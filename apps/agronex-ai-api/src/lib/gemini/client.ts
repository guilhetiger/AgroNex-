import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_MODEL = "gemini-2.0-flash";

let client: GoogleGenerativeAI | null = null;

export class GeminiQuotaError extends Error {
  constructor(message = "Cuota de Gemini agotada. Intenta de nuevo mas tarde.") {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return client;
}

function getModel(options: { systemInstruction?: string; temperature?: number }) {
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: options.systemInstruction,
    generationConfig: {
      temperature: options.temperature ?? 0.2
    }
  });
}

function normalizeSystemInstruction(systemInstruction?: string | string[]) {
  if (!systemInstruction) return undefined;
  return Array.isArray(systemInstruction) ? systemInstruction.join("\n\n") : systemInstruction;
}

export function isGeminiQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    const message = String(error ?? "").toUpperCase();
    return message.includes("RESOURCE_EXHAUSTED") || message.includes("429");
  }

  const err = error as { status?: number; message?: string; statusText?: string };
  if (err.status === 429) return true;

  const message = `${err.message ?? ""} ${err.statusText ?? ""}`.toUpperCase();
  return message.includes("RESOURCE_EXHAUSTED") || message.includes("429");
}

export function assertGeminiResponse(error: unknown): never {
  if (isGeminiQuotaError(error)) {
    throw new GeminiQuotaError();
  }
  throw error;
}

type GenerateTextResult = {
  text: string;
  model: string;
  usage: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
};

export async function generateText(options: {
  systemInstruction?: string | string[];
  temperature?: number;
  userContent: string;
}): Promise<GenerateTextResult> {
  try {
    const model = getModel({
      systemInstruction: normalizeSystemInstruction(options.systemInstruction),
      temperature: options.temperature
    });
    const result = await model.generateContent(options.userContent);
    const usage = result.response.usageMetadata;

    return {
      text: result.response.text().trim(),
      model: GEMINI_MODEL,
      usage: usage
        ? {
            promptTokenCount: usage.promptTokenCount,
            candidatesTokenCount: usage.candidatesTokenCount,
            totalTokenCount: usage.totalTokenCount
          }
        : null
    };
  } catch (error) {
    assertGeminiResponse(error);
  }
}

export async function generateTextWithImage(options: {
  systemInstruction: string;
  temperature?: number;
  text: string;
  imageBase64: string;
  mimeType: string;
}): Promise<GenerateTextResult> {
  try {
    const model = getModel({
      systemInstruction: options.systemInstruction,
      temperature: options.temperature ?? 0
    });
    const result = await model.generateContent([
      { text: options.text },
      { inlineData: { mimeType: options.mimeType, data: options.imageBase64 } }
    ]);
    const usage = result.response.usageMetadata;

    return {
      text: result.response.text().trim(),
      model: GEMINI_MODEL,
      usage: usage
        ? {
            promptTokenCount: usage.promptTokenCount,
            candidatesTokenCount: usage.candidatesTokenCount,
            totalTokenCount: usage.totalTokenCount
          }
        : null
    };
  } catch (error) {
    assertGeminiResponse(error);
  }
}
