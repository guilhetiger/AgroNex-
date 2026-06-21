const memoryStore = new Map<string, string>();

function getStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export async function initDatabase() {
  // No-op for web
}

export async function saveOfflineRecord(tableName: string, payload: Record<string, any>) {
  // No-op for web - offline sync not supported
  return { rows: { length: 0 } };
}

export async function getPendingSyncRecords() {
  // Return empty array for web
  return [];
}

export async function markRecordAsSynced(id: number) {
  // No-op for web
  return { rows: { length: 0 } };
}

export async function savePreference(key: string, value: string) {
  getStorage()?.setItem(`AGRONEX_LOCAL_${key}`, value);
  memoryStore.set(key, value);
  return { rows: { length: 1 } };
}

export async function loadPreference(key: string) {
  const stored = getStorage()?.getItem(`AGRONEX_LOCAL_${key}`);
  if (stored != null) return stored;
  return memoryStore.get(key) || null;
}
