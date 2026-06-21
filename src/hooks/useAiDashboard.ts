import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiPlatformClient } from "@services/aiPlatformClient";

export const aiDashboardKey = ["ai-dashboard"] as const;

export function useAiDashboard() {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: aiDashboardKey,
    queryFn: () => aiPlatformClient.getDashboard(),
    staleTime: 1000 * 60 * 2,
    retry: 1
  });

  const refreshAnomalies = useMutation({
    mutationFn: () => aiPlatformClient.detectAnomalies(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiDashboardKey })
  });

  const refreshPredictions = useMutation({
    mutationFn: () => aiPlatformClient.generatePredictions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiDashboardKey })
  });

  return {
    ...dashboardQuery,
    refreshAnomalies,
    refreshPredictions
  };
}
