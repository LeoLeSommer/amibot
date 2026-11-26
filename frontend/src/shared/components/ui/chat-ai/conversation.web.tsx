import type { UIMessage } from "ai";
import { ArrowDown, Download, MessageSquare } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  type FlatListProps,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { BlankProvider, useBlankContext } from "./blank-context";
import { Message, MessageContent, MessageResponse } from "./message";

export type ConversationProps = React.PropsWithChildren<{
  className?: string;
}>;

export const Conversation = ({ children, className }: ConversationProps) => (
  <BlankProvider>
    <View className={`flex-1 bg-background ${className || ""}`}>
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
  <View
    className={`flex-1 items-center justify-center px-10 py-12 ${className || ""}`}
  >
    {icon ?? <MessageSquare size={48} className="text-muted-foreground" />}
    <Text
      testID={testID}
      nativeID={nativeID}
      className="mt-4 text-xl font-semibold text-foreground"
    >
      {title}
    </Text>
    <Text className="mt-2 text-center text-base text-muted-foreground">
      {description}
    </Text>
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
} & Omit<FlatListProps<UIMessage>, "data" | "renderItem">;

export const ConversationContent = ({
  messages,
  renderItem,
  contentContainerStyle,
  ...flatListProps
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

  const listRef = useRef<FlatList<UIMessage>>(null);
  const isFollowingEnd = useRef(true);
  const lastOffset = useRef(0);
  const hasFollowedOnce = useRef(false);

  const scrollToEnd = useCallback(() => {
    if (!isFollowingEnd.current) {
      return;
    }

    const animated = hasFollowedOnce.current;
    hasFollowedOnce.current = true;

    listRef.current?.scrollToOffset({
      animated,
      offset: Number.MAX_SAFE_INTEGER,
    });
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const offset = contentOffset.y;
      const distanceFromEnd =
        contentSize.height - layoutMeasurement.height - offset;

      if (offset < lastOffset.current - 1) {
        isFollowingEnd.current = false;
        listRef.current?.scrollToOffset({ animated: false, offset });
      } else if (distanceFromEnd <= 48) {
        isFollowingEnd.current = true;
      }

      lastOffset.current = offset;
    },
    [],
  );

  const handleContentSizeChange = useCallback(() => {
    scrollToEnd();
  }, [scrollToEnd]);

  const lastMessage = messages[messages.length - 1];
  const lastTextLength =
    lastMessage?.parts.reduce(
      (total, part) => total + (part.type === "text" ? part.text.length : 0),
      0,
    ) ?? 0;

  useEffect(() => {
    scrollToEnd();
  }, [lastTextLength, messages.length, scrollToEnd]);

  return (
    <View
      className="flex-1"
      onLayout={(event) => {
        messagesContainerHeight.set(event.nativeEvent.layout.height);
      }}
    >
      <FlatList
        ref={listRef}
        data={messages}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem || defaultRenderItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        contentContainerStyle={[
          {
            gap: 24,
            paddingBottom: blankSize.value,
            paddingHorizontal: 16,
            paddingVertical: 24,
          },
          contentContainerStyle,
        ]}
        ListEmptyComponent={<ConversationEmptyState />}
        {...flatListProps}
      />
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
