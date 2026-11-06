import { Injectable } from "@nestjs/common"
import { Language } from "../common/enums/language.enum"

interface TranslationMap {
  [key: string]: {
    [Language.EN]: string
    [Language.AM]: string
    [Language.OR]: string
    [Language.TI]: string
    [Language.SO]: string
    [Language.SI]: string
    [Language.WO]: string
  }
}

@Injectable()
export class LocalizationService {
  private translations: TranslationMap = {
    // Common terms
    "common.yes": {
      [Language.EN]: "Yes",
      [Language.AM]: "አዎ",
      [Language.OR]: "Eeyyee",
      [Language.TI]: "እወ",
      [Language.SO]: "Haa",
      [Language.SI]: "Haa",
      [Language.WO]: "Waaw",
    },
    "common.no": {
      [Language.EN]: "No",
      [Language.AM]: "አይ",
      [Language.OR]: "Lakki",
      [Language.TI]: "አይ",
      [Language.SO]: "Maya",
      [Language.SI]: "Maya",
      [Language.WO]: "Déedet",
    },
    "common.save": {
      [Language.EN]: "Save",
      [Language.AM]: "አስቀምጥ",
      [Language.OR]: "Olkaa'i",
      [Language.TI]: "ኣቐምጥ",
      [Language.SO]: "Kaydi",
      [Language.SI]: "Kaydi",
      [Language.WO]: "Dakk",
    },
    "common.cancel": {
      [Language.EN]: "Cancel",
      [Language.AM]: "ሰርዝ",
      [Language.OR]: "Dhiisi",
      [Language.TI]: "ሰርዝ",
      [Language.SO]: "Jooji",
      [Language.SI]: "Jooji",
      [Language.WO]: "Neenal",
    },
    "common.delete": {
      [Language.EN]: "Delete",
      [Language.AM]: "ሰርዝ",
      [Language.OR]: "Balleessi",
      [Language.TI]: "ደምስስ",
      [Language.SO]: "Tirtir",
      [Language.SI]: "Tirtir",
      [Language.WO]: "Far",
    },
    "common.edit": {
      [Language.EN]: "Edit",
      [Language.AM]: "አርም",
      [Language.OR]: "Gulali",
      [Language.TI]: "ኣርም",
      [Language.SO]: "Wax ka beddel",
      [Language.SI]: "Wax ka beddel",
      [Language.WO]: "Soppi",
    },
    "common.create": {
      [Language.EN]: "Create",
      [Language.AM]: "ፍጠር",
      [Language.OR]: "Uumi",
      [Language.TI]: "ፍጠር",
      [Language.SO]: "Samee",
      [Language.SI]: "Samee",
      [Language.WO]: "Sos",
    },
    "common.search": {
      [Language.EN]: "Search",
      [Language.AM]: "ፈልግ",
      [Language.OR]: "Barbaadi",
      [Language.TI]: "ደልይ",
      [Language.SO]: "Raadi",
      [Language.SI]: "Raadi",
      [Language.WO]: "Ceet",
    },

    // Ticket related
    "ticket.title": {
      [Language.EN]: "Ticket",
      [Language.AM]: "ትኬት",
      [Language.OR]: "Tikeetii",
      [Language.TI]: "ትኬት",
      [Language.SO]: "Tikidh",
      [Language.SI]: "Tikidh",
      [Language.WO]: "Billet",
    },
    "ticket.status.open": {
      [Language.EN]: "Open",
      [Language.AM]: "ክፍት",
      [Language.OR]: "Banaa",
      [Language.TI]: "ክፉት",
      [Language.SO]: "Furan",
      [Language.SI]: "Furan",
      [Language.WO]: "Ubbi",
    },
    "ticket.status.in_progress": {
      [Language.EN]: "In Progress",
      [Language.AM]: "በሂደት ላይ",
      [Language.OR]: "Adeemsa keessa",
      [Language.TI]: "ኣብ መስርሕ",
      [Language.SO]: "Socda",
      [Language.SI]: "Socda",
      [Language.WO]: "Dëgg na",
    },
    "ticket.status.resolved": {
      [Language.EN]: "Resolved",
      [Language.AM]: "ተፈትቷል",
      [Language.OR]: "Furmaata argateera",
      [Language.TI]: "ተፈቲሑ",
      [Language.SO]: "La xalliyay",
      [Language.SI]: "La xalliyay",
      [Language.WO]: "Dafa ñu ko wax",
    },
    "ticket.priority.low": {
      [Language.EN]: "Low",
      [Language.AM]: "ዝቅተኛ",
      [Language.OR]: "Gadi",
      [Language.TI]: "ትሑት",
      [Language.SO]: "Hoose",
      [Language.SI]: "Hoose",
      [Language.WO]: "Suuf",
    },
    "ticket.priority.medium": {
      [Language.EN]: "Medium",
      [Language.AM]: "መካከለኛ",
      [Language.OR]: "Giddu galeessa",
      [Language.TI]: "ማእከላይ",
      [Language.SO]: "Dhexe",
      [Language.SI]: "Dhexe",
      [Language.WO]: "Diggu",
    },
    "ticket.priority.high": {
      [Language.EN]: "High",
      [Language.AM]: "ከፍተኛ",
      [Language.OR]: "Ol'aanaa",
      [Language.TI]: "ልዑል",
      [Language.SO]: "Sare",
      [Language.SI]: "Sare",
      [Language.WO]: "Gëstu",
    },
    "ticket.priority.urgent": {
      [Language.EN]: "Urgent",
      [Language.AM]: "አስቸኳይ",
      [Language.OR]: "Ariifataa",
      [Language.TI]: "ህጹጽ",
      [Language.SO]: "Degdeg ah",
      [Language.SI]: "Degdeg ah",
      [Language.WO]: "Suuf na",
    },

    // Knowledge Base
    "kb.article": {
      [Language.EN]: "Article",
      [Language.AM]: "ጽሑፍ",
      [Language.OR]: "Barreeffama",
      [Language.TI]: "ጽሑፍ",
      [Language.SO]: "Maqaal",
      [Language.SI]: "Maqaal",
      [Language.WO]: "Bind",
    },
    "kb.category": {
      [Language.EN]: "Category",
      [Language.AM]: "ምድብ",
      [Language.OR]: "Ramaddii",
      [Language.TI]: "ምድብ",
      [Language.SO]: "Qaybta",
      [Language.SI]: "Qaybta",
      [Language.WO]: "Wàll",
    },

    // User roles
    "role.general_director": {
      [Language.EN]: "General Director",
      [Language.AM]: "ዋና ዳይሬክተር",
      [Language.OR]: "Daayireektara Waliigalaa",
      [Language.TI]: "ሓፈሻዊ ዳይረክተር",
      [Language.SO]: "Agaasime Guud",
      [Language.SI]: "Agaasime Guud",
      [Language.WO]: "Direktëru bu Mag",
    },
    "role.staff_manager": {
      [Language.EN]: "Staff Manager",
      [Language.AM]: "የሰራተኞች አስተዳዳሪ",
      [Language.OR]: "Bulchaa Hojjettootaa",
      [Language.TI]: "ኣመሓዳሪ ሰራሕተኛታት",
      [Language.SO]: "Maamulaha Shaqaalaha",
      [Language.SI]: "Maamulaha Shaqaalaha",
      [Language.WO]: "Boroom Liggéey",
    },
    "role.admin": {
      [Language.EN]: "Administrator",
      [Language.AM]: "አስተዳዳሪ",
      [Language.OR]: "Bulchaa",
      [Language.TI]: "ኣመሓዳሪ",
      [Language.SO]: "Maamule",
      [Language.SI]: "Maamule",
      [Language.WO]: "Boroom",
    },
    "role.end_user": {
      [Language.EN]: "End User",
      [Language.AM]: "የመጨረሻ ተጠቃሚ",
      [Language.OR]: "Fayyadamaa Dhumaa",
      [Language.TI]: "ናይ መወዳእታ ተጠቃሚ",
      [Language.SO]: "Isticmaale Dhammaad",
      [Language.SI]: "Isticmaale Dhammaad",
      [Language.WO]: "Jëfandikukat bu mujj",
    },

    // Email templates
    "email.ticket.created.subject": {
      [Language.EN]: "New Ticket Created: {{title}}",
      [Language.AM]: "አዲስ ትኬት ተፈጥሯል: {{title}}",
      [Language.OR]: "Tikeetiin Haaraan Uumameera: {{title}}",
      [Language.TI]: "ሓድሽ ትኬት ተፈጢሩ: {{title}}",
      [Language.SO]: "Tikidh Cusub oo la sameeyay: {{title}}",
      [Language.SI]: "Tikidh Cusub oo la sameeyay: {{title}}",
      [Language.WO]: "Billet bu bees la sos: {{title}}",
    },
    "email.ticket.assigned.subject": {
      [Language.EN]: "Ticket Assigned to You: {{title}}",
      [Language.AM]: "ትኬት ተመድቦልዎታል: {{title}}",
      [Language.OR]: "Tikeetiin siif ramadameera: {{title}}",
      [Language.TI]: "ትኬት ተመዲቡልካ: {{title}}",
      [Language.SO]: "Tikidh laguu qoondeeyay: {{title}}",
      [Language.SI]: "Tikidh laguu qoondeeyay: {{title}}",
      [Language.WO]: "Billet nga joxe la: {{title}}",
    },

    // Notifications
    "notification.welcome": {
      [Language.EN]: "Welcome to Ethiopian Civil Service Commission Helpdesk",
      [Language.AM]: "ወደ የኢትዮጵያ ሲቪል ሰርቪስ ኮሚሽን የእርዳታ ዴስክ እንኳን በደህና መጡ",
      [Language.OR]: "Gara Desk Gargaarsa Komishina Tajaajila Siviilii Itoophiyaatti baga nagaan dhuftan",
      [Language.TI]: "ናብ ሓገዝ ዴስክ ኮሚሽን ሲቪል ሰርቪስ ኢትዮጵያ እንቋዕ ብደሓን መጻእኩም",
      [Language.SO]: "Ku soo dhawoow Miiska Caawinta Guddiga Adeegga Madaniga Itoobiya",
      [Language.SI]: "Ku soo dhawoow Miiska Caawinta Guddiga Adeegga Madaniga Itoobiya",
      [Language.WO]: "Dalal ak jamm ci biro caaw bu Komise yu Sërvisu Siviil yu Ecoopi",
    },
  }

  translate(key: string, language: Language = Language.EN, params?: Record<string, string>): string {
    const translation = this.translations[key]

    if (!translation) {
      console.warn(`Translation not found for key: ${key}`)
      return key
    }

    let text = translation[language] || translation[Language.EN] || key

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, "g"), value)
      })
    }

    return text
  }

  getAvailableLanguages(): Language[] {
    return Object.values(Language)
  }

  getLanguageName(language: Language): string {
    const names = {
      [Language.EN]: "English",
      [Language.AM]: "አማርኛ (Amharic)",
      [Language.OR]: "Afaan Oromoo (Oromo)",
      [Language.TI]: "ትግርኛ (Tigrinya)",
      [Language.SO]: "Soomaali (Somali)",
      [Language.SI]: "Sidaamu Afoo (Sidama)",
      [Language.WO]: "Wolof",
    }

    return names[language] || language
  }

  detectLanguageFromText(text: string): Language {
    // Simple language detection based on character patterns
    // This is a basic implementation - in production, you might want to use a proper language detection library

    // Check for Amharic characters
    if (/[\u1200-\u137F]/.test(text)) {
      return Language.AM
    }

    // Check for Arabic script (Somali can use Arabic script)
    if (/[\u0600-\u06FF]/.test(text)) {
      return Language.SO
    }

    // Default to English
    return Language.EN
  }

  formatDate(date: Date, language: Language = Language.EN): string {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }

    const locales = {
      [Language.EN]: "en-US",
      [Language.AM]: "am-ET",
      [Language.OR]: "om-ET",
      [Language.TI]: "ti-ET",
      [Language.SO]: "so-ET",
      [Language.SI]: "sid-ET",
      [Language.WO]: "wo-SN",
    }

    try {
      return new Intl.DateTimeFormat(locales[language] || "en-US", options).format(date)
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.DateTimeFormat("en-US", options).format(date)
    }
  }

  formatNumber(number: number, language: Language = Language.EN): string {
    const locales = {
      [Language.EN]: "en-US",
      [Language.AM]: "am-ET",
      [Language.OR]: "om-ET",
      [Language.TI]: "ti-ET",
      [Language.SO]: "so-ET",
      [Language.SI]: "sid-ET",
      [Language.WO]: "wo-SN",
    }

    try {
      return new Intl.NumberFormat(locales[language] || "en-US").format(number)
    } catch (error) {
      // Fallback to English if locale is not supported
      return new Intl.NumberFormat("en-US").format(number)
    }
  }

  getTextDirection(language: Language): "ltr" | "rtl" {
    // Most Ethiopian languages use left-to-right text direction
    // Arabic script languages would use right-to-left
    return "ltr"
  }
}
