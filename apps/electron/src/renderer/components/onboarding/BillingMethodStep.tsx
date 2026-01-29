import { cn } from "@/lib/utils"
import { Check, CreditCard, Key } from "lucide-react"
import { useI18n } from "@/i18n/I18nContext"
import { StepFormLayout, BackButton, ContinueButton } from "./primitives"

export type BillingMethod = 'api_key' | 'claude_oauth'

interface BillingOption {
  id: BillingMethod
  nameKey: string
  descKey: string
  icon: React.ReactNode
  recommended?: boolean
}

const BILLING_OPTIONS: BillingOption[] = [
  {
    id: 'claude_oauth',
    nameKey: 'onboarding.billing.claudePro',
    descKey: 'onboarding.billing.claudeProDesc',
    icon: <CreditCard className="size-4" />,
    recommended: true,
  },
  {
    id: 'api_key',
    nameKey: 'onboarding.billing.apiKey',
    descKey: 'onboarding.billing.apiKeyDesc',
    icon: <Key className="size-4" />,
  },
]

interface BillingMethodStepProps {
  selectedMethod: BillingMethod | null
  onSelect: (method: BillingMethod) => void
  onContinue: () => void
  onBack: () => void
}

/**
 * BillingMethodStep - Choose how to pay for AI usage
 *
 * Two options:
 * - Claude Pro/Max (recommended) - Uses Claude subscription
 * - API Key - Pay-as-you-go via Anthropic
 */
export function BillingMethodStep({
  selectedMethod,
  onSelect,
  onContinue,
  onBack
}: BillingMethodStepProps) {
  const { t } = useI18n()

  return (
    <StepFormLayout
      title={t('onboarding.billing.title', 'Choose Billing Method')}
      description={t('onboarding.billing.desc', "Select how you'd like to power your AI agents.")}
      actions={
        <>
          <BackButton onClick={onBack} />
          <ContinueButton onClick={onContinue} disabled={!selectedMethod} />
        </>
      }
    >
      {/* Options */}
      <div className="space-y-3">
        {BILLING_OPTIONS.map((option) => {
          const isSelected = option.id === selectedMethod

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={cn(
                "flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "hover:bg-foreground/[0.02] shadow-minimal",
                isSelected
                  ? "bg-background"
                  : "bg-foreground-2"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  isSelected ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {option.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{t(option.nameKey, option.nameKey)}</span>
                  {option.recommended && (
                    <span className="bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/70">
                      {t('onboarding.billing.recommended', 'Recommended')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(option.descKey, option.descKey)}
                </p>
              </div>

              {/* Check */}
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-foreground bg-foreground text-background"
                    : "border-muted-foreground/20"
                )}
              >
                {isSelected && <Check className="size-3" strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>
    </StepFormLayout>
  )
}
