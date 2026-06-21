import { Platform } from 'react-native';

const service =
  Platform.OS === 'web'
    ? require('./sessionStorage.web')
    : require('./sessionStorage.native');

export const sessionStorage = service.sessionStorage;
