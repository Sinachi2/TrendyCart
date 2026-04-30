import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { CurrencyMode } from "@/lib/currency";
import { formatNGN, formatUSD } from "@/lib/currency";

interface CurrencyContextValue {
  mode: CurrencyMode;
  setMode: (mode: CurrencyMode) => void;
  /** Format a USD price according to the active mode (returns a string). */
  format: (usdAmount: number) => string;
}

const STORAGE_KEY = "trendycart-currency-mode";

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<CurrencyMode>("both");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyMode | null;
      if (saved === "usd" || saved === "ngn" || saved === "both") {
        setModeState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((next: CurrencyMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const format = useCallback(
    (usdAmount: number) => {
      if (mode === "usd") return formatUSD(usdAmount);
      if (mode === "ngn") return formatNGN(usdAmount);
      return `${formatUSD(usdAmount)} · ${formatNGN(usdAmount)}`;
    },
    [mode]
  );

  return (
    <CurrencyContext.Provider value={{ mode, setMode, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};