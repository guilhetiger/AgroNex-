import { create } from 'zustand';

export type DataDomain = 'clients' | 'flights' | 'farms' | 'agrochemicals' | 'expenses';

type DataStoreState = {
  lastSyncedAt: Partial<Record<DataDomain, string>>;
  markSynced: (domain: DataDomain) => void;
  resetDataStore: () => void;
};

export const useDataStore = create<DataStoreState>((set) => ({
  lastSyncedAt: {},
  markSynced: (domain) =>
    set((state) => ({
      lastSyncedAt: {
        ...state.lastSyncedAt,
        [domain]: new Date().toISOString(),
      },
    })),
  resetDataStore: () => set({ lastSyncedAt: {} }),
}));
