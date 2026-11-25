process.env.TZ = "Europe/Paris";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en" }],
}));
