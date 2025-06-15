import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';

interface AirQualityCardProps {
  airQuality: {
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
  };
}

export function AirQualityCard({ airQuality }: AirQualityCardProps) {
  const getAQIInfo = (aqi: number) => {
    if (aqi <= 50) return { 
      level: 'Good', 
      color: '#4CAF50', 
      icon: <CheckCircle size={20} color="#4CAF50" />,
      description: 'Air quality is satisfactory'
    };
    if (aqi <= 100) return { 
      level: 'Moderate', 
      color: '#FF9800', 
      icon: <AlertTriangle size={20} color="#FF9800" />,
      description: 'Acceptable for most people'
    };
    if (aqi <= 150) return { 
      level: 'Unhealthy for Sensitive Groups', 
      color: '#FF5722', 
      icon: <AlertTriangle size={20} color="#FF5722" />,
      description: 'Sensitive people should limit outdoor exposure'
    };
    if (aqi <= 200) return { 
      level: 'Unhealthy', 
      color: '#E91E63', 
      icon: <XCircle size={20} color="#E91E63" />,
      description: 'Everyone should limit outdoor exposure'
    };
    return { 
      level: 'Very Unhealthy', 
      color: '#9C27B0', 
      icon: <XCircle size={20} color="#9C27B0" />,
      description: 'Avoid outdoor activities'
    };
  };

  const aqiInfo = getAQIInfo(airQuality.aqi);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Air Quality</Text>
      <View style={[styles.aqiCard, { borderLeftColor: aqiInfo.color }]}>
        <View style={styles.header}>
          {aqiInfo.icon}
          <View style={styles.aqiInfo}>
            <Text style={styles.aqiValue}>{airQuality.aqi}</Text>
            <Text style={[styles.aqiLevel, { color: aqiInfo.color }]}>{aqiInfo.level}</Text>
          </View>
        </View>
        <Text style={styles.description}>{aqiInfo.description}</Text>
        
        <View style={styles.pollutants}>
          <View style={styles.pollutantRow}>
            <Text style={styles.pollutantLabel}>PM2.5</Text>
            <Text style={styles.pollutantValue}>{Math.round(airQuality.pm25)} μg/m³</Text>
          </View>
          <View style={styles.pollutantRow}>
            <Text style={styles.pollutantLabel}>PM10</Text>
            <Text style={styles.pollutantValue}>{Math.round(airQuality.pm10)} μg/m³</Text>
          </View>
          <View style={styles.pollutantRow}>
            <Text style={styles.pollutantLabel}>NO₂</Text>
            <Text style={styles.pollutantValue}>{Math.round(airQuality.no2)} μg/m³</Text>
          </View>
          <View style={styles.pollutantRow}>
            <Text style={styles.pollutantLabel}>O₃</Text>
            <Text style={styles.pollutantValue}>{Math.round(airQuality.o3)} μg/m³</Text>
          </View>
        </View>
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
  aqiCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aqiInfo: {
    marginLeft: 12,
  },
  aqiValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  aqiLevel: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  pollutants: {
    gap: 8,
  },
  pollutantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollutantLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  pollutantValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#6B7280',
  },
});