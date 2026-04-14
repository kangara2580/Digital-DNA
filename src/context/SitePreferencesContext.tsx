"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyLocaleToDocument,
  STORAGE_THEME,
  type SiteLocale,
} from "@/lib/sitePreferences";

type Ctx = {
  themeMode: "light" | "dark";
  locale: SiteLocale;
  setTheme: (next: "light" | "dark") => void;
  toggleTheme: () => void;
  setLocale: (next: SiteLocale) => void;
};

const SitePreferencesContext = createContext<Ctx | null>(null);

export function SitePreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [locale, setLocaleState] = useState<SiteLocale>("ko");

  useEffect(() => {
    const html = document.documentElement;
    const current =
      html.dataset.theme === "light" || html.dataset.theme === "dark"
        ? (html.dataset.theme as "light" | "dark")
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    html.dataset.theme = current;
    setThemeMode(current);
    const loc = html.lang === "en" ? "en" : "ko";
    setLocaleState(loc);
  }, []);

  const setTheme = useCallback((next: "light" | "dark") => {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_THEME, next);
    } catch {
      /* noop */
    }
    setThemeMode(next);
  }, []);

  const setLocale = useCallback((next: SiteLocale) => {
    applyLocaleToDocument(next);
    setLocaleState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(themeMode === "dark" ? "light" : "dark");
  }, [setTheme, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      locale,
      setTheme,
      toggleTheme,
      setLocale,
    }),
    [themeMode, locale, setTheme, toggleTheme, setLocale],
  );

  return (
    <SitePreferencesContext.Provider value={value}>
      {children}
    </SitePreferencesContext.Provider>
  );
}

export function useSitePreferences(): Ctx {
  const c = useContext(SitePreferencesContext);
  if (!c) {
    throw new Error("useSitePreferences must be used within SitePreferencesProvider");
  }
  return c;
}
