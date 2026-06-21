import Constants from 'expo-constants';
import { Platform } from 'react-native';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function getExpoDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { hostUri?: string } | undefined)?.hostUri ??
    Constants.linkingUri;

  if (!hostUri) return null;

  const host = hostUri.replace(/^[^:]+:\/\//, '').split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function resolveDevLocalhost(url: string): string {
  const port = url.match(/:(\d+)/)?.[1] ?? '3000';
  const expoHost = getExpoDevHost();

  if (Platform.OS === 'android') {
    if (expoHost) return `http://${expoHost}:${port}`;
    return `http://10.0.2.2:${port}`;
  }

  if (Platform.OS === 'ios' && expoHost) {
    return `http://${expoHost}:${port}`;
  }

  return url;
}

export function getAiApiBaseUrl(): string {
  const envUrl = trimTrailingSlash(process.env.EXPO_PUBLIC_AI_API_URL || '');
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const extraUrl = trimTrailingSlash(extra.expoPublicAiApiUrl || '');
  const configured = envUrl || extraUrl;

  if (!configured) return '';

  if (__DEV__ && /localhost|127\.0\.0\.1/.test(configured)) {
    return resolveDevLocalhost(configured);
  }

  return configured;
}

export function isAiApiConfigured(): boolean {
  return getAiApiBaseUrl().length > 0;
}

export function getAiApiConfigHint(): string {
  const base = getAiApiBaseUrl();
  if (!base) {
    return 'Define EXPO_PUBLIC_AI_API_URL en .env.local (ej. http://TU_IP_LAN:3000) y reinicia Expo.';
  }

  if (__DEV__) {
    return `Backend esperado en ${base}. En dispositivo físico usa la IP de tu PC, no localhost. Ejecuta: cd apps/agronex-ai-api && npm run dev`;
  }

  return `Backend configurado en ${base}. Verifica que el servicio esté en línea.`;
}
