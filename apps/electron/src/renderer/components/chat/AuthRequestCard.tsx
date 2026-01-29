import * as React from 'react'
import { useState, useCallback } from 'react'
import { Key, User, Lock, Eye, EyeOff, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/I18nContext'
import type { Message, CredentialResponse } from '../../../shared/types'
import type { AuthRequestType, AuthStatus } from '@craft-agent/core/types'

// ============================================================================
// Primitives
// ============================================================================

type AuthCardVariant = 'default' | 'success' | 'error' | 'muted'

// Variant styles - bg colors are animated via Framer Motion, text via CSS transition
const VARIANT_STYLES: Record<AuthCardVariant, { bg: string; textClass: string; shadowColor?: string }> = {
  default: { bg: 'var(--background)', textClass: 'text-foreground shadow-minimal' },
  success: { bg: 'oklch(from var(--success) l c h / 0.03)', textClass: 'text-[var(--success-text)] shadow-tinted', shadowColor: 'var(--success-rgb)' },
  error: { bg: 'oklch(from var(--destructive) l c h / 0.03)', textClass: 'text-[var(--destructive-text)] shadow-tinted', shadowColor: 'var(--destructive-rgb)' },
  muted: { bg: 'var(--foreground-3)', textClass: 'text-foreground/70 shadow-minimal' },
}

interface AuthCardHeaderProps {
  icon?: LucideIcon
  iconClassName?: string
  title: string
  titleSuffix?: string
  subtitle?: string
  subtitleSecondary?: string
  description?: string
}

function AuthCardHeader({
  icon: Icon,
  iconClassName,
  title,
  titleSuffix,
  subtitle,
  subtitleSecondary,
  description,
}: AuthCardHeaderProps) {
  return (
    <div className="flex gap-3">
      {/* Icon aligned to first line of text (optional) */}
      {Icon && <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconClassName)} />}
      <div className="flex-1 min-w-0">
        {/* Title inherits container text color */}
        <div className="text-sm font-medium leading-5">
          {title}
          {titleSuffix && (
            <span className="text-xs text-muted-foreground ml-2">({titleSuffix})</span>
          )}
        </div>
        {/* Subtitles use 50% opacity of inherited color */}
        {subtitle && (
          <div className="text-xs mt-0.5 opacity-50">
            {subtitle}
          </div>
        )}
        {subtitleSecondary && (
          <div className="text-xs mt-0.5 opacity-50">
            {subtitleSecondary}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

interface AuthCardActionsProps {
  primary: {
    label: string
    icon?: LucideIcon
    onClick: () => void
    disabled?: boolean
    loading?: boolean
    dataTutorial?: string
  }
  secondary?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
    disabled?: boolean
  }
  hint?: string
}

function AuthCardActions({ primary, secondary, hint }: AuthCardActionsProps) {
  const PrimaryIcon = primary.icon
  const SecondaryIcon = secondary?.icon

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-border/50">
      <Button
        size="sm"
        variant="default"
        className="h-7 gap-1.5"
        onClick={primary.onClick}
        disabled={primary.disabled}
        data-tutorial={primary.dataTutorial}
      >
        {primary.loading ? (
          <Spinner className="text-[10px]" />
        ) : PrimaryIcon ? (
          <PrimaryIcon className="h-3.5 w-3.5" />
        ) : null}
        {primary.label}
      </Button>
      {secondary && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={secondary.onClick}
          disabled={secondary.disabled}
        >
          {SecondaryIcon && <SecondaryIcon className="h-3.5 w-3.5" />}
          {secondary.label}
        </Button>
      )}
      {hint && (
        <>
          <div className="flex-1" />
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        </>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

interface AuthRequestCardProps {
  message: Message
  /** Callback to respond to credential request */
  onRespondToCredential?: (sessionId: string, requestId: string, response: CredentialResponse) => void
  /** Session ID for this auth request */
  sessionId: string
  /** Whether the card is interactive (last message, no user message after). Default true. */
  isInteractive?: boolean
}

/**
 * AuthRequestCard - Inline auth UI displayed in chat history
 *
 * Renders different UIs based on auth type:
 * - credential: Form for API key, bearer token, basic auth
 * - oauth/oauth-google/oauth-slack/oauth-microsoft: OAuth flow with browser redirect
 *
 * Status handling:
 * - pending: Show interactive form/button
 * - completed: Show success state
 * - cancelled: Show cancelled state
 * - failed: Show error state
 */
export function AuthRequestCard({ message, onRespondToCredential, sessionId, isInteractive = true }: AuthRequestCardProps) {
  const { t } = useI18n()
  const [value, setValue] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    authRequestId,
    authRequestType,
    authSourceSlug,
    authSourceName,
    authStatus,
    authCredentialMode,
    authHeaderName,
    authLabels,
    authDescription,
    authHint,
    authError,
    authEmail,
    authWorkspace,
  } = message

  const isBasicAuth = authCredentialMode === 'basic'
  const isValid = isBasicAuth
    ? username.trim() && password.trim()
    : value.trim()

  const handleSubmit = useCallback(() => {
    if (!isValid || !authRequestId || !onRespondToCredential) return

    setIsSubmitting(true)

    if (isBasicAuth) {
      onRespondToCredential(sessionId, authRequestId, {
        type: 'credential',
        username: username.trim(),
        password: password.trim(),
        cancelled: false
      })
    } else {
      onRespondToCredential(sessionId, authRequestId, {
        type: 'credential',
        value: value.trim(),
        cancelled: false
      })
    }
  }, [isBasicAuth, username, password, value, isValid, onRespondToCredential, sessionId, authRequestId])

  const handleCancel = useCallback(() => {
    if (!authRequestId || !onRespondToCredential) return
    onRespondToCredential(sessionId, authRequestId, { type: 'credential', cancelled: true })
  }, [onRespondToCredential, sessionId, authRequestId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }, [isValid, handleSubmit, handleCancel])

  const handleOAuthClick = useCallback(async () => {
    // Trigger OAuth flow when user clicks - no longer automatic
    if (!authRequestId) return
    setIsSubmitting(true)
    try {
      await window.electronAPI.sessionCommand(sessionId, { type: 'startOAuth', requestId: authRequestId })
    } catch (error) {
      console.error('Failed to start OAuth:', error)
      setIsSubmitting(false)
    }
  }, [sessionId, authRequestId])

  // Get field labels
  const credentialLabel = authLabels?.credential ||
    (authCredentialMode === 'bearer' ? t('auth.bearerToken', 'Bearer Token') : t('auth.apiKey', 'API Key'))
  const usernameLabel = authLabels?.username || t('auth.username', 'Username')
  const passwordLabel = authLabels?.password || t('auth.password', 'Password')

  // Get auth type label
  const getAuthTypeLabel = (type: AuthRequestType | undefined) => {
    switch (type) {
      case 'oauth':
        return t('auth.oauth', 'OAuth')
      case 'oauth-google':
        return t('auth.googleSignIn', 'Google Sign-In')
      case 'oauth-slack':
        return t('auth.slackSignIn', 'Slack Sign-In')
      case 'oauth-microsoft':
        return t('auth.microsoftSignIn', 'Microsoft Sign-In')
      case 'credential':
      default:
        return t('auth.authenticationLabel', 'Authentication')
    }
  }

  const authTypeLabel = getAuthTypeLabel(authRequestType)

  // Determine variant based on status
  const variant: AuthCardVariant =
    authStatus === 'completed' ? 'success' :
    authStatus === 'cancelled' ? 'muted' :
    authStatus === 'failed' ? 'error' :
    'default'

  // Determine if we need action bar (pending states with forms/buttons)
  // Show actions when: pending credential form, OR pending OAuth that hasn't started yet
  const isOAuth = authRequestType && authRequestType !== 'credential'
  const hasActions = authStatus === 'pending' && (
    !isOAuth || !isSubmitting
  )

  const { bg: variantBg, textClass: variantTextClass, shadowColor } = VARIANT_STYLES[variant]

  // Compact card view for non-interactive terminal states (after user sends message)
  if (!isInteractive && authStatus !== 'pending') {
    const StatusIcon = authStatus === 'completed' ? CheckCircle2 : XCircle
    const sourceName = authSourceName || ''
    const title =
      authStatus === 'completed' ? t('auth.connected', '{{name}} Connected', { name: sourceName }) :
      authStatus === 'cancelled' ? t('auth.cancelled', '{{name}} Cancelled', { name: sourceName }) :
      t('auth.failed', '{{name}} Failed', { name: sourceName })
    const subtitle =
      authStatus === 'completed' && authEmail ? t('auth.signedInAs', 'Signed in as {{email}}', { email: authEmail }) :
      authStatus === 'failed' && authError ? authError :
      undefined

    return (
      <div
        className={cn('rounded-[8px] overflow-hidden w-fit select-none', variantTextClass)}
        style={{
          backgroundColor: variantBg,
          ...(shadowColor ? { '--shadow-color': shadowColor } as React.CSSProperties : {})
        }}
      >
        <div className="pl-4 pr-5 py-3">
          <AuthCardHeader
            icon={StatusIcon}
            title={title}
            subtitle={subtitle}
          />
        </div>
      </div>
    )
  }

  // Render inner content based on state
  const renderContent = () => {
    const sourceName = authSourceName || ''

    // Completed state
    if (authStatus === 'completed') {
      return (
        <AuthCardHeader
          icon={CheckCircle2}
          title={t('auth.connected', '{{name}} Connected', { name: sourceName })}
          subtitle={authEmail ? t('auth.signedInAs', 'Signed in as {{email}}', { email: authEmail }) : undefined}
          subtitleSecondary={authWorkspace ? t('auth.workspace', 'Workspace: {{workspace}}', { workspace: authWorkspace }) : undefined}
        />
      )
    }

    // Cancelled state
    if (authStatus === 'cancelled') {
      return (
        <AuthCardHeader
          icon={XCircle}
          title={t('auth.cancelled', '{{name}} Cancelled', { name: sourceName })}
        />
      )
    }

    // Failed state
    if (authStatus === 'failed') {
      return (
        <AuthCardHeader
          icon={XCircle}
          title={t('auth.failed', '{{name}} Failed', { name: sourceName })}
          subtitle={authError || undefined}
        />
      )
    }

    // OAuth authenticating state (waiting for browser)
    if (isOAuth && isSubmitting) {
      return (
        <div className="flex gap-3">
          <Spinner className="text-[10px] shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium leading-5">
              {t('auth.authenticating', '{{name}} Authenticating...', { name: sourceName })}
            </div>
            <div className="text-xs mt-0.5 opacity-50">
              {t('auth.completeInBrowser', 'Complete authentication in your browser')}
            </div>
          </div>
        </div>
      )
    }

    // OAuth pending state (button)
    if (isOAuth) {
      return (
        <AuthCardHeader
          title={`${sourceName} ${authTypeLabel}`}
          description={authDescription || undefined}
        />
      )
    }

    // Credential input form - just the header part
    return (
      <AuthCardHeader
        title={t('auth.authentication', '{{name}} Authentication', { name: sourceName })}
        description={authDescription || undefined}
      />
    )
  }

  // Render the credential form fields (separate from header for layout)
  const renderCredentialFields = () => {
    if (authStatus !== 'pending' || isOAuth) return null

    return (
      <div className="space-y-3">
        {isBasicAuth ? (
          <>
            {/* Username field */}
            <div className="space-y-1.5">
              <Label htmlFor={`auth-username-${authRequestId}`} className="text-xs">
                {usernameLabel}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`auth-username-${authRequestId}`}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  placeholder={t('auth.enterPlaceholder', 'Enter {{field}}', { field: usernameLabel.toLowerCase() })}
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {/* Password field */}
            <div className="space-y-1.5">
              <Label htmlFor={`auth-password-${authRequestId}`} className="text-xs">
                {passwordLabel}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`auth-password-${authRequestId}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-9"
                  placeholder={t('auth.enterPlaceholder', 'Enter {{field}}', { field: passwordLabel.toLowerCase() })}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Single credential field */
          <div className="space-y-1.5">
            <Label htmlFor={`auth-value-${authRequestId}`} className="text-xs">
              {credentialLabel}
              {authCredentialMode === 'header' && authHeaderName && (
                <span className="text-muted-foreground ml-1">
                  ({authHeaderName})
                </span>
              )}
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id={`auth-value-${authRequestId}`}
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9"
                placeholder={t('auth.enterPlaceholder', 'Enter {{field}}', { field: credentialLabel.toLowerCase() })}
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Hint */}
        {authHint && (
          <p className="text-[11px] text-muted-foreground">
            {authHint}
          </p>
        )}
      </div>
    )
  }

  // Render action buttons
  const renderActions = () => {
    if (!hasActions) return null

    // OAuth pending - sign in button
    if (isOAuth) {
      const providerName = authTypeLabel.replace(' Sign-In', '').replace(' 登录', '')
      return (
        <AuthCardActions
          primary={{
            label: t('auth.signInWith', 'Sign in with {{provider}}', { provider: providerName }),
            onClick: handleOAuthClick,
            dataTutorial: 'oauth-sign-in-button',
          }}
          secondary={{
            label: t('auth.cancel', 'Cancel'),
            onClick: handleCancel,
          }}
        />
      )
    }

    // Credential form - save button
    return (
      <AuthCardActions
        primary={{
          label: isSubmitting ? t('auth.saving', 'Saving...') : t('auth.save', 'Save'),
          onClick: handleSubmit,
          disabled: !isValid || isSubmitting,
          loading: isSubmitting,
        }}
        secondary={{
          label: t('auth.cancel', 'Cancel'),
          onClick: handleCancel,
          disabled: isSubmitting,
        }}
        hint={t('auth.credentialsEncrypted', 'Credentials are encrypted at rest')}
      />
    )
  }

  return (
    <div
      className={cn('rounded-[8px] overflow-hidden', variantTextClass)}
      style={{
        backgroundColor: variantBg,
        ...(shadowColor ? { '--shadow-color': shadowColor } as React.CSSProperties : {})
      }}
    >
      <div
        className={cn(
          hasActions ? 'p-4' : 'px-4 py-3',
          !isOAuth && authStatus === 'pending' && 'space-y-4'
        )}
      >
        {renderContent()}
        {renderCredentialFields()}
      </div>

      {hasActions && renderActions()}
    </div>
  )
}

/**
 * Memoized version for performance in chat list
 */
export const MemoizedAuthRequestCard = React.memo(AuthRequestCard, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.authStatus === next.message.authStatus &&
    prev.sessionId === next.sessionId &&
    prev.isInteractive === next.isInteractive
  )
})
