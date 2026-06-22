import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeatherAlertSeverity = 'low' | 'medium' | 'high';

export type StoredWeatherAlert = {
  id: string;
  type: 'high_wind' | 'rain_incoming' | 'storm_warning' | 'unsafe_spraying';
  title: string;
  message: string;
  severity: WeatherAlertSeverity;
  createdAt: string;
  locationLabel?: string;
};

const STORAGE_KEY = 'AGRONEX_WEATHER_ALERTS';
const MAX_ALERTS = 30;

export async function loadWeatherAlerts(): Promise<StoredWeatherAlert[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StoredWeatherAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWeatherAlerts(alerts: StoredWeatherAlert[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, MAX_ALERTS)));
}

export async function appendWeatherAlerts(incoming: StoredWeatherAlert[]): Promise<StoredWeatherAlert[]> {
  if (!incoming.length) return loadWeatherAlerts();

  const existing = await loadWeatherAlerts();
  const merged = [...incoming, ...existing]
    .filter((alert, index, list) => list.findIndex((item) => item.id === alert.id) === index)
    .slice(0, MAX_ALERTS);

  await saveWeatherAlerts(merged);
  return merged;
}
