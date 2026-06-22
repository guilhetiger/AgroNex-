import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackWeatherUsage } from '@services/analyticsService';
import { appendWeatherAlerts, type StoredWeatherAlert } from '@services/weatherAlertStore';
import {
  DEFAULT_WEATHER_WIND_SETTINGS,
  getWeatherWindSettings,
  saveWeatherWindSettings,
  type WeatherWindSettings,
} from '@services/weatherSettingsStore';
import { dispatchWeatherNotifications } from '@services/weatherNotificationService';

const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const MEMORY_CACHE_TTL_MS = 10 * 60 * 1000;
const OFFLINE_CACHE_PREFIX = 'AGRONEX_WEATHER_BUNDLE_';

export type SprayingStatus = 'green' | 'yellow' | 'red';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  windDirection: number;
  precipitation: number;
  rainProbability: number;
  cloudCoverage: number;
  visibility: number;
  condition: string;
  uvIndex: number;
  pressure: number;
  fetchedAt: string;
  source: 'openweather' | 'cache' | 'offline';
}

export interface WeatherForecast {
  date: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  precipitation: number;
  rainProbability: number;
  cloudCoverage: number;
  condition: string;
}

export interface HourlyForecast {
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  rainProbability: number;
  cloudCoverage: number;
  condition: string;
}

export interface WeatherBundle {
  current: WeatherData;
  hourly: HourlyForecast[];
  daily: WeatherForecast[];
  alerts: StoredWeatherAlert[];
  spraying: SprayingRecommendation;
}

export interface SprayingRecommendation {
  status: SprayingStatus;
  recommendation: string;
  windSpeedKmh: number;
  humidity: number;
  rainRiskPercent: number;
  reasons: string[];
}

type MemoryCacheEntry = {
  bundle: WeatherBundle;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryCacheEntry>();

function msToKmh(speedMs?: number) {
  return Math.round((speedMs ?? 0) * 3.6 * 10) / 10;
}

function cacheKey(lat: number, lon: number) {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function offlineStorageKey(lat: number, lon: number) {
  return `${OFFLINE_CACHE_PREFIX}${cacheKey(lat, lon)}`;
}

function hasApiKey() {
  return !!WEATHER_API_KEY && !WEATHER_API_KEY.includes('your-') && WEATHER_API_KEY.length > 8;
}

function windDirectionLabel(degrees: number) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
}

function isStormCondition(condition: string) {
  const value = condition.toLowerCase();
  return value.includes('thunder') || value.includes('storm') || value.includes('tornado');
}

function minutesAgoLabel(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes <= 1) return 'Actualizado hace 1 minuto';
  return `Actualizado hace ${minutes} minutos`;
}

export function formatWeatherUpdatedLabel(weather: WeatherData) {
  if (weather.source === 'offline') {
    return `Última actualización ${minutesAgoLabel(weather.fetchedAt).replace('Actualizado hace', 'hace')} (sin conexión)`;
  }
  return minutesAgoLabel(weather.fetchedAt);
}


async function fetchCurrentFromApi(lat: number, lon: number): Promise<WeatherData> {
  const url = `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeather current failed (${response.status})`);
  }

  const data = await response.json();
  return {
    temperature: data.main?.temp ?? 0,
    humidity: data.main?.humidity ?? 0,
    windSpeed: msToKmh(data.wind?.speed),
    windGust: data.wind?.gust != null ? msToKmh(data.wind.gust) : undefined,
    windDirection: data.wind?.deg ?? 0,
    precipitation: data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0,
    rainProbability: isStormCondition(data.weather?.[0]?.main ?? '') ? 80 : data.clouds?.all > 80 ? 45 : 0,
    cloudCoverage: data.clouds?.all ?? 0,
    visibility: (data.visibility ?? 10000) / 1000,
    condition: data.weather?.[0]?.main ?? 'Unknown',
    uvIndex: 0,
    pressure: data.main?.pressure ?? 0,
    fetchedAt: new Date().toISOString(),
    source: 'openweather',
  };
}

async function fetchForecastFromApi(lat: number, lon: number): Promise<{ hourly: HourlyForecast[]; daily: WeatherForecast[] }> {
  const url = `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenWeather forecast failed (${response.status})`);
  }

  const data = await response.json();
  const list = Array.isArray(data.list) ? data.list : [];

  const hourly: HourlyForecast[] = list.slice(0, 8).map((item: any) => ({
    timestamp: new Date((item.dt ?? 0) * 1000).toISOString(),
    temperature: item.main?.temp ?? 0,
    humidity: item.main?.humidity ?? 0,
    windSpeed: msToKmh(item.wind?.speed),
    windGust: item.wind?.gust != null ? msToKmh(item.wind.gust) : undefined,
    rainProbability: Math.round((item.pop ?? 0) * 100),
    cloudCoverage: item.clouds?.all ?? 0,
    condition: item.weather?.[0]?.main ?? 'Unknown',
  }));

  const dailyMap = new Map<string, WeatherForecast>();
  for (const item of list) {
    const date = new Date((item.dt ?? 0) * 1000).toISOString().split('T')[0];
    const candidate: WeatherForecast = {
      date,
      temperature: item.main?.temp ?? 0,
      humidity: item.main?.humidity ?? 0,
      windSpeed: msToKmh(item.wind?.speed),
      windGust: item.wind?.gust != null ? msToKmh(item.wind.gust) : undefined,
      precipitation: item.rain?.['3h'] ?? 0,
      rainProbability: Math.round((item.pop ?? 0) * 100),
      cloudCoverage: item.clouds?.all ?? 0,
      condition: item.weather?.[0]?.main ?? 'Unknown',
    };

    const existing = dailyMap.get(date);
    if (!existing || candidate.rainProbability > existing.rainProbability) {
      dailyMap.set(date, candidate);
    }
  }

  return { hourly, daily: Array.from(dailyMap.values()).slice(0, 5) };
}

export function getSprayingRecommendation(
  current: WeatherData,
  hourly: HourlyForecast[] = [],
  settings: WeatherWindSettings = DEFAULT_WEATHER_WIND_SETTINGS
): SprayingRecommendation {
  const effectiveWind = Math.max(current.windSpeed, current.windGust ?? 0);
  const nextTwoHours = hourly.slice(0, 2);
  const rainRiskPercent = Math.max(
    current.rainProbability,
    ...nextTwoHours.map((item) => item.rainProbability),
    current.precipitation > 0 ? 70 : 0
  );

  const reasons: string[] = [];
  let status: SprayingStatus = 'green';

  if (effectiveWind >= settings.dangerWindLimitKmh) {
    reasons.push(`Viento fuerte (${effectiveWind} km/h)`);
    status = 'red';
  } else if (effectiveWind >= settings.safeWindLimitKmh) {
    reasons.push(`Viento moderado (${effectiveWind} km/h)`);
    status = 'yellow';
  }

  if (isStormCondition(current.condition) || nextTwoHours.some((item) => isStormCondition(item.condition))) {
    reasons.push('Condiciones de tormenta');
    status = 'red';
  } else if (rainRiskPercent >= 60) {
    reasons.push(`Alta probabilidad de lluvia (${rainRiskPercent}%)`);
    status = 'red';
  } else if (rainRiskPercent >= 30) {
    reasons.push(`Probabilidad de lluvia (${rainRiskPercent}%)`);
    status = status === 'red' ? 'red' : 'yellow';
  }

  if (current.humidity > 92 || current.humidity < 25) {
    reasons.push(`Humedad fuera de rango (${Math.round(current.humidity)}%)`);
    status = status === 'red' ? 'red' : 'yellow';
  }

  const recommendation =
    status === 'green'
      ? 'Condiciones seguras para fumigación.'
      : status === 'yellow'
        ? 'Proceder con precaución.'
        : 'Fumigación no recomendada.';

  return {
    status,
    recommendation,
    windSpeedKmh: effectiveWind,
    humidity: current.humidity,
    rainRiskPercent,
    reasons: reasons.length ? reasons : ['Condiciones favorables'],
  };
}

export function buildWeatherAlerts(
  current: WeatherData,
  hourly: HourlyForecast[],
  spraying: SprayingRecommendation,
  locationLabel = 'Ubicación operativa',
  settings: WeatherWindSettings = DEFAULT_WEATHER_WIND_SETTINGS
): StoredWeatherAlert[] {
  const alerts: StoredWeatherAlert[] = [];
  const now = new Date().toISOString();
  const nextTwoHours = hourly.slice(0, 2);
  const maxUpcomingRain = Math.max(...nextTwoHours.map((item) => item.rainProbability), current.rainProbability);

  if (spraying.windSpeedKmh >= settings.dangerWindLimitKmh) {
    alerts.push({
      id: `high_wind_${locationLabel}_${now}`,
      type: 'high_wind',
      title: 'Alerta de viento alto',
      message: `Viento de ${spraying.windSpeedKmh} km/h en ${locationLabel}.`,
      severity: spraying.windSpeedKmh >= 20 ? 'high' : 'medium',
      createdAt: now,
      locationLabel,
    });
  }

  if (maxUpcomingRain >= 40) {
    alerts.push({
      id: `rain_incoming_${locationLabel}_${now}`,
      type: 'rain_incoming',
      title: 'Lluvia próxima',
      message: `Probabilidad de lluvia ${maxUpcomingRain}% en las próximas horas (${locationLabel}).`,
      severity: maxUpcomingRain >= 70 ? 'high' : 'medium',
      createdAt: now,
      locationLabel,
    });
  }

  if (isStormCondition(current.condition) || nextTwoHours.some((item) => isStormCondition(item.condition))) {
    alerts.push({
      id: `storm_${locationLabel}_${now}`,
      type: 'storm_warning',
      title: 'Advertencia de tormenta',
      message: `Se detectaron condiciones de tormenta en ${locationLabel}.`,
      severity: 'high',
      createdAt: now,
      locationLabel,
    });
  }

  if (spraying.status === 'red') {
    alerts.push({
      id: `unsafe_${locationLabel}_${now}`,
      type: 'unsafe_spraying',
      title: 'Fumigación no recomendada',
      message: `${spraying.recommendation} ${spraying.reasons.join('. ')}`,
      severity: 'high',
      createdAt: now,
      locationLabel,
    });
  }

  return alerts;
}

async function persistOfflineBundle(lat: number, lon: number, bundle: WeatherBundle) {
  await AsyncStorage.setItem(offlineStorageKey(lat, lon), JSON.stringify(bundle));
}

async function readOfflineBundle(lat: number, lon: number): Promise<WeatherBundle | null> {
  const raw = await AsyncStorage.getItem(offlineStorageKey(lat, lon));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as WeatherBundle;
    return {
      ...parsed,
      current: { ...parsed.current, source: 'offline' },
    };
  } catch {
    return null;
  }
}

export async function getWeatherBundle(
  lat: number,
  lon: number,
  options?: { userId?: string; locationLabel?: string; notify?: boolean }
): Promise<WeatherBundle> {
  const key = cacheKey(lat, lon);
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.bundle;
  }

  const settings = await getWeatherWindSettings();

  if (!hasApiKey()) {
    const offline = await readOfflineBundle(lat, lon);
    if (offline) return offline;
    throw new Error('Configura EXPO_PUBLIC_WEATHER_API_KEY para obtener clima real.');
  }

  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentFromApi(lat, lon),
      fetchForecastFromApi(lat, lon),
    ]);

    const spraying = getSprayingRecommendation(current, forecast.hourly, settings);
    const alerts = buildWeatherAlerts(current, forecast.hourly, spraying, options?.locationLabel, settings);
    const bundle: WeatherBundle = {
      current,
      hourly: forecast.hourly,
      daily: forecast.daily,
      alerts,
      spraying,
    };

    memoryCache.set(key, { bundle, expiresAt: Date.now() + MEMORY_CACHE_TTL_MS });
    await persistOfflineBundle(lat, lon, bundle);

    if (options?.userId) {
      await trackWeatherUsage(options.userId, 'request', { lat, lon, source: 'openweather' });
      if (alerts.length) {
        await trackWeatherUsage(options.userId, 'alert', {
          count: alerts.length,
          locationLabel: options.locationLabel,
        });
      }
      if (spraying.status === 'red') {
        await trackWeatherUsage(options.userId, 'unsafe_flight', {
          wind: spraying.windSpeedKmh,
          rainRisk: spraying.rainRiskPercent,
        });
      }
    }

    if (alerts.length) {
      await appendWeatherAlerts(alerts);
      if (options?.notify !== false) {
        await dispatchWeatherNotifications(alerts);
      }
    }

    return bundle;
  } catch (error) {
    const offline = await readOfflineBundle(lat, lon);
    if (offline) return offline;
    throw error instanceof Error ? error : new Error('Unable to fetch weather data');
  }
}

export async function getCurrentWeather(lat: number, lon: number, userId?: string): Promise<WeatherData> {
  const bundle = await getWeatherBundle(lat, lon, { userId, notify: false });
  return bundle.current;
}

export async function getWeatherForecast(lat: number, lon: number, days = 5, userId?: string): Promise<WeatherForecast[]> {
  const bundle = await getWeatherBundle(lat, lon, { userId, notify: false });
  return bundle.daily.slice(0, days);
}

export function getFlightRecommendation(weather: WeatherData, hourly: HourlyForecast[] = [], settings?: WeatherWindSettings) {
  const spraying = getSprayingRecommendation(weather, hourly, settings);
  return {
    recommended: spraying.status !== 'red',
    reason: spraying.recommendation,
    riskLevel: spraying.status === 'green' ? 'low' : spraying.status === 'yellow' ? 'medium' : 'high',
    spraying,
  } as const;
}

export function getCropRecommendation(weather: WeatherData, cropType: string): string {
  const recommendations: string[] = [];

  if (weather.precipitation > 5 || weather.rainProbability > 60) {
    recommendations.push('Monitorear drenaje y posibles inundaciones');
  }

  if (weather.temperature > 30) {
    recommendations.push(`Considerar riego adicional para ${cropType}`);
  }

  if (weather.humidity > 80) {
    recommendations.push('Vigilar enfermedades fúngicas por alta humedad');
  }

  return recommendations.length > 0
    ? recommendations.join('. ')
    : 'Condiciones climáticas favorables para el cultivo';
}

export { windDirectionLabel, getWeatherWindSettings, saveWeatherWindSettings, DEFAULT_WEATHER_WIND_SETTINGS };
export type { WeatherWindSettings };
