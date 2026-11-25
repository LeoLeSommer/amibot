import { getLocales } from "expo-localization";
import i18next, { use as i18nextUse } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const supportedLanguages = ["en", "fr"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export function detectLanguage(): SupportedLanguage {
  // E2E runs pin the locale so label-based Maestro selectors stay stable
  // regardless of the device language. An empty override is ignored.
  const override = process.env.EXPO_PUBLIC_APP_LOCALE;
  const code = override || getLocales()[0]?.languageCode;
  return supportedLanguages.includes(code as SupportedLanguage)
    ? (code as SupportedLanguage)
    : "en";
}

i18nextUse(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: detectLanguage(),
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
});

export default i18next;
