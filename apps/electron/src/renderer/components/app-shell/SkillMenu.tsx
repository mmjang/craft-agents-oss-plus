/**
 * SkillMenu - Shared menu content for skill actions
 *
 * Used by:
 * - SkillsListPanel (dropdown via "..." button, context menu via right-click)
 * - SkillInfoPage (title dropdown menu)
 *
 * Uses MenuComponents context to render with either DropdownMenu or ContextMenu
 * primitives, allowing the same component to work in both scenarios.
 *
 * Provides consistent skill actions:
 * - Open in New Window
 * - Show in Finder
 * - Delete (hidden for app-level skills)
 */

import * as React from 'react'
import {
  Trash2,
  FolderOpen,
  AppWindow,
} from 'lucide-react'
import { useMenuComponents } from '@/components/ui/menu-context'
import { useI18n } from '@/i18n/I18nContext'

export interface SkillMenuProps {
  /** Skill slug */
  skillSlug: string
  /** Skill name for display */
  skillName: string
  /** Whether this is an app-level preset skill (read-only, not deletable) */
  isAppLevel?: boolean
  /** Callbacks */
  onOpenInNewWindow: () => void
  onShowInFinder: () => void
  onDelete: () => void
}

/**
 * SkillMenu - Renders the menu items for skill actions
 * This is the content only, not wrapped in a DropdownMenu or ContextMenu
 */
export function SkillMenu({
  skillSlug,
  skillName,
  isAppLevel,
  onOpenInNewWindow,
  onShowInFinder,
  onDelete,
}: SkillMenuProps) {
  // Get menu components from context (works with both DropdownMenu and ContextMenu)
  const { MenuItem, Separator } = useMenuComponents()
  const { t } = useI18n()

  return (
    <>
      {/* Open in New Window */}
      <MenuItem onClick={onOpenInNewWindow}>
        <AppWindow className="h-3.5 w-3.5" />
        <span className="flex-1">{t('sidebar.openInNewWindow', 'Open in New Window')}</span>
      </MenuItem>

      {/* Show in Finder */}
      <MenuItem onClick={onShowInFinder}>
        <FolderOpen className="h-3.5 w-3.5" />
        <span className="flex-1">{t('skillMenu.showInFinder', 'Show in Finder')}</span>
      </MenuItem>

      {/* Delete - hidden for app-level skills */}
      {!isAppLevel && (
        <>
          <Separator />
          <MenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="h-3.5 w-3.5" />
            <span className="flex-1">{t('skillMenu.delete', 'Delete Skill')}</span>
          </MenuItem>
        </>
      )}
    </>
  )
}
