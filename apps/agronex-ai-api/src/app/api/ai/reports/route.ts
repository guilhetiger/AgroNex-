import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai/client";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { fetchAiAnalyticsContext } from "@/lib/ai/context";
import { REPORT_SUMMARY_PROMPT } from "@/lib/ai/prompts";
import { buildReportMetrics, reportTitle, type ReportType } from "@/lib/ai/reports";

const createSchema = z.object({
  reportType: z.enum(["expenses", "flights", "clients", "executive"]).default("executive")
});

export async function GET(request: Request) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const { data, error } = await supabase
      .from("ai_reports")
      .select("id, report_type, title, summary, metrics, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ reports: data ?? [] });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Error listando reportes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const body = createSchema.parse(await request.json());
    const reportType = body.reportType as ReportType;

    const context = await fetchAiAnalyticsContext(supabase, user);
    const metrics = buildReportMetrics(reportType, context);
    const title = reportTitle(reportType);

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: REPORT_SUMMARY_PROMPT },
        { role: "user", content: `Tipo: ${reportType}\nMetricas:\n${JSON.stringify(metrics)}` }
      ]
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? "Reporte generado automaticamente.";

    const { data, error } = await supabase
      .from("ai_reports")
      .insert({
        owner_id: user.id,
        report_type: reportType,
        title,
        summary,
        metrics
      })
      .select("id, report_type, title, summary, metrics, created_at")
      .single();

    if (error || !data) {
      return Response.json({ error: "No se pudo guardar el reporte." }, { status: 500 });
    }

    return Response.json({ report: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Body invalido.", details: error.flatten() }, { status: 400 });
    }
    return Response.json({ error: "Error generando reporte." }, { status: 500 });
  }
}
