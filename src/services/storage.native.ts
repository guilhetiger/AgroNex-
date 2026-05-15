import * as SecureStore from 'expo-secure-store';
import { User } from '../types/index';

const USER_KEY = 'AGRONEX_USER';

export const authStorage = {
  saveUser: async (user: User) => {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  getUser: async () => {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? (JSON.parse(data) as User) : null;
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
};
