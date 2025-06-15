import { WeatherData, LocationData, WeatherAlert } from '@/types/weather';

/**
 * WeatherService - Core weather data management service
 * 
 * This service handles all weather-related API calls and data processing.
 * It integrates with Open-Meteo API for weather data and air quality information.
 * 
 * Features:
 * - Real-time weather data fetching
 * - 7-day forecast with hourly breakdowns
 * - Air quality monitoring
 * - Intelligent retry logic with exponential backoff
 * - Weather alert generation
 * - Error handling and fallback mechanisms
 * 
 * @author The Best Weather App Team
 * @version 1.0.0
 */

// API endpoints for weather and air quality data
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';
const AIR_QUALITY_BASE_URL = 'https://air-quality-api.open-meteo.com/v1';

/**
 * WeatherService class provides static methods for weather data operations
 * Uses Open-Meteo API which is free and doesn't require API keys
 */
export class WeatherService {
  /**
   * Fetch data with intelligent retry logic and exponential backoff
   * Handles rate limiting, network errors, and temporary failures
   * 
   * @param url - The URL to fetch data from
   * @param retries - Maximum number of retry attempts (default: 3)
   * @param delay - Initial delay between retries in milliseconds (default: 1000)
   * @returns Promise<Response> - The successful HTTP response
   * @throws Error when all retry attempts are exhausted
   */
  private static async fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        
        if (response.status === 429) {
          // Rate limit hit, wait and retry
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries reached');
  }

  /**
   * Fetch comprehensive weather data for a given location
   * 
   * This method retrieves:
   * - Current weather conditions (temperature, humidity, pressure, wind, etc.)
   * - 24-hour hourly forecast starting from current time
   * - 7-day daily forecast with min/max temperatures
   * - Air quality data including AQI and pollutant levels
   * 
   * @param location - LocationData object containing latitude, longitude, and location info
   * @returns Promise<WeatherData> - Complete weather data object
   * @throws Error if weather data cannot be fetched
   */
  static async getCurrentWeather(location: LocationData): Promise<WeatherData> {
    try {
      const { latitude, longitude } = location;
      
      // Fetch main weather data
      const weatherResponse = await this.fetchWithRetry(
        `${OPEN_METEO_BASE_URL}/forecast?` +
        `latitude=${latitude}&longitude=${longitude}&` +
        `current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,uv_index,visibility,apparent_temperature&` +
        `hourly=temperature_2m,precipitation,weather_code,wind_speed_10m,relative_humidity_2m&` +
        `daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset&` +
        `timezone=auto&forecast_days=7`
      );

      // Fetch air quality data
      const airQualityResponse = await this.fetchWithRetry(
        `${AIR_QUALITY_BASE_URL}/air-quality?` +
        `latitude=${latitude}&longitude=${longitude}&` +
        `current=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`
      );

      const weatherData = await weatherResponse.json();
      const airQualityData = await airQualityResponse.json();

      // Find the current hour index to start from the current time
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const startIndex = weatherData.hourly.time.findIndex((time: string) => {
        const hourTime = new Date(time);
        return hourTime.getHours() === currentHour && 
               hourTime.getDate() === currentTime.getDate();
      });
      
      // If we can't find current hour, default to 0, otherwise use found index
      const actualStartIndex = startIndex >= 0 ? startIndex : 0;

      return {
        current: {
          temperature: weatherData.current.temperature_2m,
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.surface_pressure,
          windSpeed: weatherData.current.wind_speed_10m,
          windDirection: weatherData.current.wind_direction_10m,
          weatherCode: weatherData.current.weather_code,
          uvIndex: weatherData.current.uv_index,
          visibility: weatherData.current.visibility,
          feelsLike: weatherData.current.apparent_temperature,
          time: weatherData.current.time
        },
        hourly: {
          time: weatherData.hourly.time.slice(actualStartIndex, actualStartIndex + 24),
          temperature: weatherData.hourly.temperature_2m.slice(actualStartIndex, actualStartIndex + 24),
          precipitation: weatherData.hourly.precipitation.slice(actualStartIndex, actualStartIndex + 24),
          weatherCode: weatherData.hourly.weather_code.slice(actualStartIndex, actualStartIndex + 24),
          windSpeed: weatherData.hourly.wind_speed_10m.slice(actualStartIndex, actualStartIndex + 24),
          humidity: weatherData.hourly.relative_humidity_2m.slice(actualStartIndex, actualStartIndex + 24)
        },
        daily: {
          time: weatherData.daily.time,
          temperatureMax: weatherData.daily.temperature_2m_max,
          temperatureMin: weatherData.daily.temperature_2m_min,
          weatherCode: weatherData.daily.weather_code,
          precipitation: weatherData.daily.precipitation_sum,
          windSpeed: weatherData.daily.wind_speed_10m_max,
          uvIndex: weatherData.daily.uv_index_max,
          sunrise: weatherData.daily.sunrise,
          sunset: weatherData.daily.sunset
        },
        airQuality: {
          aqi: airQualityData.current.us_aqi || 0,
          pm25: airQualityData.current.pm2_5 || 0,
          pm10: airQualityData.current.pm10 || 0,
          no2: airQualityData.current.nitrogen_dioxide || 0,
          o3: airQualityData.current.ozone || 0
        }
      };
    } catch (error) {
      console.error('Weather service error:', error);
      throw new Error('Failed to fetch weather data. Please try again later.');
    }
  }

  static generateWeatherAlerts(weatherData: WeatherData): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const now = new Date();

    // Rain alert - check next 2 hours for precipitation
    const nextTwoHours = weatherData.hourly.precipitation.slice(0, 2);
    const willRain = nextTwoHours.some(precipitation => precipitation > 0.1);
    if (willRain && weatherData.current.weatherCode < 50) {
      alerts.push({
        id: `rain-${now.getTime()}`,
        title: 'Rain Expected Soon',
        description: 'Precipitation expected within the next 2 hours. Consider bringing an umbrella!',
        severity: 'moderate',
        type: 'rain',
        timestamp: now.toISOString()
      });
    }

    // UV Index alert
    if (weatherData.current.uvIndex >= 6) {
      alerts.push({
        id: `uv-${now.getTime()}`,
        title: 'High UV Index',
        description: `UV index is ${weatherData.current.uvIndex}. Apply sunscreen and seek shade during peak hours.`,
        severity: weatherData.current.uvIndex >= 8 ? 'high' : 'moderate',
        type: 'uv',
        timestamp: now.toISOString()
      });
    }

    // Air quality alert
    if (weatherData.airQuality.aqi >= 101) {
      alerts.push({
        id: `air-${now.getTime()}`,
        title: 'Poor Air Quality',
        description: `AQI is ${weatherData.airQuality.aqi}. Consider limiting outdoor activities.`,
        severity: weatherData.airQuality.aqi >= 151 ? 'high' : 'moderate',
        type: 'air_quality',
        timestamp: now.toISOString()
      });
    }

    // Perfect weather alert
    if (
      weatherData.current.temperature >= 20 && 
      weatherData.current.temperature <= 25 &&
      weatherData.current.humidity < 60 &&
      weatherData.current.weatherCode <= 1 &&
      weatherData.current.windSpeed < 15
    ) {
      alerts.push({
        id: `perfect-${now.getTime()}`,
        title: 'Perfect Weather!',
        description: 'Ideal conditions for outdoor activities. Temperature, humidity, and wind are just right!',
        severity: 'low',
        type: 'general',
        timestamp: now.toISOString()
      });
    }

    // Temperature swing alert
    const todayMax = weatherData.daily.temperatureMax[0];
    const todayMin = weatherData.daily.temperatureMin[0];
    const tempDifference = todayMax - todayMin;
    
    if (tempDifference >= 15) {
      alerts.push({
        id: `temp-swing-${now.getTime()}`,
        title: 'Large Temperature Swing',
        description: `Temperature will vary by ${Math.round(tempDifference)}°C today (${Math.round(todayMin)}° to ${Math.round(todayMax)}°). Dress in layers!`,
        severity: 'low',
        type: 'temperature',
        timestamp: now.toISOString()
      });
    }

    return alerts;
  }

  static getWeatherBackground(weatherCode: number, isDay: boolean): string {
    if (weatherCode === 0) return isDay ? '#87CEEB' : '#2c3e50'; // Clear
    if (weatherCode <= 3) return isDay ? '#B0C4DE' : '#34495e'; // Cloudy
    if (weatherCode >= 51 && weatherCode <= 65) return '#708090'; // Rainy
    if (weatherCode >= 71 && weatherCode <= 77) return '#F0F8FF'; // Snow
    if (weatherCode >= 95) return '#4a4a4a'; // Thunderstorm
    return isDay ? '#87CEEB' : '#2c3e50'; // Default
  }
}