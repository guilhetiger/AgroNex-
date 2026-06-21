const memory = new Map<string, string>();

function storage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export const sessionStorage = {
  async getItem(key: string) {
    return storage()?.getItem(key) ?? memory.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    storage()?.setItem(key, value);
    memory.set(key, value);
  },
  async removeItem(key: string) {
    storage()?.removeItem(key);
    memory.delete(key);
  },
};
