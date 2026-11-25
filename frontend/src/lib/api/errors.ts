import { isAxiosError } from "axios";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAxiosError(error)) {
    const data = error.response?.data as
      { error?: unknown; code?: unknown } | undefined;
    const message =
      typeof data?.error === "string" && data.error.length > 0
        ? data.error
        : error.message;
    const code =
      typeof data?.code === "string" && data.code.length > 0
        ? data.code
        : undefined;
    return new ApiError(message, error.response?.status ?? 0, code);
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }
  return new ApiError("request failed", 0);
}
