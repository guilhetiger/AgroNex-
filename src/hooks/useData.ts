import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  agroDataRepository,
  type CreateAgrochemicalInput,
  type CreateClientInput,
  type CreateExpenseInput,
  type CreateFlightInput,
} from '@repositories/agroDataRepository';
import { useDataStore, type DataDomain } from '../store/dataStore';
import { useAuth } from './useAuth';
import { Client, Flight, Farm, Agrochemical, Expense } from '../types/index';

export const queryKeys = {
  clients: ['clients'] as const,
  flights: ['flights'] as const,
  farms: ['farms'] as const,
  agrochemicals: ['agrochemicals'] as const,
  expenses: ['expenses'] as const,
};

async function trackSync<T>(domain: DataDomain, loader: () => Promise<T>) {
  const data = await loader();
  useDataStore.getState().markSynced(domain);
  return data;
}

// Custom hooks for data fetching
export function useClients() {
  const { user } = useAuth();

  return useQuery<Client[]>({
    queryKey: [...queryKeys.clients, user?.id],
    queryFn: () => trackSync('clients', () => agroDataRepository.fetchClients(user!.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useFlights() {
  const { user } = useAuth();

  return useQuery<Flight[]>({
    queryKey: [...queryKeys.flights, user?.id],
    queryFn: () => trackSync('flights', () => agroDataRepository.fetchFlights(user!.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFarms() {
  const { user } = useAuth();

  return useQuery<Farm[]>({
    queryKey: [...queryKeys.farms, user?.id],
    queryFn: () => trackSync('farms', () => agroDataRepository.fetchFarms(user!.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useAgrochemicals() {
  const { user } = useAuth();

  return useQuery<Agrochemical[]>({
    queryKey: [...queryKeys.agrochemicals, user?.id],
    queryFn: () => trackSync('agrochemicals', () => agroDataRepository.fetchAgrochemicals(user!.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useExpenses() {
  const { user } = useAuth();

  return useQuery<Expense[]>({
    queryKey: [...queryKeys.expenses, user?.id],
    queryFn: () => trackSync('expenses', () => agroDataRepository.fetchExpenses(user!.id)),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });
}

// Mutations
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (clientData: Omit<CreateClientInput, 'owner_id'>) =>
      agroDataRepository.createClient({ ...clientData, owner_id: user!.id }),
    onSuccess: () => {
      useDataStore.getState().markSynced('clients');
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}
export function useCreateAgrochemical() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<CreateAgrochemicalInput, 'owner_id'>) =>
      agroDataRepository.createAgrochemical({ ...data, owner_id: user!.id }),
    onSuccess: () => {
      useDataStore.getState().markSynced('agrochemicals');
      queryClient.invalidateQueries({ queryKey: queryKeys.agrochemicals });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<CreateExpenseInput, 'owner_id'>) =>
      agroDataRepository.createExpense({ ...data, owner_id: user!.id }),
    onSuccess: () => {
      useDataStore.getState().markSynced('expenses');
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}
export function useCreateFlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (flightData: Omit<CreateFlightInput, 'user_id'>) =>
      agroDataRepository.createFlight({ ...flightData, user_id: user!.id }),
    onSuccess: () => {
      useDataStore.getState().markSynced('flights');
      queryClient.invalidateQueries({ queryKey: queryKeys.flights });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => agroDataRepository.deleteClient(clientId),
    onSuccess: () => {
      useDataStore.getState().markSynced('clients');
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.flights });
      queryClient.invalidateQueries({ queryKey: queryKeys.farms });
    },
  });
}
