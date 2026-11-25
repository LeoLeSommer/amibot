export const serverQueryKeys = {
  manifest: (serverUrl: string | null) =>
    ["server", serverUrl ?? "none", "manifest"] as const,
};
