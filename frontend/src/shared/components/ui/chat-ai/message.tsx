import type { UIMessage } from "ai";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, {
  createContext,
  memo,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import Markdown from "react-native-markdown-display";
import Animated from "react-native-reanimated";

import { Fonts } from "@/constants/theme";
import useTheme from "@/shared/theme/useTheme";

import { useBlankSize } from "./useBlank";
import { useUserMessageAnimation } from "./userAnimation";

type MessageContextType = {
  role: UIMessage["role"];
  message?: UIMessage;
};

const MessageContext = createContext<MessageContextType | null>(null);

const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error(
      "MessageToolbar and other children must be used inside <Message>",
    );
  }
  return context;
};

const mergeRefs = <T,>(
  ...refs: (React.Ref<T> | null | undefined)[]
): React.RefCallback<T> => {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
};

export type MessageProps = {
  role: UIMessage["role"];
  children: React.ReactNode;
  className?: string;
  index: number;
  message: UIMessage;
};

export type MessageContentProps = {
  children: React.ReactNode;
  className?: string;
};

export const Message = memo(function Message({
  role,
  children,
  className,
  index,
  message,
}: MessageProps) {
  const isUserFirstMessage = index === 0;

  const {
    style: animationStyle,
    ref: animRef,
    onLayout: animOnLayout,
  } = useUserMessageAnimation({ disabled: !isUserFirstMessage });

  const { ref: blankRef, onLayout: blankOnLayout } = useBlankSize({
    disabled: !isUserFirstMessage,
  });

  const combinedRef = useMemo(
    () => mergeRefs(animRef, blankRef),
    [animRef, blankRef],
  );

  const contextValue = useMemo(() => ({ role, message }), [role, message]);

  if (role === "user") {
    return (
      <MessageContext.Provider value={contextValue}>
        <Animated.View
          ref={combinedRef}
          onLayout={(event) => {
            animOnLayout?.(event);
            blankOnLayout?.(event);
          }}
          style={animationStyle as ViewStyle}
          className={`group mt-4 flex w-full max-w-[95%] flex-col gap-2 ${className || ""}`}
        >
          {children}
        </Animated.View>
      </MessageContext.Provider>
    );
  }

  return (
    <MessageContext.Provider value={contextValue}>
      <Animated.View
        ref={blankRef}
        onLayout={blankOnLayout}
        className={`group flex w-full max-w-[95%] flex-col gap-2 ${className || ""}`}
      >
        {children}
      </Animated.View>
    </MessageContext.Provider>
  );
});

export const MessageContent = memo(function MessageContent({
  children,
  className,
}: MessageContentProps) {
  const { role } = useMessageContext();

  const roleStyles =
    role === "user" ? "self-end bg-muted max-w-[90%] px-4" : "self-start";

  return (
    <View
      className={`flex w-fit min-w-0 flex-col justify-center gap-2 overflow-hidden text-base py-3 rounded-3xl ${roleStyles} ${className || ""}`}
    >
      {children}
    </View>
  );
});

export type MessageResponseProps = {
  message: UIMessage;
  thinkingLabel?: string;
};

export const MessageResponse = memo(function MessageResponse({
  message,
  thinkingLabel = "Thinking...",
}: MessageResponseProps) {
  const { colors } = useTheme();

  const markdownStyle = useMemo(
    () =>
      ({
        body: { color: colors.foreground, fontSize: 15, lineHeight: 24 },
        text: { color: colors.foreground },
        heading1: {
          color: colors.foreground,
          fontFamily: Fonts.displayBold,
          fontSize: 22,
          lineHeight: 30,
          marginTop: 18,
          marginBottom: 8,
        },
        heading2: {
          color: colors.foreground,
          fontFamily: Fonts.displaySemibold,
          fontSize: 19,
          lineHeight: 26,
          marginTop: 16,
          marginBottom: 6,
        },
        heading3: {
          color: colors.foreground,
          fontFamily: Fonts.sansSemibold,
          fontSize: 17,
          lineHeight: 24,
          marginTop: 14,
          marginBottom: 6,
        },
        heading4: {
          color: colors.foreground,
          fontFamily: Fonts.sansSemibold,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 12,
          marginBottom: 4,
        },
        heading5: {
          color: colors.foreground,
          fontFamily: Fonts.sansSemibold,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 10,
          marginBottom: 4,
        },
        heading6: {
          color: colors.foreground,
          fontFamily: Fonts.sansSemibold,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 10,
          marginBottom: 4,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 8,
        },
        blockquote: {
          backgroundColor: colors.muted,
          borderLeftColor: colors.border,
          borderLeftWidth: 3,
          marginLeft: 0,
          marginVertical: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 6,
        },
        strong: { fontWeight: "700", color: colors.foreground },
        em: { fontStyle: "italic", color: colors.foreground },
        link: { color: colors.primary, textDecorationLine: "underline" },
        hr: {
          backgroundColor: colors.border,
          height: 1,
          marginVertical: 12,
        },
        table: {
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          marginVertical: 8,
        },
        thead: {},
        tbody: {},
        th: {
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
          backgroundColor: colors.muted,
          color: colors.foreground,
          fontFamily: Fonts.sansSemibold,
        },
        tr: {
          borderBottomWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
        },
        td: {
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
          color: colors.foreground,
        },
        code_inline: {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderRadius: 4,
          paddingHorizontal: 5,
          paddingVertical: 2,
          fontFamily: Platform.select({
            ios: "Courier",
            default: "monospace",
          }),
          color: colors.foreground,
        },
        code_block: {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderRadius: 8,
          padding: 12,
          fontFamily: Platform.select({
            ios: "Courier",
            default: "monospace",
          }),
          color: colors.foreground,
        },
        fence: {
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderRadius: 8,
          padding: 12,
          fontFamily: Platform.select({
            ios: "Courier",
            default: "monospace",
          }),
          color: colors.foreground,
        },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        list_item: {
          flexDirection: "row",
          alignItems: "flex-start",
          marginVertical: 2,
        },
        bullet_list_icon: {
          marginLeft: 0,
          marginRight: 8,
          color: colors.mutedForeground,
          fontSize: 15,
          lineHeight: 24,
        },
        bullet_list_content: { flex: 1 },
        ordered_list_icon: {
          marginLeft: 0,
          marginRight: 8,
          minWidth: 18,
          textAlign: "right",
          color: colors.mutedForeground,
          fontSize: 15,
          lineHeight: 24,
        },
        ordered_list_content: { flex: 1 },
      }) as const,
    [colors],
  );

  if (!message.parts) {
    return <Markdown style={markdownStyle}>{""}</Markdown>;
  }

  const hasText = message.parts.some((part) => part.type === "text");
  const hasFile = message.parts.some((part) => part.type === "file");

  if (!hasText && !hasFile) {
    return <Text className="text-muted-foreground">{thinkingLabel}</Text>;
  }

  return (
    <View className="gap-2">
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <Markdown key={index} style={markdownStyle}>
              {part.text || ""}
            </Markdown>
          );
        }

        if (part.type === "file") {
          const uri = part.url;

          if (!uri) {
            return null;
          }

          return (
            <Image
              key={index}
              source={{ uri }}
              className="mt-1.5 h-40 w-40 rounded-xl"
              resizeMode="cover"
            />
          );
        }

        return null;
      })}
    </View>
  );
});

export type MessageToolbarProps = {
  children: React.ReactNode;
  className?: string;
  message?: UIMessage;
};

export const MessageToolbar = memo(function MessageToolbar({
  children,
  className,
}: MessageToolbarProps) {
  const { role, message } = useMessageContext();

  const roleStyles = role === "user" ? "self-end" : "self-start";
  const hasText = message?.parts?.some(
    (part) => part.type === "text" && part.text.length > 0,
  );

  if (!hasText) {
    return null;
  }

  if (role === "user") {
    return null;
  }

  return (
    <View
      className={`-mt-4 ml-2 flex-row items-center gap-3 ${roleStyles} ${className || ""}`}
    >
      {children}
    </View>
  );
});

export const MessageAction = ({
  onPress,
  tooltip,
  children,
}: {
  onPress?: () => void;
  tooltip?: string;
  children: React.ReactNode;
}) => {
  const handlePress = () => {
    if (tooltip) {
      Alert.alert(tooltip);
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="h-8 w-8 items-center justify-center"
    >
      {children}
    </TouchableOpacity>
  );
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: React.ReactElement[];
  setBranches: (branches: React.ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null,
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);
  if (!context) {
    throw new Error(
      "MessageBranch components must be used within <MessageBranch>",
    );
  }
  return context;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  children,
  className,
}: {
  defaultBranch?: number;
  onBranchChange?: (index: number) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<React.ReactElement[]>([]);

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch);
    onBranchChange?.(newBranch);
  };

  const goToPrevious = () => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  };

  const goToNext = () => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  };

  const contextValue: MessageBranchContextType = {
    branches,
    currentBranch,
    goToNext,
    goToPrevious,
    setBranches,
    totalBranches: branches.length,
  };

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <View className={`w-full gap-2 ${className || ""}`}>{children}</View>
    </MessageBranchContext.Provider>
  );
};

export const MessageBranchContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { currentBranch, branches, setBranches } = useMessageBranch();
  const childrenArray = React.Children.toArray(
    children,
  ) as React.ReactElement[];

  React.useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches.length, setBranches]);

  return childrenArray.map((branch, index) => (
    <View
      key={branch.key || index}
      className={index === currentBranch ? "flex" : "hidden"}
    >
      {branch}
    </View>
  ));
};

export const MessageBranchSelector = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { totalBranches } = useMessageBranch();
  if (totalBranches <= 1) {
    return null;
  }
  return <View className="flex-row items-center gap-2">{children}</View>;
};

export const MessageBranchPrevious = () => {
  const { goToPrevious } = useMessageBranch();
  return (
    <TouchableOpacity
      onPress={goToPrevious}
      className="h-8 w-8 items-center justify-center"
    >
      <ChevronLeft size={18} className="text-muted-foreground" />
    </TouchableOpacity>
  );
};

export const MessageBranchNext = () => {
  const { goToNext } = useMessageBranch();
  return (
    <TouchableOpacity
      onPress={goToNext}
      className="h-8 w-8 items-center justify-center"
    >
      <ChevronRight size={18} className="text-muted-foreground" />
    </TouchableOpacity>
  );
};

export const MessageBranchPage = () => {
  const { currentBranch, totalBranches } = useMessageBranch();
  return (
    <Text className="text-sm text-muted-foreground">
      {currentBranch + 1} of {totalBranches}
    </Text>
  );
};
