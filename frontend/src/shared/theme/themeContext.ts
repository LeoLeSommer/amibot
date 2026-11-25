import { createContext } from "react";

import type {
  ColorMode,
  ThemeColors,
  ThemeName,
  ThemeScheme,
} from "@/constants/theme";

export type ThemeContextValue = {
  theme: ThemeName;
  mode: ColorMode;
  resolvedScheme: ThemeScheme;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ColorMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
