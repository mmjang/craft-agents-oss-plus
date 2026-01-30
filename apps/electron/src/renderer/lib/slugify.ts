/**
 * Slugify utility for workspace names
 *
 * Converts a human-readable name into a filesystem-safe slug.
 * Preserves Unicode characters (e.g., Chinese), only removes filesystem-unsafe characters.
 *
 * Examples:
 * - "My Project" → "My-Project"
 * - "我的项目" → "我的项目"
 * - "Project: Alpha" → "Project-Alpha"
 */

/**
 * Convert a string to a filesystem-safe slug
 * - Preserves Unicode characters (Chinese, Japanese, etc.)
 * - Removes filesystem-unsafe characters: / \ : * ? " < > |
 * - Replaces spaces with hyphens
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(str: string): string {
  return str
    .trim()
    // Remove filesystem-unsafe characters: / \ : * ? " < > |
    .replace(/[\/\\:*?"<>|]+/g, '-')
    // Merge consecutive whitespace and hyphens
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

/**
 * Check if a string is a valid slug (filesystem-safe)
 * Allows Unicode characters but not filesystem-unsafe characters
 */
export function isValidSlug(str: string): boolean {
  // Check for filesystem-unsafe characters
  if (/[\/\\:*?"<>|]/.test(str)) {
    return false
  }
  // Must not be empty and not start/end with hyphen
  return str.length > 0 && !str.startsWith('-') && !str.endsWith('-')
}
