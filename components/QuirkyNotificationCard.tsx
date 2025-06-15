import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { WeatherData, LocationData } from '@/types/weather';

interface QuirkyNotificationCardProps {
  weatherData: WeatherData | null;
  location: LocationData | null;
  bounceAnimation: Animated.AnimatedAddition<number>;
}

export function QuirkyNotificationCard({ 
  weatherData, 
  location, 
  bounceAnimation 
}: QuirkyNotificationCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const generateQuirkyMessage = (): { message: string; icon: string } => {
    const hour = new Date().getHours();
    const temp = weatherData?.current.temperature || 20;
    const weatherCode = weatherData?.current.weatherCode || 0;
    
    // Time-based messages
    if (hour >= 5 && hour < 12) {
      const morningMessages = [
        { message: "🌅 Rise and shine, weather warrior! Today's forecast: 100% chance of awesomeness!", icon: "☀️" },
        { message: "☕ Good morning! The weather gods have prepared something special for you today!", icon: "🌤️" },
        { message: "🐦 The early bird gets the... perfect weather update! Let's see what's brewing outside!", icon: "🌈" },
      ];
      return morningMessages[Math.floor(Math.random() * morningMessages.length)];
    } else if (hour >= 12 && hour < 17) {
      const afternoonMessages = [
        { message: "🌞 Afternoon check-in! Time to see if Mother Nature is still behaving herself!", icon: "🌤️" },
        { message: "☀️ Midday vibes! Perfect time to adjust your weather game plan!", icon: "⛅" },
        { message: "🌻 Afternoon sunshine (or not)! Either way, you're going to rock this day!", icon: "🌈" },
      ];
      return afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)];
    } else {
      const eveningMessages = [
        { message: "🌙 Evening weather wisdom coming your way! Let's prep for tonight and tomorrow!", icon: "✨" },
        { message: "🌆 Sunset vibes! Time to see what the weather has in store for your evening!", icon: "🌅" },
        { message: "⭐ Evening star! Ready for some weather magic to end your day right?", icon: "🌟" },
      ];
      return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
    }
  };

  const generateWeatherQuip = (): string => {
    if (!weatherData) return "Weather data is playing hide and seek, but we'll find it! 🕵️‍♀️";
    
    const temp = weatherData.current.temperature;
    const weatherCode = weatherData.current.weatherCode;
    
    if (temp < 0) {
      return "🥶 Brrr! It's colder than a penguin's toenails out there!";
    } else if (temp > 35) {
      return "🔥 It's hotter than a jalapeño's armpit! Stay cool, friend!";
    } else if (weatherCode >= 51 && weatherCode <= 65) {
      return "☔ Rain, rain, go away... or don't! Puddles are fun too! 💦";
    } else if (weatherCode >= 95) {
      return "⛈️ Thor is having a drum solo up there! Stay safe and enjoy the show!";
    } else if (weatherCode <= 1) {
      return "☀️ The sun is showing off today! Time to soak up those good vibes!";
    } else {
      return "🌤️ The weather is feeling mysterious today... I like it!";
    }
  };

  const quirkyMessage = generateQuirkyMessage();
  const weatherQuip = generateWeatherQuip();

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { scale: pulseAnim },
            { translateY: bounceAnimation }
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <Animated.Text 
          style={[
            styles.icon,
            { transform: [{ rotate: '0deg' }] }
          ]}
        >
          {quirkyMessage.icon}
        </Animated.Text>
        <Text style={styles.title}>Weather Buddy Says...</Text>
      </View>
      
      <Text style={styles.message}>{quirkyMessage.message}</Text>
      <Text style={styles.quip}>{weatherQuip}</Text>
      
      {location && (
        <Text style={styles.location}>
          📍 Currently watching over {location.city || 'your location'}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0EA5E9',
    ...Platform.select({
      ios: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 25px -5px rgba(14, 165, 233, 0.2)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C4A6E',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E40AF',
    lineHeight: 24,
    marginBottom: 8,
  },
  quip: {
    fontSize: 14,
    fontWeight: '400',
    color: '#3730A3',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
}); 