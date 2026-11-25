import { StatusBar } from "expo-status-bar";
import { VariableContextProvider } from "nativewind";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, useColorScheme } from "react-native";

import {
  DEFAULT_APPEARANCE_SETTINGS,
  themePalettes,
  type AppearanceSettings,
  type ColorMode,
  type ThemeName,
} from "@/constants/theme";
import { GluestackUIProvider } from "@/shared/components/ui/gluestack-ui-provider";

import {
  loadAppearanceSettings,
  saveAppearanceSettings,
} from "./appearanceStorage";
import { resolveColorScheme } from "./resolveColorScheme";
import { ThemeContext } from "./themeContext";
import { themeCssVariables } from "./themeCssVariables";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(
    DEFAULT_APPEARANCE_SETTINGS,
  );
  const systemScheme = useColorScheme();

  useEffect(() => {
    let active = true;

    void loadAppearanceSettings().then((stored) => {
      if (active) {
        setSettings(stored);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const setTheme = (theme: ThemeName) => {
    const next = { ...settings, theme };
    setSettings(next);
    saveAppearanceSettings(next);
  };

  const setMode = (mode: ColorMode) => {
    const next = { ...settings, mode };
    setSettings(next);
    saveAppearanceSettings(next);
  };

  const resolvedScheme = resolveColorScheme(settings.mode, systemScheme);
  const colors = themePalettes[settings.theme][resolvedScheme];
  const cssVariables = useMemo(() => themeCssVariables(colors), [colors]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    for (const [name, value] of Object.entries(cssVariables)) {
      root.style.setProperty(name, value);
    }
    root.style.backgroundColor = colors.background;
    root.style.colorScheme = resolvedScheme;

    if (document.body) {
      document.body.style.backgroundColor = colors.background;
    }
  }, [colors, cssVariables, resolvedScheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.theme,
        mode: settings.mode,
        resolvedScheme,
        colors,
        setTheme,
        setMode,
      }}
    >
      <VariableContextProvider value={cssVariables}>
        <GluestackUIProvider
          mode={settings.mode}
          style={{ backgroundColor: colors.background }}
        >
          <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
          {children}
        </GluestackUIProvider>
      </VariableContextProvider>
    </ThemeContext.Provider>
  );
}
