import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { IDIOMAS } from "@/core";
import type { Idioma, TranslationKey } from "@/core";

const STORAGE_KEY = "acuical_lang";

function getInitialLang(): Idioma {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en" || stored === "pt") return stored;
  } catch {}
  return "es";
}

type LangContext = {
  lang: Idioma;
  setLang: (l: Idioma) => void;
  t: (key: TranslationKey) => string;
};

const Ctx = createContext<LangContext | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Idioma>(getInitialLang);
  const setLang = useCallback((l: Idioma) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);
  const t = useCallback((key: TranslationKey) => (IDIOMAS[lang] as Record<string, string>)[key] ?? key, [lang]);
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useTranslation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTranslation debe usarse dentro de LanguageProvider");
  return ctx;
}
