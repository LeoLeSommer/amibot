import { useEffect } from "react";
import { type StyleProp, type TextStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { Motion } from "@/constants/theme";

export type PullUpWordProps = {
  children: string;
  index: number;
  style?: StyleProp<TextStyle>;
  enabled: boolean;
};

const STAGGER_MS = 16;
const MAX_STAGGER_STEPS = 5;
const ENTER_OFFSET = 8;

export default function PullUpWord({
  children,
  index,
  style,
  enabled,
}: PullUpWordProps) {
  const progress = useSharedValue(enabled ? 0 : 1);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    progress.value = withDelay(
      Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS,
      withTiming(1, {
        duration: Motion.base,
        easing: Easing.bezier(...Motion.ease),
      }),
    );
  }, [enabled, index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * ENTER_OFFSET }],
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>{children}</Animated.Text>
  );
}
