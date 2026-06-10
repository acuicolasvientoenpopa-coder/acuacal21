import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { MONEDAS } from "@/core";
import type { Currency } from "@/core";

const STORAGE_KEY = "aquacalc_currency";

interface CurrencyCtx {
  code: string;
  currency: Currency;
  setCode: (c: string) => void;
  fmt: (amount: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

function loadCode(): string {
  try { return localStorage.getItem(STORAGE_KEY) || "CRC"; } catch { return "CRC"; }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState(loadCode);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, code); }, [code]);

  const setCode = useCallback((c: string) => { setCodeState(c); }, []);

  const currency = MONEDAS[code] ?? MONEDAS.CRC;

  const fmt = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: "currency",
        currency: code in MONEDAS ? code : "CRC",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency.simbolo}${amount.toLocaleString()}`;
    }
  }, [code, currency]);

  return <Ctx.Provider value={{ code, currency, setCode, fmt }}>{children}</Ctx.Provider>;
}

export function useCurrency(): CurrencyCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCurrency must be inside CurrencyProvider");
  return c;
}