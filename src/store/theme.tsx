import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "acuical_theme";

interface ThemeCtx {
  theme: "dark" | "light";
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function loadTheme(): "dark" | "light" {
  try { return (localStorage.getItem(STORAGE_KEY) as "dark" | "light") || "dark"; } catch { return "dark"; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be inside ThemeProvider");
  return c;
}