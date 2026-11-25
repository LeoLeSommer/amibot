import type { ColorMode, ThemeScheme } from "@/constants/theme";

/**
 * Resolves the effective scheme for a color mode. Only an explicit dark system
 * scheme resolves to dark; `null`, `undefined`, and `"unspecified"` fall back
 * to light.
 */
export function resolveColorScheme(
  mode: ColorMode,
  systemScheme: string | null | undefined,
): ThemeScheme {
  if (mode !== "system") {
    return mode;
  }

  return systemScheme === "dark" ? "dark" : "light";
}
