import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol"
import { useI18n } from "@/i18n/I18nContext"
import { StepFormLayout, ContinueButton } from "./primitives"

interface WelcomeStepProps {
  onContinue: () => void
  /** Whether this is an existing user updating settings */
  isExistingUser?: boolean
}

/**
 * WelcomeStep - Initial welcome screen for onboarding
 *
 * Shows different messaging for new vs existing users:
 * - New users: Welcome to Craft Plus
 * - Existing users: Update your billing settings
 */
export function WelcomeStep({
  onContinue,
  isExistingUser = false
}: WelcomeStepProps) {
  const { t } = useI18n()

  return (
    <StepFormLayout
      iconElement={
        <div className="flex size-16 items-center justify-center">
          <CraftAgentsSymbol className="size-10 text-accent" />
        </div>
      }
      title={isExistingUser ? t('onboarding.welcome.titleUpdate', 'Update Settings') : t('onboarding.welcome.title', 'Welcome to Craft Plus')}
      description={
        isExistingUser
          ? t('onboarding.welcome.descUpdate', 'Update billing or change your setup.')
          : t('onboarding.welcome.desc', 'Agents with the UX they deserve. Connect anything. Organize your sessions. Everything you need to do the work of your life!')
      }
      actions={
        <ContinueButton onClick={onContinue} className="w-full">
          {isExistingUser ? t('onboarding.welcome.continue', 'Continue') : t('onboarding.welcome.getStarted', 'Get Started')}
        </ContinueButton>
      }
    />
  )
}
