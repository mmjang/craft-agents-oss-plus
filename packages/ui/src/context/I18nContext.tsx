/**
 * I18nContext - Internationalization context for @craft-agent/ui
 *
 * This context allows UI components to access translations provided by the consuming app.
 * The consuming app (Electron, web viewer) provides the translation function via the provider.
 *
 * Pattern: Dependency injection via context (same as PlatformContext)
 * - Components call useUITranslation() to get the t function
 * - Default fallback returns the fallback string if no provider is set
 */

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Translation function type
 * @param key - Translation key (e.g., 'turnCard.copy')
 * @param fallback - Fallback string if translation not found
 * @param vars - Optional template variables
 */
export type TranslationFunction = (
  key: string,
  fallback: string,
  vars?: Record<string, string | number>
) => string

/**
 * Default translation function - returns fallback with variable substitution
 */
const defaultTranslate: TranslationFunction = (key, fallback, vars) => {
  if (!vars) return fallback
  return fallback.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ''))
}

const I18nContext = createContext<TranslationFunction>(defaultTranslate)

export interface UITranslationProviderProps {
  children: ReactNode
  /**
   * Translation function provided by the consuming app
   * If not provided, falls back to returning the fallback string
   */
  t?: TranslationFunction
}

/**
 * UITranslationProvider - Wraps components with translation function
 *
 * Usage in Electron:
 * ```tsx
 * import { useI18n } from '@/i18n/I18nContext'
 *
 * function App() {
 *   const { t } = useI18n()
 *   return (
 *     <UITranslationProvider t={t}>
 *       <TurnCard ... />
 *     </UITranslationProvider>
 *   )
 * }
 * ```
 *
 * Usage in Web Viewer (no translations):
 * ```tsx
 * // No provider needed - components use fallback strings
 * <TurnCard ... />
 * ```
 */
export function UITranslationProvider({ children, t = defaultTranslate }: UITranslationProviderProps) {
  return (
    <I18nContext.Provider value={t}>
      {children}
    </I18nContext.Provider>
  )
}

/**
 * useUITranslation - Access translation function in UI components
 *
 * Usage:
 * ```tsx
 * const t = useUITranslation()
 * return <button>{t('turnCard.copy', 'Copy')}</button>
 * ```
 */
export function useUITranslation(): TranslationFunction {
  return useContext(I18nContext)
}

export default I18nContext
