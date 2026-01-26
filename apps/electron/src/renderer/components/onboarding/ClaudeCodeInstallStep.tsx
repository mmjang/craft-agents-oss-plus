import { useEffect, useState, useCallback } from 'react'
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { StepFormLayout, ContinueButton, BackButton } from './primitives'
import { useI18n } from '@/i18n/I18nContext'
import type { ClaudeCodeInstallProgress } from '../../../shared/types'

export type ClaudeCodeInstallStatus =
  | 'checking'
  | 'not_installed'
  | 'installing'
  | 'success'
  | 'error'
  | 'already_installed'

interface ClaudeCodeInstallStepProps {
  onContinue: () => void
  onBack: () => void
  /** Whether Claude CLI is already installed system-wide */
  isClaudeCliInstalled?: boolean
}

/**
 * ClaudeCodeInstallStep - Installs Claude Code using portable npm
 *
 * This step:
 * 1. Checks if Claude Code is already installed
 * 2. If not, installs it using the app's portable Node.js
 * 3. Shows progress during installation
 * 4. Handles errors with retry option
 */
export function ClaudeCodeInstallStep({
  onContinue,
  onBack,
  isClaudeCliInstalled = false,
}: ClaudeCodeInstallStepProps) {
  const { t } = useI18n()
  const [status, setStatus] = useState<ClaudeCodeInstallStatus>('checking')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const startInstallation = useCallback(async () => {
    setStatus('installing')
    setProgress(0)
    setMessage(t('onboarding.claudeCode.installing', 'Installing Claude Code...'))
    setErrorMessage('')

    try {
      await window.electronAPI.installClaudeCode()
      // Success is handled by the progress callback
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      setStatus('error')
      setErrorMessage(msg)
    }
  }, [t])

  // Listen for installation progress
  useEffect(() => {
    const cleanup = window.electronAPI.onClaudeCodeInstallProgress(
      (progressData: ClaudeCodeInstallProgress) => {
        setProgress(progressData.progress ?? 0)
        setMessage(progressData.message)

        if (progressData.status === 'success' || progressData.status === 'already_installed') {
          setStatus('success')
        } else if (progressData.status === 'error') {
          setStatus('error')
          setErrorMessage(progressData.message)
        } else if (progressData.status === 'installing') {
          setStatus('installing')
        }
      }
    )

    return cleanup
  }, [])

  // Initial check
  useEffect(() => {
    // If Claude CLI is already installed system-wide, skip this step
    if (isClaudeCliInstalled) {
      setStatus('already_installed')
      setMessage(t('onboarding.claudeCode.alreadyInstalled', 'Claude Code is already installed'))
      return
    }

    // Otherwise, start installation automatically
    setStatus('not_installed')
    setMessage(t('onboarding.claudeCode.notInstalled', 'Claude Code needs to be installed'))
  }, [isClaudeCliInstalled, t])

  // Auto-start installation when not installed
  useEffect(() => {
    if (status === 'not_installed') {
      startInstallation()
    }
  }, [status, startInstallation])

  const getIcon = () => {
    switch (status) {
      case 'checking':
      case 'installing':
        return <Loader2 className="size-8 animate-spin text-accent" />
      case 'success':
      case 'already_installed':
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
        return t('onboarding.claudeCode.checking', 'Checking Claude Code...')
      case 'installing':
        return t('onboarding.claudeCode.installingTitle', 'Installing Claude Code')
      case 'success':
      case 'already_installed':
        return t('onboarding.claudeCode.successTitle', 'Claude Code Ready')
      case 'error':
        return t('onboarding.claudeCode.errorTitle', 'Installation Failed')
      default:
        return t('onboarding.claudeCode.title', 'Claude Code')
    }
  }

  const getDescription = () => {
    switch (status) {
      case 'checking':
        return t('onboarding.claudeCode.checkingDesc', 'Checking if Claude Code is installed...')
      case 'installing':
        return message || t('onboarding.claudeCode.installingDesc', 'Installing Claude Code...')
      case 'success':
      case 'already_installed':
        return t('onboarding.claudeCode.successDesc', 'Claude Code is ready to use.')
      case 'error':
        return errorMessage || t('onboarding.claudeCode.errorDesc', 'Failed to install Claude Code.')
      default:
        return t('onboarding.claudeCode.desc', 'Claude Code is required for this application.')
    }
  }

  const canContinue = status === 'success' || status === 'already_installed'
  const isLoading = status === 'checking' || status === 'installing'

  return (
    <StepFormLayout
      iconElement={
        <div className="flex size-16 items-center justify-center">
          {getIcon()}
        </div>
      }
      title={getTitle()}
      description={getDescription()}
      actions={
        <div className="flex w-full gap-3">
          <BackButton onClick={onBack} className="flex-1">
            {t('common.cancel', 'Cancel')}
          </BackButton>
          {status === 'error' ? (
            <ContinueButton onClick={startInstallation} className="flex-1">
              {t('onboarding.claudeCode.retry', 'Retry')}
            </ContinueButton>
          ) : (
            <ContinueButton
              onClick={onContinue}
              disabled={!canContinue}
              loading={isLoading}
              loadingText={t('onboarding.claudeCode.installing', 'Installing...')}
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
            {progress > 0 ? `${progress}%` : t('onboarding.claudeCode.preparing', 'Preparing...')}
          </p>
        </div>
      )}
    </StepFormLayout>
  )
}
