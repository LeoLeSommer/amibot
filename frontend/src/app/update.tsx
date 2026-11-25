import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Text, View } from "react-native";

import { Button, ButtonText } from "@/shared/components/ui/button";

export default function UpdateScreen() {
  const { t } = useTranslation();

  const leave = () => {
    if (Platform.OS === "web") {
      window.location.reload();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  };

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-center text-2xl font-sans-bold text-foreground">
        {t("update.title")}
      </Text>
      <Text className="text-center text-base text-muted-foreground">
        {t("update.body")}
      </Text>
      <Button testID="update-reload" nativeID="update-reload" onPress={leave}>
        <ButtonText>
          {Platform.OS === "web" ? t("update.reload") : t("update.back")}
        </ButtonText>
      </Button>
    </View>
  );
}
