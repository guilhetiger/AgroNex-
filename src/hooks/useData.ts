import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchClientData,
  fetchFlightData,
  fetchFarmData,
  fetchAgrochemicalData,
  fetchExpenseData,
  createClient,
  createFlight,
  createAgrochemical,
  createExpense,
  deleteClient,
} from '../services/supabaseClient';
import { useAuth } from './useAuth';
import { Client, Flight, Farm, Agrochemical, Expense } from '../types/index';

export const queryKeys = {
  clients: ['clients'] as const,
  flights: ['flights'] as const,
  farms: ['farms'] as const,
  agrochemicals: ['agrochemicals'] as const,
  expenses: ['expenses'] as const,
};

// Custom hooks for data fetching
export function useClients() {
  const { user } = useAuth();

  return useQuery<Client[]>({
    queryKey: [...queryKeys.clients, user?.id],
    queryFn: () => fetchClientData(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useFlights() {
  const { user } = useAuth();

  return useQuery<Flight[]>({
    queryKey: [...queryKeys.flights, user?.id],
    queryFn: () => fetchFlightData(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFarms() {
  const { user } = useAuth();

  return useQuery<Farm[]>({
    queryKey: [...queryKeys.farms, user?.id],
    queryFn: () => fetchFarmData(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useAgrochemicals() {
  const { user } = useAuth();

  return useQuery<Agrochemical[]>({
    queryKey: [...queryKeys.agrochemicals, user?.id],
    queryFn: () => fetchAgrochemicalData(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useExpenses() {
  const { user } = useAuth();

  return useQuery<Expense[]>({
    queryKey: [...queryKeys.expenses, user?.id],
    queryFn: () => fetchExpenseData(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });
}

// Mutations
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (clientData: Omit<Parameters<typeof createClient>[0], 'owner_id'>) =>
      createClient({ ...clientData, owner_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
}
export function useCreateAgrochemical() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof createAgrochemical>[0], 'owner_id'>) =>
      createAgrochemical({ ...data, owner_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agrochemicals });
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<Parameters<typeof createExpense>[0], 'owner_id'>) =>
      createExpense({ ...data, owner_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}
export function useCreateFlight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (flightData: Omit<Parameters<typeof createFlight>[0], 'user_id'>) =>
      createFlight({ ...flightData, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flights });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.flights });
      queryClient.invalidateQueries({ queryKey: queryKeys.farms });
    },
  });
}
