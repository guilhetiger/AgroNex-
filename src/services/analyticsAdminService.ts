import { supabase, hasSupabaseConfig } from '@services/supabaseClient';

export type AnalyticsSummary = {
  activeUsers7d: number;
  activeUsers30d: number;
  totalAiQueries: number;
  totalOcrProcessed: number;
  totalFlightsCreated: number;
  totalPdfExports: number;
  totalClientsCreated: number;
};

export type TopFeatureRow = {
  eventType: string;
  total: number;
  rank: number;
};

export type AdminUserUsageStats = {
  user_id: string;
  ai_queries: number;
  ocr_used: number;
  reports_generated: number;
  flights_created: number;
  last_access: string | null;
};

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  if (!hasSupabaseConfig) {
    return {
      activeUsers7d: 0,
      activeUsers30d: 0,
      totalAiQueries: 0,
      totalOcrProcessed: 0,
      totalFlightsCreated: 0,
      totalPdfExports: 0,
      totalClientsCreated: 0,
    };
  }

  const { data, error } = await supabase.rpc('admin_analytics_summary');
  if (error) throw new Error(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as {
    active_users_7d?: number;
    active_users_30d?: number;
    total_ai_queries?: number;
    total_ocr_processed?: number;
    total_flights_created?: number;
    total_pdf_exports?: number;
    total_clients_created?: number;
  } | null;
  return {
    activeUsers7d: Number(row?.active_users_7d ?? 0),
    activeUsers30d: Number(row?.active_users_30d ?? 0),
    totalAiQueries: Number(row?.total_ai_queries ?? 0),
    totalOcrProcessed: Number(row?.total_ocr_processed ?? 0),
    totalFlightsCreated: Number(row?.total_flights_created ?? 0),
    totalPdfExports: Number(row?.total_pdf_exports ?? 0),
    totalClientsCreated: Number(row?.total_clients_created ?? 0),
  };
}

export async function fetchTopFeatures(): Promise<TopFeatureRow[]> {
  if (!hasSupabaseConfig) return [];

  const { data, error } = await supabase.rpc('admin_analytics_top_features');
  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<{ event_type: string; total: number; feature_rank: number }>).map((row) => ({
    eventType: row.event_type,
    total: Number(row.total ?? 0),
    rank: Number(row.feature_rank ?? 0),
  }));
}

export async function fetchUserUsageStats(userId: string): Promise<AdminUserUsageStats> {
  if (!hasSupabaseConfig) {
    return {
      user_id: userId,
      ai_queries: 0,
      ocr_used: 0,
      reports_generated: 0,
      flights_created: 0,
      last_access: null,
    };
  }

  const rpc = supabase.rpc as unknown as (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc('admin_user_usage_stats', { p_user_id: userId });
  if (error) throw new Error(error.message);

  const payload = (data ?? {}) as Partial<AdminUserUsageStats>;
  return {
    user_id: userId,
    ai_queries: Number(payload.ai_queries ?? 0),
    ocr_used: Number(payload.ocr_used ?? 0),
    reports_generated: Number(payload.reports_generated ?? 0),
    flights_created: Number(payload.flights_created ?? 0),
    last_access: payload.last_access ?? null,
  };
}
