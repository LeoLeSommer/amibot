import { BlurView } from "expo-blur";
import { useContext, useEffect, type ReactNode, type RefObject } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { GlassTint, glassVariants, type GlassVariant } from "@/constants/theme";
import useAccessibilityPreferences from "@/shared/theme/useAccessibilityPreferences";
import useTheme from "@/shared/theme/useTheme";

import { GlassDepthContext } from "./glassDepthContext";

export type GlassSurfaceProps = {
  variant: GlassVariant;
  children?: ReactNode;
  blurTarget?: RefObject<View | null>;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  nativeID?: string;
};

/**
 * Glass chrome primitive. Reserved for navigation, floating toolbars, and
 * overlays; never use it for content cards, list rows, or inputs.
 */
export default function GlassSurface({
  variant,
  children,
  blurTarget,
  className,
  style,
  testID,
  nativeID,
}: GlassSurfaceProps) {
  const { colors, resolvedScheme } = useTheme();
  const { reduceTransparency } = useAccessibilityPreferences();
  const depth = useContext(GlassDepthContext);
  const tokens = glassVariants[variant];

  useEffect(() => {
    if (__DEV__ && depth > 0) {
      console.warn(
        "GlassSurface must not be nested inside another GlassSurface.",
      );
    }
  }, [depth]);

  const androidBlurProps =
    Platform.OS === "android"
      ? ({
          blurTarget,
          blurMethod: "dimezisBlurViewSdk31Plus",
        } as const)
      : {};

  return (
    <View
      testID={testID}
      nativeID={nativeID}
      className={className}
      style={[
        styles.outer,
        {
          borderRadius: tokens.radius,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: tokens.shadowOpacity[resolvedScheme],
          shadowRadius: tokens.shadowRadius,
          elevation: tokens.elevation,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { borderRadius: tokens.radius }]}>
        {reduceTransparency ? null : (
          <BlurView
            tint={GlassTint[resolvedScheme]}
            intensity={tokens.blurIntensity}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            {...androidBlurProps}
          />
        )}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.card,
              opacity: reduceTransparency
                ? 1
                : tokens.backgroundOpacity[resolvedScheme],
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderColor: colors.border,
              opacity: tokens.borderOpacity[resolvedScheme],
            },
            tokens.borderEdges === "all"
              ? { borderWidth: StyleSheet.hairlineWidth }
              : { borderBottomWidth: StyleSheet.hairlineWidth },
          ]}
        />
        <GlassDepthContext.Provider value={depth + 1}>
          {children}
        </GlassDepthContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "transparent",
  },
  inner: {
    overflow: "hidden",
  },
});
