import { jsPDF } from "jspdf";
import type { AiAnalyticsContext } from "@/lib/ai/context";

export type ReportType = "expenses" | "flights" | "clients" | "executive";

export function buildReportMetrics(reportType: ReportType, context: AiAnalyticsContext): Record<string, unknown> {
  switch (reportType) {
    case "expenses":
      return {
        monthlyExpenseUsd: context.totals.monthlyExpenseUsd,
        monthlyExpenses: context.monthlyExpenses,
        recentExpenses: context.recentExpenses
      };
    case "flights":
      return {
        quarterFlights: context.totals.quarterFlights,
        totalFlights: context.totals.totalFlights,
        recentFlights: context.recentFlights
      };
    case "clients":
      return {
        activeClients: context.totals.activeClients,
        clientActivity: context.clientActivity
      };
    case "executive":
    default:
      return {
        totals: context.totals,
        monthlyExpenses: context.monthlyExpenses.slice(0, 6),
        topClients: context.clientActivity.slice(0, 5),
        agrochemicals: context.agrochemicalTotals.slice(0, 5)
      };
  }
}

export function reportTitle(reportType: ReportType) {
  const map: Record<ReportType, string> = {
    expenses: "Reporte de Gastos",
    flights: "Reporte de Vuelos",
    clients: "Reporte de Clientes",
    executive: "Resumen Ejecutivo AgroNex"
  };
  return map[reportType];
}

export function generateReportPdf(
  reportType: ReportType,
  title: string,
  summary: string,
  metrics: Record<string, unknown>
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Tipo: ${reportType}`, 14, 26);
  doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 14, 32);

  doc.setFontSize(12);
  doc.text("Resumen", 14, 44);
  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(summary, 180);
  doc.text(summaryLines, 14, 50);

  doc.setFontSize(12);
  const metricsY = 56 + summaryLines.length * 5;
  doc.text("Metricas", 14, metricsY);
  doc.setFontSize(9);
  const metricLines = doc.splitTextToSize(JSON.stringify(metrics, null, 2), 180);
  doc.text(metricLines.slice(0, 48), 14, metricsY + 6);

  return Buffer.from(doc.output("arraybuffer"));
}
