/**
 * Design tokens and runtime palettes.
 *
 * Each theme ships a light and a dark palette; `ThemeProvider` selects the
 * active palette at runtime and mirrors it into the CSS variables declared in
 * `src/global.css`. Prefer the NativeWind utility classes (`bg-background`,
 * `text-foreground`, …) for styling; use these hex values for JS-only needs
 * (status bar, icons, raw styles).
 */

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

export const themeNames = ["default", "ocean", "forest"] as const;
export type ThemeName = (typeof themeNames)[number];

export const colorModes = ["system", "light", "dark"] as const;
export type ColorMode = (typeof colorModes)[number];

export type ThemeScheme = "light" | "dark";

export type AppearanceSettings = {
  theme: ThemeName;
  mode: ColorMode;
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "default",
  mode: "system",
};

export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  popover: string;
  popoverForeground: string;
  surface: string;
  surfaceForeground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
};

export const themePalettes: Record<
  ThemeName,
  Record<ThemeScheme, ThemeColors>
> = {
  default: {
    light: {
      background: "#F8FAFC",
      foreground: "#0F172A",
      card: "#FFFFFF",
      popover: "#FFFFFF",
      popoverForeground: "#0F172A",
      surface: "#E2E8F0",
      surfaceForeground: "#312E81",
      muted: "#F1F5F9",
      mutedForeground: "#64748B",
      primary: "#4F46E5",
      primaryForeground: "#F8FAFC",
      secondary: "#3730A3",
      secondaryForeground: "#F8FAFC",
      accent: "#E0E7FF",
      accentForeground: "#3730A3",
      border: "#E2E8F0",
      input: "#E2E8F0",
      ring: "#4F46E5",
      destructive: "#DC2626",
    },
    dark: {
      background: "#0B1220",
      foreground: "#F8FAFC",
      card: "#111C2E",
      popover: "#111C2E",
      popoverForeground: "#F8FAFC",
      surface: "#1E293B",
      surfaceForeground: "#C7D2FE",
      muted: "#1E293B",
      mutedForeground: "#94A3B8",
      primary: "#818CF8",
      primaryForeground: "#0B1220",
      secondary: "#A5B4FC",
      secondaryForeground: "#1E1B4B",
      accent: "#312E81",
      accentForeground: "#E0E7FF",
      border: "#263449",
      input: "#263449",
      ring: "#818CF8",
      destructive: "#F87171",
    },
  },
  ocean: {
    light: {
      background: "#F0F9FF",
      foreground: "#0C4A6E",
      card: "#FFFFFF",
      popover: "#FFFFFF",
      popoverForeground: "#0C4A6E",
      surface: "#BAE6FD",
      surfaceForeground: "#075985",
      muted: "#E0F2FE",
      mutedForeground: "#0369A1",
      primary: "#0284C7",
      primaryForeground: "#F0F9FF",
      secondary: "#0E7490",
      secondaryForeground: "#ECFEFF",
      accent: "#CFFAFE",
      accentForeground: "#155E75",
      border: "#BAE6FD",
      input: "#BAE6FD",
      ring: "#0284C7",
      destructive: "#DC2626",
    },
    dark: {
      background: "#082F49",
      foreground: "#E0F2FE",
      card: "#0C3B57",
      popover: "#0C3B57",
      popoverForeground: "#E0F2FE",
      surface: "#155E75",
      surfaceForeground: "#CFFAFE",
      muted: "#0E4560",
      mutedForeground: "#7DD3FC",
      primary: "#38BDF8",
      primaryForeground: "#082F49",
      secondary: "#22D3EE",
      secondaryForeground: "#083344",
      accent: "#155E75",
      accentForeground: "#CFFAFE",
      border: "#155E75",
      input: "#155E75",
      ring: "#38BDF8",
      destructive: "#FB7185",
    },
  },
  forest: {
    light: {
      background: "#F0FDF4",
      foreground: "#052E16",
      card: "#FFFFFF",
      popover: "#FFFFFF",
      popoverForeground: "#052E16",
      surface: "#BBF7D0",
      surfaceForeground: "#166534",
      muted: "#DCFCE7",
      mutedForeground: "#15803D",
      primary: "#16A34A",
      primaryForeground: "#F0FDF4",
      secondary: "#15803D",
      secondaryForeground: "#F0FDF4",
      accent: "#D9F99D",
      accentForeground: "#3F6212",
      border: "#BBF7D0",
      input: "#BBF7D0",
      ring: "#16A34A",
      destructive: "#DC2626",
    },
    dark: {
      background: "#052E16",
      foreground: "#DCFCE7",
      card: "#0A3D20",
      popover: "#0A3D20",
      popoverForeground: "#DCFCE7",
      surface: "#14532D",
      surfaceForeground: "#BBF7D0",
      muted: "#113B23",
      mutedForeground: "#86EFAC",
      primary: "#4ADE80",
      primaryForeground: "#052E16",
      secondary: "#22C55E",
      secondaryForeground: "#052E16",
      accent: "#166534",
      accentForeground: "#DCFCE7",
      border: "#14532D",
      input: "#14532D",
      ring: "#4ADE80",
      destructive: "#F87171",
    },
  },
};

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

/**
 * Blur tints for `expo-blur`. Each tint adds its own color layer on top of the
 * blur, so the overlay opacity below is intentionally subtle.
 */
export const GlassTint = {
  light: "systemThinMaterialLight",
  dark: "systemThinMaterialDark",
} as const;

export type GlassVariant = "navigation" | "floating" | "overlay";

export type GlassVariantTokens = {
  blurIntensity: number;
  radius: number;
  backgroundOpacity: { light: number; dark: number };
  borderOpacity: { light: number; dark: number };
  borderEdges: "bottom" | "all";
  shadowOpacity: { light: number; dark: number };
  shadowRadius: number;
  elevation: number;
};

/**
 * Material tokens for glass chrome. Tune opacity and intensity on iOS,
 * Android, and web; all three must stay readable in every palette.
 */
export const glassVariants: Record<GlassVariant, GlassVariantTokens> = {
  navigation: {
    blurIntensity: 45,
    radius: 0,
    backgroundOpacity: { light: 0.78, dark: 0.66 },
    borderOpacity: { light: 0.55, dark: 0.4 },
    borderEdges: "bottom",
    shadowOpacity: { light: 0, dark: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  floating: {
    blurIntensity: 40,
    radius: 22,
    backgroundOpacity: { light: 0.72, dark: 0.58 },
    borderOpacity: { light: 0.55, dark: 0.4 },
    borderEdges: "all",
    shadowOpacity: { light: 0.1, dark: 0.3 },
    shadowRadius: 18,
    elevation: 6,
  },
  overlay: {
    blurIntensity: 60,
    radius: 24,
    backgroundOpacity: { light: 0.86, dark: 0.76 },
    borderOpacity: { light: 0.6, dark: 0.45 },
    borderEdges: "all",
    shadowOpacity: { light: 0.14, dark: 0.4 },
    shadowRadius: 24,
    elevation: 16,
  },
};

export const Layout = {
  headerHeight: 56,
} as const;
