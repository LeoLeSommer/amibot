import { DEFAULT_APPEARANCE_SETTINGS } from "@/constants/theme";
import { readText, writeText } from "@/lib/storage/deviceStorage";
import {
  APPEARANCE_STORAGE_KEY,
  loadAppearanceSettings,
  parseAppearanceSettings,
  saveAppearanceSettings,
} from "@/shared/theme/appearanceStorage";

jest.mock("@/lib/storage/deviceStorage", () => ({
  readText: jest.fn(),
  writeText: jest.fn(),
}));

const mockedReadText = jest.mocked(readText);
const mockedWriteText = jest.mocked(writeText);

describe("parseAppearanceSettings", () => {
  it("returns the defaults when nothing is stored", () => {
    expect(parseAppearanceSettings(null)).toEqual(DEFAULT_APPEARANCE_SETTINGS);
  });

  it("parses a stored theme and mode", () => {
    expect(parseAppearanceSettings('{"theme":"ocean","mode":"dark"}')).toEqual({
      theme: "ocean",
      mode: "dark",
    });
  });

  it("falls back to the defaults on corrupt JSON", () => {
    expect(parseAppearanceSettings("{not json")).toEqual(
      DEFAULT_APPEARANCE_SETTINGS,
    );
  });

  it("ignores JSON that is not an object", () => {
    expect(parseAppearanceSettings('"dark"')).toEqual(
      DEFAULT_APPEARANCE_SETTINGS,
    );
  });

  it("falls back per field for an unknown theme and an invalid mode", () => {
    expect(parseAppearanceSettings('{"theme":"neon","mode":"sepia"}')).toEqual(
      DEFAULT_APPEARANCE_SETTINGS,
    );
  });

  it("keeps a valid field while falling back on the other", () => {
    expect(
      parseAppearanceSettings('{"theme":"forest","mode":"sepia"}'),
    ).toEqual({ theme: "forest", mode: "system" });
    expect(parseAppearanceSettings('{"theme":"neon","mode":"light"}')).toEqual({
      theme: "default",
      mode: "light",
    });
  });
});

describe("loadAppearanceSettings", () => {
  it("reads the appearance key", async () => {
    mockedReadText.mockResolvedValueOnce('{"theme":"forest","mode":"light"}');

    await expect(loadAppearanceSettings()).resolves.toEqual({
      theme: "forest",
      mode: "light",
    });
    expect(mockedReadText).toHaveBeenCalledWith(APPEARANCE_STORAGE_KEY);
  });

  it("returns the defaults when the key is missing", async () => {
    mockedReadText.mockResolvedValueOnce(null);

    await expect(loadAppearanceSettings()).resolves.toEqual(
      DEFAULT_APPEARANCE_SETTINGS,
    );
  });
});

describe("saveAppearanceSettings", () => {
  it("writes the settings as JSON under the appearance key", () => {
    saveAppearanceSettings({ theme: "ocean", mode: "dark" });

    expect(mockedWriteText).toHaveBeenCalledWith(
      APPEARANCE_STORAGE_KEY,
      '{"theme":"ocean","mode":"dark"}',
    );
  });
});
