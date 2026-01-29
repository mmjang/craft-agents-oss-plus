import { Button } from "@/components/ui/button"
import { Spinner } from "@craft-agent/ui"
import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol"
import { useI18n } from "@/i18n/I18nContext"
import { StepFormLayout } from "./primitives"

interface CompletionStepProps {
  status: 'saving' | 'complete'
  spaceName?: string
  onFinish: () => void
}

/**
 * CompletionStep - Success screen after onboarding
 *
 * Shows:
 * - saving: Spinner while saving configuration
 * - complete: Success message with option to start
 */
export function CompletionStep({
  status,
  spaceName,
  onFinish
}: CompletionStepProps) {
  const { t } = useI18n()
  const isSaving = status === 'saving'

  return (
    <StepFormLayout
      iconElement={isSaving ? (
        <div className="flex size-16 items-center justify-center">
          <Spinner className="text-2xl text-foreground" />
        </div>
      ) : (
        <div className="flex size-16 items-center justify-center">
          <CraftAgentsSymbol className="size-10 text-accent" />
        </div>
      )}
      title={isSaving ? t('onboarding.completion.settingUp', 'Setting up...') : t('onboarding.completion.allSet', "You're all set!")}
      description={
        isSaving ? (
          t('onboarding.completion.saving', 'Saving your configuration...')
        ) : (
          t('onboarding.completion.startChat', 'Just start a chat and get to work.')
        )
      }
      actions={
        status === 'complete' ? (
          <Button onClick={onFinish} className="w-full max-w-[320px] bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg" size="lg">
            {t('onboarding.completion.getStarted', 'Get Started')}
          </Button>
        ) : undefined
      }
    />
  )
}
