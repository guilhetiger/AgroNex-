import type { AiAnalyticsContext } from "@/lib/ai/context";

export type AiAnomaly = {
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  payload: Record<string, unknown>;
};

const INACTIVE_DAYS = 90;
const LONG_FLIGHT_MINUTES = 180;

export function detectAnomalies(context: AiAnalyticsContext): AiAnomaly[] {
  const anomalies: AiAnomaly[] = [];

  if (context.monthlyExpenses.length >= 2) {
    const current = Number(context.monthlyExpenses[0]?.total_amount ?? 0);
    const previous = Number(context.monthlyExpenses[1]?.total_amount ?? 0);
    if (previous > 0) {
      const growthPct = ((current - previous) / previous) * 100;
      if (growthPct >= 35) {
        anomalies.push({
          alert_type: "expense_spike",
          severity: growthPct >= 65 ? "high" : "medium",
          title: "Gasto inusual detectado",
          description: `Los gastos crecieron ${growthPct.toFixed(1)}% frente al mes anterior.`,
          payload: { growthPct: Number(growthPct.toFixed(2)), current, previous }
        });
      }
    }
  }

  for (const flight of context.recentFlights) {
    if (Number(flight.duration) >= LONG_FLIGHT_MINUTES) {
      anomalies.push({
        alert_type: "long_flight",
        severity: "medium",
        title: "Vuelo excesivamente largo",
        description: `Se detecto un vuelo de ${flight.duration} minutos (${flight.date}).`,
        payload: { duration: flight.duration, date: flight.date }
      });
      break;
    }
  }

  const inactiveCutoff = Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000;
  for (const client of context.clientActivity) {
    const lastActivity = client.last_flight_at ? new Date(client.last_flight_at).getTime() : 0;
    if (!lastActivity || lastActivity < inactiveCutoff) {
      anomalies.push({
        alert_type: "inactive_client",
        severity: "low",
        title: `Cliente inactivo: ${client.client_name}`,
        description: `Sin vuelos recientes durante ${INACTIVE_DAYS} dias.`,
        payload: { client_id: client.client_id, last_flight_at: client.last_flight_at }
      });
    }
  }

  for (const item of context.agrochemicalTotals) {
    const totalStock = Number(item.total_stock);
    const totalUsed = Number(item.total_used);
    if (totalUsed > 0 && totalStock <= 10) {
      anomalies.push({
        alert_type: "agrochemical_anomaly",
        severity: totalStock <= 3 ? "high" : "medium",
        title: `Consumo/stock anomalo: ${item.product}`,
        description: `Stock ${totalStock}, usado ${totalUsed}.`,
        payload: { product: item.product, total_stock: totalStock, total_used: totalUsed }
      });
    }
  }

  return anomalies.slice(0, 12);
}
