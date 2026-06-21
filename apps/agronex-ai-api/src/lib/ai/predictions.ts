import type { AiAnalyticsContext } from "@/lib/ai/context";

export type AiPrediction = {
  prediction_type: "expenses" | "flights" | "agrochemicals";
  target_period: string;
  predicted_value: number;
  confidence: number;
  rationale: string;
  payload: Record<string, unknown>;
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function nextMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
}

export function buildPredictions(context: AiAnalyticsContext): AiPrediction[] {
  const targetPeriod = nextMonthStart();
  const predictions: AiPrediction[] = [];

  const expenseHistory = context.monthlyExpenses.map((row) => Number(row.total_amount ?? 0)).slice(0, 6);
  if (expenseHistory.length >= 2) {
    const baseline = average(expenseHistory);
    const trend = expenseHistory[0] - expenseHistory[1];
    predictions.push({
      prediction_type: "expenses",
      target_period: targetPeriod,
      predicted_value: Number(Math.max(0, baseline + trend * 0.5).toFixed(2)),
      confidence: expenseHistory.length >= 4 ? 0.78 : 0.62,
      rationale: "Promedio movil de gastos mensuales con ajuste por tendencia reciente.",
      payload: { history: expenseHistory, baseline, trend }
    });
  }

  const estimatedFlights = context.totals.quarterFlights > 0 ? context.totals.quarterFlights / 3 : context.totals.totalFlights / 3;
  predictions.push({
    prediction_type: "flights",
    target_period: targetPeriod,
    predicted_value: Number(Math.max(0, estimatedFlights).toFixed(0)),
    confidence: context.totals.quarterFlights > 0 ? 0.74 : 0.55,
    rationale: "Estimacion de actividad de vuelos basada en el trimestre actual.",
    payload: { quarterFlights: context.totals.quarterFlights, totalFlights: context.totals.totalFlights }
  });

  const topAgrochemical = context.agrochemicalTotals[0];
  if (topAgrochemical) {
    predictions.push({
      prediction_type: "agrochemicals",
      target_period: targetPeriod,
      predicted_value: Number((Number(topAgrochemical.total_used) * 1.08).toFixed(2)),
      confidence: 0.68,
      rationale: `Proyeccion de consumo para ${topAgrochemical.product} (+8%).`,
      payload: {
        product: topAgrochemical.product,
        total_used: topAgrochemical.total_used,
        total_stock: topAgrochemical.total_stock
      }
    });
  }

  return predictions;
}
