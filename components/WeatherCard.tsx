import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WEATHER_CODES } from '@/types/weather';
import { useUnits } from '@/contexts/UnitsContext';
import { formatTemperature } from '@/utils/unitConversions';

interface WeatherCardProps {
  temperature: number;
  weatherCode: number;
  feelsLike: number;
  location: string;
  isDay?: boolean;
}

export function WeatherCard({ temperature, weatherCode, feelsLike, location, isDay = true }: WeatherCardProps) {
  const { temperatureUnit } = useUnits();
  const weather = WEATHER_CODES[weatherCode] || WEATHER_CODES[0];
  const iconToShow = isDay ? weather.icon : weather.nightIcon;
  
  const getGradientColors = (): [string, string] => {
    if (weatherCode === 0) return isDay ? ['#87CEEB', '#98D8E8'] : ['#2c3e50', '#34495e'];
    if (weatherCode <= 3) return isDay ? ['#B0C4DE', '#D3D3D3'] : ['#34495e', '#2c3e50'];
    if (weatherCode >= 51 && weatherCode <= 65) return ['#708090', '#778899'];
    if (weatherCode >= 71 && weatherCode <= 77) return ['#F0F8FF', '#E6E6FA'];
    if (weatherCode >= 95) return ['#4a4a4a', '#2c2c2c'];
    return isDay ? ['#87CEEB', '#98D8E8'] : ['#2c3e50', '#34495e'];
  };

  return (
    <LinearGradient colors={getGradientColors()} style={styles.card}>
      <View style={styles.locationContainer}>
        <Text style={styles.location}>{location}</Text>
      </View>
      
      <View style={styles.mainWeather}>
        <View style={styles.iconContainer}>
          {!isDay && (iconToShow === '🌙' || iconToShow === '🌚') ? (
            <Image 
              source={require('@/assets/moon.png')} 
              style={styles.moonIcon}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.weatherIcon}>{iconToShow}</Text>
          )}
        </View>
        <Text style={styles.temperature}>{formatTemperature(temperature, temperatureUnit, false)}</Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.condition}>{weather.description}</Text>
        <Text style={styles.feelsLike}>Feels like {formatTemperature(feelsLike, temperatureUnit, false)}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    margin: 16,
    minHeight: 200,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
      },
      android: {
    elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  locationContainer: {
    alignItems: 'center',
  },
  location: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
    opacity: 0.9,
  },
  mainWeather: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  moonIcon: {
    width: 64,
    height: 64,
    tintColor: 'white',
  },
  temperature: {
    color: 'white',
    fontSize: 64,
    fontWeight: '300',
  },
  details: {
    alignItems: 'center',
  },
  condition: {
    color: 'white',
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  feelsLike: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.8,
  },
});