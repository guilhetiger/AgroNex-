import { verifyRequest } from "@/lib/auth/verifyRequest";
import { fetchAiAnalyticsContext } from "@/lib/ai/context";
import { detectAnomalies } from "@/lib/ai/anomalies";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const context = await fetchAiAnalyticsContext(supabase, user);
    const anomalies = detectAnomalies(context);

    if (anomalies.length > 0) {
      await supabase.from("ai_alerts").insert(
        anomalies.map((anomaly) => ({
          owner_id: user.id,
          alert_type: anomaly.alert_type,
          severity: anomaly.severity,
          title: anomaly.title,
          description: anomaly.description,
          payload: anomaly.payload
        }))
      );
    }

    const { data } = await supabase
      .from("ai_alerts")
      .select("id, alert_type, severity, title, description, payload, is_read, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return Response.json({ alerts: data ?? [], detected: anomalies.length });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Error detectando anomalias." }, { status: 500 });
  }
}
