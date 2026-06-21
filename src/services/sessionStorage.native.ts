import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase auth sessions (JWT + refresh token) often exceed SecureStore's ~2048-byte
 * limit. AsyncStorage is the recommended adapter for React Native / Expo.
 */
export const sessionStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
