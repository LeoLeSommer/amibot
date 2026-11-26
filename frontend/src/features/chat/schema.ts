import { z } from "zod";

export const chatModelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const chatModelsResponseSchema = z.object({
  models: z.array(chatModelSchema).min(1),
  default_model: z.string().min(1),
});

export type ChatModel = z.infer<typeof chatModelSchema>;
export type ChatModelsResponse = z.infer<typeof chatModelsResponseSchema>;
