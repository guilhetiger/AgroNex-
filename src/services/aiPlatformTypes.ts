export type AiRole = "user" | "assistant" | "system";
export type AiReportType = "expenses" | "flights" | "clients" | "executive";
export type AiPredictionType = "expenses" | "flights" | "agrochemicals";

export type AiChatRequest = {
  conversationId?: string;
  message: string;
};

export type AiChatTotals = {
  monthlyExpenseUsd: number;
  quarterFlights: number;
  activeClients: number;
  totalFlights: number;
  topAgrochemical: string | null;
};

export type AiChatResponse = {
  conversationId: string;
  message: string;
  totals?: AiChatTotals;
};

export type AiReport = {
  id: string;
  report_type: AiReportType;
  title: string;
  summary: string;
  metrics: Record<string, unknown>;
  created_at: string;
};

export type AiAlert = {
  id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  payload?: Record<string, unknown>;
  is_read?: boolean;
  created_at: string;
};

export type AiPrediction = {
  id?: string;
  prediction_type: AiPredictionType;
  target_period: string;
  predicted_value: number;
  confidence: number;
  rationale: string;
  payload?: Record<string, unknown>;
  created_at?: string;
};

export type AiDashboardResponse = {
  widgets: {
    monthlyExpenseUsd: number;
    totalFlights: number;
    quarterFlights: number;
    activeClients: number;
    topAgrochemical: string | null;
    agrochemicalUsage: Array<{
      product: string;
      total_used: number;
      total_stock: number;
    }>;
  };
  alerts: AiAlert[];
  predictions: AiPrediction[];
  liveAnomalies: Array<{
    title: string;
    description: string;
    severity: string;
  }>;
  recommendations: string[];
};

export type AiOcrResponse = {
  jobId: string;
  extracted: {
    category: string;
    amount: number;
    vendor: string;
    description: string;
    date: string;
  };
  expense: {
    id: string;
    category: string;
    amount: number;
    vendor: string;
    description: string;
    date: string;
  };
};
