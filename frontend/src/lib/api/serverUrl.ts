export type ServerUrlSource = "stored" | "environment" | "web" | "none";

export type ResolveServerUrlOptions = {
  storedUrl: string | null;
  envUrl?: string | null;
  webOrigin?: string | null;
  platform: string;
};

export type ResolvedServerUrl = {
  url: string | null;
  source: ServerUrlSource;
};

/**
 * Normalizes a server URL. Only http and https are accepted, credentials,
 * query strings, and fragments are rejected, the trailing slash is removed,
 * and the path is preserved.
 */
export function normalizeServerUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  if (url.username || url.password) {
    return null;
  }
  if (url.search || url.hash) {
    return null;
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}

/**
 * Resolves the server URL in precedence order: stored value, build-time
 * environment, then the web origin. A stored `""` or an invalid stored value
 * is an explicit absence and must not fall back, so "Disconnect" stays
 * disconnected after a reload.
 */
export function resolveServerUrl({
  storedUrl,
  envUrl,
  webOrigin,
  platform,
}: ResolveServerUrlOptions): ResolvedServerUrl {
  if (storedUrl !== null) {
    const url = normalizeServerUrl(storedUrl);
    return url ? { url, source: "stored" } : { url: null, source: "none" };
  }

  const environment = normalizeServerUrl(envUrl ?? "");
  if (environment) {
    return { url: environment, source: "environment" };
  }

  if (platform === "web") {
    const origin = normalizeServerUrl(webOrigin ?? "");
    if (origin) {
      return { url: origin, source: "web" };
    }
  }

  return { url: null, source: "none" };
}
