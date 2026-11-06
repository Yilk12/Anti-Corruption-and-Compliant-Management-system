"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import {
  type SupportedLanguage,
  type LanguageConfig,
  getLanguageConfig,
  t as translateFn,
  formatDate as formatDateFn,
  formatNumber as formatNumberFn,
} from "@/backend/lib/localization"

interface LocalizationContextType {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  t: (key: string) => string
  formatDate: (date: Date | string) => string
  formatNumber: (num: number) => string
  currentLanguage: SupportedLanguage
  languageConfig: LanguageConfig
  languageScope: "global" | "per-route"
  setLanguageScope: (scope: "global" | "per-route") => void
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("en")
  const [languageScope, setLanguageScope] = useState<"global" | "per-route">("global")
  const [remoteTranslations, setRemoteTranslations] = useState<Record<string, string> | null>(null)
  const [loadingLang, setLoadingLang] = useState(false)

  // Load saved language preference on mount and when route changes (for per-route scope)
  useEffect(() => {
    const savedScope = (localStorage.getItem("language-scope") as "global" | "per-route") || "global"
    setLanguageScope(savedScope)

    if (savedScope === "per-route") {
      const routeKey = `preferred-language:${pathname || "/"}`
      const perRoute = localStorage.getItem(routeKey) as SupportedLanguage
      if (perRoute) {
        setCurrentLanguage(perRoute)
        return
      }
    }

    const savedLanguage = localStorage.getItem("preferred-language") as SupportedLanguage
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage)
    }
  }, [pathname])

  // Update document attributes when language changes
  useEffect(() => {
    const config = getLanguageConfig(currentLanguage)
    document.documentElement.lang = currentLanguage
    document.documentElement.dir = config.direction

    // Save language preference
    try {
      const scope = (languageScope || "global")
      localStorage.setItem("language-scope", scope)
      if (scope === "per-route") {
        const routeKey = `preferred-language:${pathname || "/"}`
        localStorage.setItem(routeKey, currentLanguage)
      } else {
        localStorage.setItem("preferred-language", currentLanguage)
      }
    } catch {}
  }, [currentLanguage, languageScope, pathname])

  // Fetch translations from API when language changes (with simple cache)
  useEffect(() => {
    let cancelled = false
    const key = `i18n:lang:${currentLanguage}`
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        try { setRemoteTranslations(JSON.parse(cached)) } catch { /* ignore parse */ }
      }
    } catch {}
    const load = async () => {
      setLoadingLang(true)
      try {
        const r = await fetch(`/api/i18n/translations?lang=${encodeURIComponent(currentLanguage)}`)
        const d = await r.json()
        if (!cancelled && d && d.translations && typeof d.translations === 'object') {
          setRemoteTranslations(d.translations)
          try { localStorage.setItem(key, JSON.stringify(d.translations)) } catch {}
        }
      } catch {
        // keep whatever we had (cached or null)
      } finally {
        if (!cancelled) setLoadingLang(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [currentLanguage])

  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language)
  }

  const t = (key: string) => {
    const v = remoteTranslations?.[key]
    if (typeof v === 'string') return v
    return translateFn(key, currentLanguage)
  }
  const formatDate = (date: Date | string) => formatDateFn(date, currentLanguage)
  const formatNumber = (num: number) => formatNumberFn(num, currentLanguage)

  const languageConfig = getLanguageConfig(currentLanguage)

  const contextValue: LocalizationContextType = {
    language: currentLanguage,
    setLanguage,
    t,
    formatDate,
    formatNumber,
    currentLanguage,
    languageConfig,
    languageScope,
    setLanguageScope,
  }

  return <LocalizationContext.Provider value={contextValue}>{children}</LocalizationContext.Provider>
}

export function useLocalization() {
  const context = useContext(LocalizationContext)
  if (context === undefined) {
    throw new Error("useLocalization must be used within a LocalizationProvider")
  }
  return context
}
