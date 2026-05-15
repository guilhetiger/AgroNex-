import { Flight, Expense, Client } from '../types/index';
import { getClientScore, getOperationalInsights, getPriceSuggestion } from '@services/aiService';

export function useAI(client: Client | null, flights: Flight[], expenses: Expense[], country: string) {
  const clientScore = client ? getClientScore(client, flights, expenses) : null;

  const monthlyOpExUsd =
    expenses.length > 0 ? expenses.reduce((s, e) => s + e.amount, 0) / Math.min(6, expenses.length) : 0;

  const refArea =
    client?.area ||
    Math.max(
      40,
      Math.round(flights.reduce((s, f) => s + f.area_covered, 0) / Math.max(1, flights.length)) || 60
    );
  const refCrop = client?.crop || 'Soya';

  const insights = getOperationalInsights(flights, expenses);
  const price = getPriceSuggestion(country, refCrop, refArea, monthlyOpExUsd);

  return {
    clientScore,
    insights,
    price,
  };
}
