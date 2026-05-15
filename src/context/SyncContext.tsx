import React, { createContext, useContext } from 'react';
import { useOfflineSync } from '@hooks/useOfflineSync';

type SyncContextValue = {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue>({
  isSyncing: false,
  lastSyncedAt: null,
  syncNow: async () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isSyncing, lastSyncedAt, syncNow } = useOfflineSync();

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncedAt, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
