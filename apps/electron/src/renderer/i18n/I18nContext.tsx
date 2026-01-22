import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as storage from '@/lib/local-storage'
import { DEFAULT_LOCALE, supportedLocales, translations, type Locale } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string
  availableLocales: Locale[]
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  const stored = storage.get<Locale | null>(storage.KEYS.locale, null as Locale | null)
  if (stored && supportedLocales.includes(stored)) {
    return stored
  }

  const navigatorLang = navigator.language?.toLowerCase() ?? ''
  if (navigatorLang.startsWith('zh')) return 'zh'
  return DEFAULT_LOCALE
}

function formatTemplate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = values[key]
    return value === undefined ? '' : String(value)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  useEffect(() => {
    storage.set(storage.KEYS.locale, locale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    if (supportedLocales.includes(next)) {
      setLocaleState(next)
    }
  }, [])

  const t = useCallback((key: string, fallback?: string, values?: Record<string, string | number>) => {
    const template = translations[locale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? fallback ?? key
    return formatTemplate(template, values)
  }, [locale])

  const value = useMemo<I18nContextType>(() => ({
    locale,
    setLocale,
    t,
    availableLocales: supportedLocales,
  }), [locale, setLocale, t])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

// Alias for familiarity with common i18n libraries
export const useTranslation = useI18n
