import { Platform, type TextStyle, type ViewStyle } from "react-native";

import {
  depthShadows,
  gradients,
  type GradientName,
  type ShadowLevel,
  type ThemeScheme,
} from "@/constants/theme";

/**
 * Background gradient as a style. Web understands `backgroundImage`; native
 * uses the new-architecture equivalent. Both parse the same CSS string.
 */
export function gradientStyle(
  scheme: ThemeScheme,
  name: GradientName,
): ViewStyle {
  const value = gradients[scheme][name];

  if (Platform.OS === "web") {
    return { backgroundImage: value } as unknown as ViewStyle;
  }

  return { experimental_backgroundImage: value } as ViewStyle;
}

export function shadowStyle(
  scheme: ThemeScheme,
  level: ShadowLevel,
): ViewStyle {
  return { boxShadow: depthShadows[scheme][level] } as ViewStyle;
}

export function shadowTextStyle(
  scheme: ThemeScheme,
  level: ShadowLevel,
): TextStyle {
  return { boxShadow: depthShadows[scheme][level] } as TextStyle;
}
