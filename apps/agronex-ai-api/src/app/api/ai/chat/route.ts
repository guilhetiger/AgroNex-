import { z } from "zod";
import { GeminiQuotaError, generateText, isVertexAuthError } from "@/lib/gemini/client";
import { verifyRequest } from "@/lib/auth/verifyRequest";
import { fetchAiAnalyticsContext, buildContextSummary } from "@/lib/ai/context";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000)
});

function logChatError(phase: string, error: unknown) {
  const base =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { raw: String(error) };
  const api =
    error && typeof error === "object" && "status" in error
      ? { status: (error as { status?: number }).status }
      : {};
  console.error(`[AI][chat][${phase}]`, { ...base, ...api });
}

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

    console.log(`[AI] Reply (${message.length} chars): ${message.slice(0, 120)}`);

    return Response.json({
      conversationId,
      message,
      totals: context.totals
    });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof GeminiQuotaError) {
      logChatError("quota", error);
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && error.message === "Missing GOOGLE_CLOUD_PROJECT") {
      return Response.json(
        { error: "Missing GOOGLE_CLOUD_PROJECT. Configura Vertex AI en el servidor." },
        { status: 500 }
      );
    }
    if (isVertexAuthError(error)) {
      logChatError("vertex_auth", error);
      return Response.json(
        {
          error:
            "Credenciales de Vertex AI no disponibles o sin permisos. En local: gcloud auth application-default login, o define GOOGLE_APPLICATION_CREDENTIALS con un JSON de service account."
        },
        { status: 503 }
      );
    }
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Body invalido.", details: error.flatten() }, { status: 400 });
    }
    logChatError("unhandled", error);
    return Response.json({ error: "Error generando respuesta AI." }, { status: 500 });
  }
}
