import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeatherWindSettings = {
  safeWindLimitKmh: number;
  dangerWindLimitKmh: number;
};

const STORAGE_KEY = 'AGRONEX_WEATHER_SETTINGS';

export const DEFAULT_WEATHER_WIND_SETTINGS: WeatherWindSettings = {
  safeWindLimitKmh: 10,
  dangerWindLimitKmh: 15,
};

export async function getWeatherWindSettings(): Promise<WeatherWindSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_WEATHER_WIND_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<WeatherWindSettings>;
    const safe = Number(parsed.safeWindLimitKmh);
    const danger = Number(parsed.dangerWindLimitKmh);
    return {
      safeWindLimitKmh: Number.isFinite(safe) && safe > 0 ? safe : DEFAULT_WEATHER_WIND_SETTINGS.safeWindLimitKmh,
      dangerWindLimitKmh:
        Number.isFinite(danger) && danger > safe ? danger : DEFAULT_WEATHER_WIND_SETTINGS.dangerWindLimitKmh,
    };
  } catch {
    return DEFAULT_WEATHER_WIND_SETTINGS;
  }
}

export async function saveWeatherWindSettings(settings: WeatherWindSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
