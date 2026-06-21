import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "@services/supabaseClient";
import type {
  AiAlert,
  AiChatRequest,
  AiChatResponse,
  AiDashboardResponse,
  AiOcrResponse,
  AiPrediction,
  AiReport,
  AiReportType
} from "@services/aiPlatformTypes";
import { getAiApiBaseUrl, isAiApiConfigured } from "@utils/aiApiUrl";

function assertApiUrl() {
  if (!isAiApiConfigured()) {
    throw new Error("Configura EXPO_PUBLIC_AI_API_URL para usar la plataforma AI.");
  }
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sesion no valida. Inicia sesion nuevamente.");
  }
  return data.session.access_token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertApiUrl();
  const apiBaseUrl = getAiApiBaseUrl();
  const accessToken = await getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`
      }
    });
  } catch {
    throw new Error(
      `No se pudo conectar con ${apiBaseUrl}. Verifica que el backend este activo (npm run dev en apps/agronex-ai-api) y que la URL sea accesible desde el dispositivo.`
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(typeof payload?.error === "string" ? payload.error : `Error ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function checkAiApiHealth(): Promise<{ ok: boolean; url: string; error?: string }> {
  const url = getAiApiBaseUrl();
  if (!url) {
    return { ok: false, url: "", error: "missing_url" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${url}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { ok: false, url, error: `health_${response.status}` };
    }

    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    if (!payload?.ok) {
      return { ok: false, url, error: "invalid_health" };
    }

    return { ok: true, url };
  } catch {
    return { ok: false, url, error: "network" };
  }
}

export const aiPlatformClient = {
  sendChatMessage: (payload: AiChatRequest) =>
    request<AiChatResponse>("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),

  getDashboard: () => request<AiDashboardResponse>("/api/ai/dashboard"),

  listReports: async () => {
    const data = await request<{ reports: AiReport[] }>("/api/ai/reports");
    return data.reports;
  },

  generateReport: async (reportType: AiReportType) => {
    const data = await request<{ report: AiReport }>("/api/ai/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType })
    });
    return data.report;
  },

  detectAnomalies: async () => {
    const data = await request<{ alerts: AiAlert[]; detected: number }>("/api/ai/anomalies", {
      method: "POST"
    });
    return data;
  },

  generatePredictions: async () => {
    const data = await request<{ predictions: AiPrediction[] }>("/api/ai/predictions", {
      method: "POST"
    });
    return data.predictions;
  },

  downloadReportPdf: async (reportId: string, filename = "agronex-report.pdf") => {
    assertApiUrl();
    const apiBaseUrl = getAiApiBaseUrl();
    const token = await getAccessToken();
    const targetPath = `${FileSystem.cacheDirectory}${filename}`;
    const result = await FileSystem.downloadAsync(`${apiBaseUrl}/api/ai/reports/${reportId}/pdf`, targetPath, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (result.status !== 200) {
      throw new Error("No se pudo descargar el PDF.");
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
    }

    return result.uri;
  },

  uploadExpenseImage: async (uri: string, mimeType = "image/jpeg", name = "expense.jpg") => {
    assertApiUrl();
    const apiBaseUrl = getAiApiBaseUrl();
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append("image", { uri, name, type: mimeType } as unknown as Blob);

    const response = await fetch(`${apiBaseUrl}/api/ai/ocr`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(typeof payload?.error === "string" ? payload.error : `Error OCR ${response.status}`);
    }

    return (await response.json()) as AiOcrResponse;
  }
};
