import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types/index';

export type AuditAction = 'login' | 'logout' | 'admin_action' | 'invalid_session';

export type AuditRecord = {
  id: string;
  user_id: string;
  email?: string;
  role: UserRole;
  action: AuditAction;
  details?: string;
  timestamp: string;
};

const AUDIT_LOG_KEY = 'AGRONEX_AUDIT_LOGS';

async function readAuditStorage(): Promise<AuditRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(AUDIT_LOG_KEY);
    return raw ? (JSON.parse(raw) as AuditRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeAuditStorage(records: AuditRecord[]) {
  await AsyncStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(records));
}

export const auditService = {
  async record(event: Omit<AuditRecord, 'id' | 'timestamp'>) {
    const current = await readAuditStorage();
    const record: AuditRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    await writeAuditStorage([record, ...current]);
    return record;
  },
  async getAll() {
    return readAuditStorage();
  },
  async clear() {
    await AsyncStorage.removeItem(AUDIT_LOG_KEY);
  },
};
