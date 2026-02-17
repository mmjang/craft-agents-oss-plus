/**
 * Personality Types
 *
 * Type definitions for workspace personalities.
 * Personalities are markdown files in {workspace}/personalities/*.md
 * with optional YAML frontmatter.
 */

/**
 * Personality metadata parsed from YAML frontmatter.
 * All fields are optional.
 */
export interface PersonalityMetadata {
  /** Display name shown in the UI */
  name?: string;
  /** Short description shown in the selector */
  description?: string;
}

/**
 * A loaded personality with parsed content.
 */
export interface LoadedPersonality {
  /** Stable ID derived from filename without extension */
  id: string;
  /** Original markdown file name */
  fileName: string;
  /** Parsed frontmatter metadata */
  metadata: PersonalityMetadata;
  /** Markdown body content (without frontmatter) */
  content: string;
  /** Absolute file path */
  path: string;
}

