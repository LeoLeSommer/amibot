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
    clientUpdateRequiredHandler?.();
  }

  return Promise.reject(apiError);
}
