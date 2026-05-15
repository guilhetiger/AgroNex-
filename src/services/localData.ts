import { Platform } from 'react-native';

const dataModule = Platform.OS === 'web' ? require('./localData.web') : require('./localData.native');

export const initDatabase = dataModule.initDatabase;
export const saveOfflineRecord = dataModule.saveOfflineRecord;
export const getPendingSyncRecords = dataModule.getPendingSyncRecords;
export const markRecordAsSynced = dataModule.markRecordAsSynced;
export const savePreference = dataModule.savePreference;
export const loadPreference = dataModule.loadPreference;
