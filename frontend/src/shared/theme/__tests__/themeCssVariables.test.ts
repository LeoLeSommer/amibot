import { themeNames, themePalettes, type ThemeScheme } from "@/constants/theme";
import {
  hexToRgbTriplet,
  themeCssVariables,
} from "@/shared/theme/themeCssVariables";

const expectedVariables = [
  "--accent",
  "--accent-foreground",
  "--background",
  "--border",
  "--card",
  "--destructive",
  "--foreground",
  "--input",
  "--muted",
  "--muted-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--ring",
  "--secondary",
  "--secondary-foreground",
  "--surface",
  "--surface-foreground",
];

const schemes: ThemeScheme[] = ["light", "dark"];

describe("hexToRgbTriplet", () => {
  it("converts six-digit hex colors to space-separated triplets", () => {
    expect(hexToRgbTriplet("#4F46E5")).toBe("79 70 229");
    expect(hexToRgbTriplet("#FFFFFF")).toBe("255 255 255");
    expect(hexToRgbTriplet("#0B1220")).toBe("11 18 32");
  });

  it("rejects anything that is not a six-digit hex color", () => {
    expect(() => hexToRgbTriplet("#FFF")).toThrow();
    expect(() => hexToRgbTriplet("4F46E5")).toThrow();
    expect(() => hexToRgbTriplet("#GGGGGG")).toThrow();
  });
});

describe("themeCssVariables", () => {
  it("produces every CSS variable for every palette entry", () => {
    for (const theme of themeNames) {
      for (const scheme of schemes) {
        const variables = themeCssVariables(themePalettes[theme][scheme]);

        expect(Object.keys(variables).sort()).toEqual(expectedVariables);
        for (const value of Object.values(variables)) {
          expect(value).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
        }
      }
    }
  });

  it("maps semantic tokens to their CSS variable names", () => {
    const variables = themeCssVariables(themePalettes.default.light);

    expect(variables["--primary"]).toBe("79 70 229");
    expect(variables["--background"]).toBe("248 250 252");
    expect(variables["--muted-foreground"]).toBe("100 116 139");
  });
});
