import { useQuery } from "@tanstack/react-query";

import { fetchChatModels } from "../services/chatModels";

export default function useChatModels() {
  return useQuery({
    queryKey: ["chat", "models"],
    queryFn: fetchChatModels,
  });
}
