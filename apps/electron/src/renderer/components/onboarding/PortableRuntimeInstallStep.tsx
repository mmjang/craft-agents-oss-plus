import { useEffect } from 'react'
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { StepFormLayout, ContinueButton, BackButton } from './primitives'
import { useI18n } from '@/i18n/I18nContext'

export type PortableRuntimeInstallStatus =
  | 'checking'
  | 'not_installed'
  | 'installing'
  | 'success'
  | 'error'

interface PortableRuntimeInstallStepProps {
  status: PortableRuntimeInstallStatus
  progress: number
  message: string
  errorMessage?: string
  onContinue: () => void
  onBack: () => void
  onRetry: () => void
}

export function PortableRuntimeInstallStep({
  status,
  progress,
  message,
  errorMessage,
  onContinue,
  onBack,
  onRetry,
}: PortableRuntimeInstallStepProps) {
  const { t } = useI18n()

  useEffect(() => {
    if (status === 'not_installed') {
      onRetry()
    }
  }, [status, onRetry])

  const getIcon = () => {
    switch (status) {
      case 'checking':
      case 'installing':
        return <Loader2 className="size-8 animate-spin text-accent" />
      case 'success':
        return <CheckCircle className="size-8 text-success" />
      case 'error':
        return <AlertCircle className="size-8 text-destructive" />
      default:
        return <Download className="size-8 text-foreground" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'checking':
        return t('onboarding.runtime.checking', 'Checking runtime...')
      case 'installing':
        return t('onboarding.runtime.installingTitle', 'Installing runtime')
      case 'success':
        return t('onboarding.runtime.successTitle', 'Runtime ready')
      case 'error':
        return t('onboarding.runtime.errorTitle', 'Runtime installation failed')
      default:
        return t('onboarding.runtime.title', 'Portable runtime')
    }
  }

  const getDescription = () => {
    switch (status) {
      case 'checking':
        return t('onboarding.runtime.checkingDesc', 'Checking portable runtime components...')
      case 'installing':
        return message || t('onboarding.runtime.installingDesc', 'Downloading runtime components...')
      case 'success':
        return t('onboarding.runtime.successDesc', 'Portable runtime is ready to use.')
      case 'error':
        return errorMessage || t('onboarding.runtime.errorDesc', 'Failed to install portable runtime.')
      default:
        return t('onboarding.runtime.desc', 'Portable runtime is required for this application.')
    }
  }

  const canContinue = status === 'success'
  const isLoading = status === 'checking' || status === 'installing'

  return (
    <StepFormLayout
      iconElement={<div className="flex size-16 items-center justify-center">{getIcon()}</div>}
      title={getTitle()}
      description={getDescription()}
      actions={
        <div className="flex w-full gap-3">
          <BackButton onClick={onBack} className="flex-1">
            {t('common.cancel', 'Cancel')}
          </BackButton>
          {status === 'error' ? (
            <ContinueButton onClick={onRetry} className="flex-1">
              {t('onboarding.runtime.retry', 'Retry')}
            </ContinueButton>
          ) : (
            <ContinueButton
              onClick={onContinue}
              disabled={!canContinue}
              loading={isLoading}
              loadingText={t('onboarding.runtime.installing', 'Installing...')}
              className="flex-1"
            >
              {t('common.continue', 'Continue')}
            </ContinueButton>
          )}
        </div>
      }
    >
      {isLoading && (
        <div className="w-full space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {progress > 0 ? `${progress}%` : t('onboarding.runtime.preparing', 'Preparing...')}
          </p>
        </div>
      )}
    </StepFormLayout>
  )
}
