"use client"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Badge } from "@/app/components/ui/badge"
import { Globe, Check } from "lucide-react"
import { supportedLanguages, getLanguageConfig, type SupportedLanguage } from "@/backend/lib/localization"

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  variant?: "button" | "compact"
}

export function LanguageSelector({ currentLanguage, onLanguageChange, variant = "button" }: LanguageSelectorProps) {
  const currentConfig = getLanguageConfig(currentLanguage)
  const primaryOptions = supportedLanguages.filter(l => l.code === "am" || l.code === "en")

  if (variant === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 min-w-[120px] bg-transparent">
            <Globe className="w-4 h-4" />
            {currentConfig.nativeName && currentConfig.nativeName !== currentConfig.name
              ? `${currentConfig.name} / ${currentConfig.nativeName}`
              : currentConfig.name}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {primaryOptions.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => onLanguageChange(language.code)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{language.flag}</span>
                <div>
                  <div className="font-medium">
                    {language.nativeName && language.nativeName !== language.name
                      ? `${language.name} / ${language.nativeName}`
                      : language.name}
                  </div>
                </div>
              </div>
              {currentLanguage === language.code && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">{currentConfig.name}</span>
          <span className="sm:hidden">{currentConfig.code.toUpperCase()}</span>
          <Badge variant="secondary" className="ml-1">
            {currentConfig.script === "geez" ? "ፊደል" : "Latin"}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Choose Language / ቋንቋ ይምረጡ
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Primary Languages */}
        <div className="px-2 py-1">
          <div className="text-xs font-medium text-muted-foreground mb-2">Primary Languages</div>
          {primaryOptions.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => onLanguageChange(language.code)}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{language.flag}</span>
                <div>
                  <div className="font-medium">{language.name}</div>
                  <div className="text-sm text-muted-foreground" dir={language.direction}>
                    {language.nativeName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {language.script === "geez" ? "ፊደል" : "Latin"}
                </Badge>
                {currentLanguage === language.code && <Check className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
