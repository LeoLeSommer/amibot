import { fetch as expoFetch } from "expo/fetch";

import { notifyClientUpdateRequired } from "@/lib/api/clientInterceptors";

type FetchLike = typeof globalThis.fetch;

// On web expo/fetch is globalThis.fetch; on native it provides the streaming
// response body the AI SDK needs. Its native typing is wider than the DOM
// fetch type the transport expects.
const platformFetch = expoFetch as FetchLike;

export const streamFetch: FetchLike = async (input, init) => {
  const response = await platformFetch(input, init);
  if (response.status === 426) {
    notifyClientUpdateRequired();
  }
  return response;
};
