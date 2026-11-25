import {
  clearServerUrl,
  loadServerUrl,
  saveServerUrl,
  SERVER_URL_STORAGE_KEY,
} from "@/features/server/services/serverConfig";
import { readText, writeText } from "@/lib/storage/deviceStorage";

jest.mock("@/lib/storage/deviceStorage", () => ({
  readText: jest.fn(),
  writeText: jest.fn(),
}));

const readMock = readText as jest.Mock;
const writeMock = writeText as jest.Mock;

describe("server config storage", () => {
  beforeEach(() => {
    readMock.mockReset();
    writeMock.mockReset();
  });

  it("uses a stable storage key", () => {
    expect(SERVER_URL_STORAGE_KEY).toBe("amibot.serverUrl");
  });

  it("reads the stored URL", async () => {
    readMock.mockResolvedValueOnce("http://localhost:3000");

    await expect(loadServerUrl()).resolves.toBe("http://localhost:3000");
    expect(readMock).toHaveBeenCalledWith("amibot.serverUrl");
  });

  it("returns null when nothing was stored", async () => {
    readMock.mockResolvedValueOnce(null);

    await expect(loadServerUrl()).resolves.toBeNull();
  });

  it("writes the normalized URL", () => {
    saveServerUrl("http://localhost:3000");

    expect(writeMock).toHaveBeenCalledWith(
      "amibot.serverUrl",
      "http://localhost:3000",
    );
  });

  it("writes the explicit disconnect sentinel", () => {
    clearServerUrl();

    expect(writeMock).toHaveBeenCalledWith("amibot.serverUrl", "");
  });
});
