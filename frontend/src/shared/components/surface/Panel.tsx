import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { gradientStyle, shadowStyle } from "@/shared/theme/depthStyles";
import useTheme from "@/shared/theme/useTheme";

export type PanelProps = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Opaque raised content surface: hairline border, paper gradient, and one soft
 * elevation layer. Use it once per settings section, never nested.
 */
export default function Panel({ children, className, style }: PanelProps) {
  const { resolvedScheme } = useTheme();

  return (
    <View
      className={`rounded-2xl border border-border p-4 ${className || ""}`}
      style={[
        gradientStyle(resolvedScheme, "card"),
        shadowStyle(resolvedScheme, "raised"),
        style,
      ]}
    >
      {children}
    </View>
  );
}
