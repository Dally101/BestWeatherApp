import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DailyForecast } from '@/components/DailyForecast';
import { HourlyForecast } from '@/components/HourlyForecast';
import { LocationService } from '@/services/locationService';
import { WeatherData } from '@/types/weather';

export default function ForecastScreen() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeatherData = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      
      const response = await fetch(
        `/api/weather?latitude=${location.latitude}&longitude=${location.longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather:', error);
      Alert.alert('Error', 'Unable to fetch weather data. Please try again.');
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

  if (loading || !weatherData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading state would go here */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <HourlyForecast 
          hourlyData={weatherData.hourly} 
          sunrise={weatherData.daily.sunrise[0]}
          sunset={weatherData.daily.sunset[0]}
        />
        <DailyForecast dailyData={weatherData.daily} />
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
});