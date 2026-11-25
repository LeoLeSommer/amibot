import {
  colorModes,
  DEFAULT_APPEARANCE_SETTINGS,
  themeNames,
  type AppearanceSettings,
  type ColorMode,
  type ThemeName,
} from "@/constants/theme";
import { readText, writeText } from "@/lib/storage/deviceStorage";

export const APPEARANCE_STORAGE_KEY = "amibot.appearance";

function isThemeName(value: unknown): value is ThemeName {
  return (
    typeof value === "string" &&
    (themeNames as readonly string[]).includes(value)
  );
}

function isColorMode(value: unknown): value is ColorMode {
  return (
    typeof value === "string" &&
    (colorModes as readonly string[]).includes(value)
  );
}

/**
 * Parses a stored appearance value. Corrupt JSON, missing keys, and removed
 * theme or mode names fall back per field to the defaults and never throw.
 */
export function parseAppearanceSettings(
  raw: string | null,
): AppearanceSettings {
  if (!raw) {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }

  const record = parsed as Record<string, unknown>;

  return {
    theme: isThemeName(record.theme)
      ? record.theme
      : DEFAULT_APPEARANCE_SETTINGS.theme,
    mode: isColorMode(record.mode)
      ? record.mode
      : DEFAULT_APPEARANCE_SETTINGS.mode,
  };
}

export async function loadAppearanceSettings(): Promise<AppearanceSettings> {
  const raw = await readText(APPEARANCE_STORAGE_KEY);
  return parseAppearanceSettings(raw);
}

export function saveAppearanceSettings(settings: AppearanceSettings): void {
  writeText(APPEARANCE_STORAGE_KEY, JSON.stringify(settings));
}
