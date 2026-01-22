# Renderer Localization Tracker

Track user-facing strings that still need localization in `apps/electron/src/renderer`.

## useI18n quick start
- Import and grab the translator: `import { useI18n } from '@/i18n/I18nContext'; const { t } = useI18n()`.
- Replace literals with `t('key', 'Fallback', optionalValues)` inside components.
- Add matching keys for `en` and `zh` in `apps/electron/src/renderer/i18n/translations.ts`.
- Prefer descriptive keys (e.g., `preferences.title`) and reuse existing keys where possible.
- For interpolations: `t('appShell.skills.deleteSuccess', 'Deleted skill: {{skill}}', { skill: name })`.

## Detection method (latest sweep)
- Ran a TypeScript AST sweep across `apps/electron/src/renderer/**/*.tsx|jsx`, capturing `JsxText` and string literals used as JSX children. Command used:
  - `node - <<'NODE' ...` (parses files with `ts.createSourceFile`, prints file/line and text containing letters). Re-run as needed to refresh.
- This catches visible text nodes; it can miss strings buried in props (e.g., `aria-label`, tooltips passed as variables). When touching a file, double-check those props too.

## Status legend
- Needs localization: visible strings are still hardcoded.
- Low priority (demo): playground or sample components; localize only if they ship to end users.

## Components needing localization (UI & flows)
| Component path | Status | Notes |
| --- | --- | --- |
| apps/electron/src/renderer/pages/PreferencesPage.tsx | Needs localization | Section headers, form labels/placeholders, buttons. |
| apps/electron/src/renderer/pages/SkillInfoPage.tsx | Needs localization | Permission mode labels and descriptions. |
| apps/electron/src/renderer/pages/SourceInfoPage.tsx | Needs localization | “Source Disabled” alert copy. |
| apps/electron/src/renderer/pages/ChatPage.tsx | Needs localization | Missing-session empty state. |
| apps/electron/src/renderer/pages/PreferencesPage.tsx | Needs localization | Section headers, form labels/placeholders, buttons. |
| apps/electron/src/renderer/components/AppMenu.tsx | Needs localization (maybe) | Shortcut label “⌘N” if locale-specific. |
| apps/electron/src/renderer/components/KeyboardShortcutsDialog.tsx | Needs localization | Dialog title. |
| apps/electron/src/renderer/components/ResetConfirmationDialog.tsx | Needs localization | Warning copy and list items. |
| apps/electron/src/renderer/components/app-shell/ActiveOptionBadges.tsx | Needs localization | “Ultrathink” badge. |
| apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx | Needs localization | Scroll hint, “technical details”, “Raw”, “Conversation Compacted”, “Warning”. |
| apps/electron/src/renderer/components/app-shell/MainContentPanel.tsx | Needs localization | Empty states (sources/skills/chat selection). |
| apps/electron/src/renderer/components/app-shell/SessionList.tsx | Needs localization | Labels (“New”, “Plan”) and empty/search states. |
| apps/electron/src/renderer/components/app-shell/SourceMenu.tsx | Needs localization | Menu items: open, show in Finder, delete. |
| apps/electron/src/renderer/components/app-shell/SkillMenu.tsx | Needs localization | Menu items: open, show in Finder, delete. |
| apps/electron/src/renderer/components/app-shell/SourcesListPanel.tsx | Needs localization | “Add your first source”. |
| apps/electron/src/renderer/components/app-shell/SkillsListPanel.tsx | Needs localization | Empty state + “Add your first skill”. |
| apps/electron/src/renderer/components/app-shell/TaskActionMenu.tsx | Needs localization | “View Output”, “Stop Task”. |
| apps/electron/src/renderer/components/app-shell/WorkspaceSwitcher.tsx | Needs localization | “Add Workspace…”. |
| apps/electron/src/renderer/components/app-shell/RightSidebar.tsx | Needs localization | “Files/History panel - Coming soon”. |
| apps/electron/src/renderer/components/app-shell/input/EscapeInterruptOverlay.tsx | Needs localization | Instruction for double-Esc. |
| apps/electron/src/renderer/components/app-shell/input/FreeFormInput.tsx | Needs localization | Model chooser labels, extended reasoning, context, working directory, folder prompts, reset, empty state text. |
| apps/electron/src/renderer/components/app-shell/input/structured/CredentialRequest.tsx | Needs localization | Authentication title, Save/Cancel, encryption note. |
| apps/electron/src/renderer/components/app-shell/input/structured/PermissionRequest.tsx | Needs localization | Permission labels/buttons and helper copy. |
| apps/electron/src/renderer/components/chat/AuthRequestCard.tsx | Needs localization | “Complete authentication in your browser”. |
| apps/electron/src/renderer/components/files/FileViewer.tsx | Needs localization | Empty/error/loading states and helper text. |
| apps/electron/src/renderer/components/info/Info_DataTable.tsx | Needs localization | Auth prompt text. |
| apps/electron/src/renderer/components/info/Info_GroupedList.tsx | Needs localization | Auth prompt text. |
| apps/electron/src/renderer/components/info/Info_Page.tsx | Needs localization | Error text. |
| apps/electron/src/renderer/components/info/PermissionsDataTable.tsx | Needs localization | Column header “Comment”. |
| apps/electron/src/renderer/components/info/ToolsDataTable.tsx | Needs localization | Column header “Description”. |
| apps/electron/src/renderer/components/onboarding/BillingMethodStep.tsx | Needs localization | “Recommended”. |
| apps/electron/src/renderer/components/onboarding/CompletionStep.tsx | Needs localization | “Get Started”. |
| apps/electron/src/renderer/components/onboarding/CredentialsStep.tsx | Needs localization | Buttons/labels for OAuth/API key and helper text. |
| apps/electron/src/renderer/components/onboarding/ReauthScreen.tsx | Needs localization | Reauth messaging and buttons. |
| apps/electron/src/renderer/components/preview/TableOfContents.tsx | Needs localization | “No headings” empty state. |
| apps/electron/src/renderer/components/right-sidebar/SessionMetadataPanel.tsx | Needs localization | Empty/loading states, field labels (Name, Notes). |
| apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx | Needs localization | Header “Files”. |
| apps/electron/src/renderer/components/settings/SettingsEditRow.tsx | Needs localization | “Edit”. |
| apps/electron/src/renderer/components/ui/HeaderMenu.tsx | Needs localization | “Open in New Window”, “Learn More”. |
| apps/electron/src/renderer/components/ui/data-table.tsx | Needs localization | Pagination labels (“total”, “Previous”, “Page”, “of”, “Next”). |
| apps/electron/src/renderer/components/ui/dialog.tsx | Needs localization | `sr-only` “Close”. |
| apps/electron/src/renderer/components/ui/rename-dialog.tsx | Needs localization | Cancel/Save buttons. |
| apps/electron/src/renderer/components/ui/slash-command-menu.tsx | Needs localization | “No commands found”. |
| apps/electron/src/renderer/components/ui/todo-filter-menu.tsx | Needs localization | “No status found”. |
| apps/electron/src/renderer/components/workspace/AddWorkspaceStep_CreateNew.tsx | Needs localization | Back/Next labels, “Workspace name”, “Location”, “Browse”, “Create”. |
| apps/electron/src/renderer/components/workspace/AddWorkspaceStep_OpenFolder.tsx | Needs localization | Back, “No folder selected”, “Browse”, “Workspace name”, “Open”. |
| apps/electron/src/renderer/pages/settings/PermissionsSettingsPage.tsx | Needs localization | Inline file-path hints. |
| apps/electron/src/renderer/components/ui/EditPopover.tsx | Needs localization | “Edit” label. |
| apps/electron/src/renderer/components/app-shell/input/structured/CredentialRequest.tsx | Needs localization | Authentication title, buttons, encryption note. |
| apps/electron/src/renderer/components/app-shell/input/structured/PermissionRequest.tsx | Needs localization | Permission buttons and helper copy. |
| apps/electron/src/renderer/components/app-shell/SourcesListPanel.tsx | Needs localization | Empty state prompt. |
| apps/electron/src/renderer/components/app-shell/SkillsListPanel.tsx | Needs localization | Empty state prompt. |
| apps/electron/src/renderer/components/app-shell/MainContentPanel.tsx | Needs localization | Empty states for sources/skills/chat. |
| apps/electron/src/renderer/components/app-shell/SessionList.tsx | Needs localization | “No conversations yet/found”, “Clear search”, share menu labels. |

## Playground/demo components (low priority)
| Component path | Status | Notes |
| --- | --- | --- |
| apps/electron/src/renderer/playground/PlaygroundApp.tsx | Low priority (demo) | Playground title/empty prompt. |
| apps/electron/src/renderer/playground/VariantsSidebar.tsx | Low priority (demo) | “Variants”, “Props”, empty state. |
| apps/electron/src/renderer/playground/ComponentPreview.tsx | Low priority (demo) | “Reset”, “Background”. |
| apps/electron/src/renderer/playground/registry/messages.tsx | Low priority (demo) | Section headers and sample message text. |
| apps/electron/src/renderer/playground/registry/chat.tsx | Low priority (demo) | Sample chat content and labels. |
| apps/electron/src/renderer/playground/registry/slash-command.tsx | Low priority (demo) | Demo labels (“Active:”, etc.). |
| apps/electron/src/renderer/playground/registry/toasts.tsx | Low priority (demo) | Sample headers/actions. |
| apps/electron/src/renderer/playground/registry/input.tsx | Low priority (demo) | Demo headings. |
| apps/electron/src/renderer/playground/registry/turn-card.tsx | Low priority (demo) | “Open Document Overlay”. |
