import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { DarkThemeCustom, LightTheme } from "./themes";
import type { AppTheme } from "./types";

type ThemeType = "light" | "dark";

type ThemeContextType = {
  theme: ThemeType;
  toggleTheme: () => void;
  navTheme: AppTheme;
};

const THEME_KEY = "APP_THEME";

const ThemeContext = createContext<ThemeContextType | null>(null);

export function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemTheme = useColorScheme() ?? "light";
  const [theme, setTheme] = useState<ThemeType>(systemTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") {
          setTheme(saved);
        } else {
          setTheme(systemTheme);
        }
      } catch {
        setTheme(systemTheme);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, [systemTheme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_KEY, next).catch((err) => {
        console.warn("Failed to persist theme preference:", err);
      });
      return next;
    });
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      navTheme: theme === "dark" ? DarkThemeCustom : LightTheme,
    }),
    [theme],
  );

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within provider");
  return ctx;
};
