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
      background: "#F7F6F2",
      foreground: "#17171A",
      card: "#FFFFFF",
      popover: "#FFFFFF",
      popoverForeground: "#17171A",
      surface: "#ECE9E2",
      surfaceForeground: "#17171A",
      muted: "#ECE9E2",
      mutedForeground: "#5F5B54",
      primary: "#2A3CCB",
      primaryForeground: "#FFFFFF",
      secondary: "#26262B",
      secondaryForeground: "#F7F6F2",
      accent: "#E7E4DD",
      accentForeground: "#17171A",
      border: "#DCD8CF",
      input: "#DCD8CF",
      ring: "#2A3CCB",
      destructive: "#B42318",
    },
    dark: {
      background: "#0E0E10",
      foreground: "#F3F1EC",
      card: "#17171A",
      popover: "#17171A",
      popoverForeground: "#F3F1EC",
      surface: "#1F1F23",
      surfaceForeground: "#F3F1EC",
      muted: "#1F1F23",
      mutedForeground: "#A6A29A",
      primary: "#9BA6FF",
      primaryForeground: "#101018",
      secondary: "#ECEAE4",
      secondaryForeground: "#17171A",
      accent: "#26262B",
      accentForeground: "#F3F1EC",
      border: "#2E2E33",
      input: "#2E2E33",
      ring: "#9BA6FF",
      destructive: "#FF6B61",
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

/**
 * Elevation presets. Values are CSS `box-shadow` strings: React Native's new
 * architecture and react-native-web both accept them, so one token drives
 * every platform. `inset` highlights fake a lit top edge; the drop layers stay
 * low-opacity so neutral surfaces keep the lead.
 */
export type ShadowLevel =
  "raised" | "floating" | "overlay" | "action" | "control" | "field" | "header";

export const depthShadows: Record<ThemeScheme, Record<ShadowLevel, string>> = {
  light: {
    raised:
      "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(23, 23, 26, 0.05), 0 6px 20px rgba(23, 23, 26, 0.06)",
    floating:
      "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 16px rgba(23, 23, 26, 0.08), 0 20px 44px rgba(23, 23, 26, 0.08)",
    overlay: "0 28px 72px rgba(23, 23, 26, 0.2)",
    action:
      "inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 1px 2px rgba(42, 60, 203, 0.28), 0 8px 20px rgba(42, 60, 203, 0.22)",
    control:
      "inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 1px 2px rgba(23, 23, 26, 0.06)",
    field: "inset 0 1px 2px rgba(23, 23, 26, 0.07)",
    header:
      "0 1px 0 rgba(23, 23, 26, 0.04), 0 10px 30px rgba(23, 23, 26, 0.07)",
  },
  dark: {
    raised:
      "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.35)",
    floating:
      "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 10px 28px rgba(0, 0, 0, 0.5), 0 24px 60px rgba(0, 0, 0, 0.35)",
    overlay: "0 32px 80px rgba(0, 0, 0, 0.65)",
    action:
      "inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 22px rgba(155, 166, 255, 0.16)",
    control:
      "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.4)",
    field: "inset 0 1px 2px rgba(0, 0, 0, 0.45)",
    header: "0 1px 0 rgba(255, 255, 255, 0.04), 0 12px 36px rgba(0, 0, 0, 0.5)",
  },
};

export type GradientName = "canvas" | "card" | "primary" | "header";

/**
 * Background gradients. They stay neutral and directional (top light, bottom
 * shaded) so they read as light on a surface, never as decoration.
 */
export const gradients: Record<ThemeScheme, Record<GradientName, string>> = {
  light: {
    canvas: "linear-gradient(180deg, #FBFAF7 0%, #F7F6F2 46%, #EFECE4 100%)",
    card: "linear-gradient(180deg, #FFFFFF 0%, #FAF9F6 100%)",
    primary: "linear-gradient(180deg, #3547D8 0%, #2A3CCB 52%, #2536A9 100%)",
    header:
      "linear-gradient(180deg, rgba(251, 250, 247, 0.94) 0%, rgba(247, 246, 242, 0.88) 100%)",
  },
  dark: {
    canvas: "linear-gradient(180deg, #15151A 0%, #0E0E10 48%, #0B0B0D 100%)",
    card: "linear-gradient(180deg, #1B1B20 0%, #17171A 100%)",
    primary: "linear-gradient(180deg, #ADB6FF 0%, #9BA6FF 52%, #808CEE 100%)",
    header:
      "linear-gradient(180deg, rgba(21, 21, 26, 0.94) 0%, rgba(14, 14, 16, 0.88) 100%)",
  },
};

export const Layout = {
  headerHeight: 56,
} as const;
