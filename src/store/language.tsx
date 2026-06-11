import { createContext, useContext, useState, type ReactNode } from "react";
import { IDIOMAS } from "@/core";
import type { Idioma, TranslationKey } from "@/core";

type LangContext = {
  lang: Idioma;
  setLang: (l: Idioma) => void;
  t: (key: TranslationKey) => string;
};

const Ctx = createContext<LangContext | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Idioma>("es");
  const t = (key: TranslationKey) => (IDIOMAS[lang] as Record<string, string>)[key] ?? key;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useTranslation() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTranslation debe usarse dentro de LanguageProvider");
  return ctx;
}
