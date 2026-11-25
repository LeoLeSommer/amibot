import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { Palette } from "@/constants/theme";
import useServerConfig from "@/features/server/hooks/useServerConfig";

export default function IndexScreen() {
  const { serverUrl, isLoading } = useServerConfig();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  return <Redirect href={serverUrl ? "/home" : "/settings"} />;
}
