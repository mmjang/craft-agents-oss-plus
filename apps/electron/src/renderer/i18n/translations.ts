import en from './en'
import zh from './zh'

export type Locale = 'en' | 'zh'

export const DEFAULT_LOCALE: Locale = 'en'

export const supportedLocales: Locale[] = ['en', 'zh']

// Extract all valid translation keys from the English translations
export type TranslationKey = keyof typeof en

// Type-level validation: ensure zh has all keys from en
// This will cause a compile error if zh is missing any keys
type ValidateTranslations<T extends Record<string, string>> = {
  [K in TranslationKey]: K extends keyof T ? T[K] : never
}
const _validateZh: ValidateTranslations<typeof zh> = zh

type TranslationTable = Record<Locale, Record<TranslationKey, string>>

// Translation tables keyed by locale.
// Keys are stable identifiers used throughout the renderer.
export const translations: TranslationTable = {
  en,
  zh,
}
