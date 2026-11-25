import { ApiError, toApiError } from "@/lib/api/errors";

function axiosLikeError({
  message,
  status,
  data,
}: {
  message: string;
  status?: number;
  data?: unknown;
}) {
  return {
    isAxiosError: true,
    message,
    response: status === undefined ? undefined : { status, data },
  };
}

describe("toApiError", () => {
  it("returns the same instance for an ApiError", () => {
    const error = new ApiError("boom", 418);

    expect(toApiError(error)).toBe(error);
  });

  it("uses a string response error message and the response status", () => {
    const error = toApiError(
      axiosLikeError({
        message: "Request failed",
        status: 422,
        data: { error: "invalid payload" },
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("invalid payload");
    expect(error.status).toBe(422);
    expect(error.code).toBeUndefined();
  });

  it("keeps a string response error code", () => {
    const error = toApiError(
      axiosLikeError({
        message: "Request failed",
        status: 426,
        data: {
          error: "client update required",
          code: "client_update_required",
        },
      }),
    );

    expect(error.status).toBe(426);
    expect(error.code).toBe("client_update_required");
  });

  it("ignores a non-string response error code", () => {
    const error = toApiError(
      axiosLikeError({
        message: "Request failed",
        status: 400,
        data: { error: "invalid payload", code: 42 },
      }),
    );

    expect(error.code).toBeUndefined();
  });

  it("falls back to the Axios message for a non-string response error", () => {
    const error = toApiError(
      axiosLikeError({
        message: "Request failed",
        status: 500,
        data: { error: { code: "bad" } },
      }),
    );

    expect(error.message).toBe("Request failed");
    expect(error.status).toBe(500);
  });

  it("uses status 0 when the Axios error has no response", () => {
    const error = toApiError(axiosLikeError({ message: "Network Error" }));

    expect(error.message).toBe("Network Error");
    expect(error.status).toBe(0);
  });

  it("wraps a plain Error with status 0", () => {
    const error = toApiError(new Error("plain failure"));

    expect(error.message).toBe("plain failure");
    expect(error.status).toBe(0);
  });

  it("wraps a non-Error input as a request failure", () => {
    const error = toApiError("nope");

    expect(error.message).toBe("request failed");
    expect(error.status).toBe(0);
  });
});
