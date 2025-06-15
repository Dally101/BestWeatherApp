import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, Info, AlertCircle, Zap } from 'lucide-react-native';
import { WeatherAlert } from '@/types/weather';

interface AlertCardProps {
  alert: WeatherAlert;
  onDismiss?: (alertId: string) => void;
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'rain':
        return <Info size={20} color="#3B82F6" />;
      case 'uv':
        return <AlertTriangle size={20} color="#F59E0B" />;
      case 'air_quality':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'temperature':
        return <AlertTriangle size={20} color="#F97316" />;
      case 'wind':
        return <Zap size={20} color="#8B5CF6" />;
      default:
        return <Info size={20} color="#3B82F6" />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'extreme':
        return '#DC2626';
      case 'high':
        return '#EF4444';
      case 'moderate':
        return '#F59E0B';
      case 'low':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.card, { borderLeftColor: getSeverityColor() }]}>
      <View style={styles.header}>
        {getAlertIcon()}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.time}>{formatTime(alert.timestamp)}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
          <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{alert.description}</Text>
      
      {onDismiss && (
        <TouchableOpacity 
          style={styles.dismissButton} 
          onPress={() => onDismiss(alert.id)}
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
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
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  dismissText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#6B7280',
  },
});