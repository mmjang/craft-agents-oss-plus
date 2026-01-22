import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRegisterModal } from "@/context/ModalContext"
import { useI18n } from "@/i18n/I18nContext"
import { useMemo } from "react"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutItem[]
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
const cmdKey = isMac ? '⌘' : 'Ctrl'

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium bg-muted border border-border rounded shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  // Register with modal context so X button / Cmd+W closes this dialog first
  useRegisterModal(open, () => onOpenChange(false))
  const { t } = useI18n()

  const sections: ShortcutSection[] = useMemo(() => [
    {
      title: t('shortcuts.section.global', 'Global'),
      shortcuts: [
        { keys: [cmdKey, '1'], description: t('shortcuts.focusSidebar', 'Focus sidebar') },
        { keys: [cmdKey, '2'], description: t('shortcuts.focusSessionList', 'Focus session list') },
        { keys: [cmdKey, '3'], description: t('shortcuts.focusChatInput', 'Focus chat input') },
        { keys: [cmdKey, 'N'], description: t('shortcuts.newChat', 'New chat') },
        { keys: [cmdKey, 'Shift', 'N'], description: t('shortcuts.newWindow', 'New window') },
        { keys: [cmdKey, '\\'], description: t('shortcuts.toggleSidebar', 'Toggle sidebar') },
        { keys: [cmdKey, ','], description: t('shortcuts.openSettings', 'Open settings') },
        { keys: [cmdKey, '/'], description: t('shortcuts.showShortcuts', 'Show this dialog') },
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
      ],
    },
  ], [t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('menu.shortcuts', 'Keyboard Shortcuts')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Kbd key={keyIndex}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
