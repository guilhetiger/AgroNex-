import { useMutation } from "@tanstack/react-query";
import { aiPlatformClient } from "@services/aiPlatformClient";
import type { AiChatRequest } from "@services/aiPlatformTypes";

export function useAgroChat() {
  return useMutation({
    mutationFn: (payload: AiChatRequest) => aiPlatformClient.sendChatMessage(payload)
  });
}
