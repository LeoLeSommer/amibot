// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const boundaries = require("eslint-plugin-boundaries");
const checkFile = require("eslint-plugin-check-file");
const react = require("eslint-plugin-react");
const globals = require("globals");

const BOUNDARIES_ELEMENTS = [
  { type: "app", pattern: "src/app" },
  { type: "feature", pattern: "src/features/*", capture: ["name"] },
  { type: "shared", pattern: "src/shared" },
  { type: "lib", pattern: "src/lib" },
  { type: "i18n", pattern: "src/i18n" },
  { type: "constants", pattern: "src/constants" },
];

const BOUNDARIES_POLICIES = [
  {
    from: { element: { type: "app" } },
    allow: {
      to: {
        element: {
          types: ["app", "feature", "shared", "lib", "i18n", "constants"],
        },
      },
    },
  },
  {
    from: { element: { type: "feature" } },
    allow: {
      to: {
        element: {
          types: ["shared", "lib", "i18n", "constants"],
        },
      },
    },
  },
  {
    from: { element: { type: "feature" } },
    allow: {
      to: {
        element: {
          type: "feature",
          captured: { name: "{{ from.element.captured.name }}" },
        },
      },
    },
  },
  {
    from: { element: { type: "shared" } },
    allow: {
      to: { element: { types: ["shared", "lib", "i18n", "constants"] } },
    },
  },
  {
    from: { element: { type: "lib" } },
    allow: {
      to: { element: { types: ["lib", "i18n", "constants"] } },
    },
  },
];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["src/**/*.tsx"],
    ignores: ["src/shared/components/ui/**"],
    plugins: { react },
    rules: {
      "react/no-multi-comp": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/app/**",
      "src/features/*/provider.tsx",
      "src/shared/components/ui/**",
      "src/**/*.types.ts",
    ],
    plugins: { "check-file": checkFile },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{jsx,tsx}": "PASCAL_CASE",
          "**/*.{js,ts}": "CAMEL_CASE",
        },
        { ignoreMiddleExtensions: true },
      ],
    },
  },
  {
    files: [
      "src/**/__tests__/**/*.{ts,tsx}",
      "__tests__/**/*.{ts,tsx}",
      "test/**/*.{ts,tsx}",
    ],
    languageOptions: { globals: globals.jest },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": BOUNDARIES_ELEMENTS,
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        { default: "disallow", policies: BOUNDARIES_POLICIES },
      ],
    },
  },
]);
