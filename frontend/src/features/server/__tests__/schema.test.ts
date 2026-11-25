import { serverUrlSchema } from "@/features/server/schema";

describe("serverUrlSchema", () => {
  it("accepts a valid http URL", () => {
    expect(
      serverUrlSchema.safeParse({ serverUrl: "http://localhost:3000" }).success,
    ).toBe(true);
  });

  it("accepts a valid https URL with a trailing slash", () => {
    expect(
      serverUrlSchema.safeParse({ serverUrl: "https://amibot.example/" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty URL with the required message key", () => {
    const result = serverUrlSchema.safeParse({ serverUrl: "   " });

    if (result.success) {
      throw new Error("expected the schema to reject an empty URL");
    }
    expect(result.error.issues[0]?.message).toBe("settings.errors.urlRequired");
  });

  it("rejects a malformed URL with the invalid message key", () => {
    const result = serverUrlSchema.safeParse({ serverUrl: "not a url" });

    if (result.success) {
      throw new Error("expected the schema to reject a malformed URL");
    }
    expect(result.error.issues[0]?.message).toBe("settings.errors.urlInvalid");
  });

  it("rejects non-http schemes", () => {
    const result = serverUrlSchema.safeParse({
      serverUrl: "ftp://amibot.example",
    });

    if (result.success) {
      throw new Error("expected the schema to reject a non-http URL");
    }
    expect(result.error.issues[0]?.message).toBe("settings.errors.urlInvalid");
  });
});
