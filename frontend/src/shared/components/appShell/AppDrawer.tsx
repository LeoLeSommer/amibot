import { MessageSquarePlus, Settings } from "lucide-react-native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Layout, Motion } from "@/constants/theme";
import { Button, ButtonText } from "@/shared/components/ui/button";
import { shadowStyle } from "@/shared/theme/depthStyles";
import useAccessibilityPreferences from "@/shared/theme/useAccessibilityPreferences";
import useTheme from "@/shared/theme/useTheme";

export type AppDrawerProps = {
  open: boolean;
  onClose: () => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
};

const PANEL_WIDTH_RATIO = 0.84;
const PANEL_MAX_WIDTH = 360;
const SCRIM_OPACITY = 0.4;

export default function AppDrawer({
  open,
  onClose,
  onNewConversation,
  onOpenSettings,
}: AppDrawerProps) {
  const { t } = useTranslation();
  const { colors, resolvedScheme } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(open ? 1 : 0);

  const panelWidth = Math.min(width * PANEL_WIDTH_RATIO, PANEL_MAX_WIDTH);
  const drawerTop = insets.top + Layout.headerHeight;
  const duration = reduceMotion ? 0 : Motion.slow;

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration,
      easing: Easing.bezier(...Motion.ease),
    });
  }, [duration, open, progress]);

  useEffect(() => {
    if (!open || Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      },
    );

    return () => subscription.remove();
  }, [onClose, open]);

  useEffect(() => {
    if (!open || Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(1 - progress.value) * panelWidth }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: progress.value * SCRIM_OPACITY,
  }));

  return (
    <View
      pointerEvents={open ? "auto" : "none"}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      style={[StyleSheet.absoluteFill, { top: drawerTop, zIndex: 10 }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.foreground },
          scrimStyle,
        ]}
      />
      <Pressable
        testID="app-drawer-scrim"
        nativeID="app-drawer-scrim"
        accessibilityRole="button"
        accessibilityLabel={t("menu.close")}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        testID="app-drawer"
        nativeID="app-drawer"
        accessibilityViewIsModal
        style={[
          styles.panel,
          panelStyle,
          {
            width: panelWidth,
            backgroundColor: colors.card,
            borderRightColor: colors.border,
          },
          shadowStyle(resolvedScheme, "overlay"),
        ]}
      >
        <View
          className="flex-1"
          style={{ paddingLeft: insets.left, paddingRight: insets.right }}
        >
          <View className="flex-1 gap-1 px-3 pt-3">
            <Button
              testID="drawer-new-conversation"
              nativeID="drawer-new-conversation"
              variant="ghost"
              className="h-14 w-full flex-row items-center justify-start gap-3 px-3"
              onPress={onNewConversation}
            >
              <MessageSquarePlus color={colors.foreground} size={20} />
              <ButtonText className="text-base">
                {t("menu.newConversation")}
              </ButtonText>
            </Button>
          </View>
          <View
            className="flex-row items-center justify-between gap-2 border-t border-border px-3 pt-2"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            <Button
              testID="drawer-connect"
              nativeID="drawer-connect"
              variant="ghost"
              isDisabled
              className="h-11 justify-start px-3"
            >
              <ButtonText>{t("settings.connect")}</ButtonText>
            </Button>
            <Button
              testID="settings-open"
              nativeID="settings-open"
              variant="ghost"
              size="icon"
              accessibilityLabel={t("settings.open")}
              className="h-11 w-11"
              onPress={onOpenSettings}
            >
              <Settings color={colors.foreground} size={20} />
            </Button>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
