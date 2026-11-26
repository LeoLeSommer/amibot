import { DefaultTheme } from "expo-router";
import { useMemo } from "react";

import useTheme from "@/shared/theme/useTheme";

export default function useNavigationTheme() {
  const { colors, resolvedScheme } = useTheme();

  return useMemo(
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
}
