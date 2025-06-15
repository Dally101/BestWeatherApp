import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { WeatherData } from '@/types/weather';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOutdoor: boolean;
}

interface CalendarEventsCardProps {
  events: CalendarEvent[];
  weatherData: WeatherData | null;
  bounceAnimation: Animated.AnimatedAddition<number>;
}

export function CalendarEventsCard({ 
  events, 
  weatherData, 
  bounceAnimation 
}: CalendarEventsCardProps) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getWeatherAdviceForEvent = (event: CalendarEvent): string => {
    if (!weatherData) return "Check the weather before heading out! 🌤️";
    
    const temp = weatherData.current.temperature;
    const weatherCode = weatherData.current.weatherCode;
    const hour = parseInt(event.startTime.split(':')[0]);
    
    if (!event.isOutdoor) {
      return "Indoor event - you're all set! 🏢";
    }
    
    let advice = "";
    
    // Temperature advice
    if (temp < 5) {
      advice += "Bundle up warm! 🧥 ";
    } else if (temp < 15) {
      advice += "Bring a jacket! 🧥 ";
    } else if (temp > 30) {
      advice += "Stay cool and hydrated! 💧 ";
    }
    
    // Weather condition advice
    if (weatherCode >= 51 && weatherCode <= 65) {
      advice += "Bring an umbrella! ☔ ";
    } else if (weatherCode >= 95) {
      advice += "Watch for storms! ⛈️ ";
    } else if (weatherCode <= 1 && temp > 20) {
      advice += "Perfect weather! ☀️ ";
    }
    
    // Time-based advice
    if (hour >= 11 && hour <= 15 && weatherData.current.uvIndex >= 6) {
      advice += "Don't forget sunscreen! 🧴";
    }
    
    return advice || "Enjoy your outdoor time! 🌟";
  };

  const getEventIcon = (event: CalendarEvent): string => {
    if (event.title.toLowerCase().includes('jog') || event.title.toLowerCase().includes('run')) {
      return '🏃‍♀️';
    } else if (event.title.toLowerCase().includes('walk')) {
      return '🚶‍♀️';
    } else if (event.title.toLowerCase().includes('meeting') || event.title.toLowerCase().includes('lunch')) {
      return '🍽️';
    } else if (event.title.toLowerCase().includes('workout') || event.title.toLowerCase().includes('gym')) {
      return '💪';
    } else if (event.isOutdoor) {
      return '🌳';
    } else {
      return '📅';
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: opacityAnim,
          transform: [
            { translateX: slideAnim },
            { translateY: bounceAnimation }
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.title}>Today's Events & Weather Tips</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Smart suggestions for your scheduled activities
      </Text>
      
      {events.map((event, index) => (
        <Animated.View
          key={event.id}
          style={[
            styles.eventItem,
            {
              opacity: opacityAnim,
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 50 * (index + 1)],
                })
              }]
            }
          ]}
        >
          <View style={styles.eventHeader}>
            <Text style={styles.eventIcon}>{getEventIcon(event)}</Text>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventTime}>
                {event.startTime} - {event.endTime}
                {event.location && ` • ${event.location}`}
              </Text>
            </View>
            {event.isOutdoor && (
              <View style={styles.outdoorBadge}>
                <Text style={styles.outdoorText}>OUTDOOR</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.eventAdvice}>
            💡 {getWeatherAdviceForEvent(event)}
          </Text>
        </Animated.View>
      ))}
      
      <TouchableOpacity style={styles.calendarButton}>
        <Text style={styles.calendarButtonText}>📱 Open Calendar App</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
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
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
  },
  eventItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  outdoorBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outdoorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  eventAdvice: {
    fontSize: 13,
    fontWeight: '400',
    color: '#059669',
    fontStyle: 'italic',
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
  },
  calendarButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
}); 