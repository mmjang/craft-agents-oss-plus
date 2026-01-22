/**
 * ShortcutsPage
 *
 * Displays keyboard shortcuts reference.
 */

import * as React from 'react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'
import { useI18n } from '@/i18n/I18nContext'

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutItem[]
}

const isMac =
  typeof navigator !== 'undefined' &&
  navigator.platform.toUpperCase().indexOf('MAC') >= 0
const cmdKey = isMac ? '⌘' : 'Ctrl'

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium bg-muted border border-border rounded shadow-sm ${className || ''}`}>
      {children}
    </kbd>
  )
}

export default function ShortcutsPage() {
  const { t } = useI18n()

  const sections: ShortcutSection[] = React.useMemo(() => [
    {
      title: t('shortcuts.section.global', 'Global'),
      shortcuts: [
        { keys: [cmdKey, '1'], description: t('shortcuts.focusSidebar', 'Focus sidebar') },
        { keys: [cmdKey, '2'], description: t('shortcuts.focusSessionList', 'Focus session list') },
        { keys: [cmdKey, '3'], description: t('shortcuts.focusChatInput', 'Focus chat input') },
        { keys: [cmdKey, 'N'], description: t('shortcuts.newChat', 'New chat') },
        { keys: [cmdKey, 'B'], description: t('shortcuts.toggleSidebar', 'Toggle sidebar') },
        { keys: [cmdKey, ','], description: t('shortcuts.openSettings', 'Open settings') },
        { keys: [cmdKey, '/'], description: t('shortcuts.showShortcuts', 'Show keyboard shortcuts') },
      ],
    },
    {
      title: t('shortcuts.section.navigation', 'Navigation'),
      shortcuts: [
        { keys: ['Tab'], description: t('shortcuts.nextZone', 'Move to next zone') },
        { keys: ['Shift', 'Tab'], description: t('shortcuts.prevZone', 'Move to previous zone') },
        { keys: ['←', '→'], description: t('shortcuts.zoneArrows', 'Move between zones (in lists)') },
        { keys: ['↑', '↓'], description: t('shortcuts.navigateList', 'Navigate items in list') },
        { keys: ['Home'], description: t('shortcuts.firstItem', 'Go to first item') },
        { keys: ['End'], description: t('shortcuts.lastItem', 'Go to last item') },
        { keys: ['Esc'], description: t('shortcuts.closeDialog', 'Close dialog / blur input') },
      ],
    },
    {
      title: t('shortcuts.section.sessionList', 'Session List'),
      shortcuts: [
        { keys: ['Enter'], description: t('shortcuts.sessionFocusInput', 'Focus chat input') },
        { keys: ['Delete'], description: t('shortcuts.deleteSession', 'Delete session') },
        { keys: ['R'], description: t('shortcuts.renameSession', 'Rename session') },
        { keys: ['Right-click'], description: t('shortcuts.contextMenu', 'Open context menu') },
      ],
    },
    {
      title: t('shortcuts.section.agentTree', 'Agent Tree'),
      shortcuts: [
        { keys: ['←'], description: t('shortcuts.collapseFolder', 'Collapse folder') },
        { keys: ['→'], description: t('shortcuts.expandFolder', 'Expand folder') },
      ],
    },
    {
      title: t('shortcuts.section.chat', 'Chat'),
      shortcuts: [
        { keys: ['Enter'], description: t('shortcuts.send', 'Send message') },
        { keys: ['Shift', 'Enter'], description: t('shortcuts.newLine', 'New line') },
        { keys: [cmdKey, 'Enter'], description: t('shortcuts.send', 'Send message') },
        { keys: ['Esc'], description: t('shortcuts.stopAgent', 'Stop agent (when processing)') },
      ],
    },
  ], [t])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('shortcuts.title', 'Shortcuts')} actions={<HeaderMenu route={routes.view.settings('shortcuts')} />} />
      <Separator />
      <ScrollArea className="flex-1">
        <div className="px-5 py-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1.5 border-b border-border/50">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex-1 mx-3 h-px bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_8px)] opacity-0 group-hover:opacity-15" />
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <Kbd key={keyIndex} className="group-hover:bg-foreground/10 group-hover:border-foreground/20">{key}</Kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
