import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import Canvas from "@/shared/components/surface/Canvas";
import { Button, ButtonText } from "@/shared/components/ui/button";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <Canvas className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-center text-2xl font-sans-bold text-foreground">
        {t("notFound.title")}
      </Text>
      <Text className="text-center text-base text-muted-foreground">
        {t("notFound.body")}
      </Text>
      <Button onPress={() => router.replace("/")}>
        <ButtonText>{t("notFound.back")}</ButtonText>
      </Button>
    </Canvas>
  );
}
