/**
 * Light-only design palette, mirroring the tokens declared in `src/global.css`.
 * Prefer the NativeWind utility classes (`bg-background`, `text-foreground`, …)
 * for styling; keep these hex values for JS-only needs (StatusBar, raw styles).
 */

import "@/global.css";

export const Fonts = {
  sans: "PublicSans-Regular",
  sansMedium: "PublicSans-Medium",
  sansSemibold: "PublicSans-SemiBold",
  sansBold: "PublicSans-Bold",
  sansExtraBold: "PublicSans-ExtraBold",
  display: "Archivo-Bold",
  displaySemibold: "Archivo-SemiBold",
  displayBold: "Archivo-Bold",
} as const;

export const Palette = {
  background: "#F8FAFC",
  foreground: "#0F172A",
  card: "#FFFFFF",
  surface: "#E2E8F0",
  surfaceForeground: "#312E81",
  muted: "#F1F5F9",
  mutedForeground: "#64748B",
  primary: "#4F46E5",
  primaryForeground: "#F8FAFC",
  secondary: "#3730A3",
  secondaryForeground: "#F8FAFC",
  border: "#E2E8F0",
  destructive: "#DC2626",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
