import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function NoModulesState() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center gap-2 p-6">
      <Text
        testID="home-empty-title"
        nativeID="home-empty-title"
        className="text-center text-xl font-sans-semibold text-foreground"
      >
        {t("home.emptyTitle")}
      </Text>
      <Text className="text-center text-base text-muted-foreground">
        {t("home.emptyBody")}
      </Text>
    </View>
  );
}
