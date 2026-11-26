import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";

import useServerConfig from "@/features/server/hooks/useServerConfig";
import Canvas from "@/shared/components/surface/Canvas";
import useTheme from "@/shared/theme/useTheme";

export default function IndexScreen() {
  const { serverUrl, isLoading } = useServerConfig();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <Canvas className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </Canvas>
    );
  }

  return <Redirect href={serverUrl ? "/home" : "/settings"} />;
}
