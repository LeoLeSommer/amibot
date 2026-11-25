import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { fetchManifest } from "@/lib/api/manifest";

jest.mock("@/lib/api/client", () => ({
  apiClient: { get: jest.fn() },
}));

const getMock = apiClient.get as jest.Mock;

const emptyManifest = {
  api_version: 1,
  core: { version: "0.1.0" },
  server: { name: "Amibot E2E" },
  compatibility: { min_client_api_version: 1 },
  modules: [],
  capabilities: [],
  ui: { slots: {} },
};

function respondWith(data: unknown) {
  getMock.mockResolvedValueOnce({ data });
}

describe("fetchManifest", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("requests the manifest endpoint", async () => {
    respondWith(emptyManifest);

    await fetchManifest();

    expect(getMock).toHaveBeenCalledWith("/api/v1/app/manifest");
  });

  it("parses an empty manifest", async () => {
    respondWith(emptyManifest);

    await expect(fetchManifest()).resolves.toEqual(emptyManifest);
  });

  it("parses a manifest with a module and a contribution", async () => {
    const manifest = {
      ...emptyManifest,
      modules: [
        {
          id: "amibot_chat",
          name: "Chat",
          version: "0.1.0",
          permissions: [],
        },
      ],
      capabilities: [{ id: "chat.messages", module: "amibot_chat" }],
      ui: {
        slots: {
          "app.header": [
            {
              id: "new_conversation",
              module: "amibot_chat",
              component: "Button",
              order: 10,
              platforms: ["web", "ios"],
              permissions: [],
              props: { labelKey: "chat.newConversation" },
            },
          ],
        },
      },
    };
    respondWith(manifest);

    await expect(fetchManifest()).resolves.toEqual(manifest);
  });

  it("accepts contributions without a platforms field", async () => {
    const manifest = {
      ...emptyManifest,
      ui: {
        slots: {
          "app.main": [
            {
              id: "home",
              module: "amibot_chat",
              component: "Button",
              order: 0,
              permissions: [],
              props: {},
            },
          ],
        },
      },
    };
    respondWith(manifest);

    const parsed = await fetchManifest();

    expect(parsed.ui.slots["app.main"][0].platforms).toBeUndefined();
  });

  it("ignores unknown fields", async () => {
    respondWith({ ...emptyManifest, future_field: true });

    const parsed = await fetchManifest();

    expect("future_field" in parsed).toBe(false);
  });

  it("rejects a missing required field", async () => {
    const incomplete: Record<string, unknown> = { ...emptyManifest };
    delete incomplete.compatibility;
    respondWith(incomplete);

    await expect(fetchManifest()).rejects.toMatchObject({
      name: "ApiError",
      code: "invalid_manifest",
    });
  });

  it("rejects an unknown API version", async () => {
    respondWith({ ...emptyManifest, api_version: 2 });

    await expect(fetchManifest()).rejects.toBeInstanceOf(ApiError);
  });
});
