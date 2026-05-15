// Web version - stores data in localStorage
import { User } from '../types/index';

const USER_KEY = 'AGRONEX_USER';

export const authStorage = {
  saveUser: async (user: User) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  getUser: async () => {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(USER_KEY);
      return data ? (JSON.parse(data) as User) : null;
    }
    return null;
  },
  clear: async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  }
};
