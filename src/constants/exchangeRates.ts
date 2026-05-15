import type { CurrencyOption } from '../types/index';

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
