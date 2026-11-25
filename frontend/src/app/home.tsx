import { Redirect, router } from "expo-router";
import { Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Palette } from "@/constants/theme";
import ModuleSurface from "@/features/server/components/ModuleSurface";
import useManifest from "@/features/server/hooks/useManifest";
import useServerConfig from "@/features/server/hooks/useServerConfig";
import AppShell from "@/shared/components/appShell/AppShell";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { serverUrl, isLoading } = useServerConfig();
  const { data } = useManifest();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  if (!serverUrl) {
    return <Redirect href="/settings" />;
  }

  return (
    <AppShell
      title={data?.server.name ?? t("app.name")}
      rightActions={
        <Pressable
          testID="settings-open"
          nativeID="settings-open"
          accessibilityLabel={t("settings.open")}
          className="rounded-lg p-2"
          onPress={() => router.push("/settings")}
        >
          <Settings color={Palette.foreground} size={20} />
        </Pressable>
      }
    >
      <ModuleSurface />
    </AppShell>
  );
}
