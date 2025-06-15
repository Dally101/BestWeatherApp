import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { WEATHER_CODES } from '@/types/weather';

interface HourlyForecastProps {
  hourlyData: {
    time: string[];
    temperature: number[];
    weatherCode: number[];
    precipitation: number[];
  };
  sunrise: string;
  sunset: string;
}

export function HourlyForecast({ hourlyData, sunrise, sunset }: HourlyForecastProps) {
  const formatHour = (timeString: string, index: number) => {
    if (index === 0) return 'Now';
    return `${index}h`;
  };

  const isNightTime = (timeString: string) => {
    const currentTime = new Date(timeString);
    const currentHour = currentTime.getHours();
    
    // Get sunrise and sunset times for the same date as currentTime
    const currentDate = currentTime.toISOString().split('T')[0];
    const sunriseTime = new Date(`${currentDate}T${sunrise.split('T')[1]}`);
    const sunsetTime = new Date(`${currentDate}T${sunset.split('T')[1]}`);
    
    const sunriseHour = sunriseTime.getHours();
    const sunsetHour = sunsetTime.getHours();
    
    // Night time is after sunset or before sunrise
    return currentHour < sunriseHour || currentHour >= sunsetHour;
  };

  const isSunriseOrSunset = (timeString: string) => {
    const currentTime = new Date(timeString);
    const sunriseTime = new Date(sunrise);
    const sunsetTime = new Date(sunset);
    
    // Check if this hour matches sunrise or sunset hour
    const currentHour = currentTime.getHours();
    const sunriseHour = sunriseTime.getHours();
    const sunsetHour = sunsetTime.getHours();
    
    if (currentHour === sunriseHour) {
      return { 
        type: 'sunrise', 
        time: sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    if (currentHour === sunsetHour) {
      return { 
        type: 'sunset', 
        time: sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next 24-hours forecast</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hourlyData.time.map((time, index) => {
          const weather = WEATHER_CODES[hourlyData.weatherCode[index]] || WEATHER_CODES[0];
          const precipitation = hourlyData.precipitation[index];
          const isNight = isNightTime(time);
          const iconToShow = isNight ? weather.nightIcon : weather.icon;
          const sunEvent = isSunriseOrSunset(time);
          
          return (
            <View key={index} style={styles.hourCard}>
              <Text style={styles.hour}>{formatHour(time, index)}</Text>
              {sunEvent ? (
                <View style={styles.sunEventContainer}>
                  <Text style={styles.sunEvent}>
                    {sunEvent.type === 'sunrise' ? '🌅' : '🌇'}
                  </Text>
                  <Text style={styles.sunEventText}>
                    {sunEvent.type === 'sunrise' ? 'Sunrise' : 'Sunset'}
                  </Text>
                  <Text style={styles.sunEventTime}>
                    {sunEvent.time}
                  </Text>
                </View>
              ) : (
                <View style={styles.iconContainer}>
                  {isNight && (iconToShow === '🌙' || iconToShow === '🌚') ? (
                    <Image 
                      source={require('@/assets/moon.png')} 
                      style={styles.moonIcon}
                      resizeMode="contain"
                    />
              ) : (
                <Text style={styles.icon}>{iconToShow}</Text>
                  )}
                </View>
              )}
              <Text style={styles.temperature}>{Math.round(hourlyData.temperature[index])}°</Text>
              {precipitation > 0 && (
                <Text style={styles.precipitation}>{Math.round(precipitation)}mm</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  hourCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hour: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 8,
  },
  sunEventContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  sunEvent: {
    fontSize: 16,
    marginBottom: 2,
  },
  sunEventText: {
    fontSize: 8,
    fontWeight: '400',
    color: '#F59E0B',
    marginBottom: 1,
  },
  sunEventTime: {
    fontSize: 8,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 4,
  },
  iconContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  moonIcon: {
    width: 24,
    height: 24,
    tintColor: '#6B7280',
  },
  temperature: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  precipitation: {
    fontSize: 10,
    fontWeight: '400',
    color: '#3B82F6',
    marginTop: 4,
  },
});