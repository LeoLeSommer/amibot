import { readText, writeText } from "@/lib/storage/deviceStorage";

export const SERVER_URL_STORAGE_KEY = "amibot.serverUrl";

export async function loadServerUrl(): Promise<string | null> {
  return readText(SERVER_URL_STORAGE_KEY);
}

export function saveServerUrl(url: string): void {
  writeText(SERVER_URL_STORAGE_KEY, url);
}

/**
 * Stores the explicit disconnect sentinel. The empty string is distinct from
 * "never configured": it must not fall back to the environment or the web
 * origin after a reload.
 */
export function clearServerUrl(): void {
  writeText(SERVER_URL_STORAGE_KEY, "");
}
