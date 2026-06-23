import fs from "fs";
import { ApiError, GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
let credentialsInitialized = false;

function ensureVertexCredentials() {
  if (credentialsInitialized) return;
  credentialsInitialized = true;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  const serviceAccountJson = process.env.GCP_SA_JSON;
  if (!serviceAccountJson) return;

  fs.writeFileSync("/tmp/gcp-sa.json", serviceAccountJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/gcp-sa.json";
}

export class GeminiQuotaError extends Error {
  constructor(message = "Cuota de Gemini agotada. Intenta de nuevo mas tarde.") {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

function getVertexConfig() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location =
    process.env.GOOGLE_CLOUD_LOCATION ?? process.env.GOOGLE_LOCATION ?? "us-central1";

  if (!project) {
    throw new Error("Missing GOOGLE_CLOUD_PROJECT");
  }

  return { project, location };
}

export function isVertexAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return true;
    const message = `${error.message ?? ""}`.toUpperCase();
    return (
      message.includes("UNAUTHENTICATED") ||
      message.includes("PERMISSION_DENIED") ||
      message.includes("CREDENTIALS")
    );
  }

  if (error instanceof Error) {
    const message = error.message.toUpperCase();
    return (
      message.includes("COULD NOT LOAD THE DEFAULT CREDENTIALS") ||
      message.includes("UNAUTHENTICATED") ||
      message.includes("PERMISSION_DENIED") ||
      message.includes("INVALID GRANT")
    );
  }

  return false;
}

export function getGeminiClient() {
  ensureVertexCredentials();
  const { project, location } = getVertexConfig();

  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project,
      location
    });
  }

  return client;
}

function normalizeSystemInstruction(systemInstruction?: string | string[]) {
  if (!systemInstruction) return undefined;
  return Array.isArray(systemInstruction) ? systemInstruction.join("\n\n") : systemInstruction;
}

export function isGeminiQuotaError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 429) return true;
    const message = `${error.message ?? ""}`.toUpperCase();
    return message.includes("RESOURCE_EXHAUSTED") || message.includes("429");
  }

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

function mapUsageMetadata(
  usage: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } | undefined
) {
  if (!usage) return null;
  return {
    promptTokenCount: usage.promptTokenCount,
    candidatesTokenCount: usage.candidatesTokenCount,
    totalTokenCount: usage.totalTokenCount
  };
}

export async function generateText(options: {
  systemInstruction?: string | string[];
  temperature?: number;
  userContent: string;
}): Promise<GenerateTextResult> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: options.userContent,
      config: {
        systemInstruction: normalizeSystemInstruction(options.systemInstruction),
        temperature: options.temperature ?? 0.2
      }
    });

    return {
      text: (response.text ?? "").trim(),
      model: GEMINI_MODEL,
      usage: mapUsageMetadata(response.usageMetadata)
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
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        options.text,
        {
          inlineData: {
            mimeType: options.mimeType,
            data: options.imageBase64
          }
        }
      ],
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0
      }
    });

    return {
      text: (response.text ?? "").trim(),
      model: GEMINI_MODEL,
      usage: mapUsageMetadata(response.usageMetadata)
    };
  } catch (error) {
    assertGeminiResponse(error);
  }
}
