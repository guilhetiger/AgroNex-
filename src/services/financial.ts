import type { Agrochemical, Client, Expense, Flight } from '../types/index';
import { roundMoney } from '@utils/number';

export const DEFAULT_PRICE_PER_HECTARE_USD = 110;

export function getAppliedHectares(flights: Flight[] = []) {
  return roundMoney(flights.reduce((sum, flight) => sum + (flight.area_covered || 0), 0), 2);
}

export function getPipelineHectares(clients: Client[] = []) {
  return roundMoney(clients.reduce((sum, client) => sum + (client.area || 0), 0), 2);
}

export function getExpensesUsd(expenses: Expense[] = []) {
  return roundMoney(expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0), 2);
}

export function getInventoryValueUsd(chemicals: Agrochemical[] = []) {
  return roundMoney(
    chemicals.reduce((sum, item) => sum + (item.stock || 0) * (item.unit_cost_usd || 0), 0),
    2,
  );
}

export function getRevenueUsd(appliedHectares: number, pricePerHectareUsd = DEFAULT_PRICE_PER_HECTARE_USD) {
  return roundMoney(appliedHectares * pricePerHectareUsd, 2);
}

export function getProfitUsd(revenueUsd: number, expensesUsd: number) {
  return roundMoney(revenueUsd - expensesUsd, 2);
}

export function getCostPerHectareUsd(expensesUsd: number, appliedHectares: number) {
  return appliedHectares > 0 ? roundMoney(expensesUsd / appliedHectares, 2) : 0;
}
