import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import ServerSettingsForm from "@/features/server/components/ServerSettingsForm";
import ServerStatus from "@/features/server/components/ServerStatus";
import useServerConfig from "@/features/server/hooks/useServerConfig";
import AppShell from "@/shared/components/appShell/AppShell";
import AppearanceSettings from "@/shared/components/settings/AppearanceSettings";
import Slot from "@/shared/components/slots/Slot";
import { Button } from "@/shared/components/ui/button";
import useTheme from "@/shared/theme/useTheme";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { serverUrl } = useServerConfig();
  const { colors } = useTheme();

  return (
    <AppShell
      title={t("settings.title")}
      titleTestID="settings-title"
      rightActions={
        serverUrl ? (
          <Button
            testID="settings-back"
            nativeID="settings-back"
            variant="ghost"
            size="icon"
            accessibilityLabel={t("common.back")}
            onPress={() => router.replace("/home")}
          >
            <ChevronLeft color={colors.foreground} size={20} />
          </Button>
        ) : null
      }
    >
      <View className="gap-6 p-4">
        <View className="gap-3">
          <Text className="text-base font-sans-semibold text-foreground">
            {t("settings.server.title")}
          </Text>
          <ServerSettingsForm />
          <ServerStatus />
        </View>
        <AppearanceSettings />
        <Slot name="app.settings" />
      </View>
    </AppShell>
  );
}
