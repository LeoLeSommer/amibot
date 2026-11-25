import { BlurTargetView } from "expo-blur";
import type { ReactNode, RefObject } from "react";
import type { StyleProp, View, ViewStyle } from "react-native";

export type GlassTargetProps = {
  children: ReactNode;
  targetRef: RefObject<View | null>;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Content area that Android `BlurView` samples. Wrap the scrolling or dynamic
 * content, never the glass surface itself.
 */
export default function GlassTarget({
  children,
  targetRef,
  className,
  style,
}: GlassTargetProps) {
  return (
    <BlurTargetView ref={targetRef} className={className} style={style}>
      {children}
    </BlurTargetView>
  );
}
