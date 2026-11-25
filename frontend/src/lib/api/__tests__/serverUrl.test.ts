import { normalizeServerUrl, resolveServerUrl } from "@/lib/api/serverUrl";

describe("normalizeServerUrl", () => {
  it("accepts http and https URLs", () => {
    expect(normalizeServerUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeServerUrl("https://amibot.example")).toBe(
      "https://amibot.example",
    );
  });

  it("removes trailing slashes and preserves the path", () => {
    expect(normalizeServerUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeServerUrl("https://amibot.example/api/")).toBe(
      "https://amibot.example/api",
    );
  });

  it("normalizes the scheme and host case", () => {
    expect(normalizeServerUrl("HTTPS://AMIBOT.EXAMPLE")).toBe(
      "https://amibot.example",
    );
  });

  it("rejects non-http schemes", () => {
    expect(normalizeServerUrl("ftp://amibot.example")).toBeNull();
    expect(normalizeServerUrl("amibot.example")).toBeNull();
  });

  it("rejects credentials, query strings, and fragments", () => {
    expect(normalizeServerUrl("http://user:secret@amibot.example")).toBeNull();
    expect(normalizeServerUrl("http://amibot.example?token=1")).toBeNull();
    expect(normalizeServerUrl("http://amibot.example#section")).toBeNull();
  });

  it("rejects empty and malformed values", () => {
    expect(normalizeServerUrl("")).toBeNull();
    expect(normalizeServerUrl("   ")).toBeNull();
    expect(normalizeServerUrl("http://")).toBeNull();
  });
});

describe("resolveServerUrl", () => {
  const fallbacks = {
    envUrl: "https://env.amibot.example",
    webOrigin: "https://web.amibot.example",
    platform: "web",
  };

  it("prefers the stored URL", () => {
    expect(
      resolveServerUrl({ storedUrl: "http://localhost:3000", ...fallbacks }),
    ).toEqual({ url: "http://localhost:3000", source: "stored" });
  });

  it("treats an empty stored value as an explicit disconnect", () => {
    expect(resolveServerUrl({ storedUrl: "", ...fallbacks })).toEqual({
      url: null,
      source: "none",
    });
  });

  it("treats an invalid stored value as an explicit absence", () => {
    expect(resolveServerUrl({ storedUrl: "not a url", ...fallbacks })).toEqual({
      url: null,
      source: "none",
    });
  });

  it("falls back to the environment when nothing is stored", () => {
    expect(resolveServerUrl({ storedUrl: null, ...fallbacks })).toEqual({
      url: "https://env.amibot.example",
      source: "environment",
    });
  });

  it("falls back to the web origin when the environment is empty", () => {
    expect(
      resolveServerUrl({
        storedUrl: null,
        envUrl: "",
        webOrigin: "https://web.amibot.example",
        platform: "web",
      }),
    ).toEqual({ url: "https://web.amibot.example", source: "web" });
  });

  it("ignores the web origin on native platforms", () => {
    expect(
      resolveServerUrl({
        storedUrl: null,
        envUrl: null,
        webOrigin: "https://web.amibot.example",
        platform: "ios",
      }),
    ).toEqual({ url: null, source: "none" });
  });

  it("ignores an invalid environment URL on web", () => {
    expect(
      resolveServerUrl({
        storedUrl: null,
        envUrl: "ftp://env.amibot.example",
        webOrigin: "https://web.amibot.example",
        platform: "web",
      }),
    ).toEqual({ url: "https://web.amibot.example", source: "web" });
  });
});
