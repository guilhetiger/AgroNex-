import { verifyRequest } from "@/lib/auth/verifyRequest";
import { fetchAiAnalyticsContext } from "@/lib/ai/context";
import { detectAnomalies } from "@/lib/ai/anomalies";
import { buildPredictions } from "@/lib/ai/predictions";

export async function GET(request: Request) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const context = await fetchAiAnalyticsContext(supabase, user);

    const [{ data: alerts }, { data: predictions }] = await Promise.all([
      supabase
        .from("ai_alerts")
        .select("id, alert_type, severity, title, description, payload, is_read, created_at")
        .eq("owner_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("ai_predictions")
        .select("id, prediction_type, target_period, predicted_value, confidence, rationale, payload, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const liveAnomalies = detectAnomalies(context).slice(0, 5);
    const livePredictions = buildPredictions(context).slice(0, 3);

    return Response.json({
      widgets: {
        monthlyExpenseUsd: context.totals.monthlyExpenseUsd,
        totalFlights: context.totals.totalFlights,
        quarterFlights: context.totals.quarterFlights,
        activeClients: context.totals.activeClients,
        topAgrochemical: context.totals.topAgrochemical,
        agrochemicalUsage: context.agrochemicalTotals.slice(0, 5)
      },
      alerts: alerts ?? [],
      predictions: predictions?.length ? predictions : livePredictions,
      liveAnomalies,
      recommendations: liveAnomalies.slice(0, 3).map((item) => item.description)
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Error cargando dashboard AI." }, { status: 500 });
  }
}
