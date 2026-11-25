import { useRef, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Layout } from "@/constants/theme";
import GlassSurface from "@/shared/components/glass/GlassSurface";
import GlassTarget from "@/shared/components/glass/GlassTarget";
import Slot from "@/shared/components/slots/Slot";
import useTheme from "@/shared/theme/useTheme";

export type AppShellProps = {
  title: string;
  titleTestID?: string;
  children: ReactNode;
  rightActions?: ReactNode;
  scrollable?: boolean;
};

export default function AppShell({
  title,
  titleTestID,
  children,
  rightActions,
  scrollable = false,
}: AppShellProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const targetRef = useRef<View>(null);

  const contentTop = insets.top + Layout.headerHeight;
  const horizontalInsets = {
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <GlassTarget targetRef={targetRef} className="flex-1">
        {scrollable ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: contentTop,
              paddingBottom: insets.bottom,
              ...horizontalInsets,
            }}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            className="flex-1"
            style={{ paddingTop: contentTop, ...horizontalInsets }}
          >
            {children}
          </View>
        )}
      </GlassTarget>
      <GlassSurface
        variant="navigation"
        blurTarget={targetRef}
        className="absolute left-0 right-0 top-0"
        style={{ paddingTop: insets.top, ...horizontalInsets }}
      >
        <View
          className="flex-row items-center gap-3 px-4"
          style={{ height: Layout.headerHeight }}
        >
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
      </GlassSurface>
    </View>
  );
}
