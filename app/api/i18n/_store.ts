import { supportedLanguages, translations as baseTranslations, type SupportedLanguage, type TranslationEntry } from '@/backend/lib/localization'

export type TranslationsMap = Record<string, TranslationEntry>

// In-memory i18n store, seeded from lib/localization
// Seed translations without undefined entries to satisfy strict index signature
const seededTranslations: TranslationsMap = {}
for (const [k, v] of Object.entries(baseTranslations)) {
  if (v) seededTranslations[k] = v as TranslationEntry
}

export const I18N_STORE: {
  languages: { code: SupportedLanguage; name: string; nativeName: string }[]
  translations: TranslationsMap
} = {
  languages: supportedLanguages.map(l => ({ code: l.code, name: l.name, nativeName: l.nativeName })),
  translations: seededTranslations,
}

export function getLanguageList() {
  return I18N_STORE.languages
}

export function listKeys(): string[] {
  return Object.keys(I18N_STORE.translations).sort()
}

export function getEntry(key: string): TranslationEntry | null {
  return I18N_STORE.translations[key] || null
}

export function setEntry(key: string, entry: TranslationEntry) {
  if (!entry || typeof entry.en !== 'string' || !entry.en.trim()) {
    throw new Error('Entry must include a non-empty English (en) string')
  }
  I18N_STORE.translations[key] = entry
}

export function deleteEntry(key: string) {
  delete I18N_STORE.translations[key]
}

export function getFlatTranslations(lang: SupportedLanguage): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(I18N_STORE.translations)) {
    const val = (v as any)[lang] || v.en
    out[k] = String(val)
  }
  return out
}
