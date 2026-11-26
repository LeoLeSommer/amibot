import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Check, ChevronDown, Copy, Mic, Plus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import i18n from "@/i18n";
import { getApiBaseUrl } from "@/lib/api/client";
import {
  CLIENT_API_VERSION,
  CLIENT_API_VERSION_HEADER,
} from "@/lib/api/clientInfo";
import type { SlotComponentProps } from "@/shared/components/slots/catalogue";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  Message,
  MessageContent,
  MessageResponse,
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputIconButton,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type ConversationRenderItem,
  type PromptInputMessage,
} from "@/shared/components/ui/chat-ai";
import { subscribeNewConversation } from "@/shared/events/newConversation";
import useAccessibilityPreferences from "@/shared/theme/useAccessibilityPreferences";
import useTheme from "@/shared/theme/useTheme";

import useChatModels from "../hooks/useChatModels";
import { copyToClipboard } from "../services/copyToClipboard";
import { streamFetch } from "../services/streamFetch";

export type ChatPanelProps = SlotComponentProps;

function textOf(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function toWireMessages(messages: UIMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: textOf(message),
  }));
}

function createSessionId(): string {
  return `ses_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export default function ChatPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const [selectedModel, setSelectedModel] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [lastSent, setLastSent] = useState("");
  const [sessionId, setSessionId] = useState(createSessionId);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { data: modelsData } = useChatModels();

  const models = modelsData?.models ?? [];
  const effectiveModel = selectedModel || modelsData?.default_model || "";
  const effectiveModelLabel =
    models.find((model) => model.id === effectiveModel)?.label ??
    effectiveModel;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        credentials: "include",
        fetch: streamFetch,
        prepareSendMessagesRequest: ({ messages, body }) => ({
          api: `${getApiBaseUrl() ?? ""}/api/v1/chat`,
          headers: {
            [CLIENT_API_VERSION_HEADER]: String(CLIENT_API_VERSION),
            "Accept-Language": i18n.language,
          },
          body: {
            messages: toWireMessages(messages),
            model: (body as { model?: string } | undefined)?.model,
            session_id: sessionId,
          },
        }),
      }),
    [sessionId],
  );

  const {
    messages,
    sendMessage,
    status,
    error,
    clearError,
    regenerate,
    setMessages,
    stop,
  } = useChat({
    transport,
    onError: (cause) => setSendError(cause),
  });

  useEffect(
    () =>
      subscribeNewConversation(() => {
        stop();
        setMessages([]);
        setSendError(null);
        clearError();
        setSessionId(createSessionId());
      }),
    [clearError, setMessages, stop],
  );

  const isBusy = status === "submitted" || status === "streaming";
  const activeError = error ?? sendError;
  const isNotConfigured =
    activeError?.message.includes("chat_not_configured") ?? false;

  useEffect(() => {
    if (!copiedId) {
      return;
    }
    const timeout = setTimeout(() => setCopiedId(null), 1500);
    return () => clearTimeout(timeout);
  }, [copiedId]);

  const handleCopy = async (message: UIMessage) => {
    const text = textOf(message);
    if (!text) {
      return;
    }
    if (await copyToClipboard(text)) {
      setCopiedId(message.id);
    }
  };

  const handleSubmit = ({ text }: PromptInputMessage) => {
    if (!text.trim() || isBusy) {
      return;
    }
    setLastSent(text.trim());
    setSendError(null);
    clearError();
    void sendMessage(
      { text: text.trim() },
      { body: { model: effectiveModel || undefined } },
    );
  };

  const handleRetry = () => {
    setSendError(null);
    clearError();
    if (lastSent) {
      void regenerate();
    }
  };

  const renderItem: ConversationRenderItem = ({ item, index }) => {
    const isStreaming =
      status === "streaming" &&
      index === messages.length - 1 &&
      item.role === "assistant";
    const copyable = textOf(item).length > 0;
    const showCopy =
      copyable && (Platform.OS !== "web" || hoveredId === item.id);
    const copied = copiedId === item.id;
    // On web the row is overlaid in the list gap so revealing it never shifts
    // the conversation. Native has no hover and keeps the row in flow.
    const copyRowStyle: ViewStyle | undefined =
      Platform.OS === "web"
        ? {
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: 2,
          }
        : undefined;

    return (
      <View
        onPointerEnter={() => setHoveredId(item.id)}
        onPointerLeave={() =>
          setHoveredId((current) => (current === item.id ? null : current))
        }
        className="w-full"
      >
        <Message role={item.role} index={index} message={item}>
          <MessageContent>
            <MessageResponse
              message={item}
              streaming={isStreaming}
              thinkingLabel={t("chat.thinking")}
              reasoningLabel={t("chat.reasoning")}
              reasoningStreamingLabel={t("chat.reasoningStreaming")}
              reasoningToggleLabel={t("chat.reasoningToggle")}
            />
          </MessageContent>
          {showCopy ? (
            <Animated.View
              entering={reduceMotion ? undefined : FadeIn.duration(140)}
              exiting={reduceMotion ? undefined : FadeOut.duration(140)}
              style={copyRowStyle}
              className={`flex-row ${
                item.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <Pressable
                testID={`chat-copy-${index}`}
                nativeID={`chat-copy-${index}`}
                accessibilityRole="button"
                accessibilityLabel={t("chat.copy")}
                onPress={() => void handleCopy(item)}
                className="flex-row items-center gap-1 rounded-md px-2 py-1 active:bg-muted"
              >
                {copied ? (
                  <Check size={13} color={colors.mutedForeground} />
                ) : (
                  <Copy size={13} color={colors.mutedForeground} />
                )}
                <Text
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  {copied ? t("chat.copied") : t("chat.copy")}
                </Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </Message>
      </View>
    );
  };

  return (
    <View
      testID="chat-panel"
      nativeID="chat-panel"
      className="flex-1 bg-transparent"
    >
      {activeError ? (
        <View
          testID="chat-error"
          nativeID="chat-error"
          className="mx-4 mt-2 gap-2 rounded-md border p-3"
          style={{ borderColor: colors.destructive }}
        >
          <Text className="text-sm" style={{ color: colors.destructive }}>
            {isNotConfigured ? t("chat.notConfigured") : t("chat.error")}
          </Text>
          <Pressable
            testID="chat-retry"
            nativeID="chat-retry"
            accessibilityRole="button"
            onPress={handleRetry}
          >
            <Text className="text-sm" style={{ color: colors.primary }}>
              {t("chat.retry")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Conversation>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title={t("chat.emptyTitle")}
            description={t("chat.emptyBody")}
            testID="chat-empty-title"
            nativeID="chat-empty-title"
          />
        ) : (
          <ConversationContent
            messages={messages}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 168 }}
          />
        )}
        <PromptInputProvider>
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                testID="chat-input"
                nativeID="chat-input"
                placeholder={t("chat.placeholder")}
                editable={!isBusy}
              />
              <PromptInputFooter>
                <PromptInputTools className="min-w-0 shrink">
                  <PromptInputIconButton
                    disabled
                    testID="chat-attach"
                    nativeID="chat-attach"
                    accessibilityLabel={t("chat.attach")}
                  >
                    <Plus size={20} className="text-muted-foreground" />
                  </PromptInputIconButton>
                  <ModelSelector open={modelOpen} onOpenChange={setModelOpen}>
                    <ModelSelectorTrigger
                      testID="chat-model-selector"
                      nativeID="chat-model-selector"
                      accessibilityLabel={t("chat.modelLabel")}
                    >
                      <Text
                        numberOfLines={1}
                        className="max-w-32 shrink text-sm text-foreground"
                      >
                        {effectiveModelLabel || t("chat.modelLabel")}
                      </Text>
                      <ChevronDown
                        size={16}
                        className="text-muted-foreground"
                      />
                    </ModelSelectorTrigger>
                    <ModelSelectorContent title={t("chat.modelLabel")}>
                      <ModelSelectorList>
                        {models.map((model) => (
                          <ModelSelectorItem
                            key={model.id}
                            isSelected={model.id === effectiveModel}
                            testID={`chat-model-${model.id}`}
                            nativeID={`chat-model-${model.id}`}
                            onPress={() => {
                              setSelectedModel(model.id);
                              setModelOpen(false);
                            }}
                          >
                            <ModelSelectorName>{model.label}</ModelSelectorName>
                          </ModelSelectorItem>
                        ))}
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                </PromptInputTools>
                <PromptInputTools className="shrink-0">
                  <PromptInputIconButton
                    disabled
                    testID="chat-voice"
                    nativeID="chat-voice"
                    accessibilityLabel={t("chat.voice")}
                  >
                    <Mic size={20} className="text-muted-foreground" />
                  </PromptInputIconButton>
                  <PromptInputSubmit
                    testID="chat-send"
                    nativeID="chat-send"
                    accessibilityLabel={t("chat.send")}
                    disabled={isBusy}
                    loading={isBusy}
                  />
                </PromptInputTools>
              </PromptInputFooter>
            </PromptInputBody>
          </PromptInput>
        </PromptInputProvider>
      </Conversation>
    </View>
  );
}
