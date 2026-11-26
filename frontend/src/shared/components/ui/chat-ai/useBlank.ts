import { useAnimatedReaction } from "react-native-reanimated";

import { useBlankContext } from "./blank-context";
import { useMessageHeight } from "./useMessageHeight";

interface UseMessageBlankSizeOptions {
  disabled?: boolean;
}

export function useBlankSize({ disabled = false }: UseMessageBlankSizeOptions) {
  const context = useBlankContext();
  if (!context) {
    throw new Error("useMessageBlankSize must be used inside Chat");
  }

  const { ref, onLayout } = useMessageHeight();

  useAnimatedReaction(
    () => ({
      user: context.userMessageHeight.value,
      container: context.messagesContainerHeight.value,
      disabled,
    }),
    ({ user, container, disabled: isDisabled }) => {
      "worklet";

      if (isDisabled) {
        return;
      }

      context.blankSize.set(Math.max(0, container - user - 46));
    },
  );

  return { ref, onLayout };
}
