/**
 * AppSettingsPage
 *
 * Global app-level settings that apply across all workspaces.
 *
 * Settings:
 * - Appearance (Theme, Font)
 * - Notifications
 * - Billing (API Key, Claude Max)
 */

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/navigate'
import {
  Monitor,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import type { AuthType } from '../../../shared/types'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsToggle,
  SettingsSegmentedControl,
  SettingsMenuSelectRow,
  SettingsMenuSelect,
} from '@/components/settings'
import { useUpdateChecker } from '@/hooks/useUpdateChecker'
import { useAppShellContext } from '@/context/AppShellContext'
import type { PresetTheme } from '@config/theme'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useI18n } from '@/i18n/I18nContext'
import type { Locale } from '@/i18n/translations'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'app',
}

// ============================================
// API Key Dialog Content
// ============================================

interface ApiKeyDialogProps {
  value: string
  baseUrl: string
  onChange: (value: string) => void
  onBaseUrlChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  hasExistingKey: boolean
  error?: string
}

function ApiKeyDialogContent({ value, baseUrl, onChange, onBaseUrlChange, onSave, onCancel, isSaving, hasExistingKey, error }: ApiKeyDialogProps) {
  const [showValue, setShowValue] = useState(false)
  const { t } = useI18n()

  return (
    <div className="space-y-4">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        {t('appSettings.apiKey.description', 'Pay-as-you-go with your own API key.')}{' '}
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline inline-flex items-center gap-0.5"
          onClick={(e) => {
            e.preventDefault()
            window.electronAPI?.openUrl('https://console.anthropic.com')
          }}
        >
          {t('appSettings.apiKey.getOne', 'Get one from Anthropic')}
          <ExternalLink className="size-3" />
        </a>
      </p>

      {/* Input */}
      <div className="relative">
        <Input
          type={showValue ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hasExistingKey ? '••••••••••••••••' : 'sk-ant-...'}
          className={cn("pr-10", error && "border-destructive")}
          disabled={isSaving}
        />
        <button
          type="button"
          onClick={() => setShowValue(!showValue)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="api-base-url">{t('appSettings.apiKey.baseUrlLabel', 'API base URL (optional)')}</Label>
        <Input
          id="api-base-url"
          type="text"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="https://api.anthropic.com"
          disabled={isSaving}
        />
        <p className="text-xs text-muted-foreground">
          {t('appSettings.apiKey.baseUrlHint', "Leave blank to use Anthropic's default endpoint. Set this if you're using a proxy or gateway.")}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={onSave}
          disabled={(!value.trim() && !hasExistingKey) || isSaving}
        >
          {isSaving ? (
            <>
              <Spinner className="mr-1.5" />
              {t('common.validating', 'Validating...')}
            </>
          ) : (
            <>
              <Check className="size-3 mr-1.5" />
              {hasExistingKey ? t('appSettings.apiKey.update', 'Update Key') : t('common.save', 'Save')}
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Claude OAuth Dialog Content
// ============================================

interface ClaudeOAuthDialogBaseProps {
  existingToken: string | null
  isLoading: boolean
  onUseExisting: () => void
  onStartOAuth: () => void
  onCancel: () => void
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string
}

type ClaudeOAuthDialogProps = ClaudeOAuthDialogBaseProps & (
  | { isWaitingForCode: false }
  | { isWaitingForCode: true; authCode: string; onAuthCodeChange: (code: string) => void; onSubmitAuthCode: (code: string) => void }
)

function ClaudeOAuthDialogContent(props: ClaudeOAuthDialogProps) {
  const { existingToken, isLoading, onUseExisting, onStartOAuth, onCancel, status, errorMessage } = props
  const { t } = useI18n()

  if (status === 'success') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" />
          {t('appSettings.oauth.connected', 'Connected to Claude')}
        </div>
      </div>
    )
  }

  // Waiting for authorization code entry
  if (props.isWaitingForCode) {
    const { authCode, onAuthCodeChange, onSubmitAuthCode } = props
    const trimmedCode = authCode.trim()

    const handleSubmit = () => {
      if (trimmedCode) {
        onSubmitAuthCode(trimmedCode)
      }
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('appSettings.oauth.copyCode', 'Copy the authorization code from your browser and paste it below.')}
        </p>
        <div className="space-y-2">
          <Label htmlFor="auth-code">{t('appSettings.oauth.codeLabel', 'Authorization Code')}</Label>
          <div className="relative rounded-md shadow-minimal transition-colors bg-foreground-2 focus-within:bg-background">
            <Input
              id="auth-code"
              type="text"
              value={authCode}
              onChange={(e) => onAuthCodeChange(e.target.value)}
              placeholder={t('appSettings.oauth.codePlaceholder', 'Paste your authorization code here')}
              className="border-0 bg-transparent shadow-none font-mono text-sm"
              disabled={status === 'loading'}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit()
                }
              }}
            />
          </div>
          {status === 'error' && errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={status === 'loading'}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!trimmedCode || status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <Spinner className="mr-1.5" />
                {t('common.connecting', 'Connecting...')}
              </>
            ) : (
              t('common.connect', 'Connect')
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('appSettings.oauth.desc', 'Use your Claude Pro or Max subscription for unlimited access.')}
      </p>
      <div className="flex items-center justify-end gap-2 pt-2">
        {existingToken ? (
          <Button
            onClick={onUseExisting}
            disabled={isLoading}
          >
            {status === 'loading' ? (
              <>
                <Spinner className="mr-1.5" />
                {t('common.connecting', 'Connecting...')}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3 mr-1.5" />
                {t('appSettings.oauth.useExisting', 'Use Existing Token')}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onStartOAuth}
            disabled={isLoading}
          >
            {status === 'loading' ? (
              <>
                <Spinner className="mr-1.5" />
                {t('common.starting', 'Starting...')}
              </>
            ) : (
              <>
                <ExternalLink className="size-3 mr-1.5" />
                {t('appSettings.oauth.signIn', 'Sign in with Claude')}
              </>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('common.cancel', 'Cancel')}
        </Button>
      </div>
      {existingToken && (
        <div className="text-center">
          <Button
            variant="link"
            onClick={onStartOAuth}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('appSettings.oauth.signInOther', 'Or sign in with a different account')}
          </Button>
        </div>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function AppSettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const { mode, setMode, colorTheme, setColorTheme, setPreviewColorTheme, font, setFont } = useTheme()

  // Get workspace ID from context for loading preset themes
  const { activeWorkspaceId } = useAppShellContext()

  // Preset themes state
  const [presetThemes, setPresetThemes] = useState<PresetTheme[]>([])

  // Billing state
  const [authType, setAuthType] = useState<AuthType>('api_key')
  const [expandedMethod, setExpandedMethod] = useState<AuthType | null>(null)
  const [hasCredential, setHasCredential] = useState(false)
  const [isLoadingBilling, setIsLoadingBilling] = useState(true)

  // API Key state
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [savedApiBaseUrl, setSavedApiBaseUrl] = useState('')
  const [isSavingApiKey, setIsSavingApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | undefined>()

  // Claude OAuth state
  const [existingClaudeToken, setExistingClaudeToken] = useState<string | null>(null)
  const [claudeOAuthStatus, setClaudeOAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [claudeOAuthError, setClaudeOAuthError] = useState<string | undefined>()
  const [isWaitingForCode, setIsWaitingForCode] = useState(false)
  const [authCode, setAuthCode] = useState('')

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Auto-update state
  const updateChecker = useUpdateChecker()
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)

  const handleCheckForUpdates = useCallback(async () => {
    setIsCheckingForUpdates(true)
    try {
      await updateChecker.checkForUpdates()
    } finally {
      setIsCheckingForUpdates(false)
    }
  }, [updateChecker])

  // Load current billing method, notifications setting, and preset themes on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return
      try {
        const [billing, notificationsOn] = await Promise.all([
          window.electronAPI.getBillingMethod(),
          window.electronAPI.getNotificationsEnabled(),
        ])
        setAuthType(billing.authType)
        setHasCredential(billing.hasCredential)
        setApiBaseUrl(billing.baseUrl ?? '')
        setSavedApiBaseUrl(billing.baseUrl ?? '')
        setNotificationsEnabled(notificationsOn)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoadingBilling(false)
      }
    }
    loadSettings()
  }, [])

  // Load preset themes when workspace changes (themes are workspace-scoped)
  // Load preset themes (app-level, no workspace dependency)
  useEffect(() => {
    const loadThemes = async () => {
      if (!window.electronAPI) {
        setPresetThemes([])
        return
      }
      try {
        const themes = await window.electronAPI.loadPresetThemes()
        setPresetThemes(themes)
      } catch (error) {
        console.error('Failed to load preset themes:', error)
        setPresetThemes([])
      }
    }
    loadThemes()
  }, [])

  // Check for existing Claude token when expanding oauth_token option
  useEffect(() => {
    if (expandedMethod !== 'oauth_token') return

    const checkExistingToken = async () => {
      if (!window.electronAPI) return
      try {
        const token = await window.electronAPI.getExistingClaudeToken()
        setExistingClaudeToken(token)
      } catch (error) {
        console.error('Failed to check existing Claude token:', error)
      }
    }
    checkExistingToken()
  }, [expandedMethod])

  // Handle clicking on a billing method option
  const handleMethodClick = useCallback(async (method: AuthType) => {
    if (method === authType && hasCredential) {
      setExpandedMethod(null)
      return
    }

    setExpandedMethod(method)
    setApiKeyError(undefined)
    setClaudeOAuthStatus('idle')
    setClaudeOAuthError(undefined)
  }, [authType, hasCredential])

  // Cancel billing method expansion
  const handleCancel = useCallback(() => {
    setExpandedMethod(null)
    setApiKeyValue('')
    setApiBaseUrl(savedApiBaseUrl)
    setApiKeyError(undefined)
    setClaudeOAuthStatus('idle')
    setClaudeOAuthError(undefined)
  }, [savedApiBaseUrl])

  // Save API key
  const handleSaveApiKey = useCallback(async () => {
    if (!window.electronAPI) return

    const trimmedKey = apiKeyValue.trim()
    const trimmedBaseUrl = apiBaseUrl.trim()
    const hasExistingKey = hasCredential && authType === 'api_key'

    if (!trimmedKey && !hasExistingKey) {
      setApiKeyError(t('appSettings.apiKey.enterKey', 'Please enter your API key'))
      return
    }

    let baseUrlToSave: string | null | undefined = undefined
    if (trimmedBaseUrl) {
      try {
        const parsed = new URL(trimmedBaseUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error(t('appSettings.apiKey.protocolError', 'Base URL must use http or https'))
        }
        baseUrlToSave = trimmedBaseUrl
      } catch {
        setApiKeyError(t('appSettings.apiKey.urlInvalid', 'Base URL must be a valid http(s) URL.'))
        return
      }
    } else {
      baseUrlToSave = null
    }

    setIsSavingApiKey(true)
    setApiKeyError(undefined)
    try {
      await window.electronAPI.updateBillingMethod({
        authType: 'api_key',
        credential: trimmedKey || undefined,
        baseUrl: baseUrlToSave,
      })
      setAuthType('api_key')
      setHasCredential(true)
      setApiKeyValue('')
      setApiBaseUrl(baseUrlToSave ?? '')
      setSavedApiBaseUrl(baseUrlToSave ?? '')
      setExpandedMethod(null)
    } catch (error) {
      console.error('Failed to save API key:', error)
      setApiKeyError(error instanceof Error ? error.message : t('appSettings.apiKey.invalid', 'Invalid API key. Please check and try again.'))
    } finally {
      setIsSavingApiKey(false)
    }
  }, [apiKeyValue, apiBaseUrl, hasCredential, authType, t])

  // Use existing Claude token
  const handleUseExistingClaudeToken = useCallback(async () => {
    if (!window.electronAPI || !existingClaudeToken) return

    setClaudeOAuthStatus('loading')
    setClaudeOAuthError(undefined)
    try {
      await window.electronAPI.updateBillingMethod({
        authType: 'oauth_token',
        credential: existingClaudeToken,
      })
      setAuthType('oauth_token')
      setHasCredential(true)
      setApiBaseUrl('')
      setSavedApiBaseUrl('')
      setClaudeOAuthStatus('success')
      setExpandedMethod(null)
    } catch (error) {
      setClaudeOAuthStatus('error')
      setClaudeOAuthError(error instanceof Error ? error.message : t('appSettings.oauth.saveTokenFailed', 'Failed to save token'))
    }
  }, [existingClaudeToken, t])

  // Start Claude OAuth flow (native browser-based)
  const handleStartClaudeOAuth = useCallback(async () => {
    if (!window.electronAPI) return

    setClaudeOAuthStatus('loading')
    setClaudeOAuthError(undefined)

    try {
      // Start OAuth flow - this opens the browser
      const result = await window.electronAPI.startClaudeOAuth()

      if (result.success) {
        // Browser opened successfully, now waiting for user to copy the code
        setIsWaitingForCode(true)
        setClaudeOAuthStatus('idle')
      } else {
        setClaudeOAuthStatus('error')
        setClaudeOAuthError(result.error || t('appSettings.oauth.startFailed', 'Failed to start OAuth'))
      }
    } catch (error) {
      setClaudeOAuthStatus('error')
      setClaudeOAuthError(error instanceof Error ? error.message : t('appSettings.oauth.failed', 'OAuth failed'))
    }
  }, [t])

  // Submit authorization code from browser
  const handleSubmitAuthCode = useCallback(async (code: string) => {
    if (!window.electronAPI || !code.trim()) {
      setClaudeOAuthError(t('appSettings.oauth.enterCode', 'Please enter the authorization code'))
      return
    }

    setClaudeOAuthStatus('loading')
    setClaudeOAuthError(undefined)

    try {
      const result = await window.electronAPI.exchangeClaudeCode(code.trim())

      if (result.success && result.token) {
        await window.electronAPI.updateBillingMethod({
          authType: 'oauth_token',
          credential: result.token,
        })
        setAuthType('oauth_token')
        setHasCredential(true)
        setApiBaseUrl('')
        setSavedApiBaseUrl('')
        setClaudeOAuthStatus('success')
        setIsWaitingForCode(false)
        setAuthCode('')
        setExpandedMethod(null)
      } else {
        setClaudeOAuthStatus('error')
        setClaudeOAuthError(result.error || t('appSettings.oauth.exchangeFailed', 'Failed to exchange code'))
      }
    } catch (error) {
      setClaudeOAuthStatus('error')
      setClaudeOAuthError(error instanceof Error ? error.message : t('appSettings.oauth.exchangeFailed', 'Failed to exchange code'))
    }
  }, [t])

  // Cancel OAuth flow and clear state
  const handleCancelOAuth = useCallback(async () => {
    setIsWaitingForCode(false)
    setAuthCode('')
    setClaudeOAuthStatus('idle')
    setClaudeOAuthError(undefined)
    setExpandedMethod(null)

    // Clear OAuth state on backend
    if (window.electronAPI) {
      try {
        await window.electronAPI.clearClaudeOAuthState()
      } catch (error) {
        // Non-critical: state cleanup failed, but UI is already reset
        console.error('Failed to clear OAuth state:', error)
      }
    }
  }, [])

  const handleNotificationsEnabledChange = useCallback(async (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    await window.electronAPI.setNotificationsEnabled(enabled)
  }, [])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('appSettings.title', 'App Settings')} actions={<HeaderMenu route={routes.view.settings('app')} helpFeature="app-settings" />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
          <div className="space-y-6">
            {/* Appearance */}
            <SettingsSection title={t('appSettings.appearance.title', 'Appearance')}>
              <SettingsCard>
                <SettingsRow label={t('appSettings.appearance.mode', 'Mode')}>
                  <SettingsSegmentedControl
                    value={mode}
                    onValueChange={setMode}
                    options={[
                      { value: 'system', label: t('common.system', 'System'), icon: <Monitor className="w-4 h-4" /> },
                      { value: 'light', label: t('common.light', 'Light'), icon: <Sun className="w-4 h-4" /> },
                      { value: 'dark', label: t('common.dark', 'Dark'), icon: <Moon className="w-4 h-4" /> },
                    ]}
                  />
                </SettingsRow>
                <SettingsRow label={t('appSettings.appearance.colorTheme', 'Color theme')}>
                  <SettingsMenuSelect
                    value={colorTheme}
                    onValueChange={setColorTheme}
                    options={[
                      { value: 'default', label: t('common.default', 'Default') },
                      ...presetThemes
                        .filter(t => t.id !== 'default')
                        .map(t => ({
                          value: t.id,
                          label: t.theme.name || t.id,
                        })),
                    ]}
                  />
                </SettingsRow>
                <SettingsRow label={t('appSettings.appearance.font', 'Font')}>
                  <SettingsSegmentedControl
                    value={font}
                    onValueChange={setFont}
                    options={[
                      { value: 'inter', label: t('appSettings.appearance.fontInter', 'Inter') },
                      { value: 'system', label: t('common.system', 'System') },
                    ]}
                  />
                </SettingsRow>
                <SettingsRow label={t('appSettings.appearance.language', 'Language')}>
                  <SettingsMenuSelect
                    value={locale}
                    onValueChange={(value) => setLocale(value as Locale)}
                    options={[
                      { value: 'en', label: t('common.language.english', 'English') },
                      { value: 'zh', label: t('common.language.chinese', 'Chinese (Simplified)') },
                    ]}
                  />
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection title={t('appSettings.notifications.title', 'Notifications')}>
              <SettingsCard>
                <SettingsToggle
                  label={t('appSettings.notifications.desktop', 'Desktop notifications')}
                  description={t('appSettings.notifications.desc', 'Get notified when AI finishes working in a chat.')}
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationsEnabledChange}
                />
              </SettingsCard>
            </SettingsSection>

            {/* Billing */}
            <SettingsSection title={t('appSettings.billing.title', 'Billing')} description={t('appSettings.billing.desc', 'Choose how you pay for AI usage')}>
              <SettingsCard>
                <SettingsMenuSelectRow
                  label={t('appSettings.billing.paymentMethod', 'Payment method')}
                  description={
                    authType === 'api_key' && hasCredential
                      ? t('appSettings.billing.apiConfigured', 'API key configured')
                      : authType === 'oauth_token' && hasCredential
                        ? t('appSettings.billing.claudeConnected', 'Claude connected')
                        : t('appSettings.billing.selectMethod', 'Select a method')
                  }
                  value={authType}
                  onValueChange={(v) => handleMethodClick(v as AuthType)}
                  options={[
                    { value: 'oauth_token', label: t('appSettings.billing.claudePro', 'Claude Pro/Max'), description: t('appSettings.billing.claudeDesc', 'Use your Pro or Max subscription') },
                    { value: 'api_key', label: t('appSettings.billing.apiKeyLabel', 'API Key'), description: t('appSettings.billing.apiKeyDesc', 'Pay-as-you-go with your Anthropic key') },
                  ]}
                />
              </SettingsCard>

              {/* API Key Dialog */}
              <Dialog open={expandedMethod === 'api_key'} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('appSettings.apiKey.title', 'API Key')}</DialogTitle>
                    <DialogDescription>
                      {t('appSettings.apiKey.configure', 'Configure your Anthropic API key')}
                    </DialogDescription>
                  </DialogHeader>
                  <ApiKeyDialogContent
                    value={apiKeyValue}
                    baseUrl={apiBaseUrl}
                    onChange={setApiKeyValue}
                    onBaseUrlChange={setApiBaseUrl}
                    onSave={handleSaveApiKey}
                    onCancel={handleCancel}
                    isSaving={isSavingApiKey}
                    hasExistingKey={authType === 'api_key' && hasCredential}
                    error={apiKeyError}
                  />
                </DialogContent>
              </Dialog>

              {/* Claude OAuth Dialog */}
              <Dialog open={expandedMethod === 'oauth_token'} onOpenChange={(open) => !open && handleCancelOAuth()}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('appSettings.oauth.title', 'Claude Max')}</DialogTitle>
                    <DialogDescription>
                      {t('appSettings.oauth.connect', 'Connect your Claude subscription')}
                    </DialogDescription>
                  </DialogHeader>
                  {isWaitingForCode ? (
                    <ClaudeOAuthDialogContent
                      existingToken={existingClaudeToken}
                      isLoading={claudeOAuthStatus === 'loading'}
                      onUseExisting={handleUseExistingClaudeToken}
                      onStartOAuth={handleStartClaudeOAuth}
                      onCancel={handleCancelOAuth}
                      status={claudeOAuthStatus}
                      errorMessage={claudeOAuthError}
                      isWaitingForCode={true}
                      authCode={authCode}
                      onAuthCodeChange={setAuthCode}
                      onSubmitAuthCode={handleSubmitAuthCode}
                    />
                  ) : (
                    <ClaudeOAuthDialogContent
                      existingToken={existingClaudeToken}
                      isLoading={claudeOAuthStatus === 'loading'}
                      onUseExisting={handleUseExistingClaudeToken}
                      onStartOAuth={handleStartClaudeOAuth}
                      onCancel={handleCancelOAuth}
                      status={claudeOAuthStatus}
                      errorMessage={claudeOAuthError}
                      isWaitingForCode={false}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </SettingsSection>

            {/* About */}
            <SettingsSection title={t('appSettings.about.title', 'About')}>
              <SettingsCard>
                <SettingsRow label={t('appSettings.about.version', 'Version')}>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {updateChecker.updateInfo?.currentVersion ?? t('common.loading', 'Loading...')}
                    </span>
                    {updateChecker.updateAvailable && updateChecker.updateInfo?.latestVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={updateChecker.installUpdate}
                      >
                        {t('appSettings.about.updateTo', 'Update to {{version}}', { version: updateChecker.updateInfo.latestVersion })}
                      </Button>
                    )}
                  </div>
                </SettingsRow>
                <SettingsRow label={t('appSettings.about.check', 'Check for updates')}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingForUpdates}
                  >
                    {isCheckingForUpdates ? (
                      <>
                        <Spinner className="mr-1.5" />
                        {t('appSettings.about.checking', 'Checking...')}
                      </>
                    ) : (
                      t('appSettings.about.checkNow', 'Check Now')
                    )}
                  </Button>
                </SettingsRow>
                {updateChecker.isReadyToInstall && (
                  <SettingsRow label={t('appSettings.about.install', 'Install update')}>
                    <Button
                      size="sm"
                      onClick={updateChecker.installUpdate}
                    >
                      {t('appSettings.about.restart', 'Restart to Update')}
                    </Button>
                  </SettingsRow>
                )}
              </SettingsCard>
            </SettingsSection>
          </div>
        </div>
        </ScrollArea>
      </div>
    </div>
  )
}
