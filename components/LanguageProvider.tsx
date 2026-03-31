"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "@/lib/translations";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LangCtx>({
  lang: "nl",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl"); // Dutch default

  useEffect(() => {
    const saved = localStorage.getItem("language") as Lang | null;
    if (saved === "en" || saved === "nl") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("language", l);
  }

  function t(key: string): string {
    return translations[key]?.[lang] ?? translations[key]?.["en"] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
