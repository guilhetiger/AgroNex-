import type { UserSupabaseClient } from "@/lib/supabase/server";

export type AiAnalyticsContext = {
  generatedAt: string;
  userId: string;
  totals: {
    monthlyExpenseUsd: number;
    quarterFlights: number;
    activeClients: number;
    totalFlights: number;
    topAgrochemical: string | null;
  };
  monthlyExpenses: Array<{
    month: string;
    total_amount: number;
    expense_count: number;
  }>;
  clientActivity: Array<{
    client_id: string;
    client_name: string;
    flight_count: number;
    total_area: number;
    last_flight_at: string | null;
  }>;
  agrochemicalTotals: Array<{
    product: string;
    total_used: number;
    total_stock: number;
  }>;
  recentExpenses: Array<{
    category: string;
    amount: number;
    date: string;
    vendor: string | null;
    description: string | null;
  }>;
  recentFlights: Array<{
    client_id: string | null;
    area_covered: number;
    duration: number;
    date: string;
  }>;
};

function startOfMonth(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfQuarter(now: Date) {
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1);
}

export async function fetchAiAnalyticsContext(
  supabase: UserSupabaseClient,
  user: { id: string }
): Promise<AiAnalyticsContext> {
  const now = new Date();
  const monthStartIso = startOfMonth(now).toISOString();
  const quarterStartIso = startOfQuarter(now).toISOString();

  const [
    { data: monthExpenses = [] },
    { data: quarterFlights = [] },
    { data: allFlights = [] },
    { data: clients = [] },
    { data: monthlyRows = [] },
    { data: clientRows = [] },
    { data: agroRows = [] },
    { data: recentExpenses = [] },
    { data: recentFlights = [] }
  ] = await Promise.all([
    supabase.from("expenses").select("amount").eq("owner_id", user.id).gte("date", monthStartIso),
    supabase.from("flights").select("id").eq("user_id", user.id).gte("date", quarterStartIso),
    supabase.from("flights").select("id, client_id").eq("user_id", user.id),
    supabase.from("clients").select("id").eq("owner_id", user.id),
    supabase
      .from("v_ai_monthly_expenses")
      .select("month, total_amount, expense_count")
      .eq("owner_id", user.id)
      .order("month", { ascending: false })
      .limit(12),
    supabase
      .from("v_ai_client_activity")
      .select("client_id, client_name, flight_count, total_area, last_flight_at")
      .eq("owner_id", user.id)
      .order("flight_count", { ascending: false }),
    supabase
      .from("v_ai_agrochemical_totals")
      .select("product, total_used, total_stock")
      .eq("owner_id", user.id)
      .order("total_used", { ascending: false }),
    supabase
      .from("expenses")
      .select("category, amount, date, vendor, description")
      .eq("owner_id", user.id)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("flights")
      .select("client_id, area_covered, duration, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(20)
  ]);

  const monthlyExpenseUsd = (monthExpenses as Array<{ amount: number | null }>).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0
  );
  const activeClientIds = new Set(
    (allFlights as Array<{ client_id: string | null }>).map((row) => row.client_id).filter(Boolean)
  );
  const activeClients = (clients as Array<{ id: string }>).filter((client) => activeClientIds.has(client.id)).length;
  const topAgrochemical = (agroRows as Array<{ product: string }>)[0]?.product ?? null;

  return {
    generatedAt: now.toISOString(),
    userId: user.id,
    totals: {
      monthlyExpenseUsd: Number(monthlyExpenseUsd.toFixed(2)),
      quarterFlights: quarterFlights.length,
      activeClients,
      totalFlights: allFlights.length,
      topAgrochemical
    },
    monthlyExpenses: (monthlyRows as AiAnalyticsContext["monthlyExpenses"]) ?? [],
    clientActivity: (clientRows as AiAnalyticsContext["clientActivity"]) ?? [],
    agrochemicalTotals: (agroRows as AiAnalyticsContext["agrochemicalTotals"]) ?? [],
    recentExpenses: (recentExpenses as AiAnalyticsContext["recentExpenses"]) ?? [],
    recentFlights: (recentFlights as AiAnalyticsContext["recentFlights"]) ?? []
  };
}

export function buildContextSummary(context: AiAnalyticsContext): string {
  return [
    `Total flights: ${context.totals.totalFlights}`,
    `Quarter flights: ${context.totals.quarterFlights}`,
    `Monthly expenses (USD): ${context.totals.monthlyExpenseUsd}`,
    `Active clients: ${context.totals.activeClients}`,
    `Top agrochemical: ${context.totals.topAgrochemical ?? "n/a"}`
  ].join("\n");
}
