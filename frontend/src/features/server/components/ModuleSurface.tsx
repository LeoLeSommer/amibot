import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, Text, View } from "react-native";

import { Palette } from "@/constants/theme";
import { slotCatalogue } from "@/shared/components/slots/catalogue";
import {
  renderableContributions,
  type SlotPlatform,
} from "@/shared/components/slots/contributions";
import Slot from "@/shared/components/slots/Slot";
import { Button, ButtonText } from "@/shared/components/ui/button";

import useManifest from "../hooks/useManifest";

import NoModulesState from "./NoModulesState";

function currentPlatform(): SlotPlatform {
  if (Platform.OS === "ios") {
    return "ios";
  }
  if (Platform.OS === "android") {
    return "android";
  }
  return "web";
}

export default function ModuleSurface() {
  const { t } = useTranslation();
  const { data, isError, isLoading, refetch } = useManifest();
  const platform = currentPlatform();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6">
        <Text className="text-center text-base text-destructive">
          {t("settings.status.error")}
        </Text>
        <Button onPress={() => void refetch()}>
          <ButtonText>{t("common.retry")}</ButtonText>
        </Button>
      </View>
    );
  }

  if (!data || data.modules.length === 0) {
    return <NoModulesState />;
  }

  const mainContributions = data.ui.slots["app.main"] ?? [];
  const catalogueKeys = new Set(Object.keys(slotCatalogue));
  if (
    renderableContributions(mainContributions, platform, catalogueKeys)
      .length === 0
  ) {
    return (
      <View className="flex-1 items-center justify-center gap-2 p-6">
        <Text className="text-center text-xl font-sans-semibold text-foreground">
          {t("home.noUiTitle")}
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          {t("home.noUiBody")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Slot name="app.main" />
    </View>
  );
}
