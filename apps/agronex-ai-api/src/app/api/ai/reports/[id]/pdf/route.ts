import { verifyRequest } from "@/lib/auth/verifyRequest";
import { generateReportPdf, type ReportType } from "@/lib/ai/reports";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, { params }: Params) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const { data, error } = await supabase
      .from("ai_reports")
      .select("id, report_type, title, summary, metrics")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single();

    if (error || !data) {
      return Response.json({ error: "Reporte no encontrado." }, { status: 404 });
    }

    const pdfBuffer = generateReportPdf(
      data.report_type as ReportType,
      data.title,
      data.summary,
      (data.metrics as Record<string, unknown>) ?? {}
    );

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="agronex-${data.report_type}-${params.id}.pdf"`
      }
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Error exportando PDF." }, { status: 500 });
  }
}
