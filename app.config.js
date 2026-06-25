const env = process.env;
const isIosBuild = env.EAS_BUILD_PLATFORM === 'ios';
const googleMapsAndroidApiKey = env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || env.GOOGLE_MAPS_ANDROID_API_KEY || '';

module.exports = ({ config }) => ({
  ...config,
  version: '1.0.0',
  scheme: 'agronex',
  ios: {
    bundleIdentifier: 'com.agronex.app',
    ...(isIosBuild
      ? {
          infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
          },
        }
      : {}),
  },
  android: {
    package: 'com.agronex.app',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: false,
        data: [{ scheme: 'agronex' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
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
    expoPublicAiApiUrl:
      env.EXPO_PUBLIC_AI_API_URL || 'https://agronex-production-a195.up.railway.app',
    expoPublicGoogleMapsAndroidApiKey: googleMapsAndroidApiKey,
    eas: {
      projectId: 'c707e6fe-11cd-45e3-930d-c90ae751755b',
    },
  },
});
