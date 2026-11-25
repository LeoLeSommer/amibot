import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

const REDUCED_TRANSPARENCY_QUERY = "(prefers-reduced-transparency: reduce)";

function reducedTransparencyQuery(): MediaQueryList | null {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }

  return window.matchMedia(REDUCED_TRANSPARENCY_QUERY);
}

export default function useAccessibilityPreferences() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(
    () => reducedTransparencyQuery()?.matches ?? false,
  );

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const query = reducedTransparencyQuery();
      if (!query) {
        return;
      }

      const handleChange = (event: MediaQueryListEvent) => {
        setReduceTransparency(event.matches);
      };

      query.addEventListener("change", handleChange);

      return () => {
        query.removeEventListener("change", handleChange);
      };
    }

    if (Platform.OS !== "ios") {
      return;
    }

    let active = true;

    void AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      if (active) {
        setReduceTransparency(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return { reduceMotion, reduceTransparency };
}
