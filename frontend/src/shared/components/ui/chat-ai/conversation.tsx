import { AnimatedLegendList } from "@legendapp/list/reanimated";
import type { UIMessage } from "ai";
import { ArrowDown, Download } from "lucide-react-native";
import React, { useCallback, type ReactElement } from "react";
import {
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { BlankProvider, useBlankContext } from "./blank-context";
import { Message, MessageContent, MessageResponse } from "./message";

export type ConversationProps = React.PropsWithChildren<{
  className?: string;
}>;

export const Conversation = ({ children, className }: ConversationProps) => (
  <BlankProvider>
    <View className={`flex-1 bg-background px-4 ${className || ""}`}>
      {children}
    </View>
  </BlankProvider>
);

export type ConversationEmptyStateProps = {
  title?: string;
  description?: string;
  icon?: ReactElement;
  className?: string;
  testID?: string;
  nativeID?: string;
};

export const ConversationEmptyState = ({
  title = "Start a conversation",
  description = "Type a message below to begin chatting",
  icon,
  className,
  testID,
  nativeID,
}: ConversationEmptyStateProps) => (
  <View className={`flex-1 items-center justify-center ${className || ""}`}>
    <Text
      testID={testID}
      nativeID={nativeID}
      className="mt-4 text-3xl font-semibold text-foreground"
    >
      {title}
    </Text>
    <Text className="mt-2 text-center text-base text-muted-foreground">
      {description}
    </Text>
    {icon}
  </View>
);

export type ConversationRenderItem = (info: {
  item: UIMessage;
  index: number;
}) => React.ReactElement | null;

export type ConversationContentProps = {
  messages: UIMessage[];
  renderItem?: ConversationRenderItem;
  estimatedItemSize?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export const ConversationContent = ({
  messages,
  renderItem,
  estimatedItemSize = 140,
  contentContainerStyle,
}: ConversationContentProps) => {
  const defaultRenderItem: ConversationRenderItem = useCallback(
    ({ item: message, index }) => (
      <Message role={message.role} index={index} message={message}>
        <MessageContent>
          <MessageResponse message={message} />
        </MessageContent>
      </Message>
    ),
    [],
  );

  const { blankSize, messagesContainerHeight } = useBlankContext();

  return (
    <View
      className="flex-1"
      onLayout={(event) => {
        messagesContainerHeight.set(event.nativeEvent.layout.height);
      }}
    >
      {messages.length === 0 ? (
        <ConversationEmptyState />
      ) : (
        <AnimatedLegendList
          data={messages}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          renderItem={renderItem || defaultRenderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={estimatedItemSize}
          maintainScrollAtEnd
          contentContainerStyle={
            contentContainerStyle ?? {
              paddingBottom: blankSize.value,
            }
          }
        />
      )}
    </View>
  );
};

export const ConversationScrollButton = () => (
  <TouchableOpacity className="absolute bottom-6 left-1/2 h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-primary shadow-lg">
    <ArrowDown size={22} className="text-primary-foreground" />
  </TouchableOpacity>
);

export type ConversationDownloadProps = { messages: UIMessage[] };

export const ConversationDownload = ({
  messages,
}: ConversationDownloadProps) => {
  const handleDownload = useCallback(() => {
    Alert.alert("Download", `Markdown ready (${messages.length} messages)`);
  }, [messages.length]);

  return (
    <TouchableOpacity
      onPress={handleDownload}
      className="absolute right-4 top-4 rounded-2xl bg-card p-3 shadow-sm"
    >
      <Download size={20} className="text-muted-foreground" />
    </TouchableOpacity>
  );
};
