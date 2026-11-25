import { z } from "zod";

import { normalizeServerUrl } from "@/lib/api/serverUrl";

export const serverUrlSchema = z.object({
  serverUrl: z
    .string()
    .trim()
    .min(1, "settings.errors.urlRequired")
    .refine((value) => normalizeServerUrl(value) !== null, {
      message: "settings.errors.urlInvalid",
    }),
});

export type ServerUrlFormValues = z.infer<typeof serverUrlSchema>;
