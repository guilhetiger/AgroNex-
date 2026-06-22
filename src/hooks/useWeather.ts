import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { loadWeatherAlerts } from '@services/weatherAlertStore';
import {
  getCropRecommendation,
  getCurrentWeather,
  getFlightRecommendation,
  getWeatherBundle,
  getWeatherForecast,
  type WeatherBundle,
} from '@services/weatherService';

export const weatherKeys = {
  current: (lat: number, lon: number) => ['weather', 'current', lat, lon] as const,
  forecast: (lat: number, lon: number, days: number) => ['weather', 'forecast', lat, lon, days] as const,
  bundle: (lat: number, lon: number, label?: string) => ['weather', 'bundle', lat, lon, label ?? ''] as const,
  alerts: () => ['weather', 'alerts'] as const,
};

const DEFAULT_COORDS = { latitude: -16.4897, longitude: -68.1193 };

export function useWeatherBundle(
  lat: number,
  lon: number,
  options?: { enabled?: boolean; locationLabel?: string; userId?: string; notify?: boolean }
) {
  const enabled = options?.enabled !== false && Number.isFinite(lat) && Number.isFinite(lon);

  return useQuery<WeatherBundle>({
    queryKey: weatherKeys.bundle(lat, lon, options?.locationLabel),
    queryFn: () =>
      getWeatherBundle(lat, lon, {
        userId: options?.userId,
        locationLabel: options?.locationLabel,
        notify: options?.notify,
      }),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useWeatherAlerts() {
  return useQuery({
    queryKey: weatherKeys.alerts(),
    queryFn: loadWeatherAlerts,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}

export function useCurrentWeather(lat: number, lon: number, enabled = true, userId?: string) {
  return useQuery({
    queryKey: weatherKeys.current(lat, lon),
    queryFn: () => getCurrentWeather(lat, lon, userId),
    enabled: enabled && Number.isFinite(lat) && Number.isFinite(lon),
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useWeatherForecast(lat: number, lon: number, days = 5, enabled = true, userId?: string) {
  return useQuery({
    queryKey: weatherKeys.forecast(lat, lon, days),
    queryFn: () => getWeatherForecast(lat, lon, days, userId),
    enabled: enabled && Number.isFinite(lat) && Number.isFinite(lon),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useFlightRecommendation(lat: number, lon: number, userId?: string) {
  const { data: bundle } = useWeatherBundle(lat, lon, { userId, notify: false });

  return {
    recommendation: bundle ? getFlightRecommendation(bundle.current, bundle.hourly).spraying : null,
    legacyRecommendation: bundle ? getFlightRecommendation(bundle.current, bundle.hourly) : null,
    weather: bundle?.current ?? null,
    spraying: bundle?.spraying ?? null,
  };
}

export function useCropRecommendation(lat: number, lon: number, cropType: string, userId?: string) {
  const { data: weather } = useCurrentWeather(lat, lon, true, userId);

  return {
    recommendation: weather ? getCropRecommendation(weather, cropType) : null,
    weather,
  };
}

export function useUserLocation(enabled = true) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setPermissionDenied(true);
          return;
        }

        const loc =
          (await Location.getLastKnownPositionAsync()) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

        if (!cancelled && loc) {
          setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch {
        if (!cancelled) setPermissionDenied(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { coords, permissionDenied, fallbackCoords: DEFAULT_COORDS };
}
