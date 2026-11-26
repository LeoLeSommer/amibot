import { useCallback, useRef, useState, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Layout } from "@/constants/theme";
import GlassSurface from "@/shared/components/glass/GlassSurface";
import GlassTarget from "@/shared/components/glass/GlassTarget";
import Slot from "@/shared/components/slots/Slot";
import Canvas from "@/shared/components/surface/Canvas";
import { shadowStyle } from "@/shared/theme/depthStyles";
import useTheme from "@/shared/theme/useTheme";

import AppDrawer from "./AppDrawer";
import MenuButton from "./MenuButton";

export type AppShellProps = {
  title: string;
  titleTestID?: string;
  children: ReactNode;
  rightActions?: ReactNode;
  scrollable?: boolean;
  showMenu?: boolean;
  leading?: ReactNode;
  onNewConversation?: () => void;
  onOpenSettings?: () => void;
};

export default function AppShell({
  title,
  titleTestID,
  children,
  rightActions,
  scrollable = false,
  showMenu = true,
  leading,
  onNewConversation,
  onOpenSettings,
}: AppShellProps) {
  const { resolvedScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const targetRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((value) => !value);
  }, []);

  const handleNewConversation = useCallback(() => {
    setMenuOpen(false);
    onNewConversation?.();
  }, [onNewConversation]);

  const handleOpenSettings = useCallback(() => {
    setMenuOpen(false);
    onOpenSettings?.();
  }, [onOpenSettings]);

  const contentTop = insets.top + Layout.headerHeight;
  const horizontalInsets = {
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <Canvas className="flex-1">
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
      {showMenu ? (
        <AppDrawer
          open={menuOpen}
          onClose={closeMenu}
          onNewConversation={handleNewConversation}
          onOpenSettings={handleOpenSettings}
        />
      ) : null}
      <GlassSurface
        variant="navigation"
        blurTarget={targetRef}
        className="absolute left-0 right-0 top-0"
        style={[
          { paddingTop: insets.top, ...horizontalInsets },
          shadowStyle(resolvedScheme, "header"),
          { zIndex: 20 },
        ]}
      >
        <View
          className="flex-row items-center gap-3 px-4"
          style={{ height: Layout.headerHeight }}
        >
          {showMenu ? (
            <MenuButton open={menuOpen} onPress={toggleMenu} />
          ) : (
            leading
          )}
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
    </Canvas>
  );
}
