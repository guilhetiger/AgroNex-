import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather, getWeatherForecast, getFlightRecommendation, getCropRecommendation } from '../services/weatherService';

// Query keys
export const weatherKeys = {
  current: (lat: number, lon: number) => ['weather', 'current', lat, lon] as const,
  forecast: (lat: number, lon: number, days: number) => ['weather', 'forecast', lat, lon, days] as const,
};

// Hooks for weather data
export function useCurrentWeather(lat: number, lon: number, enabled = true) {
  return useQuery({
    queryKey: weatherKeys.current(lat, lon),
    queryFn: () => getCurrentWeather(lat, lon),
    enabled,
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });
}

export function useWeatherForecast(lat: number, lon: number, days = 5, enabled = true) {
  return useQuery({
    queryKey: weatherKeys.forecast(lat, lon, days),
    queryFn: () => getWeatherForecast(lat, lon, days),
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Utility hooks for recommendations
export function useFlightRecommendation(lat: number, lon: number) {
  const { data: weather } = useCurrentWeather(lat, lon);

  return {
    recommendation: weather ? getFlightRecommendation(weather) : null,
    weather,
  };
}

export function useCropRecommendation(lat: number, lon: number, cropType: string) {
  const { data: weather } = useCurrentWeather(lat, lon);

  return {
    recommendation: weather ? getCropRecommendation(weather, cropType) : null,
    weather,
  };
}