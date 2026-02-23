import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

import { Language, isLanguage, translate } from "../i18n";
import { STORAGE_LANGUAGE_KEY } from "../utils/constants";

interface LanguageContextValue {
  language: Language;
  direction: "rtl" | "ltr";
  hasSelectedLanguage: boolean;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLanguage(): Language | null {
  const raw = localStorage.getItem(STORAGE_LANGUAGE_KEY);
  return isLanguage(raw) ? raw : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => !!readStoredLanguage());
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage() ?? "en");

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = (nextLanguage: Language) => {
    localStorage.setItem(STORAGE_LANGUAGE_KEY, nextLanguage);
    setHasSelectedLanguage(true);
    setLanguageState(nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      direction: language === "ar" ? "rtl" : "ltr",
      hasSelectedLanguage,
      setLanguage,
      t: (key, params) => translate(language, key, params),
    }),
    [hasSelectedLanguage, language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
