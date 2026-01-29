import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, ExternalLink, CheckCircle2, XCircle } from "lucide-react"
import { Spinner } from "@craft-agent/ui"
import { useI18n } from "@/i18n/I18nContext"
import type { TranslationKey } from "@/i18n/translations"
import type { BillingMethod } from "./BillingMethodStep"
import { StepFormLayout, BackButton, ContinueButton, type StepIconVariant } from "./primitives"

export type CredentialStatus = 'idle' | 'validating' | 'success' | 'error'
export interface ApiCredentialPayload {
  apiKey: string
  baseUrl?: string | null
}

interface CredentialsStepProps {
  billingMethod: BillingMethod
  status: CredentialStatus
  errorMessage?: string
  onSubmit: (credential: ApiCredentialPayload) => void
  onStartOAuth?: () => void
  onBack: () => void
  // Claude OAuth specific
  existingClaudeToken?: string | null
  isClaudeCliInstalled?: boolean
  onUseExistingClaudeToken?: () => void
  // Two-step OAuth flow
  isWaitingForCode?: boolean
  onSubmitAuthCode?: (code: string) => void
  onCancelOAuth?: () => void
}

function getOAuthIcon(status: CredentialStatus): React.ReactNode {
  switch (status) {
    case 'idle': return undefined
    case 'validating': return <Spinner className="text-2xl" />
    case 'success': return <CheckCircle2 />
    case 'error': return <XCircle />
  }
}

function getOAuthIconVariant(status: CredentialStatus): StepIconVariant {
  switch (status) {
    case 'idle': return 'primary'
    case 'validating': return 'loading'
    case 'success': return 'success'
    case 'error': return 'error'
  }
}

interface OAuthStatusContent {
  titleKey: TranslationKey
  descKey: TranslationKey | ''
}

const OAUTH_STATUS_CONTENT: Record<CredentialStatus, OAuthStatusContent> = {
  idle: {
    titleKey: 'onboarding.credentials.connectTitle',
    descKey: 'onboarding.credentials.connectDesc',
  },
  validating: {
    titleKey: 'onboarding.credentials.connecting',
    descKey: 'onboarding.credentials.connectingDesc',
  },
  success: {
    titleKey: 'onboarding.credentials.connected',
    descKey: 'onboarding.credentials.connectedDesc',
  },
  error: {
    titleKey: 'onboarding.credentials.connectionFailed',
    descKey: '', // Will use errorMessage prop
  },
}

/**
 * CredentialsStep - Enter API key or start OAuth flow
 *
 * For API Key: Shows input field with validation
 * For Claude OAuth: Shows button to start OAuth flow
 */
export function CredentialsStep({
  billingMethod,
  status,
  errorMessage,
  onSubmit,
  onStartOAuth,
  onBack,
  existingClaudeToken,
  isClaudeCliInstalled,
  onUseExistingClaudeToken,
  // Two-step OAuth flow
  isWaitingForCode,
  onSubmitAuthCode,
  onCancelOAuth,
}: CredentialsStepProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [showValue, setShowValue] = useState(false)
  const [authCode, setAuthCode] = useState('')

  const isApiKey = billingMethod === 'api_key'
  const isOAuth = billingMethod === 'claude_oauth'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      apiKey: value.trim(),
      baseUrl: baseUrl.trim() || null,
    })
  }

  // Handle auth code submission
  const handleAuthCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (authCode.trim() && onSubmitAuthCode) {
      onSubmitAuthCode(authCode.trim())
    }
  }

  // OAuth flow
  if (isOAuth) {
    const content = OAUTH_STATUS_CONTENT[status]

    // Check if we have existing token from keychain
    const hasExistingToken = !!existingClaudeToken

    // Waiting for authorization code entry
    if (isWaitingForCode) {
      return (
        <StepFormLayout
          title={t('onboarding.credentials.enterAuthCode', 'Enter Authorization Code')}
          description={t('onboarding.credentials.enterAuthCodeDesc', 'Copy the code from the browser page and paste it below.')}
          actions={
            <>
              <BackButton onClick={onCancelOAuth} disabled={status === 'validating'}>{t('onboarding.credentials.cancel', 'Cancel')}</BackButton>
              <ContinueButton
                type="submit"
                form="auth-code-form"
                disabled={!authCode.trim()}
                loading={status === 'validating'}
                loadingText={t('onboarding.credentials.connecting', 'Connecting...')}
              />
            </>
          }
        >
          <form id="auth-code-form" onSubmit={handleAuthCodeSubmit}>
            <div className="space-y-2">
              <Label htmlFor="auth-code">{t('onboarding.credentials.authCodeLabel', 'Authorization Code')}</Label>
              <div className={cn(
                "relative rounded-md shadow-minimal transition-colors",
                "bg-foreground-2 focus-within:bg-background"
              )}>
                <Input
                  id="auth-code"
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder={t('onboarding.credentials.authCodePlaceholder', 'Paste your authorization code here')}
                  className={cn(
                    "border-0 bg-transparent shadow-none font-mono text-sm",
                    status === 'error' && "focus-visible:ring-destructive"
                  )}
                  disabled={status === 'validating'}
                  autoFocus
                />
              </div>
              {status === 'error' && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
            </div>
          </form>
        </StepFormLayout>
      )
    }

    const actions = (
      <>
        {status === 'idle' && (
          <>
            <BackButton onClick={onBack} />
            {hasExistingToken ? (
              <ContinueButton onClick={onUseExistingClaudeToken} className="gap-2">
                <CheckCircle2 className="size-4" />
                {t('onboarding.credentials.useExistingToken', 'Use Existing Token')}
              </ContinueButton>
            ) : (
              <ContinueButton onClick={onStartOAuth} className="gap-2">
                <ExternalLink className="size-4" />
                {t('onboarding.credentials.signInWithClaude', 'Sign in with Claude')}
              </ContinueButton>
            )}
          </>
        )}

        {status === 'validating' && (
          <BackButton onClick={onBack} className="w-full">{t('onboarding.credentials.cancel', 'Cancel')}</BackButton>
        )}

        {status === 'error' && (
          <>
            <BackButton onClick={onBack} />
            <ContinueButton onClick={hasExistingToken ? onUseExistingClaudeToken : onStartOAuth}>
              {t('onboarding.credentials.tryAgain', 'Try Again')}
            </ContinueButton>
          </>
        )}
      </>
    )

    // Dynamic description based on state
    let description = content.descKey ? t(content.descKey, content.descKey) : ''
    if (status === 'idle') {
      if (hasExistingToken && existingClaudeToken) {
        // Show preview of detected token (first 20 chars)
        const tokenPreview = existingClaudeToken.length > 20
          ? `${existingClaudeToken.slice(0, 20)}...`
          : existingClaudeToken
        description = t('onboarding.credentials.foundToken', 'Found existing token: {{token}}', { token: tokenPreview })
      } else {
        description = t('onboarding.credentials.clickToSignIn', 'Click below to sign in with your Claude Pro or Max subscription.')
      }
    }

    return (
      <StepFormLayout
        icon={getOAuthIcon(status)}
        iconVariant={getOAuthIconVariant(status)}
        title={t(content.titleKey, content.titleKey)}
        description={status === 'error' ? (errorMessage || t('onboarding.credentials.somethingWrong', 'Something went wrong. Please try again.')) : description}
        actions={actions}
      >
        {/* Show secondary option if we have an existing token */}
        {status === 'idle' && hasExistingToken && (
          <div className="text-center">
            <button
              onClick={onStartOAuth}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {t('onboarding.credentials.signInDifferent', 'Or sign in with a different account')}
            </button>
          </div>
        )}
      </StepFormLayout>
    )
  }

  // API Key flow
  return (
    <StepFormLayout
      title={t('onboarding.credentials.enterApiKey', 'Enter API Key')}
      description={
        <>
          {t('onboarding.credentials.getApiKey', 'Get your API key from')}{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:underline"
          >
            console.anthropic.com
          </a>
        </>
      }
      actions={
        <>
          <BackButton onClick={onBack} disabled={status === 'validating'} />
          <ContinueButton
            type="submit"
            form="api-key-form"
            disabled={!value.trim()}
            loading={status === 'validating'}
            loadingText={t('onboarding.credentials.validating', 'Validating...')}
          />
        </>
      }
    >
      <form id="api-key-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">{t('onboarding.credentials.apiKeyLabel', 'Anthropic API Key')}</Label>
            <div className={cn(
              "relative rounded-md shadow-minimal transition-colors",
              "bg-foreground-2 focus-within:bg-background"
            )}>
              <Input
                id="api-key"
                type={showValue ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sk-ant-..."
                className={cn(
                  "pr-10 border-0 bg-transparent shadow-none",
                  status === 'error' && "focus-visible:ring-destructive"
                )}
                disabled={status === 'validating'}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showValue ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-base-url">{t('onboarding.credentials.baseUrlLabel', 'API Base URL (optional)')}</Label>
            <div className={cn(
              "rounded-md shadow-minimal transition-colors",
              "bg-foreground-2 focus-within:bg-background"
            )}>
              <Input
                id="api-base-url"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.anthropic.com"
                className={cn(
                  "border-0 bg-transparent shadow-none font-mono text-sm",
                  status === 'error' && "focus-visible:ring-destructive"
                )}
                disabled={status === 'validating'}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('onboarding.credentials.baseUrlHint', "Leave blank to use Anthropic's default endpoint or set your proxy URL here.")}
            </p>
          </div>

          {status === 'error' && errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
      </form>
    </StepFormLayout>
  )
}
