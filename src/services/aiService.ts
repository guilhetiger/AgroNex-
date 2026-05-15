import { Client, Expense, Flight } from '../types/index';

export function getClientScore(client: Client, flights: Flight[], expenses: Expense[]) {
  const activityScore = Math.min(100, flights.length * 8 + client.area);
  const financialScore = Math.max(0, 100 - expenses.filter((item) => item.vendor.toLowerCase().includes('deuda')).length * 12);
  const reliability = client.area > 40 ? 90 : 70;
  const score = Math.round(activityScore * 0.45 + financialScore * 0.35 + reliability * 0.2);

  const category = score > 75 ? 'good' : score > 50 ? 'average' : 'risky';

  return {
    score,
    category,
    breakdown: {
      activity: Math.round(activityScore),
      financial: Math.round(financialScore),
      reliability,
    },
    reasons: [
      `${flights.length} vuelos registrados para este cliente.`,
      `${client.area} hectáreas bajo seguimiento comercial.`,
      financialScore >= 90 ? 'Sin alertas financieras fuertes en el historial.' : 'Hay señales financieras que conviene revisar.',
    ],
    recommendation:
      category === 'good'
        ? 'Cliente con buena rentabilidad y constancia en los servicios.'
        : category === 'average'
          ? 'Cliente moderado, monitorear frecuencia y pagos.'
          : 'Cliente riesgoso, revisar historial de pagos y retrasos.',
  };
}

/**
 * Precio sugerido por hectárea (USD interno). Considera país, cultivo, tamaño y presión de OPEX mensual.
 */
export function getPriceSuggestion(country: string, crop: string, size: number, monthlyOpExUsd = 0) {
  const baseRate = country === 'BO' ? 60 : country === 'BR' ? 70 : country === 'AR' ? 65 : 75;
  const cropName = crop.toLowerCase();
  const cropModifier = cropName.includes('soya') ? 1 : cropName.includes('maíz') || cropName.includes('maiz') ? 1.05 : 1.1;
  const sizeModifier = size > 50 ? 0.95 : size < 15 ? 1.15 : 1.0;
  const costPressure = Math.min(1.14, 1 + monthlyOpExUsd / 8500);
  const suggested = Math.round(baseRate * cropModifier * sizeModifier * costPressure);

  return {
    suggestedPricePerHectare: suggested,
    margin: Math.round(((suggested - baseRate) / baseRate) * 100),
    explanation:
      monthlyOpExUsd > 2800
        ? 'OPEX mensual elevado: se ajusta el precio sugerido para proteger margen operativo.'
        : 'Recomendación basada en país, cultivo, tamaño del lote y estructura de costos reciente.',
  };
}

export function getOperationalInsights(flights: Flight[], expenses: Expense[]) {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalFlightMinutes = flights.reduce((sum, flight) => sum + flight.duration, 0);
  const totalHa = flights.reduce((sum, flight) => sum + flight.area_covered, 0);
  const revenueProxy = totalHa * 95;
  const marginProxy = revenueProxy - totalExpenses;
  const riskAlerts =
    totalExpenses > 5000
      ? ['Gastos elevados en el periodo.', 'Revisar categorías con mayor peso en el flujo de caja.']
      : totalExpenses > 2500
        ? ['Gastos en rango medio: mantener disciplina de registro por vuelo.']
        : [];

  const financialOutlook =
    marginProxy > 20000
      ? 'Proyección de margen amplia frente a gastos registrados; capacidad para reinvertir en flota.'
      : marginProxy > 8000
        ? 'Rentabilidad operativa positiva; monitorear combustible y repuestos en la próxima campaña.'
        : 'Margen ajustado: priorizar contratos por hectárea y revisar frecuencia de vuelos vs. OPEX.';

  return {
    efficiencyScore: Math.min(100, Math.round((flights.length * 8 + 1000 / (totalExpenses + 1)) / 2)),
    riskAlerts,
    financialOutlook,
    quickTips: [
      totalFlightMinutes > 200 ? 'Optimizar rutas para reducir tiempo de vuelo.' : 'Mantener registros precisos de baterías y consumo.',
      totalExpenses > 3000 ? 'Revisar costos de repuestos y mantenimiento.' : 'Buen control de gastos operativos.',
    ],
  };
}
