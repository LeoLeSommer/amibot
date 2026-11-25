import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Slot from "@/shared/components/slots/Slot";
import useTheme from "@/shared/theme/useTheme";

export type AppShellProps = {
  title: string;
  titleTestID?: string;
  children: ReactNode;
  rightActions?: ReactNode;
};

export default function AppShell({
  title,
  titleTestID,
  children,
  rightActions,
}: AppShellProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Text
          testID={titleTestID}
          nativeID={titleTestID}
          className="text-lg font-sans-semibold text-foreground"
        >
          {title}
        </Text>
        <View className="flex-1">
          <Slot name="app.header" />
        </View>
        {rightActions}
      </View>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
