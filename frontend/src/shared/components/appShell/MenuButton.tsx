import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Motion } from "@/constants/theme";
import useAccessibilityPreferences from "@/shared/theme/useAccessibilityPreferences";
import useTheme from "@/shared/theme/useTheme";

export type MenuButtonProps = {
  open: boolean;
  onPress: () => void;
};

export default function MenuButton({ open, onPress }: MenuButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: reduceMotion ? 0 : Motion.base,
      easing: Easing.bezier(...Motion.ease),
    });
  }, [open, progress, reduceMotion]);

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * 6 },
      { rotate: `${progress.value * 45}deg` },
    ],
  }));

  const middleStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ scaleX: 1 - progress.value }],
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * -6 },
      { rotate: `${progress.value * -45}deg` },
    ],
  }));

  return (
    <Pressable
      testID="menu-toggle"
      nativeID="menu-toggle"
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={open ? t("menu.close") : t("menu.open")}
      hitSlop={8}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-md active:bg-accent web:hover:bg-accent"
    >
      <View style={styles.frame}>
        <Animated.View
          style={[
            styles.line,
            styles.top,
            { backgroundColor: colors.foreground },
            topStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.line,
            styles.middle,
            { backgroundColor: colors.foreground },
            middleStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.line,
            styles.bottom,
            { backgroundColor: colors.foreground },
            bottomStyle,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 20,
    height: 14,
  },
  line: {
    position: "absolute",
    left: 0,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  top: {
    top: 0,
  },
  middle: {
    top: 6,
  },
  bottom: {
    top: 12,
  },
});
