import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ChevronDown, Mic, Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

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
import useTheme from "@/shared/theme/useTheme";

import useChatModels from "../hooks/useChatModels";
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
  const [selectedModel, setSelectedModel] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [lastSent, setLastSent] = useState("");
  const [sessionId] = useState(createSessionId);
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

  const { messages, sendMessage, status, error, clearError, regenerate } =
    useChat({
      transport,
      onError: (cause) => setSendError(cause),
    });

  const isBusy = status === "submitted" || status === "streaming";
  const activeError = error ?? sendError;
  const isNotConfigured =
    activeError?.message.includes("chat_not_configured") ?? false;

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

  const renderItem: ConversationRenderItem = ({ item, index }) => (
    <Message role={item.role} index={index} message={item}>
      <MessageContent>
        <MessageResponse message={item} thinkingLabel={t("chat.thinking")} />
      </MessageContent>
    </Message>
  );

  return (
    <View
      testID="chat-panel"
      nativeID="chat-panel"
      className="flex-1"
      style={{ backgroundColor: colors.background }}
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
