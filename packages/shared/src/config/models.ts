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

/**
 * Normalize custom model IDs from config/UI.
 * - trims whitespace
 * - removes empty entries
 * - removes duplicates while preserving order
 */
export function normalizeCustomModelIds(customModelIds: string[] | null | undefined): string[] {
  if (!Array.isArray(customModelIds)) return [];
  const unique = new Set<string>();
  for (const raw of customModelIds) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim();
    if (id) unique.add(id);
  }
  return Array.from(unique);
}

function toCustomModelDefinition(modelId: string): ModelDefinition {
  return {
    id: modelId,
    name: modelId,
    shortName: modelId,
    description: 'Custom model',
  };
}

/**
 * Get the model list for UI selection.
 * If custom model IDs are configured, use them as the selectable list.
 * Otherwise fall back to built-in Claude models.
 */
export function getModelsForBaseUrl(_baseUrl: string | null | undefined, customModelIds?: string[] | null): ModelDefinition[] {
  const customModels = normalizeCustomModelIds(customModelIds);
  if (customModels.length > 0) {
    return customModels.map(toCustomModelDefinition);
  }
  return CLAUDE_MODELS;
}

/**
 * Get the default model for the current billing/model configuration.
 */
export function getDefaultModelForBaseUrl(_baseUrl: string | null | undefined, customModelIds?: string[] | null): string {
  const customModels = normalizeCustomModelIds(customModelIds);
  const firstCustomModel = customModels.at(0);
  if (firstCustomModel) {
    return firstCustomModel;
  }
  return DEFAULT_MODEL;
}

// Legacy export for backward compatibility
export const MODELS: ModelDefinition[] = CLAUDE_MODELS;

// ============================================
// PURPOSE-SPECIFIC DEFAULTS
// ============================================

/** Default model for main chat (user-facing) - Claude */
export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

/** Model for agent definition extraction (always high quality) */
export const EXTRACTION_MODEL = 'claude-opus-4-5-20251101';

/** Model for API response summarization (cost efficient) */
export const SUMMARIZATION_MODEL = 'claude-haiku-4-5-20251001';

/** Model for instruction updates (high quality for accurate document editing) */
export const INSTRUCTION_UPDATE_MODEL = 'claude-opus-4-5-20251101';

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Built-in models for lookup */
const BUILTIN_MODELS = [...CLAUDE_MODELS];

/** Get display name for a model ID (full name with version) */
export function getModelDisplayName(modelId: string): string {
  const model = BUILTIN_MODELS.find(m => m.id === modelId);
  if (model) return model.name;
  if (modelId.startsWith('claude-')) {
    return modelId.replace('claude-', '').replace(/-\d{8}$/, '');
  }
  return modelId;
}

/** Get short display name for a model ID (without version number) */
export function getModelShortName(modelId: string): string {
  const model = BUILTIN_MODELS.find(m => m.id === modelId);
  if (model) return model.shortName;
  if (modelId.startsWith('claude-')) {
    return modelId.replace('claude-', '').replace(/-[\d.-]+$/, '');
  }
  return modelId;
}

/** Check if model is an Opus model (for cache TTL decisions) */
export function isOpusModel(modelId: string): boolean {
  return modelId.includes('opus');
}
