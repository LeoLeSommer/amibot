const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

// NativeWind inlines single-use CSS variables at build time. ThemeProvider
// overrides these tokens at runtime, so they must survive as var() lookups.
// Keep in sync with the token names in src/shared/theme/themeCssVariables.ts.
const themeVariables = [
  "--background",
  "--foreground",
  "--card",
  "--popover",
  "--popover-foreground",
  "--surface",
  "--surface-foreground",
  "--muted",
  "--muted-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
  "--ring",
  "--destructive",
];

module.exports = withNativewind(getDefaultConfig(__dirname), {
  inlineRem: 16,
  inlineVariables: {
    exclude: themeVariables,
  },
});
