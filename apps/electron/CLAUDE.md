# CLAUDE.md - Electron App

**Important:** Keep this file up-to-date whenever functionality changes. After making changes to the app, update the documentation to reflect the current state.

## Overview

The Electron app is the desktop application for Craft Agent. It provides a native desktop experience with:
- Multi-window support
- Deep linking (`craftagents://` protocol)
- Native menus and system integration
- Renderer process with React UI
- Main process for system operations
- Chat header action to open an agent-controlled automation browser (dev-browser)
- First-run portable runtime download (Git Bash/Python/Node) into `~/.craft-agent/runtime/` with onboarding progress
- Workspace custom personalities (`{workspace}/personalities/*.md`) with optional YAML frontmatter, selectable per session in chat input
- Personality selector is hidden in chat input when only the built-in default personality is available

## Directory Structure

```
apps/electron/
├── src/
│   ├── main/           # Electron main process
│   ├── preload/        # Preload scripts for IPC
│   ├── renderer/       # React UI application
│   │   ├── i18n/       # Internationalization
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable UI components
│   │   └── lib/        # Utilities and helpers
│   └── shared/         # Shared types between processes
├── resources/          # App icons and assets
├── scripts/            # Build and dev scripts
└── package.json
```

## Internationalization (i18n)

Custom lightweight i18n system in `src/renderer/i18n/`. Supports English (default) and Chinese (Simplified).

### File Structure

```
src/renderer/i18n/
├── translations.ts    # Main exports and type definitions
├── en.ts             # English translations
├── zh.ts             # Chinese translations
└── I18nContext.tsx   # React context provider
```

### Adding Translations

1. Add key-value pairs to both `en.ts` and `zh.ts`:
   ```typescript
   // en.ts
   'settings.navigator.app': 'App',

   // zh.ts
   'settings.navigator.app': '应用',
   ```

2. Use hierarchical keys: `{section}.{subsection}.{identifier}`

### Usage

```typescript
import { useI18n } from '@/i18n/I18nContext'

function MyComponent() {
  const { t, locale, setLocale } = useI18n()

  // Basic usage with fallback
  return <button>{t('common.save', 'Save')}</button>

  // With template variables
  const text = t('dataTable.total', '{{count}} total', { count: 42 })
}
```

**Key prefixes:** `common.*`, `menu.*`, `session.*`, `settings.*`, `appSettings.*`, `workspace.*`, `preferences.*`, `shortcuts.*`, `permissions.*`, `freeform.*`

## Development

**Run dev server:**
```bash
cd apps/electron
bun run dev
```

**Build:**
```bash
bun run build
```

**Type checking:**
```bash
bun run tsc --noEmit
```

## Key Technologies

- **Electron**: Desktop app framework
- **React**: UI library
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
