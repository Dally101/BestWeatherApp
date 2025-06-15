export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    uvIndex: number;
    visibility: number;
    feelsLike: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature: number[];
    precipitation: number[];
    weatherCode: number[];
    windSpeed: number[];
    humidity: number[];
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
    precipitation: number[];
    windSpeed: number[];
    uvIndex: number[];
    sunrise: string[];
    sunset: string[];
  };
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  type: 'rain' | 'uv' | 'air_quality' | 'temperature' | 'wind' | 'general';
  timestamp: string;
}

export const WEATHER_CODES: Record<number, { description: string; icon: string; nightIcon: string }> = {
  0: { description: 'Clear sky', icon: '☀️', nightIcon: '🌙' },
  1: { description: 'Mainly clear', icon: '🌤️', nightIcon: '🌙' },
  2: { description: 'Partly cloudy', icon: '⛅', nightIcon: '☁️' },
  3: { description: 'Overcast', icon: '☁️', nightIcon: '☁️' },
  45: { description: 'Fog', icon: '🌫️', nightIcon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️', nightIcon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️', nightIcon: '🌧️' },
  53: { description: 'Moderate drizzle', icon: '🌦️', nightIcon: '🌧️' },
  55: { description: 'Dense drizzle', icon: '🌧️', nightIcon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️', nightIcon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️', nightIcon: '🌧️' },
  65: { description: 'Heavy rain', icon: '⛈️', nightIcon: '⛈️' },
  71: { description: 'Slight snow', icon: '🌨️', nightIcon: '🌨️' },
  73: { description: 'Moderate snow', icon: '❄️', nightIcon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️', nightIcon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️', nightIcon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️', nightIcon: '⛈️' },
  99: { description: 'Heavy thunderstorm with hail', icon: '⛈️', nightIcon: '⛈️' }
};