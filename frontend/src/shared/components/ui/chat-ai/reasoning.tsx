import { ChevronRight } from "lucide-react-native";
import React, { memo, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import useAccessibilityPreferences from "@/shared/theme/useAccessibilityPreferences";
import useTheme from "@/shared/theme/useTheme";

const TRANSITION_MS = 220;

export type MessageReasoningProps = {
  text: string;
  streaming?: boolean;
  label?: string;
  streamingLabel?: string;
  toggleLabel?: string;
  testID?: string;
  nativeID?: string;
};

/**
 * Collapsible plain-text panel for the model's reasoning. It stays collapsed
 * by default: while the part streams only a compact loader is shown, and the
 * raw reasoning is revealed on demand. The body height animates so expanding
 * and collapsing grow smoothly instead of jumping. Plain text keeps long
 * chains of thought cheap to render on every delta.
 */
export const MessageReasoning = memo(function MessageReasoning({
  text,
  streaming = false,
  label = "Reasoning",
  streamingLabel = "Reasoning in progress",
  toggleLabel = "Show or hide reasoning",
  testID,
  nativeID,
}: MessageReasoningProps) {
  const { colors } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const [open, setOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const progress = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) {
      opacity.set(withTiming(1, { duration: 180 }));
    }
  }, [opacity, reduceMotion]);

  useEffect(() => {
    const target = open ? 1 : 0;
    if (reduceMotion) {
      progress.set(target);
      return;
    }
    progress.set(withTiming(target, { duration: TRANSITION_MS }));
  }, [open, progress, reduceMotion]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const bodyStyle = useAnimatedStyle(
    () => ({
      height: contentHeight * progress.value,
      opacity: progress.value,
    }),
    [contentHeight],
  );

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 90}deg` }],
  }));

  return (
    <Animated.View
      testID={testID}
      nativeID={nativeID}
      style={fadeStyle}
      className="w-full rounded-md border border-border px-3 py-2"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={toggleLabel}
        accessibilityState={{ expanded: open, busy: streaming }}
        onPress={() => setOpen((value) => !value)}
        className="flex-row items-center gap-2"
      >
        {streaming ? (
          <ActivityIndicator size="small" color={colors.mutedForeground} />
        ) : null}
        <Text
          className="flex-1 text-xs"
          style={{ color: colors.mutedForeground }}
        >
          {streaming ? streamingLabel : label}
        </Text>
        <Animated.View style={chevronStyle}>
          <ChevronRight size={14} color={colors.mutedForeground} />
        </Animated.View>
      </Pressable>
      <Animated.View
        style={bodyStyle}
        className="overflow-hidden"
        pointerEvents={open ? "auto" : "none"}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      >
        <View
          className="pt-2"
          onLayout={(event) =>
            setContentHeight(event.nativeEvent.layout.height)
          }
        >
          <Text
            className="text-xs"
            style={{ color: colors.mutedForeground, lineHeight: 18 }}
          >
            {text}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
});
