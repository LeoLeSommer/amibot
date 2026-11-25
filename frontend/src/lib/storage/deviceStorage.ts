import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

function storageFile(key: string) {
  return new File(Paths.document, key);
}

export async function readText(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  try {
    const file = storageFile(key);
    if (!file.exists) {
      return null;
    }
    return await file.text();
  } catch {
    return null;
  }
}

export function writeText(key: string, value: string): void {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Storage failures must not block the caller.
    }
    return;
  }

  try {
    const file = storageFile(key);
    file.create({ intermediates: true, overwrite: true });
    file.write(value);
  } catch {
    // Storage failures must not block the caller.
  }
}

export function removeText(key: string): void {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Storage failures must not block the caller.
    }
    return;
  }

  try {
    const file = storageFile(key);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Storage failures must not block the caller.
  }
}
