import type { ThemeColors } from "@/constants/theme";

const colorVariableNames: Record<keyof ThemeColors, `--${string}`> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  surface: "--surface",
  surfaceForeground: "--surface-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  destructive: "--destructive",
};

export function hexToRgbTriplet(hex: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    throw new Error(`Expected a six-digit hex color, received "${hex}"`);
  }

  const value = match[1];
  return [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)]
    .map((channel) => Number.parseInt(channel, 16))
    .join(" ");
}

export function themeCssVariables(
  colors: ThemeColors,
): Record<`--${string}`, string> {
  return Object.fromEntries(
    (Object.keys(colorVariableNames) as (keyof ThemeColors)[]).map((token) => [
      colorVariableNames[token],
      hexToRgbTriplet(colors[token]),
    ]),
  ) as Record<`--${string}`, string>;
}
