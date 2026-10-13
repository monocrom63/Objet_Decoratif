import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Language } from "./translations";

const STORAGE_KEY = "objet-decoratif-language";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
  t: (text: string) => string;
  locale: string;
} | null>(null);

function initialLanguage(): Language {
  const requested = new URLSearchParams(window.location.search).get("lang")?.toUpperCase();
  if (requested === "DE" || requested === "EN") return requested;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "DE" ? "DE" : "EN";
  } catch {
    return "EN";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const chooseLanguage = (value: Language) => {
    setLanguage(value);
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.set("lang", value.toLowerCase());
      window.history.replaceState(window.history.state, "", url);
    }
  };
  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Language switching still works when a browser disallows persistent storage.
    }
  }, [language]);
  const value = useMemo(() => ({
    language,
    setLanguage: chooseLanguage,
    t: (text: string) => translate(text, language),
    locale: language === "DE" ? "de-DE" : "en-GB",
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required");
  return context;
}
