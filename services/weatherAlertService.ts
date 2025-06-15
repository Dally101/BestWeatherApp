import { WeatherData, LocationData } from '@/types/weather';
import { NotificationService } from './notificationService';
import { AIService } from './aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocalWeatherAlert {
  id: string;
  type: 'unusual' | 'opportunity' | 'warning' | 'interesting';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  conditions: string[];
  timestamp: number;
}

interface WeatherPattern {
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  weatherCode: number;
  timestamp: number;
}

export class WeatherAlertService {
  private static readonly STORAGE_KEYS = {
    WEATHER_HISTORY: 'weatherHistory',
    LAST_ALERTS: 'lastWeatherAlerts',
    ALERT_PREFERENCES: 'alertPreferences'
  };

  private static readonly ALERT_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours between similar alerts
  private static readonly HISTORY_LIMIT = 24; // Keep 24 hours of weather data

  // Main function to check for weather alerts
  static async checkForWeatherAlerts(
    currentWeather: WeatherData,
    location: LocationData
  ): Promise<void> {
    try {
      console.log('🔍 Checking for weather alerts...');
      console.log('Current weather:', {
        temp: currentWeather.current.temperature,
        weatherCode: currentWeather.current.weatherCode,
        windSpeed: currentWeather.current.windSpeed,
        uvIndex: currentWeather.current.uvIndex,
        humidity: currentWeather.current.humidity,
        pressure: currentWeather.current.pressure
      });
      
      // Store current weather in history
      await this.storeWeatherData(currentWeather);
      
      // Get weather history for pattern analysis
      const history = await this.getWeatherHistory();
      console.log(`📊 Weather history has ${history.length} entries`);
      
      // Analyze for different types of alerts
      const alerts = await Promise.all([
        this.checkUnusualPatterns(currentWeather, history, location),
        this.checkOpportunityAlerts(currentWeather, location),
        this.checkWarningAlerts(currentWeather, location),
        this.checkInterestingConditions(currentWeather, history, location)
      ]);

      // Flatten and filter alerts
      const allAlerts = alerts.flat().filter(alert => alert !== null);
      
      if (allAlerts.length > 0) {
        console.log(`🚨 Found ${allAlerts.length} weather alerts:`, allAlerts.map(a => a.title));
        await this.processAlerts(allAlerts);
      } else {
        console.log('✅ No weather alerts needed');
      }
    } catch (error) {
      console.error('❌ Error checking weather alerts:', error);
    }
  }

  // Check for unusual weather patterns
  private static async checkUnusualPatterns(
    current: WeatherData,
    history: WeatherPattern[],
    location: LocationData
  ): Promise<LocalWeatherAlert[]> {
    const alerts: LocalWeatherAlert[] = [];
    
    if (history.length < 3) return alerts; // Need some history
    
    const temp = current.current.temperature;
    const avgTemp = history.reduce((sum, h) => sum + h.temperature, 0) / history.length;
    const tempDiff = Math.abs(temp - avgTemp);
    
    // Sudden temperature changes
    if (tempDiff > 10) {
      const isWarmer = temp > avgTemp;
      alerts.push({
        id: `temp-change-${Date.now()}`,
        type: 'unusual',
        severity: tempDiff > 15 ? 'high' : 'medium',
        title: isWarmer ? '🌡️ Sudden Warm Spell!' : '🥶 Temperature Drop Alert!',
        message: `${Math.round(temp)}°C is ${Math.round(tempDiff)}° ${isWarmer ? 'warmer' : 'cooler'} than usual! ${isWarmer ? 'Perfect for outdoor adventures!' : 'Time to bundle up!'}`,
        conditions: ['temperature_change'],
        timestamp: Date.now()
      });
    }

    // Pressure changes (weather system changes)
    const avgPressure = history.reduce((sum, h) => sum + h.pressure, 0) / history.length;
    const pressureDiff = Math.abs(current.current.pressure - avgPressure);
    
    if (pressureDiff > 20) {
      const isRising = current.current.pressure > avgPressure;
      alerts.push({
        id: `pressure-change-${Date.now()}`,
        type: 'interesting',
        severity: 'medium',
        title: isRising ? '📈 High Pressure System!' : '📉 Low Pressure Alert!',
        message: `Atmospheric pressure ${isRising ? 'rising' : 'dropping'} significantly! ${isRising ? 'Clear skies ahead!' : 'Weather changes coming!'}`,
        conditions: ['pressure_change'],
        timestamp: Date.now()
      });
    }

    return alerts;
  }

  // Check for opportunity alerts (great weather for activities)
  private static async checkOpportunityAlerts(
    current: WeatherData,
    location: LocationData
  ): Promise<LocalWeatherAlert[]> {
    const alerts: LocalWeatherAlert[] = [];
    const temp = current.current.temperature;
    const weatherCode = current.current.weatherCode;
    const windSpeed = current.current.windSpeed;
    const uvIndex = current.current.uvIndex;
    
    // Perfect weather day
    if (weatherCode <= 1 && temp >= 18 && temp <= 26 && windSpeed < 15) {
      alerts.push({
        id: `perfect-day-${Date.now()}`,
        type: 'opportunity',
        severity: 'low',
        title: '🌟 Perfect Weather Alert!',
        message: `${Math.round(temp)}°C with clear skies! This is your sign to get outside - picnic, walk, or just soak up the amazing vibes! ☀️`,
        conditions: ['perfect_weather'],
        timestamp: Date.now()
      });
    }

    // Great sunset/sunrise conditions
    const hour = new Date().getHours();
    if (weatherCode <= 3 && ((hour >= 17 && hour <= 19) || (hour >= 6 && hour <= 8))) {
      const timeOfDay = hour < 12 ? 'sunrise' : 'sunset';
      alerts.push({
        id: `${timeOfDay}-${Date.now()}`,
        type: 'opportunity',
        severity: 'low',
        title: `🌅 Epic ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Alert!`,
        message: `Clear skies = spectacular ${timeOfDay}! Grab your camera and find a good spot - nature's about to put on a show! 📸`,
        conditions: [`${timeOfDay}_opportunity`],
        timestamp: Date.now()
      });
    }

    // Stargazing conditions
    if (weatherCode <= 1 && hour >= 21 && uvIndex === 0) {
      alerts.push({
        id: `stargazing-${Date.now()}`,
        type: 'opportunity',
        severity: 'low',
        title: '⭐ Stargazing Paradise!',
        message: `Crystal clear skies tonight! Perfect for stargazing - grab a blanket and look up! The universe is calling! 🌌`,
        conditions: ['stargazing'],
        timestamp: Date.now()
      });
    }

    // Snow day fun
    if (weatherCode >= 71 && weatherCode <= 77 && temp < 2) {
      alerts.push({
        id: `snow-fun-${Date.now()}`,
        type: 'opportunity',
        severity: 'medium',
        title: '❄️ Snow Day Magic!',
        message: `Fresh snow falling! Time for snowball fights, snow angels, or just enjoying the winter wonderland! Bundle up and have fun! ⛄`,
        conditions: ['snow_opportunity'],
        timestamp: Date.now()
      });
    }

    return alerts;
  }

  // Check for warning alerts (weather to be careful about)
  private static async checkWarningAlerts(
    current: WeatherData,
    location: LocationData
  ): Promise<LocalWeatherAlert[]> {
    const alerts: LocalWeatherAlert[] = [];
    const temp = current.current.temperature;
    const weatherCode = current.current.weatherCode;
    const windSpeed = current.current.windSpeed;
    const uvIndex = current.current.uvIndex;
    const humidity = current.current.humidity;

    // Rain incoming
    if (weatherCode >= 51 && weatherCode <= 67) {
      const intensity = weatherCode >= 61 ? 'heavy' : 'light';
      alerts.push({
        id: `rain-warning-${Date.now()}`,
        type: 'warning',
        severity: weatherCode >= 61 ? 'high' : 'medium',
        title: '☔ Rain Alert!',
        message: `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} rain detected! Don't forget your umbrella and maybe waterproof shoes. Puddle jumping is optional but encouraged! 🌧️`,
        conditions: ['rain'],
        timestamp: Date.now()
      });
    }

    // High UV warning
    if (uvIndex >= 8) {
      alerts.push({
        id: `uv-warning-${Date.now()}`,
        type: 'warning',
        severity: uvIndex >= 10 ? 'high' : 'medium',
        title: '🕶️ UV Alert!',
        message: `UV index is ${uvIndex}! Time for sunscreen, sunglasses, and a hat. Your future self will thank you for the sun protection! ☀️`,
        conditions: ['high_uv'],
        timestamp: Date.now()
      });
    }

    // Extreme cold
    if (temp < -5) {
      alerts.push({
        id: `cold-warning-${Date.now()}`,
        type: 'warning',
        severity: temp < -15 ? 'high' : 'medium',
        title: '🥶 Extreme Cold Alert!',
        message: `${Math.round(temp)}°C is seriously cold! Layer up like an onion, cover exposed skin, and maybe have some hot cocoa ready! Stay warm! 🧥`,
        conditions: ['extreme_cold'],
        timestamp: Date.now()
      });
    }

    // High winds
    if (windSpeed > 30) {
      alerts.push({
        id: `wind-warning-${Date.now()}`,
        type: 'warning',
        severity: windSpeed > 50 ? 'high' : 'medium',
        title: '💨 Windy Conditions!',
        message: `${Math.round(windSpeed)} km/h winds! Hold onto your hat, secure loose items, and maybe skip the umbrella today. Nature's having a blustery day! 🌪️`,
        conditions: ['high_wind'],
        timestamp: Date.now()
      });
    }

    // Heat warning
    if (temp > 35) {
      alerts.push({
        id: `heat-warning-${Date.now()}`,
        type: 'warning',
        severity: temp > 40 ? 'high' : 'medium',
        title: '🔥 Heat Wave Alert!',
        message: `${Math.round(temp)}°C is sizzling! Stay hydrated, seek shade, and maybe save outdoor activities for later. Your AC is your best friend today! 🧊`,
        conditions: ['extreme_heat'],
        timestamp: Date.now()
      });
    }

    return alerts;
  }

  // Check for interesting weather conditions
  private static async checkInterestingConditions(
    current: WeatherData,
    history: WeatherPattern[],
    location: LocationData
  ): Promise<LocalWeatherAlert[]> {
    const alerts: LocalWeatherAlert[] = [];
    const temp = current.current.temperature;
    const humidity = current.current.humidity;
    const weatherCode = current.current.weatherCode;

    // Fog conditions
    if (weatherCode >= 45 && weatherCode <= 48) {
      alerts.push({
        id: `fog-interesting-${Date.now()}`,
        type: 'interesting',
        severity: 'low',
        title: '🌫️ Mysterious Fog!',
        message: `Foggy conditions creating a mystical atmosphere! Drive carefully but enjoy the ethereal vibes - it's like being in a movie! 👻`,
        conditions: ['fog'],
        timestamp: Date.now()
      });
    }

    // High humidity
    if (humidity > 85 && temp > 20) {
      alerts.push({
        id: `humidity-interesting-${Date.now()}`,
        type: 'interesting',
        severity: 'low',
        title: '💧 Tropical Vibes!',
        message: `${humidity}% humidity is giving major tropical feels! Your hair might have its own plans today, but embrace the natural volume! 🌴`,
        conditions: ['high_humidity'],
        timestamp: Date.now()
      });
    }

    // Perfect temperature
    if (temp >= 21 && temp <= 23) {
      alerts.push({
        id: `perfect-temp-${Date.now()}`,
        type: 'interesting',
        severity: 'low',
        title: '🌡️ Goldilocks Temperature!',
        message: `${Math.round(temp)}°C - not too hot, not too cold, just perfect! This is the temperature that makes everyone happy. Enjoy this rare gift! ✨`,
        conditions: ['perfect_temperature'],
        timestamp: Date.now()
      });
    }

    return alerts;
  }

  // Process and send alerts
  private static async processAlerts(alerts: LocalWeatherAlert[]): Promise<void> {
    try {
      // Check cooldown periods
      const lastAlerts = await this.getLastAlerts();
      const now = Date.now();
      
      const filteredAlerts = alerts.filter(alert => {
        const lastSimilar = lastAlerts.find(last => 
          last.type === alert.type && 
          last.conditions.some((c: string) => alert.conditions.includes(c))
        );
        
        if (!lastSimilar) return true;
        return (now - lastSimilar.timestamp) > this.ALERT_COOLDOWN;
      });

      if (filteredAlerts.length === 0) {
        console.log('🔇 All alerts filtered due to cooldown');
        return;
      }

      // Sort by severity and send the most important one
      const sortedAlerts = filteredAlerts.sort((a, b) => {
        const severityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      const alertToSend = sortedAlerts[0];
      
      // Enhance with AI if possible
      const enhancedAlert = await this.enhanceAlertWithAI(alertToSend);
      
      // Convert to the format expected by NotificationService
      const notificationAlert = {
        id: enhancedAlert.id,
        title: enhancedAlert.title,
        description: enhancedAlert.message,
        severity: this.mapSeverity(enhancedAlert.severity),
        type: this.mapType(enhancedAlert.type),
        timestamp: new Date().toISOString()
      };
      
      // Send the notification
      await NotificationService.sendWeatherAlert(notificationAlert);

      // Store the sent alert
      await this.storeLastAlert(enhancedAlert);
      
      console.log(`🚨 Weather alert sent: ${enhancedAlert.title}`);
    } catch (error) {
      console.error('❌ Error processing alerts:', error);
    }
  }

  // Map local severity to notification severity
  private static mapSeverity(severity: 'low' | 'medium' | 'high'): 'low' | 'moderate' | 'high' | 'extreme' {
    switch (severity) {
      case 'low': return 'low';
      case 'medium': return 'moderate';
      case 'high': return 'high';
      default: return 'moderate';
    }
  }

  // Map local type to notification type
  private static mapType(type: 'unusual' | 'opportunity' | 'warning' | 'interesting'): 'rain' | 'uv' | 'air_quality' | 'temperature' | 'wind' | 'general' {
    switch (type) {
      case 'unusual': return 'temperature';
      case 'opportunity': return 'general';
      case 'warning': return 'general';
      case 'interesting': return 'general';
      default: return 'general';
    }
  }

  // Enhance alert with AI creativity
  private static async enhanceAlertWithAI(alert: LocalWeatherAlert): Promise<LocalWeatherAlert> {
    try {
      const enhancedMessage = await AIService.enhanceWeatherAlert(alert);
      return {
        ...alert,
        title: enhancedMessage.title,
        message: enhancedMessage.body
      };
    } catch (error) {
      console.log('Using original alert message (AI enhancement failed)');
      return alert;
    }
  }

  // Storage methods
  private static async storeWeatherData(weather: WeatherData): Promise<void> {
    try {
      const history = await this.getWeatherHistory();
      const newEntry: WeatherPattern = {
        temperature: weather.current.temperature,
        humidity: weather.current.humidity,
        windSpeed: weather.current.windSpeed,
        pressure: weather.current.pressure,
        uvIndex: weather.current.uvIndex,
        weatherCode: weather.current.weatherCode,
        timestamp: Date.now()
      };

      const updatedHistory = [newEntry, ...history].slice(0, this.HISTORY_LIMIT);
      await AsyncStorage.setItem(this.STORAGE_KEYS.WEATHER_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error storing weather data:', error);
    }
  }

  private static async getWeatherHistory(): Promise<WeatherPattern[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.WEATHER_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting weather history:', error);
      return [];
    }
  }

  private static async storeLastAlert(alert: LocalWeatherAlert): Promise<void> {
    try {
      const lastAlerts = await this.getLastAlerts();
      const updatedAlerts = [alert, ...lastAlerts].slice(0, 10); // Keep last 10 alerts
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_ALERTS, JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('Error storing last alert:', error);
    }
  }

  private static async getLastAlerts(): Promise<LocalWeatherAlert[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_ALERTS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting last alerts:', error);
      return [];
    }
  }

  // Public method to manually trigger alert check
  static async triggerAlertCheck(weather: WeatherData, location: LocationData): Promise<void> {
    await this.checkForWeatherAlerts(weather, location);
  }

  // Clear alert history (for testing)
  static async clearAlertHistory(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.WEATHER_HISTORY,
        this.STORAGE_KEYS.LAST_ALERTS
      ]);
      console.log('Alert history cleared');
    } catch (error) {
      console.error('Error clearing alert history:', error);
    }
  }
} 