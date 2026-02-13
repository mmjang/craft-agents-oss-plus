/**
 * Centralized model definitions for the entire application.
 * Update model IDs here when new versions are released.
 */

export interface ModelDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

// ============================================
// USER-SELECTABLE MODELS (shown in UI)
// ============================================

/** Claude models (default) */
export const CLAUDE_MODELS: ModelDefinition[] = [
  { id: 'claude-opus-4-5-20251101', name: 'Opus 4.5', shortName: 'Opus', description: 'Most capable' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Sonnet 4.5', shortName: 'Sonnet', description: 'Balanced' },
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5', shortName: 'Haiku', description: 'Fast & efficient' },
];

/** Zhipu AI models (for bigmodel.cn API) */
export const ZHIPU_MODELS: ModelDefinition[] = [
  { id: 'glm-5', name: 'GLM-5', shortName: 'GLM-5', description: 'Most capable' },
  { id: 'glm-4.7', name: 'GLM-4.7', shortName: 'GLM-4.7', description: 'Balanced' },
  { id: 'glm-4.5-air', name: 'GLM-4.5 Air', shortName: 'GLM-4.5', description: 'Fast & efficient' },
];

/** Zhipu API base URL pattern */
const ZHIPU_BASE_URL_PATTERN = /bigmodel\.cn/i;

/**
 * Check if the given base URL is for Zhipu AI
 */
export function isZhipuBaseUrl(baseUrl: string | null | undefined): boolean {
  if (!baseUrl) return false;
  return ZHIPU_BASE_URL_PATTERN.test(baseUrl);
}

/**
 * Get the appropriate models list based on the API base URL.
 * Returns Zhipu models if the base URL contains 'bigmodel.cn',
 * otherwise returns Claude models.
 */
export function getModelsForBaseUrl(baseUrl: string | null | undefined): ModelDefinition[] {
  return isZhipuBaseUrl(baseUrl) ? ZHIPU_MODELS : CLAUDE_MODELS;
}

/**
 * Get the default model for the given API base URL.
 */
export function getDefaultModelForBaseUrl(baseUrl: string | null | undefined): string {
  return isZhipuBaseUrl(baseUrl) ? DEFAULT_ZHIPU_MODEL : DEFAULT_MODEL;
}

// Legacy export for backward compatibility
export const MODELS: ModelDefinition[] = CLAUDE_MODELS;

// ============================================
// PURPOSE-SPECIFIC DEFAULTS
// ============================================

/** Default model for main chat (user-facing) - Claude */
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

/** Default model for main chat (user-facing) - Zhipu */
export const DEFAULT_ZHIPU_MODEL = 'glm-5';

/** Model for agent definition extraction (always high quality) */
export const EXTRACTION_MODEL = 'claude-opus-4-5-20251101';

/** Model for API response summarization (cost efficient) */
export const SUMMARIZATION_MODEL = 'claude-haiku-4-5-20251001';

/** Model for instruction updates (high quality for accurate document editing) */
export const INSTRUCTION_UPDATE_MODEL = 'claude-opus-4-5-20251101';

// ============================================
// HELPER FUNCTIONS
// ============================================

/** All models combined for lookup */
const ALL_MODELS = [...CLAUDE_MODELS, ...ZHIPU_MODELS];

/** Get display name for a model ID (full name with version) */
export function getModelDisplayName(modelId: string): string {
  const model = ALL_MODELS.find(m => m.id === modelId);
  if (model) return model.name;
  // Fallback: strip prefix and date suffix
  return modelId.replace('claude-', '').replace(/-\d{8}$/, '');
}

/** Get short display name for a model ID (without version number) */
export function getModelShortName(modelId: string): string {
  const model = ALL_MODELS.find(m => m.id === modelId);
  if (model) return model.shortName;
  // Fallback: strip prefix and date suffix
  return modelId.replace('claude-', '').replace(/-[\d.-]+$/, '');
}

/** Check if model is an Opus model (for cache TTL decisions) */
export function isOpusModel(modelId: string): boolean {
  return modelId.includes('opus');
}
