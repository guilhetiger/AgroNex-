import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { initDatabase, getPendingSyncRecords, markRecordAsSynced } from '@services/localData';
import { supabase, hasSupabaseConfig } from '@services/supabaseClient';
import { queryClient } from '@services/queryClient';
import { queryKeys } from '@hooks/useData';

const LAST_SYNC_KEY = 'AGRONEX_LAST_SYNC_AT';

async function invalidateAllLists() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.clients }),
    queryClient.invalidateQueries({ queryKey: queryKeys.flights }),
    queryClient.invalidateQueries({ queryKey: queryKeys.farms }),
    queryClient.invalidateQueries({ queryKey: queryKeys.agrochemicals }),
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses }),
  ]);
}

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_SYNC_KEY).then((value) => {
      if (value) setLastSyncedAt(value);
    });
  }, []);

  const syncPendingData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        return;
      }

      await initDatabase();

      if (hasSupabaseConfig) {
        const pending = await getPendingSyncRecords();
        for (const record of pending) {
          const payload = JSON.parse(record.payload);
          try {
            if (record.table_name === 'clients') {
              await supabase.from('clients').insert(payload);
            } else if (record.table_name === 'flights') {
              await supabase.from('flights').insert(payload);
            } else if (record.table_name === 'agrochemicals') {
              await supabase.from('agrochemicals').insert(payload);
            } else if (record.table_name === 'expenses') {
              await supabase.from('expenses').insert(payload);
            }
            await markRecordAsSynced(record.id);
          } catch (error) {
            console.warn('Sync failed for record', record.id, error);
          }
        }
      }

      const ts = new Date().toISOString();
      await AsyncStorage.setItem(LAST_SYNC_KEY, ts);
      setLastSyncedAt(ts);
      await invalidateAllLists();
    } catch (error) {
      console.warn('Offline sync failed', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    initDatabase();
    syncPendingData();
  }, [syncPendingData]);

  return {
    isSyncing,
    lastSyncedAt,
    syncNow: syncPendingData,
  };
}
