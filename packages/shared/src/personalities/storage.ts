/**
 * Personality Storage
 *
 * Load workspace personalities from {workspace}/personalities/*.md.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { basename, extname, join } from 'path';
import matter from 'gray-matter';
import type { LoadedPersonality, PersonalityMetadata } from './types.ts';
import { getWorkspacePersonalitiesPath } from '../workspaces/storage.ts';

/** Maximum personality markdown size to include in prompts (20KB) */
const MAX_PERSONALITY_SIZE = 20 * 1024;

function isMarkdownFile(fileName: string): boolean {
  const ext = extname(fileName).toLowerCase();
  return ext === '.md' || ext === '.markdown';
}

function getPersonalityId(fileName: string): string {
  return basename(fileName, extname(fileName));
}

function parsePersonalityFile(content: string): { metadata: PersonalityMetadata; body: string } {
  const parsed = matter(content);

  return {
    metadata: {
      name: typeof parsed.data.name === 'string' ? parsed.data.name : undefined,
      description: typeof parsed.data.description === 'string' ? parsed.data.description : undefined,
    },
    body: parsed.content,
  };
}

/**
 * Load all personalities from a workspace.
 */
export function loadWorkspacePersonalities(workspaceRoot: string): LoadedPersonality[] {
  const personalitiesDir = getWorkspacePersonalitiesPath(workspaceRoot);
  if (!existsSync(personalitiesDir)) {
    return [];
  }

  const personalities: LoadedPersonality[] = [];

  try {
    const entries = readdirSync(personalitiesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const personality = loadWorkspacePersonalityByFileName(workspaceRoot, entry.name);
      if (personality) {
        personalities.push(personality);
      }
    }
  } catch {
    // Ignore malformed entries and filesystem errors.
  }

  return personalities;
}

/**
 * Load one personality by ID (filename without extension).
 */
export function loadWorkspacePersonality(workspaceRoot: string, personalityId: string): LoadedPersonality | null {
  const personalitiesDir = getWorkspacePersonalitiesPath(workspaceRoot);
  if (!existsSync(personalitiesDir)) {
    return null;
  }

  try {
    const entries = readdirSync(personalitiesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && isMarkdownFile(entry.name));

    for (const entry of entries) {
      if (getPersonalityId(entry.name) === personalityId) {
        return loadWorkspacePersonalityByFileName(workspaceRoot, entry.name);
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Load one personality by exact file name.
 */
function loadWorkspacePersonalityByFileName(workspaceRoot: string, fileName: string): LoadedPersonality | null {
  const personalitiesDir = getWorkspacePersonalitiesPath(workspaceRoot);
  const filePath = join(personalitiesDir, fileName);

  if (!existsSync(filePath) || !statSync(filePath).isFile() || !isMarkdownFile(fileName)) {
    return null;
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const safeContent = raw.length > MAX_PERSONALITY_SIZE
      ? `${raw.slice(0, MAX_PERSONALITY_SIZE)}\n\n... (truncated)`
      : raw;
    const parsed = parsePersonalityFile(safeContent);

    return {
      id: getPersonalityId(fileName),
      fileName,
      metadata: parsed.metadata,
      content: parsed.body,
      path: filePath,
    };
  } catch {
    return null;
  }
}

