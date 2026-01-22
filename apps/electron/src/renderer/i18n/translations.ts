import en from './en'
import zh from './zh'

export type Locale = 'en' | 'zh'

export const DEFAULT_LOCALE: Locale = 'en'

export const supportedLocales: Locale[] = ['en', 'zh']

type TranslationTable = Record<Locale, Record<string, string>>

// Translation tables keyed by locale.
// Keys are stable identifiers used throughout the renderer.
export const translations: TranslationTable = {
  en,
  zh,
}
