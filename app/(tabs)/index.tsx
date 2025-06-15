import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeatherCard } from '@/components/WeatherCard';
import { WeatherMetrics } from '@/components/WeatherMetrics';
import { AirQualityCard } from '@/components/AirQualityCard';
import { UnitSwitcher } from '@/components/UnitSwitcher';
import { LocationService } from '@/services/locationService';
import { WeatherService } from '@/services/weatherService';
import { WeatherAlertService } from '@/services/weatherAlertService';
import { WeatherData, LocationData } from '@/types/weather';

export default function CurrentWeatherScreen() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setError(null);
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);

      const data = await WeatherService.getCurrentWeather(locationData);
      setWeatherData(data);

      // Check for weather alerts after getting fresh data
      await WeatherAlertService.checkForWeatherAlerts(data, locationData);
      console.log('🔍 Weather alert check completed from main screen');
    } catch (error) {
      console.error('Error fetching weather:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to fetch weather data. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Getting your weather...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !weatherData || !location) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Unable to load weather data'}</Text>
          <Text style={styles.retryText} onPress={fetchWeatherData}>
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const locationString = `${location.city}, ${location.region}`;
  
  // Determine if it's day or night based on actual sunrise/sunset times
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const sunriseTime = new Date(weatherData.daily.sunrise[0]);
  const sunsetTime = new Date(weatherData.daily.sunset[0]);
  const sunriseHour = sunriseTime.getHours();
  const sunsetHour = sunsetTime.getHours();
  
  // Day time is between sunrise and sunset
  const isDay = currentHour >= sunriseHour && currentHour < sunsetHour;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <WeatherCard
          temperature={weatherData.current.temperature}
          weatherCode={weatherData.current.weatherCode}
          feelsLike={weatherData.current.feelsLike}
          location={locationString}
          isDay={isDay}
        />

        <UnitSwitcher />

        <WeatherMetrics
          humidity={weatherData.current.humidity}
          pressure={weatherData.current.pressure}
          windSpeed={weatherData.current.windSpeed}
          uvIndex={weatherData.current.uvIndex}
          visibility={weatherData.current.visibility}
          windDirection={weatherData.current.windDirection}
        />

        <AirQualityCard airQuality={weatherData.airQuality} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 4, // Extra spacing for status bar visibility
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  retryText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});