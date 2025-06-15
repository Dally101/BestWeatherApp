import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WEATHER_CODES } from '@/types/weather';

interface DailyForecastProps {
  dailyData: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
    precipitation: number[];
    uvIndex: number[];
  };
}

export function DailyForecast({ dailyData }: DailyForecastProps) {
  const formatDay = (dateString: string, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next 7-Days Forecast</Text>
      {dailyData.time.map((date, index) => {
        const weather = WEATHER_CODES[dailyData.weatherCode[index]] || WEATHER_CODES[0];
        const precipitation = dailyData.precipitation[index];
        const uvIndex = dailyData.uvIndex[index];
        
        return (
          <View key={index} style={styles.dayCard}>
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{formatDay(date, index)}</Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.icon}>{weather.icon}</Text>
                <Text style={styles.condition}>{weather.description}</Text>
              </View>
            </View>
            
            <View style={styles.tempContainer}>
              <Text style={styles.highTemp}>{Math.round(dailyData.temperatureMax[index])}°</Text>
              <Text style={styles.lowTemp}>{Math.round(dailyData.temperatureMin[index])}°</Text>
            </View>
            
            <View style={styles.details}>
              {precipitation > 0 && (
                <Text style={styles.precipitation}>{Math.round(precipitation)}mm</Text>
              )}
              {uvIndex > 0 && (
                <Text style={styles.uvIndex}>UV {uvIndex}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  condition: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  highTemp: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginRight: 8,
  },
  lowTemp: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  details: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  precipitation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#3B82F6',
  },
  uvIndex: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#F59E0B',
  },
});