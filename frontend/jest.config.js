module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}",
    "<rootDir>/__tests__/**/*.test.{ts,tsx}",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|native-base|react-native-svg|@gluestack-ui/.*|nativewind|react-native-css))",
  ],
  collectCoverageFrom: [
    "src/lib/api/{errors,serverUrl,clientInfo,clientInterceptors,manifest}.ts",
    "src/features/**/services/**/*.ts",
    "src/features/**/schema.ts",
    "src/shared/components/slots/{contributions,catalogue}.ts",
    "!src/**/*.types.ts",
    "!src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/", "/test/"],
  clearMocks: true,
  restoreMocks: true,
};
