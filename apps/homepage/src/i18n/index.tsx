import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { en, type Translations } from './en'
import { zh } from './zh'

type Language = 'en' | 'zh'

interface I18nContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

const I18nContext = createContext<I18nContextType | null>(null)

const translations: Record<Language, Translations> = { en, zh }

function detectLanguage(): Language {
  const stored = localStorage.getItem('lang') as Language | null
  if (stored && (stored === 'en' || stored === 'zh')) return stored

  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh'
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    setLangState(detectLanguage())
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
