# Craft Agents

**Important:** Keep this file and package-specific CLAUDE.md files up-to-date when making architectural changes.

## Overview

Craft Agents is an open-source desktop application for working with AI agents, built by Craft.do. It provides a document-centric alternative to Claude Code (CLI) with a GUI, advanced session management, and external integrations.

**Key Features:**
- Desktop-first experience (Electron + React)
- Multi-workspace support with isolated sessions
- MCP server integration for external data sources
- Three-level permission system (Explore/Ask/Auto)
- Session sharing and collaboration
- Built entirely using Craft Agents itself

**Tech Stack:** Bun, TypeScript, Electron, React, Tailwind CSS v4, Claude Agent SDK

## Monorepo Structure

```
craft-agents-oss/
├── apps/
│   ├── electron/          # Desktop app (main interface)
│   └── viewer/            # Web viewer for session sharing
└── packages/
    ├── core/              # Shared types (Workspace, Session, Message)
    ├── shared/            # Business logic (agent, auth, config, MCP)
    └── ui/                # Reusable React components
```

**Package Documentation:**
- [apps/electron/CLAUDE.md](apps/electron/CLAUDE.md) - Electron app, i18n, UI components
- [packages/core/CLAUDE.md](packages/core/CLAUDE.md) - Type definitions and utilities
- [packages/shared/CLAUDE.md](packages/shared/CLAUDE.md) - Agent implementation, auth, config, MCP

## Key Architectural Patterns

### Session-Scoped Architecture
- **Sessions** are the primary isolation boundary (not workspaces)
- Each session maps 1:1 with a Claude Agent SDK session
- Persistence: JSONL format with debounced writes (500ms)
- Storage: `~/.craft-agent/workspaces/{id}/sessions/`

### Permission System
Three modes per session (SHIFT+TAB to cycle):
- `safe` (Explore): Read-only, blocks write operations
- `ask` (Ask to Edit): Prompts for approval (default)
- `allow-all` (Auto): Auto-approves all commands

Customizable via `permissions.json` at workspace and source levels.

### Sources System
External data connections (MCP servers, APIs, local filesystems):
- Storage: `~/.craft-agent/workspaces/{id}/sources/{slug}/`
- Built-in: Google (Gmail, Calendar, Drive), Slack, Microsoft
- OAuth: Separate per source (not shared with Craft API)

### Configuration Storage
All config in `~/.craft-agent/`:
```
~/.craft-agent/
├── config.json              # Main config (workspaces, auth)
├── credentials.enc          # AES-256-GCM encrypted credentials
├── preferences.json         # User preferences
├── theme.json               # App-level theme (6-color system)
└── workspaces/{id}/
    ├── sessions/            # Session data (JSONL)
    ├── sources/             # Connected sources
    ├── skills/              # Custom agent instructions
    ├── statuses/            # Workflow states
    └── permissions.json     # Workspace-level rules
```

### MCP Integration
- **CraftMcpClient** wraps MCP SDK with validation and security
- Large result handling: Auto-summarization for responses >60KB
- Environment filtering: Prevents credential leakage

## Development

**Setup:**
```bash
bun install
```

**Run dev server:**
```bash
bun run electron:dev        # Hot reload (CDP enabled on port 9333 by default)
```

**CDP Debugging with Agent Browser:**

Dev server enables CDP (Chrome DevTools Protocol) on port 9333 by default. Use [agent-browser](https://github.com/vercel-labs/agent-browser) to automate and debug the app:
```bash
npx agent-browser connect 9333   # Connect to running app
npx agent-browser --help         # See all commands
```

To disable or change CDP port:
```bash
CDP_PORT=0 bun run electron:dev      # Disable CDP
CDP_PORT=9222 bun run electron:dev   # Use different port
```

**Type checking:**
```bash
bun run typecheck:all       # All packages
```

**Build:**
```bash
bun run electron:build      # Build all (main, preload, renderer)
bun run electron:dist       # Create distributable
```

**Platform-specific builds:**
```bash
bun run electron:dist:mac   # macOS DMG
bun run electron:dist:win   # Windows installer
bun run electron:dist:linux # Linux AppImage
```

## Common Workflows

### Adding a New Feature
1. Determine scope: UI-only (electron), business logic (shared), or types (core)
2. Update relevant package(s)
3. Add i18n keys if UI text is involved (see [apps/electron/CLAUDE.md](apps/electron/CLAUDE.md))
4. **Run `bun run typecheck:all` to verify no type errors**
5. Update CLAUDE.md if architecture changes

### Working with Translations
- Files: `apps/electron/src/renderer/i18n/{en,zh}.ts`
- Add keys to both locales
- Use hierarchical naming: `{section}.{subsection}.{identifier}`
- See [apps/electron/CLAUDE.md](apps/electron/CLAUDE.md) for details

### Adding a New Source Type
1. Define type in `packages/shared/src/sources/types.ts`
2. Implement credential flow in `packages/shared/src/sources/`
3. Add OAuth handling if needed
4. Update UI in `apps/electron/src/renderer/pages/sources/`

### Modifying Agent Behavior
- Core agent: `packages/shared/src/agent/craft-agent.ts`
- Permission logic: `packages/shared/src/agent/permissions-config.ts`
- Session-scoped tools: `packages/shared/src/agent/session-scoped-tools.ts`

## Project Conventions

- **TypeScript**: Strict mode, no implicit any
- **Type checking**: Always run `bun run typecheck:all` after completing any code task to catch type errors early
- **Imports**: Use `@/` alias for renderer, `@craft-agent/*` for packages
- **State**: Jotai atoms for global state, React hooks for local
- **Styling**: Tailwind CSS v4 with utility classes
- **Components**: shadcn/ui + Radix UI primitives
- **File naming**: kebab-case for files, PascalCase for components
- **Git**: Conventional commits preferred

## Key Dependencies

- `@anthropic-ai/claude-agent-sdk` - Core agent functionality
- `@anthropic-ai/sdk` - Direct Anthropic API access
- `@modelcontextprotocol/sdk` - MCP server integration
- `electron` - Desktop framework
- `react` - UI library
- `jotai` - State management
- `tailwindcss` - Styling

## Resources

- [README.md](README.md) - Comprehensive project documentation
- [Contributing Guide](CONTRIBUTING.md) - Contribution guidelines (if exists)
- [License](LICENSE) - Apache 2.0
