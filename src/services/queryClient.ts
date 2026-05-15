import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a client with offline support
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
          if (error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      networkMode: 'offlineFirst', // Try cache first, then network
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Custom storage for React Query (optional, for persistence)
export const asyncStoragePersistor = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};