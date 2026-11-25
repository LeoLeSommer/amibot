import { z } from "zod";

import { apiClient } from "./client";
import { ApiError } from "./errors";

const platformSchema = z.enum(["web", "ios", "android"]);

const contributionSchema = z.object({
  id: z.string(),
  module: z.string(),
  component: z.string(),
  order: z.number().int(),
  platforms: z.array(platformSchema).optional(),
  permissions: z.array(z.string()),
  props: z.record(z.string(), z.unknown()),
});

const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  permissions: z.array(z.string()),
});

const capabilitySchema = z.object({
  id: z.string(),
  module: z.string(),
});

export const manifestSchema = z.object({
  api_version: z.literal(1),
  core: z.object({ version: z.string() }),
  server: z.object({ name: z.string() }),
  compatibility: z.object({ min_client_api_version: z.number().int() }),
  modules: z.array(moduleSchema),
  capabilities: z.array(capabilitySchema),
  ui: z.object({
    slots: z.record(z.string(), z.array(contributionSchema)),
  }),
});

export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestContribution = z.infer<typeof contributionSchema>;

export async function fetchManifest(): Promise<Manifest> {
  const response = await apiClient.get("/api/v1/app/manifest");
  const parsed = manifestSchema.safeParse(response.data);

  if (!parsed.success) {
    throw new ApiError("invalid manifest", 0, "invalid_manifest");
  }

  return parsed.data;
}
