import { z } from "zod";
import { GeminiQuotaError, generateTextWithImage } from "@/lib/gemini/client";
import { OCR_EXTRACTION_PROMPT } from "@/lib/ai/prompts";
import { verifyRequest } from "@/lib/auth/verifyRequest";

const ocrResultSchema = z.object({
  category: z.string().min(1),
  amount: z.number().nonnegative(),
  vendor: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(8)
});

function parseOcrJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return ocrResultSchema.parse(JSON.parse(cleaned));
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await verifyRequest(request);
    const form = await request.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return Response.json({ error: "Imagen requerida (campo image)." }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabase
      .from("ai_ocr_jobs")
      .insert({
        owner_id: user.id,
        status: "processing",
        source_filename: file.name,
        source_mime: file.type || "image/jpeg"
      })
      .select("id")
      .single();

    if (jobError || !job?.id) {
      return Response.json({ error: "No se pudo crear el job OCR." }, { status: 500 });
    }

    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/jpeg";
      const base64 = bytes.toString("base64");

      const completion = await generateTextWithImage({
        systemInstruction: OCR_EXTRACTION_PROMPT,
        temperature: 0,
        text: "Extrae los campos del comprobante.",
        imageBase64: base64,
        mimeType: mime
      });

      const extracted = parseOcrJson(completion.text || "{}");
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          owner_id: user.id,
          category: extracted.category,
          amount: extracted.amount,
          vendor: extracted.vendor,
          description: extracted.description,
          date: new Date(extracted.date).toISOString()
        })
        .select("id, category, amount, vendor, description, date")
        .single();

      if (expenseError || !expense) {
        throw new Error(expenseError?.message ?? "No se pudo crear el gasto.");
      }

      await supabase
        .from("ai_ocr_jobs")
        .update({
          status: "completed",
          extracted_payload: extracted,
          expense_id: expense.id
        })
        .eq("id", job.id)
        .eq("owner_id", user.id);

      return Response.json({
        jobId: job.id,
        extracted,
        expense
      });
    } catch (innerError) {
      await supabase
        .from("ai_ocr_jobs")
        .update({
          status: "failed",
          error_message: innerError instanceof Error ? innerError.message : "OCR processing error"
        })
        .eq("id", job.id)
        .eq("owner_id", user.id);
      throw innerError;
    }
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof GeminiQuotaError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "Missing GOOGLE_CLOUD_PROJECT") {
      return Response.json(
        { error: "Missing GOOGLE_CLOUD_PROJECT. Configura Vertex AI en el servidor." },
        { status: 500 }
      );
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "OCR no pudo extraer campos validos.", details: error.flatten() }, { status: 422 });
    }
    return Response.json({ error: "Error procesando OCR." }, { status: 500 });
  }
}
