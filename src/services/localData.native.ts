import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('agronex.db') as any;

type SqlResult = { rows: { length: number; item: (index: number) => any } };

function executeSql<T>(sql: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_tx: any, result: any) => resolve(result as T),
        (_tx: any, error: any) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

export async function initDatabase() {
  await executeSql('CREATE TABLE IF NOT EXISTS offline_sync (id INTEGER PRIMARY KEY AUTOINCREMENT, table_name TEXT, payload TEXT, created_at TEXT, synced INTEGER DEFAULT 0)');
  await executeSql('CREATE TABLE IF NOT EXISTS local_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT, updated_at TEXT)');
}

export async function saveOfflineRecord(tableName: string, payload: Record<string, any>) {
  return executeSql('INSERT INTO offline_sync (table_name, payload, created_at, synced) VALUES (?, ?, ?, 0)', [tableName, JSON.stringify(payload), new Date().toISOString()]);
}

export async function getPendingSyncRecords() {
  const result = await executeSql<SqlResult>('SELECT * FROM offline_sync WHERE synced = 0 ORDER BY created_at ASC');
  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
}

export async function markRecordAsSynced(id: number) {
  return executeSql('UPDATE offline_sync SET synced = 1 WHERE id = ?', [id]);
}

export async function savePreference(key: string, value: string) {
  const now = new Date().toISOString();
  return executeSql('INSERT OR REPLACE INTO local_notes (key, value, updated_at) VALUES (?, ?, ?)', [key, value, now]);
}

export async function loadPreference(key: string) {
  const result = await executeSql<SqlResult>('SELECT value FROM local_notes WHERE key = ?', [key]);
  if (result.rows.length > 0) {
    return result.rows.item(0).value;
  }
  return null;
}
