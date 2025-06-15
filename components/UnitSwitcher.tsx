import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { useUnits } from '@/contexts/UnitsContext';

export function UnitSwitcher() {
  const {
    temperatureUnit,
    speedUnit,
    pressureUnit,
    distanceUnit,
    toggleTemperatureUnit,
    toggleSpeedUnit,
    togglePressureUnit,
    toggleDistanceUnit,
  } = useUnits();

  const switchItems = [
    {
      label: 'Temperature',
      leftLabel: '°C',
      rightLabel: '°F',
      value: temperatureUnit === 'fahrenheit',
      onToggle: toggleTemperatureUnit,
    },
    {
      label: 'Wind Speed',
      leftLabel: 'km/h',
      rightLabel: 'mph',
      value: speedUnit === 'mph',
      onToggle: toggleSpeedUnit,
    },
    {
      label: 'Pressure',
      leftLabel: 'hPa',
      rightLabel: 'inHg',
      value: pressureUnit === 'inHg',
      onToggle: togglePressureUnit,
    },
    {
      label: 'Distance',
      leftLabel: 'km',
      rightLabel: 'mi',
      value: distanceUnit === 'miles',
      onToggle: toggleDistanceUnit,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Measurement Units</Text>
      
      {switchItems.map((item, index) => (
        <View key={index} style={styles.switchRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.mainLabel}>{item.label}</Text>
            <View style={styles.unitLabels}>
              <Text style={[styles.unitLabel, !item.value && styles.activeUnitLabel]}>
                {item.leftLabel}
              </Text>
              <Text style={[styles.unitLabel, item.value && styles.activeUnitLabel]}>
                {item.rightLabel}
              </Text>
            </View>
          </View>
          
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
            style={styles.switch}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  labelContainer: {
    flex: 1,
  },
  mainLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  unitLabels: {
    flexDirection: 'row',
    gap: 8,
  },
  unitLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  activeUnitLabel: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
}); 