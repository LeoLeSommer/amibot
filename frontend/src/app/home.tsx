import { Redirect, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator } from "react-native";

import ModuleSurface from "@/features/server/components/ModuleSurface";
import useManifest from "@/features/server/hooks/useManifest";
import useServerConfig from "@/features/server/hooks/useServerConfig";
import AppShell from "@/shared/components/appShell/AppShell";
import Canvas from "@/shared/components/surface/Canvas";
import { requestNewConversation } from "@/shared/events/newConversation";
import useTheme from "@/shared/theme/useTheme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { serverUrl, isLoading } = useServerConfig();
  const { data } = useManifest();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <Canvas className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Canvas>
    );
  }

  if (!serverUrl) {
    return <Redirect href="/settings" />;
  }

  return (
    <AppShell
      title={data?.server.name ?? t("app.name")}
      onNewConversation={requestNewConversation}
      onOpenSettings={() => router.push("/settings")}
    >
      <ModuleSurface />
    </AppShell>
  );
}
