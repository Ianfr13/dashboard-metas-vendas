import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  // Limpar qualquer tema salvo anteriormente
  useEffect(() => {
    localStorage.removeItem("theme");
  }, []);

  // Sempre forçar tema light, ignorar localStorage
  const [theme] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;
    // Sempre remover classe dark para garantir tema light
    root.classList.remove("dark");
  }, []);

  // toggleTheme desabilitado - sempre light
  const toggleTheme = undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
