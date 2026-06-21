import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiPlatformClient } from "@services/aiPlatformClient";
import type { AiReportType } from "@services/aiPlatformTypes";

export const aiReportsKey = ["ai-reports"] as const;

export function useAiReports() {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: aiReportsKey,
    queryFn: () => aiPlatformClient.listReports(),
    staleTime: 1000 * 60 * 5
  });

  const generateReport = useMutation({
    mutationFn: (reportType: AiReportType) => aiPlatformClient.generateReport(reportType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiReportsKey })
  });

  const downloadReportPdf = useMutation({
    mutationFn: ({ reportId, filename }: { reportId: string; filename?: string }) =>
      aiPlatformClient.downloadReportPdf(reportId, filename)
  });

  return {
    ...reportsQuery,
    generateReport,
    downloadReportPdf
  };
}
