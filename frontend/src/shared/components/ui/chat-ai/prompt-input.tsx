import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export type PromptInputMessage = {
  text: string;
};

type PromptContextType = {
  text: string;
  setText: (text: string) => void;
  handleSubmit: () => void;
  isDisabled: boolean;
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

  const value = useMemo(
    () => ({ text, setText, handleSubmit, isDisabled }),
    [text, handleSubmit, isDisabled],
  );

  return (
    <PromptContext.Provider value={value}>
      <Animated.View style={inputAnimatedStyle}>
        <View className="absolute bottom-4 left-4 right-4 rounded-3xl border border-border bg-muted px-3 py-2">
          {children}
        </View>
      </Animated.View>
    </PromptContext.Provider>
  );
};

export const PromptInputBody = ({ children }: { children: ReactNode }) => (
  <View className="flex-row items-center gap-2 pt-2">{children}</View>
);

export type PromptInputTextareaProps = Omit<
  TextInputProps,
  "value" | "onChangeText"
>;

export const PromptInputTextarea = ({
  placeholder = "Type a message",
  editable = true,
  ...props
}: PromptInputTextareaProps) => {
  const { text, setText } = usePrompt();

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      placeholder={placeholder}
      multiline
      editable={editable}
      className="flex-1 rounded-3xl px-4 text-base text-foreground placeholder:text-muted-foreground"
      {...props}
    />
  );
};

export const PromptInputFooter = ({ children }: { children: ReactNode }) => (
  <View className="mt-6 flex-row items-center justify-between">{children}</View>
);

export const PromptInputTools = ({ children }: { children: ReactNode }) => (
  <View className="flex-row items-center gap-2">{children}</View>
);

export const PromptInputButton = ({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="rounded-full bg-muted px-3 py-1"
  >
    <Text>{children}</Text>
  </TouchableOpacity>
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
      className={`mx-1 h-10 w-10 items-center justify-center rounded-full bg-primary ${
        isInactive ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className="text-primary-foreground">↑</Text>
      )}
    </Pressable>
  );
};
