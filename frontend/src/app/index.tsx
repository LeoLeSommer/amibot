import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import useServerConfig from "@/features/server/hooks/useServerConfig";
import useTheme from "@/shared/theme/useTheme";

export default function IndexScreen() {
  const { serverUrl, isLoading } = useServerConfig();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={serverUrl ? "/home" : "/settings"} />;
}
