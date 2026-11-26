import { apiClient } from "@/lib/api/client";

import { chatModelsResponseSchema, type ChatModelsResponse } from "../schema";

export async function fetchChatModels(): Promise<ChatModelsResponse> {
  const response = await apiClient.get("/api/v1/chat/models");
  return chatModelsResponseSchema.parse(response.data);
}
