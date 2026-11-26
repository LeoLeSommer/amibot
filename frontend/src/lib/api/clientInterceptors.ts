import { isAxiosError, type InternalAxiosRequestConfig } from "axios";

import i18n from "@/i18n";

import { CLIENT_API_VERSION, CLIENT_API_VERSION_HEADER } from "./clientInfo";
import { toApiError } from "./errors";

type Handler = (() => void) | null;

let clientUpdateRequiredHandler: Handler = null;

/**
 * Registers the app-wide reaction to a `426 Upgrade Required` response. The
 * boot layer wires this to the forced update screen.
 */
export function setClientUpdateRequiredHandler(handler: Handler): void {
  clientUpdateRequiredHandler = handler;
}

/**
 * Triggers the app-wide forced update reaction. Streaming transports use
 * fetch directly and bypass Axios interceptors, so they call this on a `426`.
 */
export function notifyClientUpdateRequired(): void {
  clientUpdateRequiredHandler?.();
}

export function withClientHeaders(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  config.headers.set("Accept-Language", i18n.language);
  config.headers.set(CLIENT_API_VERSION_HEADER, String(CLIENT_API_VERSION));
  return config;
}

export function handleApiError(error: unknown): Promise<never> {
  const apiError = toApiError(error);

  if (isAxiosError(error) && error.response?.status === 426) {
    notifyClientUpdateRequired();
  }

  return Promise.reject(apiError);
}
