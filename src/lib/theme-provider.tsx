import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const THEMES = [
  { id: "light", name: "Light", swatch: "#ffffff" },
  { id: "dark", name: "Dark", swatch: "#1a1d2e" },
  { id: "amoled", name: "AMOLED", swatch: "#000000" },
  { id: "blue", name: "Blue", swatch: "#2563eb" },
  { id: "purple", name: "Purple", swatch: "#8b5cf6" },
  { id: "green", name: "Green", swatch: "#10b981" },
  { id: "pink", name: "Pink", swatch: "#ec4899" },
  { id: "orange", name: "Orange", swatch: "#f97316" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}
const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme")) as ThemeId | null;
    if (stored && THEMES.find((t) => t.id === stored)) setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme outside provider");
  return c;
};
