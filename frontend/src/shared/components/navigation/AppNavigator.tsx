import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
} from "expo-router";
import { useMemo } from "react";

import useTheme from "@/shared/theme/useTheme";

export type AppNavigatorProps = {
  reduceMotion: boolean;
};

/**
 * Navigator theme derived from the active app palette so screen backgrounds
 * follow the in-app color mode instead of the navigation library default.
 */
export default function AppNavigator({ reduceMotion }: AppNavigatorProps) {
  const { colors, resolvedScheme } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: resolvedScheme === "dark",
      colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.foreground,
        border: colors.border,
        notification: colors.destructive,
      },
    }),
    [colors, resolvedScheme],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? "none" : "default",
        }}
      >
        <Stack.Screen
          name="home"
          options={{ animation: reduceMotion ? "none" : "fade" }}
        />
        <Stack.Screen name="update" options={{ gestureEnabled: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
