import { create, type AxiosInstance } from "axios";

import { handleApiError, withClientHeaders } from "./clientInterceptors";

export { ApiError, toApiError } from "./errors";
export { setClientUpdateRequiredHandler } from "./clientInterceptors";

/**
 * Session-cookie authenticated client for the server API. The base URL can be
 * absent until the server is resolved; requests are only issued when a URL is
 * configured. Errors are normalized to `ApiError` by the shared response
 * interceptor.
 */
export const apiClient: AxiosInstance = create({
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

apiClient.interceptors.request.use(withClientHeaders);
apiClient.interceptors.response.use((response) => response, handleApiError);

export function setApiBaseUrl(url: string | null): void {
  apiClient.defaults.baseURL = url ?? undefined;
}

export function getApiBaseUrl(): string | null {
  return apiClient.defaults.baseURL ?? null;
}
