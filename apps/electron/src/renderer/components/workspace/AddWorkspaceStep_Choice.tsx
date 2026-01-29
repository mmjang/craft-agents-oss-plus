import { FolderPlus, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/i18n/I18nContext"
import { AddWorkspaceContainer, AddWorkspaceStepHeader } from "./primitives"

interface AddWorkspaceStep_ChoiceProps {
  onCreateNew: () => void
  onOpenFolder: () => void
}

interface ChoiceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

function ChoiceCard({ icon, title, description, onClick, variant = 'secondary' }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full p-4 rounded-lg text-left",
        "bg-background shadow-minimal",
        "transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === 'primary'
          ? "hover:bg-accent/5"
          : "hover:bg-foreground/5"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        variant === 'primary'
          ? "bg-accent/10 text-accent"
          : "bg-foreground/5 text-foreground/70"
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-medium text-[15px] text-foreground">{title}</div>
        <div className="text-[12px] text-muted-foreground -mt-[1px]">{description}</div>
      </div>
    </button>
  )
}

/**
 * AddWorkspaceStep_Choice - Initial step to choose creation method
 *
 * Two options:
 * 1. Create new workspace - Creates a fresh workspace folder
 * 2. Open folder as workspace - Use an existing folder
 */
export function AddWorkspaceStep_Choice({
  onCreateNew,
  onOpenFolder
}: AddWorkspaceStep_ChoiceProps) {
  const { t } = useI18n()

  return (
    <AddWorkspaceContainer>
      <div className="mt-2" />
      <AddWorkspaceStepHeader
        title={t('workspace.add.title', 'Add Workspace')}
        description={t('workspace.add.desc', 'Where your ideas meet the tools to make them happen.')}
      />

      <div className="mt-8 w-full space-y-3">
        <ChoiceCard
          icon={<FolderPlus className="h-5 w-5" />}
          title={t('workspace.add.createNew', 'Create new')}
          description={t('workspace.add.createNewDesc', 'Start fresh with an empty workspace.')}
          onClick={onCreateNew}
          variant="primary"
        />

        <ChoiceCard
          icon={<FolderOpen className="h-5 w-5" />}
          title={t('workspace.add.openFolder', 'Open folder')}
          description={t('workspace.add.openFolderDesc', 'Choose an existing folder as workspace.')}
          onClick={onOpenFolder}
        />
      </div>
    </AddWorkspaceContainer>
  )
}
