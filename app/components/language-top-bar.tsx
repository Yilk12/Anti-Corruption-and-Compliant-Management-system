"use client"

import React from "react"
import { useLocalization } from "@/app/hooks/use-localization"
import { supportedLanguages, type SupportedLanguage } from "@/backend/lib/localization"
import { LanguageSelector } from "@/app/components/language-selector"
import { usePathname } from "next/navigation"

export default function LanguageTopBar() {
  const { language, setLanguage } = useLocalization()
  const pathname = usePathname()
  

  return (
    <div
      style={{
        width: "100%",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 1001,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "6px 12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <nav style={{ display: "flex", alignItems: "center", gap: 12, color: "#0d47a1", flexWrap: "wrap" }}>
          <a
            href="/"
            style={{
              color: "#0d47a1",
              background: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: ".9rem",
              border: "1px solid #ccd6e5",
              transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#f1f5fb";
              (e.target as HTMLElement).style.borderColor = "#b9c9e4";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "#ffffff";
              (e.target as HTMLElement).style.borderColor = "#ccd6e5";
            }}
          >
            Home
          </a>

          {/* Regional languages dropdown (globe icon) */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {pathname !== "/login" && (
              <span aria-hidden="true" title="Regional languages" style={{ fontSize: 14 }}>🌐</span>
            )}
            <select
              value={language}
              onChange={(e) => {
                const val = e.target.value as SupportedLanguage | ""
                if (val) setLanguage(val as SupportedLanguage)
              }}
              style={{
                fontSize: 12,
                color: "#0d47a1",
                border: "1px solid #ccd6e5",
                background: "#ffffff",
                padding: "4px 6px",
                borderRadius: 6,
              }}
            >
              <option value="">Select</option>
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                  {lang.nativeName ? ` (${lang.nativeName})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Advertisement link placed next to globe icon */}
          {pathname !== "/login" && (
            <span style={{ color: "#9aa9bf" }}>|</span>
          )}
          <a
            href="/advertisements"
            style={{
              color: "#ffffff",
              background: "#fe6100",
              textDecoration: "none",
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: ".9rem",
              border: "1px solid #fe6100",
              transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#e45700";
              (e.target as HTMLElement).style.borderColor = "#e45700";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "#fe6100";
              (e.target as HTMLElement).style.borderColor = "#fe6100";
            }}
          >
            ማስታወቂያ
          </a>

          <a
            href="/about"
            style={{
              color: "#0d47a1",
              background: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 6,
              fontSize: ".9rem",
              border: "1px solid #ccd6e5",
              transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#f1f5fb";
              (e.target as HTMLElement).style.borderColor = "#b9c9e4";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "#ffffff";
              (e.target as HTMLElement).style.borderColor = "#ccd6e5";
            }}
          >
            About us
          </a>

          {pathname !== "/login" && (
            <>
              <span style={{ color: "#9aa9bf" }}>|</span>
              <a href="/messages" style={{ textDecoration: "none", color: "#0d47a1", fontWeight: 600 }}>
                Messages
              </a>
            </>
          )}
        </nav>

        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} variant="compact" />
      </div>
    </div>
  )
}
