import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import useManifest from "../hooks/useManifest";
import useServerConfig from "../hooks/useServerConfig";

export default function ServerStatus() {
  const { t } = useTranslation();
  const { serverUrl } = useServerConfig();
  const { data, isError, isLoading } = useManifest();

  return (
    <View
      testID="server-status"
      nativeID="server-status"
      className="gap-1 rounded-lg border border-border bg-card p-4"
    >
      {!serverUrl ? (
        <Text className="text-sm text-muted-foreground">
          {t("settings.status.notConnected")}
        </Text>
      ) : null}

      {serverUrl && isLoading ? (
        <Text className="text-sm text-muted-foreground">
          {t("settings.status.loading")}
        </Text>
      ) : null}

      {serverUrl && isError ? (
        <Text className="text-sm text-destructive">
          {t("settings.status.error")}
        </Text>
      ) : null}

      {data ? (
        <>
          <Text className="text-sm font-sans-medium text-foreground">
            {t("settings.status.name", { name: data.server.name })}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {t("settings.status.coreVersion", { version: data.core.version })}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {t("settings.status.modules", { count: data.modules.length })}
          </Text>
        </>
      ) : null}
    </View>
  );
}
