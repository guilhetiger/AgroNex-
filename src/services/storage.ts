import { Platform } from 'react-native';

const service = Platform.OS === 'web' ? require('./storage.web') : require('./storage.native');

export const authStorage = service.authStorage;
