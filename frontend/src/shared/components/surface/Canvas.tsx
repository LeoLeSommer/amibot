import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { gradientStyle } from "@/shared/theme/depthStyles";
import useTheme from "@/shared/theme/useTheme";

export type CanvasProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Full-screen page canvas. Paints the opaque theme background first, then the
 * neutral gradient, so a screen never reveals the navigator's default surface.
 */
export default function Canvas({ children, className, style }: CanvasProps) {
  const { colors, resolvedScheme } = useTheme();

  return (
    <View
      className={className}
      style={[
        { backgroundColor: colors.background },
        gradientStyle(resolvedScheme, "canvas"),
        style,
      ]}
    >
      {children}
    </View>
  );
}
