import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wind, Droplets, Gauge, Eye, Sun, Thermometer } from 'lucide-react-native';
import { useUnits } from '@/contexts/UnitsContext';
import { formatSpeed, formatPressure, formatDistance } from '@/utils/unitConversions';

interface WeatherMetricsProps {
  humidity: number;
  pressure: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  windDirection: number;
}

export function WeatherMetrics({ 
  humidity, 
  pressure, 
  windSpeed, 
  uvIndex, 
  visibility, 
  windDirection 
}: WeatherMetricsProps) {
  const { speedUnit, pressureUnit, distanceUnit } = useUnits();
  
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getUVLevel = (uv: number) => {
    if (uv <= 2) return { level: 'Low', color: '#4CAF50' };
    if (uv <= 5) return { level: 'Moderate', color: '#FF9800' };
    if (uv <= 7) return { level: 'High', color: '#FF5722' };
    if (uv <= 10) return { level: 'Very High', color: '#E91E63' };
    return { level: 'Extreme', color: '#9C27B0' };
  };

  const uvInfo = getUVLevel(uvIndex);

  const metrics = [
    {
      icon: <Droplets size={20} color="#3B82F6" />,
      label: 'Humidity',
      value: `${humidity}%`,
    },
    {
      icon: <Gauge size={20} color="#3B82F6" />,
      label: 'Pressure',
      value: formatPressure(pressure, pressureUnit),
    },
    {
      icon: <Wind size={20} color="#3B82F6" />,
      label: 'Wind',
      value: `${formatSpeed(windSpeed, speedUnit)} ${getWindDirection(windDirection)}`,
    },
    {
      icon: <Sun size={20} color={uvInfo.color} />,
      label: 'UV Index',
      value: `${uvIndex} (${uvInfo.level})`,
    },
    {
      icon: <Eye size={20} color="#3B82F6" />,
      label: 'Visibility',
      value: formatDistance(visibility / 1000, distanceUnit),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Details</Text>
      <View style={styles.grid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.iconContainer}>
              {metric.icon}
            </View>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
  },
});