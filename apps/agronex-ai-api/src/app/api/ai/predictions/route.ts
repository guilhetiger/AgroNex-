import { verifyRequest } from "@/lib/auth/verifyRequest";
import { fetchAiAnalyticsContext } from "@/lib/ai/context";
import { buildPredictions } from "@/lib/ai/predictions";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const context = await fetchAiAnalyticsContext(supabase, user);
    const generated = buildPredictions(context);

    if (generated.length > 0) {
      await supabase.from("ai_predictions").insert(
        generated.map((prediction) => ({
          owner_id: user.id,
          prediction_type: prediction.prediction_type,
          target_period: prediction.target_period,
          predicted_value: prediction.predicted_value,
          confidence: prediction.confidence,
          rationale: prediction.rationale,
          payload: prediction.payload
        }))
      );
    }

    const { data } = await supabase
      .from("ai_predictions")
      .select("id, prediction_type, target_period, predicted_value, confidence, rationale, payload, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    return Response.json({ predictions: data ?? [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Error generando predicciones." }, { status: 500 });
  }
}
