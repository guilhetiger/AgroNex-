import {
  createAgrochemical,
  createClient,
  createExpense,
  createFlight,
  deleteClient,
  fetchAgrochemicalData,
  fetchClientData,
  fetchExpenseData,
  fetchFarmData,
  fetchFlightData,
} from '@services/supabaseClient';

export type CreateClientInput = Parameters<typeof createClient>[0];
export type CreateFlightInput = Parameters<typeof createFlight>[0];
export type CreateAgrochemicalInput = Parameters<typeof createAgrochemical>[0];
export type CreateExpenseInput = Parameters<typeof createExpense>[0];

export const agroDataRepository = {
  fetchClients: fetchClientData,
  fetchFlights: fetchFlightData,
  fetchFarms: fetchFarmData,
  fetchAgrochemicals: fetchAgrochemicalData,
  fetchExpenses: fetchExpenseData,
  createClient,
  createFlight,
  createAgrochemical,
  createExpense,
  deleteClient,
};
