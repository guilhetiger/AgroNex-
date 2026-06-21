import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;

function getDatabase() {
  if (!database) {
    database = SQLite.openDatabaseSync('agronex.db');
  }
  return database;
}

export async function initDatabase() {
  const db = getDatabase();
  await db.execAsync('CREATE TABLE IF NOT EXISTS offline_sync (id INTEGER PRIMARY KEY AUTOINCREMENT, table_name TEXT, payload TEXT, created_at TEXT, synced INTEGER DEFAULT 0)');
  await db.execAsync('CREATE TABLE IF NOT EXISTS local_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT, updated_at TEXT)');
}

export async function saveOfflineRecord(tableName: string, payload: Record<string, any>) {
  const db = getDatabase();
  return db.runAsync('INSERT INTO offline_sync (table_name, payload, created_at, synced) VALUES (?, ?, ?, 0)', [tableName, JSON.stringify(payload), new Date().toISOString()]);
}

export async function getPendingSyncRecords() {
  const db = getDatabase();
  return db.getAllAsync('SELECT * FROM offline_sync WHERE synced = 0 ORDER BY created_at ASC');
}

export async function markRecordAsSynced(id: number) {
  const db = getDatabase();
  return db.runAsync('UPDATE offline_sync SET synced = 1 WHERE id = ?', [id]);
}

export async function savePreference(key: string, value: string) {
  const db = getDatabase();
  const now = new Date().toISOString();
  return db.runAsync('INSERT OR REPLACE INTO local_notes (key, value, updated_at) VALUES (?, ?, ?)', [key, value, now]);
}

export async function loadPreference(key: string) {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ value: string }>('SELECT value FROM local_notes WHERE key = ?', [key]);
  return result?.value ?? null;
}
