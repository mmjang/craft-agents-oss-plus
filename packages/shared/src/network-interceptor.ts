/**
 * Fetch interceptor for LLM API requests.
 *
 * Loaded via bunfig.toml preload to run BEFORE any modules are evaluated.
 * This ensures we patch globalThis.fetch before the SDK captures it.
 *
 * Features:
 * - Captures API errors for error handler (4xx/5xx responses)
 * - Adds _intent and _displayName metadata to MCP tool schemas
 * - Optionally dumps per-request API I/O evidence to JSON files
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, appendFileSync, mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Type alias for fetch's HeadersInit (not in ESNext lib, but available at runtime via Bun)
// Using string[][] instead of [string, string][] to match RequestInit.headers type
type HeadersInitType = Headers | Record<string, string> | string[][];

const DEBUG = process.argv.includes('--debug') || process.env.CRAFT_DEBUG === '1';
const API_IO_DUMP_DIR_ENV = 'CRAFT_API_IO_DUMP_DIR';
const API_IO_INCLUDE_SECRETS = process.env.CRAFT_API_IO_INCLUDE_SECRETS === '1';
const DEFAULT_API_IO_DUMP_DIR = join(homedir(), '.craft-plus', 'api-request-dumps');
const API_IO_DUMP_DIR = resolveApiIoDumpDir();
const API_IO_DUMP_ENABLED = API_IO_DUMP_DIR !== null;
const API_IO_MAX_BODY_CHARS = parsePositiveInt(process.env.CRAFT_API_IO_MAX_BODY_CHARS, 2_000_000);
let apiIoDumpCounter = 0;

// Log file for debug output (avoids console spam)
const LOG_DIR = join(homedir(), '.craft-plus', 'logs');
const LOG_FILE = join(LOG_DIR, 'interceptor.log');

function ensureDir(dir: string): void {
  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Ignore - logging/dumping will silently fail if dir can't be created
  }
}

// Ensure output directories exist at module load
ensureDir(LOG_DIR);
if (API_IO_DUMP_DIR) {
  ensureDir(API_IO_DUMP_DIR);
}

interface ApiRequestCapture {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyText: string | null;
  bodyJson?: unknown;
}

interface ApiResponseCapture {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bodyText: string | null;
  bodyJson?: unknown;
  bodyOmittedReason?: string;
  bodyTruncated?: boolean;
  originalBodyLength?: number;
}

interface SecretSummary {
  present: boolean;
  preview: string | null;
  sha256: string | null;
}

interface ApiInteractionCapture {
  request: ApiRequestCapture;
  startedAtMs: number;
  finishedAtMs: number;
  durationMs: number;
  response?: ApiResponseCapture;
  networkError?: {
    message: string;
    name?: string;
  };
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) return fallback;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveApiIoDumpDir(): string | null {
  const raw = process.env[API_IO_DUMP_DIR_ENV];
  if (raw === undefined) return null;

  const trimmed = raw.trim();
  if (!trimmed || trimmed === '1' || trimmed.toLowerCase() === 'true') {
    return DEFAULT_API_IO_DUMP_DIR;
  }
  return trimmed;
}

function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function previewSecret(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return '(empty)';
  if (trimmed.length <= 8) {
    return `${trimmed.charAt(0)}***${trimmed.charAt(trimmed.length - 1)} (len=${trimmed.length})`;
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)} (len=${trimmed.length})`;
}

function summarizeSecret(value: string | null | undefined): SecretSummary {
  if (value == null) {
    return { present: false, preview: null, sha256: null };
  }
  return {
    present: true,
    preview: previewSecret(value),
    sha256: value ? hashSecret(value) : null,
  };
}

function sanitizeFileSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'unknown';
}

function timestampForFile(timestampMs: number): string {
  return new Date(timestampMs).toISOString().replace(/[.:]/g, '-');
}

function headerEntries(headersInit: HeadersInitType | undefined): Array<[string, string]> {
  if (!headersInit) return [];
  if (headersInit instanceof Headers) {
    const pairs: Array<[string, string]> = [];
    headersInit.forEach((value, key) => {
      pairs.push([key, value]);
    });
    return pairs;
  }
  if (Array.isArray(headersInit)) {
    const pairs: Array<[string, string]> = [];
    for (const entry of headersInit) {
      if (entry.length >= 2) {
        pairs.push([String(entry[0]), String(entry[1])]);
      }
    }
    return pairs;
  }
  return Object.entries(headersInit);
}

function mergeHeaders(input: string | URL | Request, init?: RequestInit): Headers {
  const merged = new Headers(input instanceof Request ? input.headers : undefined);
  for (const [key, value] of headerEntries(init?.headers as HeadersInitType | undefined)) {
    merged.set(key, value);
  }
  return merged;
}

function getRequestBodyTypeLabel(body: RequestInit['body']): string {
  if (!body) return 'empty';
  if (typeof body === 'string') return 'text';
  if (body instanceof URLSearchParams) return 'urlsearchparams';
  if (body instanceof FormData) return 'formdata';
  if (body instanceof Blob) return 'blob';
  if (body instanceof ReadableStream) return 'readable-stream';
  if (body instanceof ArrayBuffer) return 'arraybuffer';
  if (ArrayBuffer.isView(body)) return 'typed-array';
  return typeof body;
}

async function extractRequestBodyText(input: string | URL | Request, init?: RequestInit): Promise<string | null> {
  if (typeof init?.body === 'string') return init.body;

  if (init?.body != null) {
    return `[omitted non-text request body: ${getRequestBodyTypeLabel(init.body)}]`;
  }

  if (input instanceof Request) {
    try {
      return await input.clone().text();
    } catch {
      return '[omitted request body: failed to clone/read Request body]';
    }
  }

  return null;
}

function tryParseJson(text: string | null): unknown | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toObjectSanitized(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    const isSensitive =
      lower === 'authorization' ||
      lower === 'x-api-key' ||
      lower === 'cookie' ||
      lower === 'set-cookie';

    if (isSensitive && !API_IO_INCLUDE_SECRETS) {
      const preview = previewSecret(value) ?? 'n/a';
      const digest = value ? hashSecret(value) : 'empty';
      result[key] = `[REDACTED preview=${preview} sha256=${digest}]`;
      return;
    }

    result[key] = value;
  });
  return result;
}

function extractAuthScheme(value: string | null): string | null {
  if (!value) return null;
  const firstSpace = value.indexOf(' ');
  if (firstSpace === -1) return value;
  return value.slice(0, firstSpace);
}

function getApiAuthContext(headers: Headers): Record<string, unknown> {
  const authorization = headers.get('authorization');
  const xApiKey = headers.get('x-api-key');

  return {
    requestHeaders: {
      authorization: summarizeSecret(authorization),
      authorizationScheme: extractAuthScheme(authorization),
      xApiKey: summarizeSecret(xApiKey),
      anthropicVersion: headers.get('anthropic-version'),
      claudeOauthHeaderPresent: headers.has('x-claude-code-oauth-token'),
    },
    runtimeEnv: {
      anthropicApiKey: summarizeSecret(process.env.ANTHROPIC_API_KEY),
      anthropicAuthToken: summarizeSecret(process.env.ANTHROPIC_AUTH_TOKEN),
      claudeCodeOauthToken: summarizeSecret(process.env.CLAUDE_CODE_OAUTH_TOKEN),
      anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL?.trim() || null,
    },
  };
}

async function buildRequestCapture(
  input: string | URL | Request,
  init: RequestInit | undefined,
  url: string,
  method: string
): Promise<ApiRequestCapture> {
  const headers = mergeHeaders(input, init);
  const bodyText = await extractRequestBodyText(input, init);
  return {
    url,
    method,
    headers: toObjectSanitized(headers),
    bodyText,
    bodyJson: tryParseJson(bodyText),
  };
}

async function buildResponseCapture(response: Response): Promise<ApiResponseCapture> {
  const contentType = response.headers.get('content-type') ?? '';
  const headers = toObjectSanitized(response.headers);

  if (contentType.includes('text/event-stream')) {
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      bodyText: null,
      bodyOmittedReason: 'SSE stream body is not captured to avoid consuming live stream payload',
    };
  }

  try {
    const text = await response.clone().text();
    const truncated = text.length > API_IO_MAX_BODY_CHARS;
    const bodyText = truncated ? `${text.slice(0, API_IO_MAX_BODY_CHARS)}\n...[truncated]` : text;
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      bodyText,
      bodyJson: tryParseJson(bodyText),
      bodyTruncated: truncated || undefined,
      originalBodyLength: truncated ? text.length : undefined,
    };
  } catch (error) {
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      bodyText: null,
      bodyOmittedReason: `Failed to read response body: ${extractErrorMessage(error)}`,
    };
  }
}

function shouldCaptureApiIoDump(url: string): boolean {
  return API_IO_DUMP_ENABLED && isLlmApiEndpointUrl(url);
}

function writeApiInteractionDump(
  url: string,
  method: string,
  capture: ApiInteractionCapture,
  authContext: Record<string, unknown>
): void {
  if (!shouldCaptureApiIoDump(url) || !API_IO_DUMP_DIR) return;

  ensureDir(API_IO_DUMP_DIR);
  const counter = (++apiIoDumpCounter).toString().padStart(6, '0');
  const statusPart = capture.networkError
    ? 'network-error'
    : capture.response
      ? `http-${capture.response.status}`
      : 'unknown';
  const fileName = `${timestampForFile(capture.startedAtMs)}-${sanitizeFileSegment(method)}-${sanitizeFileSegment(statusPart)}-${counter}-${randomUUID().slice(0, 8)}.json`;
  const filePath = join(API_IO_DUMP_DIR, fileName);

  const payload = {
    schemaVersion: 1,
    capturedAt: new Date(capture.finishedAtMs).toISOString(),
    timing: {
      startedAt: new Date(capture.startedAtMs).toISOString(),
      finishedAt: new Date(capture.finishedAtMs).toISOString(),
      durationMs: capture.durationMs,
    },
    request: capture.request,
    response: capture.response ?? null,
    networkError: capture.networkError ?? null,
    authentication: authContext,
    runtime: {
      pid: process.pid,
      platform: process.platform,
      bunVersion: process.versions.bun ?? null,
      nodeVersion: process.versions.node,
    },
  };

  try {
    writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (error) {
    debugLog(`[api-io-dump] Failed to write file ${filePath}: ${extractErrorMessage(error)}`);
  }
}

/**
 * Store the last API error for the error handler to access.
 * This allows us to capture the actual HTTP status code (e.g., 402 Payment Required)
 * before the SDK wraps it in a generic error message.
 *
 * Uses file-based storage to reliably share across process boundaries
 * (the SDK may run in a subprocess with separate memory space).
 */
export interface LastApiError {
  status: number;
  statusText: string;
  message: string;
  timestamp: number;
  url?: string;
  method?: string;
  errorType?: 'http_error' | 'network_error';
}

// File-based storage for cross-process sharing
const ERROR_FILE = join(homedir(), '.craft-plus', 'api-error.json');
const MAX_ERROR_AGE_MS = 5 * 60 * 1000; // 5 minutes

function getStoredError(): LastApiError | null {
  try {
    if (!existsSync(ERROR_FILE)) return null;
    const content = readFileSync(ERROR_FILE, 'utf-8');
    const error = JSON.parse(content) as LastApiError;
    // Pop: delete after reading
    try {
      unlinkSync(ERROR_FILE);
      debugLog(`[getStoredError] Popped error file`);
    } catch {
      // Ignore delete errors
    }
    return error;
  } catch {
    return null;
  }
}

function setStoredError(error: LastApiError | null): void {
  try {
    if (error) {
      writeFileSync(ERROR_FILE, JSON.stringify(error));
      debugLog(`[setStoredError] Wrote error to file: ${error.status} ${error.message}`);
    } else {
      // Clear the file
      try {
        unlinkSync(ERROR_FILE);
      } catch {
        // File might not exist
      }
    }
  } catch (e) {
    debugLog(`[setStoredError] Failed to write: ${e}`);
  }
}

export function getLastApiError(): LastApiError | null {
  const error = getStoredError();
  if (error) {
    const age = Date.now() - error.timestamp;
    if (age < MAX_ERROR_AGE_MS) {
      debugLog(`[getLastApiError] Found error (age ${age}ms): ${error.status}`);
      return error;
    }
    debugLog(`[getLastApiError] Error too old (${age}ms > ${MAX_ERROR_AGE_MS}ms)`);
  }
  return null;
}

export function clearLastApiError(): void {
  setStoredError(null);
}


function debugLog(...args: unknown[]) {
  if (!DEBUG) return;
  const timestamp = new Date().toISOString();
  const message = `${timestamp} [interceptor] ${args.map((a) => {
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a);
      } catch (e) {
        const keys = a && typeof a === 'object' ? Object.keys(a as object).join(', ') : 'unknown';
        return `[CYCLIC STRUCTURE, keys: ${keys}] (error: ${e})`;
      }
    }
    return String(a);
  }).join(' ')}`;
  // Write to log file instead of stderr to avoid console spam
  try {
    appendFileSync(LOG_FILE, message + '\n');
  } catch {
    // Silently fail if can't write to log file
  }
}


/**
 * Check whether URL targets Anthropic-compatible /messages endpoint.
 * Works for both official api.anthropic.com and custom base URLs.
 */
function isMessagesEndpointUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/v1/messages' || parsed.pathname.endsWith('/messages');
  } catch {
    return url.includes('/v1/messages') || url.includes('/messages');
  }
}

/**
 * Check whether URL targets a common LLM inference endpoint.
 * Covers Anthropic-compatible, OpenAI-compatible, and gateway variants.
 */
function isLlmApiEndpointUrl(url: string): boolean {
  const matches = (path: string): boolean => {
    const normalized = path.toLowerCase();
    return (
      normalized === '/v1/messages' ||
      normalized.endsWith('/messages') ||
      normalized === '/v1/chat/completions' ||
      normalized.endsWith('/chat/completions') ||
      normalized === '/v1/responses' ||
      normalized.endsWith('/responses') ||
      normalized === '/v1/completions' ||
      normalized.endsWith('/completions')
    );
  };

  try {
    const parsed = new URL(url);
    return matches(parsed.pathname);
  } catch {
    return matches(url);
  }
}

/**
 * Add _intent and _displayName fields to all MCP tool schemas in Anthropic API request.
 * Only modifies tools that start with "mcp__" (MCP tools from SDK).
 * Returns the modified request body object.
 *
 * - _intent: 1-2 sentence description of what the tool call accomplishes (for UI activity descriptions)
 * - _displayName: 2-4 word human-friendly action name (for UI tool name display)
 */
function addMetadataToMcpTools(body: Record<string, unknown>): Record<string, unknown> {
  const tools = body.tools as Array<{
    name?: string;
    input_schema?: {
      properties?: Record<string, unknown>;
      required?: string[];
    };
  }> | undefined;

  if (!tools || !Array.isArray(tools)) {
    return body;
  }

  let modifiedCount = 0;
  for (const tool of tools) {
    // Only modify MCP tools (prefixed with mcp__)
    if (tool.name?.startsWith('mcp__') && tool.input_schema?.properties) {
      let modified = false;

      // Add _intent if not present
      if (!('_intent' in tool.input_schema.properties)) {
        tool.input_schema.properties._intent = {
          type: 'string',
          description: 'REQUIRED: Describe what you are trying to accomplish with this tool call (1-2 sentences)',
        };
        modified = true;
      }

      // Add _displayName if not present
      if (!('_displayName' in tool.input_schema.properties)) {
        tool.input_schema.properties._displayName = {
          type: 'string',
          description: 'REQUIRED: Human-friendly name for this action (2-4 words, e.g., "List Folders", "Search Documents", "Create Task")',
        };
        modified = true;
      }

      // Add both to required array if we modified anything
      if (modified) {
        const currentRequired = tool.input_schema.required || [];
        const newRequired = [...currentRequired];
        if (!currentRequired.includes('_intent')) {
          newRequired.push('_intent');
        }
        if (!currentRequired.includes('_displayName')) {
          newRequired.push('_displayName');
        }
        tool.input_schema.required = newRequired;
        modifiedCount++;
      }
    }
  }

  if (modifiedCount > 0) {
    debugLog(`[MCP Schema] Added _intent and _displayName to ${modifiedCount} MCP tools`);
  }

  return body;
}

/**
 * Check if URL should have API errors captured
 */
function shouldCaptureApiErrors(url: string): boolean {
  return isLlmApiEndpointUrl(url);
}

function isOpenRouterUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === 'openrouter.ai' || host.endsWith('.openrouter.ai');
  } catch {
    return url.includes('openrouter.ai');
  }
}

function stripBetaQuery(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('beta');
    return parsed.toString();
  } catch {
    return url.replace(/[?&]beta=[^&]*/g, '').replace(/[?&]$/, '');
  }
}

function isAnthropicFamilyModel(model: unknown): boolean {
  if (typeof model !== 'string') return false;
  const normalized = model.toLowerCase().trim();
  return (
    normalized.startsWith('claude-') ||
    normalized.startsWith('anthropic/')
  );
}

function applyOpenRouterCompatibility(
  url: string,
  parsedBody: Record<string, unknown>
): Record<string, unknown> {
  if (!isOpenRouterUrl(url)) return parsedBody;
  if (isAnthropicFamilyModel(parsedBody.model)) return parsedBody;

  const provider =
    parsedBody.provider && typeof parsedBody.provider === 'object'
      ? { ...(parsedBody.provider as Record<string, unknown>) }
      : {};

  // Keep routing broad so OpenRouter can pick any provider that supports
  // the current payload. For non-Claude models this avoids accidental over-filtering.
  if (provider.allow_fallbacks === undefined) provider.allow_fallbacks = true;
  provider.require_parameters = false;

  return {
    ...parsedBody,
    provider,
  };
}

function buildHeadersWithOpenRouterAuth(
  url: string,
  headersInit: HeadersInitType | undefined
): Headers {
  const headers = new Headers(headersInit as any);
  if (!isOpenRouterUrl(url)) return headers;

  const authToken = process.env.ANTHROPIC_AUTH_TOKEN?.trim();
  if (authToken && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${authToken}`);
  }
  return headers;
}

async function responseBodyText(response: Response): Promise<string> {
  try {
    return await response.clone().text();
  } catch {
    return '';
  }
}

function isNoAllowedProvidersMessage(bodyText: string): boolean {
  return /no allowed providers are available for the selected model/i.test(bodyText);
}

function removeToolFields(parsedBody: Record<string, unknown>): Record<string, unknown> {
  const next = { ...parsedBody };
  delete next.tools;
  delete next.tool_choice;
  return next;
}

function getRequestMethod(input: string | URL | Request, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return 'GET';
}

function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const parts: string[] = [];
  if (error.message) parts.push(error.message);

  const anyError = error as Error & {
    code?: unknown;
    errno?: unknown;
    cause?: unknown;
    syscall?: unknown;
    hostname?: unknown;
    address?: unknown;
  };

  if (anyError.code) parts.push(`code=${String(anyError.code)}`);
  if (anyError.errno) parts.push(`errno=${String(anyError.errno)}`);
  if (anyError.syscall) parts.push(`syscall=${String(anyError.syscall)}`);
  if (anyError.hostname) parts.push(`hostname=${String(anyError.hostname)}`);
  if (anyError.address) parts.push(`address=${String(anyError.address)}`);

  if (anyError.cause) {
    if (anyError.cause instanceof Error) {
      parts.push(`cause=${anyError.cause.message}`);
    } else {
      parts.push(`cause=${String(anyError.cause)}`);
    }
  }

  return parts.join(' | ');
}

const originalFetch = globalThis.fetch.bind(globalThis);

/**
 * Convert headers to cURL -H flags, redacting sensitive values
 */
function headersToCurl(headers: HeadersInitType | undefined): string {
  if (!headers) return '';

  const headerObj: Record<string, string> =
    headers instanceof Headers
      ? Object.fromEntries(Array.from(headers as unknown as Iterable<[string, string]>))
      : Array.isArray(headers)
        ? Object.fromEntries(headers)
        : (headers as Record<string, string>);

  const sensitiveKeys = ['x-api-key', 'authorization', 'cookie'];

  return Object.entries(headerObj)
    .map(([key, value]) => {
      const redacted = sensitiveKeys.includes(key.toLowerCase())
        ? '[REDACTED]'
        : value;
      return `-H '${key}: ${redacted}'`;
    })
    .join(' \\\n  ');
}

/**
 * Format a fetch request as a cURL command
 */
function toCurl(url: string, init?: RequestInit): string {
  const method = init?.method?.toUpperCase() ?? 'GET';
  const headers = headersToCurl(init?.headers as HeadersInitType | undefined);

  let curl = `curl -X ${method}`;
  if (headers) {
    curl += ` \\\n  ${headers}`;
  }
  if (init?.body && typeof init.body === 'string') {
    // Escape single quotes in body for shell safety
    const escapedBody = init.body.replace(/'/g, "'\\''");
    curl += ` \\\n  -d '${escapedBody}'`;
  }
  curl += ` \\\n  '${url}'`;

  return curl;
}

/**
 * Clone response and log its body (handles streaming responses).
 * Also captures API errors (4xx/5xx) for the error handler.
 */
async function logResponse(
  response: Response,
  url: string,
  startTime: number,
  method = 'GET',
  requestCapture?: ApiRequestCapture,
  authContext?: Record<string, unknown>
): Promise<Response> {
  const finishedAtMs = Date.now();
  const duration = finishedAtMs - startTime;


  // Capture API errors (runs regardless of DEBUG mode)
  if (shouldCaptureApiErrors(url) && response.status >= 400) {
    debugLog(`  [Attempting to capture error for ${response.status} response]`);
    // Clone to read body without consuming the original
    const errorClone = response.clone();
    try {
      const errorText = await errorClone.text();
      let errorMessage = response.statusText;

      // Try to parse JSON error response
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Use raw text if not JSON
        if (errorText) errorMessage = errorText;
      }

      setStoredError({
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        timestamp: Date.now(),
        url,
        method,
        errorType: 'http_error',
      });
      debugLog(`  [Captured API error: ${response.status} ${errorMessage}]`);
    } catch (e) {
      // Still capture basic info even if body read fails
      debugLog(`  [Error reading body, capturing basic info: ${e}]`);
      setStoredError({
        status: response.status,
        statusText: response.statusText,
        message: response.statusText,
        timestamp: Date.now(),
        url,
        method,
        errorType: 'http_error',
      });
    }
  }

  if (requestCapture && authContext && shouldCaptureApiIoDump(url)) {
    const responseCapture = await buildResponseCapture(response);
    writeApiInteractionDump(url, method, {
      request: requestCapture,
      startedAtMs: startTime,
      finishedAtMs,
      durationMs: duration,
      response: responseCapture,
    }, authContext);
  }

  if (!DEBUG) return response;

  debugLog(`\n← RESPONSE ${response.status} ${response.statusText} (${duration}ms)`);
  debugLog(`  URL: ${url}`);

  // Log response headers
  const respHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    respHeaders[key] = value;
  });
  debugLog('  Headers:', respHeaders);

  // For streaming responses, we can't easily log the body without consuming it
  // For non-streaming, clone and log
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream')) {
    debugLog('  Body: [SSE stream - not logged]');
    return response;
  }

  // Clone the response so we can read the body without consuming it
  const clone = response.clone();
  try {
    const text = await clone.text();
    // Limit logged response size to prevent huge logs
    const maxLogSize = 5000;
    if (text.length > maxLogSize) {
      debugLog(`  Body (truncated to ${maxLogSize} chars):\n${text.substring(0, maxLogSize)}...`);
    } else {
      debugLog(`  Body:\n${text}`);
    }
  } catch (e) {
    debugLog('  Body: [failed to read]', e);
  }

  return response;
}

async function interceptedFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  const method = getRequestMethod(input, init);


  // Log all requests as cURL commands
  if (DEBUG) {
    debugLog('\n' + '='.repeat(80));
    debugLog('→ REQUEST');
    debugLog(toCurl(url, init));
  }

  if (
    isMessagesEndpointUrl(url) &&
    init?.method?.toUpperCase() === 'POST' &&
    init?.body
  ) {
    try {
      const body = typeof init.body === 'string' ? init.body : undefined;
      if (body) {
        let parsed = JSON.parse(body) as Record<string, unknown>;

        // Add _intent and _displayName to MCP tool schemas
        parsed = addMetadataToMcpTools(parsed);
        parsed = applyOpenRouterCompatibility(url, parsed);

        const requestUrl = isOpenRouterUrl(url) ? stripBetaQuery(url) : url;
        const headers = buildHeadersWithOpenRouterAuth(requestUrl, init.headers as HeadersInitType | undefined);

        const modifiedInit = {
          ...init,
          headers,
          body: JSON.stringify(parsed),
        };
        const shouldDumpRequest = shouldCaptureApiIoDump(requestUrl);
        const requestCapture = shouldDumpRequest
          ? await buildRequestCapture(requestUrl, modifiedInit, requestUrl, method)
          : undefined;
        const authContext = shouldDumpRequest
          ? getApiAuthContext(mergeHeaders(requestUrl, modifiedInit))
          : undefined;
        const requestStartTime = Date.now();
        const response = await originalFetch(requestUrl, modifiedInit);

        // OpenRouter fallback:
        // If provider routing rejects tool-enabled payload for a non-Claude model,
        // retry once in text-only mode (remove tools/tool_choice).
        if (
          isOpenRouterUrl(requestUrl) &&
          response.status === 404 &&
          !isAnthropicFamilyModel(parsed.model) &&
          (parsed.tools !== undefined || parsed.tool_choice !== undefined)
        ) {
          const firstBody = await responseBodyText(response);
          if (isNoAllowedProvidersMessage(firstBody)) {
            await logResponse(response, requestUrl, requestStartTime, method, requestCapture, authContext);
            debugLog('[OpenRouter fallback] No providers for tool payload; retrying without tools/tool_choice');
            const fallbackBody = removeToolFields(parsed);
            const fallbackInit = {
              ...modifiedInit,
              body: JSON.stringify(fallbackBody),
            };
            const fallbackShouldDump = shouldCaptureApiIoDump(requestUrl);
            const fallbackRequestCapture = fallbackShouldDump
              ? await buildRequestCapture(requestUrl, fallbackInit, requestUrl, method)
              : undefined;
            const fallbackAuthContext = fallbackShouldDump
              ? getApiAuthContext(mergeHeaders(requestUrl, fallbackInit))
              : undefined;
            const fallbackStartTime = Date.now();
            const fallbackResponse = await originalFetch(requestUrl, fallbackInit);
            if (fallbackResponse.ok) {
              // Clear stale captured error from failed first attempt
              setStoredError(null);
            }
            return logResponse(fallbackResponse, requestUrl, fallbackStartTime, method, fallbackRequestCapture, fallbackAuthContext);
          }
        }

        return logResponse(response, requestUrl, requestStartTime, method, requestCapture, authContext);
      }
    } catch (e) {
      debugLog('FETCH modification failed:', e);
    }
  }

  const shouldDump = shouldCaptureApiIoDump(url);
  const requestCapture = shouldDump
    ? await buildRequestCapture(input, init, url, method)
    : undefined;
  const authContext = shouldDump
    ? getApiAuthContext(mergeHeaders(input, init))
    : undefined;
  const requestStartTime = Date.now();
  try {
    const response = await originalFetch(input, init);
    return logResponse(response, url, requestStartTime, method, requestCapture, authContext);
  } catch (error) {
    const message = extractErrorMessage(error);

    // Capture network-level failures (DNS/TLS/connection timeout/refused/etc.)
    if (shouldCaptureApiErrors(url)) {
      setStoredError({
        status: 0,
        statusText: 'NETWORK_ERROR',
        message,
        timestamp: Date.now(),
        url,
        method,
        errorType: 'network_error',
      });
      debugLog(`[NETWORK ERROR] ${method} ${url} -> ${message}`);
    }

    if (requestCapture && authContext) {
      const finishedAtMs = Date.now();
      writeApiInteractionDump(url, method, {
        request: requestCapture,
        startedAtMs: requestStartTime,
        finishedAtMs,
        durationMs: finishedAtMs - requestStartTime,
        networkError: {
          message,
          name: error instanceof Error ? error.name : undefined,
        },
      }, authContext);
    }

    throw error;
  }
}

// Create proxy to handle both function calls and static properties (e.g., fetch.preconnect in Bun)
const fetchProxy = new Proxy(interceptedFetch, {
  apply(target, thisArg, args) {
    return Reflect.apply(target, thisArg, args);
  },
  get(target, prop, receiver) {
    if (prop in originalFetch) {
      return (originalFetch as unknown as Record<string | symbol, unknown>)[
        prop
      ];
    }
    return Reflect.get(target, prop, receiver);
  },
});

(globalThis as unknown as { fetch: unknown }).fetch = fetchProxy;
debugLog('Fetch interceptor installed');
