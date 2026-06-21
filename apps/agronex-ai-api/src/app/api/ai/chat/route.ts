import { z } from "zod";
import { GeminiQuotaError, generateText } from "@/lib/gemini/client";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { fetchAiAnalyticsContext, buildContextSummary } from "@/lib/ai/context";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000)
});

export async function POST(request: Request) {
  console.log('[AI] Request received');
  try {
    const { user, supabase } = await verifyRequest(request);
    const body = bodySchema.parse(await request.json());

    let conversationId = body.conversationId;
    if (!conversationId) {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          owner_id: user.id,
          title: body.message.slice(0, 80)
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        return Response.json({ error: "No se pudo crear la conversacion." }, { status: 500 });
      }
      conversationId = data.id;
    }

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      owner_id: user.id,
      role: "user",
      content: body.message
    });

    const context = await fetchAiAnalyticsContext(supabase, user);
    const contextSummary = buildContextSummary(context);
    const completion = await generateText({
      systemInstruction: [CHAT_SYSTEM_PROMPT, `Contexto:\n${contextSummary}`],
      temperature: 0.2,
      userContent: body.message
    });

    const message = completion.text || "No tengo una respuesta disponible en este momento.";

    await supabase.from("ai_messages").insert({
      conversation_id: conversationId,
      owner_id: user.id,
      role: "assistant",
      content: message,
      metadata: { model: completion.model, usage: completion.usage }
    });

    return Response.json({
      conversationId,
      message,
      totals: context.totals
    });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof GeminiQuotaError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "Missing GEMINI_API_KEY") {
      return Response.json({ error: "Missing GEMINI_API_KEY. Configura la variable de entorno del servidor." }, { status: 500 });
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Body invalido.", details: error.flatten() }, { status: 400 });
    }
    console.error('[AI] Full error:', error);
    console.error('[AI] Stack:', error instanceof Error ? error.stack : undefined);
    return Response.json({ error: "Error generando respuesta AI." }, { status: 500 });
  }
}
