import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiPlatformClient } from "@services/aiPlatformClient";
import { trackAIUsage } from "@services/analyticsService";
import { useAuth } from "@hooks/useAuth";
import { isAiApiConfigured } from "@utils/aiApiUrl";

export const aiDashboardKey = ["ai-dashboard"] as const;

export function useAiDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: aiDashboardKey,
    queryFn: () => aiPlatformClient.getDashboard(),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    enabled: isAiApiConfigured(),
  });

  const refreshAnomalies = useMutation({
    mutationFn: () => aiPlatformClient.detectAnomalies(),
    onSuccess: () => {
      if (user?.id) void trackAIUsage(user.id, 'anomaly');
      queryClient.invalidateQueries({ queryKey: aiDashboardKey });
    },
  });

  const refreshPredictions = useMutation({
    mutationFn: () => aiPlatformClient.generatePredictions(),
    onSuccess: () => {
      if (user?.id) void trackAIUsage(user.id, 'prediction');
      queryClient.invalidateQueries({ queryKey: aiDashboardKey });
    },
  });

  return {
    ...dashboardQuery,
    refreshAnomalies,
    refreshPredictions
  };
}
