import { ArrowUp } from "lucide-react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextInputProps,
} from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import useTheme from "@/shared/theme/useTheme";

export type PromptInputMessage = {
  text: string;
};

type PromptContextType = {
  text: string;
  setText: (text: string) => void;
  handleSubmit: () => void;
  isDisabled: boolean;
  isFocused: boolean;
  setFocused: (focused: boolean) => void;
};

const PromptContext = createContext<PromptContextType | null>(null);

const usePrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("Must be inside PromptInput");
  }
  return context;
};

export const PromptInputProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

export const PromptInput = ({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit?: (message: PromptInputMessage) => void;
}) => {
  const [text, setText] = useState("");
  const [isFocused, setFocused] = useState(false);
  const { colors } = useTheme();

  const handleSubmit = useCallback(() => {
    if (!text.trim()) {
      return;
    }
    onSubmit?.({ text });
    setText("");
  }, [onSubmit, text]);

  const isDisabled = !text.trim();

  const { height } = useReanimatedKeyboardAnimation();
  const inputAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: height.value }],
    }),
    [height],
  );

  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: 180 });
  }, [focusProgress, isFocused]);

  const composerAnimatedStyle = useAnimatedStyle(
    () => ({
      borderColor: interpolateColor(
        focusProgress.value,
        [0, 1],
        [colors.border, colors.primary],
      ),
    }),
    [colors.border, colors.primary, focusProgress],
  );

  const value = useMemo(
    () => ({
      isDisabled,
      isFocused,
      setFocused,
      handleSubmit,
      setText,
      text,
    }),
    [handleSubmit, isDisabled, isFocused, text],
  );

  return (
    <PromptContext.Provider value={value}>
      <Animated.View style={inputAnimatedStyle}>
        <Animated.View
          style={composerAnimatedStyle}
          className="absolute bottom-4 left-4 right-4 rounded-3xl border bg-card px-2 py-2"
        >
          {children}
        </Animated.View>
      </Animated.View>
    </PromptContext.Provider>
  );
};

export const PromptInputBody = ({ children }: { children: ReactNode }) => (
  <View className="flex-col gap-1">{children}</View>
);

export type PromptInputTextareaProps = Omit<
  TextInputProps,
  "value" | "onChangeText"
>;

type WebKeyPressEvent = NativeSyntheticEvent<
  TextInputKeyPressEventData & {
    shiftKey?: boolean;
    isComposing?: boolean;
  }
>;

export const PromptInputTextarea = ({
  placeholder = "Type a message",
  editable = true,
  onKeyPress,
  onFocus,
  onBlur,
  ...props
}: PromptInputTextareaProps) => {
  const { text, setText, handleSubmit, setFocused } = usePrompt();

  const handleKeyPress = (event: WebKeyPressEvent) => {
    onKeyPress?.(event);

    if (Platform.OS !== "web") {
      return;
    }

    const nativeEvent = event.nativeEvent;

    if (nativeEvent.isComposing) {
      return;
    }

    if (nativeEvent.key === "Enter" && !nativeEvent.shiftKey) {
      event.preventDefault?.();
      handleSubmit();
    }
  };

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onKeyPress={handleKeyPress}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      placeholder={placeholder}
      multiline
      editable={editable}
      textAlignVertical="top"
      className="max-h-40 min-h-11 w-full px-2 py-1.5 text-base text-foreground outline-none placeholder:text-muted-foreground"
      {...props}
    />
  );
};

export const PromptInputFooter = ({ children }: { children: ReactNode }) => (
  <View className="flex-row items-center justify-between gap-2">
    {children}
  </View>
);

export const PromptInputTools = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <View className={`flex-row items-center gap-1 ${className || ""}`}>
    {children}
  </View>
);

export type PromptInputIconButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  nativeID?: string;
};

export const PromptInputIconButton = ({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  testID,
  nativeID,
}: PromptInputIconButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled }}
    testID={testID}
    nativeID={nativeID}
    className={`h-10 w-10 items-center justify-center rounded-full ${
      disabled ? "opacity-40" : "active:bg-accent"
    }`}
  >
    {children}
  </Pressable>
);

export type PromptInputSubmitProps = {
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  nativeID?: string;
};

export const PromptInputSubmit = ({
  disabled = false,
  loading = false,
  accessibilityLabel,
  testID,
  nativeID,
}: PromptInputSubmitProps) => {
  const { handleSubmit, isDisabled } = usePrompt();
  const isInactive = disabled || isDisabled || loading;

  return (
    <Pressable
      onPress={handleSubmit}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      nativeID={nativeID}
      className={`h-10 w-10 items-center justify-center rounded-full bg-primary ${
        isInactive ? "opacity-40" : "active:opacity-90"
      }`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <ArrowUp size={20} className="text-primary-foreground" />
      )}
    </Pressable>
  );
};
