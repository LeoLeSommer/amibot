import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Palette } from "@/constants/theme";
import ServerSettingsForm from "@/features/server/components/ServerSettingsForm";
import ServerStatus from "@/features/server/components/ServerStatus";
import useServerConfig from "@/features/server/hooks/useServerConfig";
import AppShell from "@/shared/components/appShell/AppShell";
import Slot from "@/shared/components/slots/Slot";
import { Button } from "@/shared/components/ui/button";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { serverUrl } = useServerConfig();

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
            <ChevronLeft color={Palette.foreground} size={20} />
          </Button>
        ) : null
      }
    >
      <View className="gap-6 p-4">
        <ServerSettingsForm />
        <ServerStatus />
        <Slot name="app.settings" />
      </View>
    </AppShell>
  );
}
