import type { CurrencyOption } from '../types/index';
import { roundMoney } from '@utils/number';

/**
 * Moneda base de los montos en la app (ingresos estimados, gastos, precios IA, etc.).
 * Al mostrar otra moneda se multiplica por la tasa respecto al USD.
 *
 * BOB: referencia tipo cambio oficial BCB (Bs por USD), actualizar según necesidad.
 */
export const USD_TO_CURRENCY: Record<CurrencyOption, number> = {
  USD: 1,
  BOB: 6.96,
  BRL: 5.65,
  ARS: 1050,
  EUR: 0.92,
};

export function convertCurrency(amount: number, from: CurrencyOption, to: CurrencyOption) {
  const fromRate = USD_TO_CURRENCY[from] ?? 1;
  const toRate = USD_TO_CURRENCY[to] ?? 1;
  if (!Number.isFinite(amount) || fromRate <= 0 || toRate <= 0) return 0;
  return roundMoney((amount / fromRate) * toRate);
}

export function convertFromUsd(amountUsd: number, to: CurrencyOption) {
  return convertCurrency(amountUsd, 'USD', to);
}

export function convertToUsd(amount: number, from: CurrencyOption) {
  return convertCurrency(amount, from, 'USD');
}
