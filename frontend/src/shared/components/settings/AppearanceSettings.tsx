import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { colorModes, themeNames, type ColorMode } from "@/constants/theme";
import { Button, ButtonText } from "@/shared/components/ui/button";
import useTheme from "@/shared/theme/useTheme";

const modeOptionTestIDs: Record<ColorMode, string> = {
  system: "mode-option-auto",
  light: "mode-option-light",
  dark: "mode-option-dark",
};

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const { theme, mode, setTheme, setMode } = useTheme();

  return (
    <View
      testID="appearance-settings"
      nativeID="appearance-settings"
      className="gap-4"
    >
      <Text className="text-base font-sans-semibold text-foreground">
        {t("settings.appearance.title")}
      </Text>

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">
          {t("settings.appearance.themeLabel")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {themeNames.map((name) => {
            const selected = name === theme;
            const testID = `theme-option-${name}`;

            return (
              <Button
                key={name}
                testID={testID}
                nativeID={testID}
                variant={selected ? "default" : "outline"}
                size="sm"
                accessibilityState={{ selected }}
                onPress={() => setTheme(name)}
              >
                <ButtonText>
                  {t(`settings.appearance.themes.${name}`)}
                </ButtonText>
              </Button>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">
          {t("settings.appearance.modeLabel")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {colorModes.map((name) => {
            const selected = name === mode;
            const testID = modeOptionTestIDs[name];

            return (
              <Button
                key={name}
                testID={testID}
                nativeID={testID}
                variant={selected ? "default" : "outline"}
                size="sm"
                accessibilityState={{ selected }}
                onPress={() => setMode(name)}
              >
                <ButtonText>
                  {t(`settings.appearance.modes.${name}`)}
                </ButtonText>
              </Button>
            );
          })}
        </View>
      </View>
    </View>
  );
}
