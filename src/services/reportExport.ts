import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type ReportExportPayload = {
  profitUsd: number;
  expensesUsd: number;
  profitDisplay: number;
  expensesDisplay: number;
  currency: string;
  totalHectares: number;
  flightCount: number;
  bestClient: string;
  topProduct: string;
  efficiencyHaPerFlight: number;
  generatedAtIso: string;
};

export function buildReportCsv(p: ReportExportPayload): string {
  return [
    'AgroNex;exportacion_csv',
    `fecha_iso;${p.generatedAtIso}`,
    `lucro_estimado_usd;${p.profitUsd}`,
    `lucro_estimado_${p.currency.toLowerCase()};${p.profitDisplay}`,
    `gastos_usd;${p.expensesUsd}`,
    `gastos_${p.currency.toLowerCase()};${p.expensesDisplay}`,
    `hectareas_aplicadas;${p.totalHectares}`,
    `vuelos;${p.flightCount}`,
    `cliente_top;${escapeCsv(p.bestClient)}`,
    `producto_top;${escapeCsv(p.topProduct)}`,
    `eficiencia_ha_por_vuelo;${p.efficiencyHaPerFlight}`,
  ].join('\n');
}

function escapeCsv(s: string): string {
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildReportHtml(p: ReportExportPayload): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:28px;background:#0b0d0f;color:#e8eef5;}
    h1{font-size:22px;margin:0 0 8px;color:#3ee8a8;}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#8b95ff;margin:24px 0 10px;}
    table{width:100%;border-collapse:collapse;font-size:14px;}
    td{padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.08);}
    td:first-child{color:#9aa3b5;width:42%;}
    .muted{color:#6b7380;font-size:12px;margin-top:16px;}
  </style></head><body>
    <h1>AgroNex — Reporte ejecutivo</h1>
    <p class="muted">Generado: ${p.generatedAtIso}</p>
    <h2>Resumen financiero</h2>
    <table>
      <tr><td>Lucro estimado (USD)</td><td><strong>${p.profitUsd.toFixed(2)}</strong></td></tr>
      <tr><td>Lucro estimado (${p.currency})</td><td><strong>${p.profitDisplay.toFixed(2)}</strong></td></tr>
      <tr><td>Gastos (USD)</td><td>${p.expensesUsd.toFixed(2)}</td></tr>
      <tr><td>Gastos (${p.currency})</td><td>${p.expensesDisplay.toFixed(2)}</td></tr>
      <tr><td>Hectáreas aplicadas</td><td>${p.totalHectares}</td></tr>
      <tr><td>Vuelos</td><td>${p.flightCount}</td></tr>
      <tr><td>Eficiencia ha/vuelo</td><td>${p.efficiencyHaPerFlight}</td></tr>
    </table>
    <h2>Operación</h2>
    <table>
      <tr><td>Cliente destacado</td><td>${escapeHtml(p.bestClient)}</td></tr>
      <tr><td>Producto más usado</td><td>${escapeHtml(p.topProduct)}</td></tr>
    </table>
    <p class="muted">Documento generado en la app. Conectar backend para series históricas y firma digital.</p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function shareCsvFile(csv: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Share.share({ title: 'AgroNex CSV', message: csv });
    return;
  }
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) {
    await Share.share({ title: 'AgroNex CSV', message: csv });
    return;
  }
  const path = `${base}agronex-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const can = await Sharing.isAvailableAsync();
  if (can) {
    await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Exportar CSV' });
  } else {
    await Share.share({ title: 'AgroNex', message: csv });
  }
}

export async function sharePdfFromHtml(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Share.share({
      title: 'AgroNex PDF',
      message: 'En la app móvil puedes generar un PDF descargable. En web usa exportación CSV desde Reportes.',
    });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const can = await Sharing.isAvailableAsync();
  if (can) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartir PDF' });
  } else {
    await Share.share({ title: 'AgroNex PDF', url: uri });
  }
}

export async function sharePlainMessage(title: string, body: string): Promise<void> {
  await Share.share({ title, message: body });
}
