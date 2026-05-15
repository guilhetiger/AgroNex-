// Weather service for flight planning and crop monitoring
export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  visibility: number;
  condition: string;
  uvIndex: number;
  pressure: number;
}

export interface WeatherForecast {
  date: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
}

// Mock weather API - In production, integrate with OpenWeatherMap, WeatherAPI, etc.
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    // Mock data for demo - replace with actual API call
    const mockWeather: WeatherData = {
      temperature: 22 + Math.random() * 10, // 22-32°C
      humidity: 60 + Math.random() * 30, // 60-90%
      windSpeed: 5 + Math.random() * 15, // 5-20 km/h
      windDirection: Math.random() * 360,
      precipitation: Math.random() * 5, // 0-5mm
      visibility: 8 + Math.random() * 7, // 8-15km
      condition: ['Clear', 'Clouds', 'Rain', 'Drizzle'][Math.floor(Math.random() * 4)],
      uvIndex: Math.floor(Math.random() * 11), // 0-10
      pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
    };

    // Uncomment for real API integration:
    // const response = await fetch(
    //   `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    // );
    // const data = await response.json();
    // return {
    //   temperature: data.main.temp,
    //   humidity: data.main.humidity,
    //   windSpeed: data.wind.speed,
    //   windDirection: data.wind.deg,
    //   precipitation: data.rain?.['1h'] || 0,
    //   visibility: data.visibility / 1000,
    //   condition: data.weather[0].main,
    //   uvIndex: 0, // Would need separate UV API
    //   pressure: data.main.pressure,
    // };

    return mockWeather;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw new Error('Unable to fetch weather data');
  }
}

export async function getWeatherForecast(lat: number, lon: number, days: number = 5): Promise<WeatherForecast[]> {
  try {
    // Mock forecast data
    const forecast: WeatherForecast[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: 20 + Math.random() * 15,
        humidity: 50 + Math.random() * 40,
        windSpeed: 3 + Math.random() * 20,
        precipitation: Math.random() * 10,
        condition: ['Clear', 'Clouds', 'Rain', 'Thunderstorm'][Math.floor(Math.random() * 4)],
      });
    }

    return forecast;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw new Error('Unable to fetch weather forecast');
  }
}

// Flight planning recommendations based on weather
export function getFlightRecommendation(weather: WeatherData): {
  recommended: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
} {
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (weather.windSpeed > 15) {
    reasons.push('Viento fuerte (>15 km/h)');
    riskLevel = 'high';
  } else if (weather.windSpeed > 10) {
    reasons.push('Viento moderado (>10 km/h)');
    riskLevel = 'medium';
  }

  if (weather.precipitation > 2) {
    reasons.push('Precipitación alta (>2mm)');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  if (weather.visibility < 5) {
    reasons.push('Visibilidad reducida (<5km)');
    riskLevel = 'high';
  }

  if (weather.temperature < 10 || weather.temperature > 35) {
    reasons.push('Temperatura extrema');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  const recommended = riskLevel !== 'high';

  return {
    recommended,
    reason: reasons.length > 0 ? reasons.join(', ') : 'Condiciones óptimas para vuelo',
    riskLevel,
  };
}

// Crop monitoring recommendations
export function getCropRecommendation(weather: WeatherData, cropType: string): string {
  const recommendations: string[] = [];

  if (weather.precipitation > 5) {
    recommendations.push('Monitorear drenaje y posibles inundaciones');
  }

  if (weather.temperature > 30) {
    recommendations.push('Considerar riego adicional por altas temperaturas');
  }

  if (weather.humidity > 80) {
    recommendations.push('Vigilar enfermedades fúngicas por alta humedad');
  }

  if (weather.uvIndex > 7) {
    recommendations.push('Proteger cultivos de radiación UV intensa');
  }

  return recommendations.length > 0
    ? recommendations.join('. ')
    : 'Condiciones climáticas favorables para el cultivo';
}