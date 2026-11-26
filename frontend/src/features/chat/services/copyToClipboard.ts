import { Clipboard, Platform } from "react-native";

/**
 * Copies plain text to the system clipboard. Web uses the async Clipboard API;
 * native falls back to React Native's Clipboard module, which is deprecated but
 * still shipped and avoids adding a dependency.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  Clipboard.setString(text);
  return true;
}
