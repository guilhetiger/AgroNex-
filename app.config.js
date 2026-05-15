const { config } = require('dotenv');

config({ path: '.env.local' });
config();

module.exports = {
  expo: {
    name: 'AgroNex',
    slug: 'agronex',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    scheme: 'agronex',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.agronex.app',
      buildNumber: '1',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.agronex.app',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#030712',
      },
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
    plugins: ['expo-font', 'expo-notifications'],
    extra: {
      expoPublicSupabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      expoPublicSupabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'c707e6fe-11cd-45e3-930d-c90ae751755b',
      },
    },
  },
};
