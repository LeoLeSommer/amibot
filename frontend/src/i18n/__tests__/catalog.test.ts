import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";

type Catalog = Record<string, unknown>;

function flatten(
  value: Catalog,
  prefix = "",
  result: Record<string, unknown> = {},
): Record<string, unknown> {
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      flatten(entry as Catalog, path, result);
    } else {
      result[path] = entry;
    }
  }
  return result;
}

function placeholders(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }
  return [...value.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
    .map((match) => match[1])
    .sort();
}

describe("locale catalogs", () => {
  const english = flatten(en);
  const french = flatten(fr);

  it("have identical key sets", () => {
    expect(Object.keys(french).sort()).toEqual(Object.keys(english).sort());
  });

  it("use the same interpolation placeholders per key", () => {
    for (const key of Object.keys(english)) {
      expect(placeholders(french[key])).toEqual(placeholders(english[key]));
    }
  });
});
