import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status === 426) &&
        failureCount < 1,
      staleTime: 30_000,
    },
    mutations: { retry: 0 },
  },
});
