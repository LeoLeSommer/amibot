import { resolveColorScheme } from "@/shared/theme/resolveColorScheme";

describe("resolveColorScheme", () => {
  it("returns an explicit light mode regardless of the system scheme", () => {
    expect(resolveColorScheme("light", "dark")).toBe("light");
  });

  it("returns an explicit dark mode regardless of the system scheme", () => {
    expect(resolveColorScheme("dark", "light")).toBe("dark");
  });

  it("follows a dark system scheme in system mode", () => {
    expect(resolveColorScheme("system", "dark")).toBe("dark");
  });

  it.each(["light", null, undefined, "unspecified"])(
    "falls back to light for a %p system scheme",
    (scheme) => {
      expect(resolveColorScheme("system", scheme)).toBe("light");
    },
  );
});
