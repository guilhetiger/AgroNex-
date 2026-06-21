const env = process.env;
const isIosBuild = env.EAS_BUILD_PLATFORM === 'ios';
const googleMapsAndroidApiKey = env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || env.GOOGLE_MAPS_ANDROID_API_KEY || '';

module.exports = ({ config }) => ({
  ...config,
  version: '1.0.0',
  ...(isIosBuild
    ? {
        scheme: 'agronex',
        ios: {
          bundleIdentifier: 'com.agronex.app',
          infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
          },
        },
      }
    : {}),
  assetBundlePatterns: ['**/*'],
  jsEngine: 'hermes',
  updates: {
    enabled: false,
    checkAutomatically: 'NEVER',
    fallbackToCacheTimeout: 0,
  },
  web: {
    bundler: 'metro',
    name: 'AgroNex',
    shortName: 'AgroNex',
    themeColor: '#030712',
    backgroundColor: '#030712',
    display: 'standalone',
    startUrl: '/',
  },
  extra: {
    expoPublicSupabaseUrl: env.EXPO_PUBLIC_SUPABASE_URL || '',
    expoPublicSupabaseAnonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    expoPublicGoogleClientId: env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
    expoPublicGoogleMapsAndroidApiKey: googleMapsAndroidApiKey,
    eas: {
      projectId: 'c707e6fe-11cd-45e3-930d-c90ae751755b',
    },
  },
});
