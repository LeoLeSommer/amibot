import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

import i18n from "@/i18n";
import {
  CLIENT_API_VERSION,
  CLIENT_API_VERSION_HEADER,
} from "@/lib/api/clientInfo";
import {
  handleApiError,
  setClientUpdateRequiredHandler,
  withClientHeaders,
} from "@/lib/api/clientInterceptors";
import { ApiError } from "@/lib/api/errors";

function requestConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

function axiosLikeError(status: number, data?: unknown) {
  return {
    isAxiosError: true,
    message: "Request failed",
    response: { status, data },
  };
}

describe("client interceptors", () => {
  afterEach(() => {
    setClientUpdateRequiredHandler(null);
  });

  it("adds the language and contract headers", () => {
    const config = withClientHeaders(requestConfig());

    expect(config.headers.get("Accept-Language")).toBe(i18n.language);
    expect(config.headers.get(CLIENT_API_VERSION_HEADER)).toBe(
      String(CLIENT_API_VERSION),
    );
  });

  it("calls the update handler on a 426 response and keeps the code", async () => {
    const handler = jest.fn();
    setClientUpdateRequiredHandler(handler);

    await expect(
      handleApiError(
        axiosLikeError(426, {
          error: "client update required",
          code: "client_update_required",
        }),
      ),
    ).rejects.toMatchObject({
      status: 426,
      code: "client_update_required",
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not call the update handler on a 401 response", async () => {
    const handler = jest.fn();
    setClientUpdateRequiredHandler(handler);

    await expect(
      handleApiError(axiosLikeError(401, { error: "unauthorized" })),
    ).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it("ignores statuses without a registered handler", async () => {
    const updateRequired = jest.fn();
    setClientUpdateRequiredHandler(updateRequired);

    await expect(
      handleApiError(axiosLikeError(500, { error: "internal error" })),
    ).rejects.toMatchObject({ status: 500 });
    expect(updateRequired).not.toHaveBeenCalled();
  });
});
