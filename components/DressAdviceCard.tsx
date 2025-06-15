import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { WeatherData } from '@/types/weather';

interface DressAdviceCardProps {
  weatherData: WeatherData | null;
  bounceAnimation: Animated.AnimatedAddition<number>;
}

export function DressAdviceCard({ weatherData, bounceAnimation }: DressAdviceCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Rotate animation for clothing icons
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const getDressAdvice = () => {
    if (!weatherData) {
      return {
        title: '👕 Dress Smart!',
        advice: 'Check the weather and dress appropriately for the conditions!',
        items: ['Check temperature', 'Consider weather conditions', 'Layer if needed'],
        icon: '🤔'
      };
    }

    const temp = weatherData.current.temperature;
    const weatherCode = weatherData.current.weatherCode;
    const windSpeed = weatherData.current.windSpeed;
    const uvIndex = weatherData.current.uvIndex;

    if (temp < 0) {
      return {
        title: '🧥 Arctic Explorer Mode!',
        advice: `It's ${Math.round(temp)}°C - time to channel your inner penguin!`,
        items: [
          '🧥 Heavy winter coat',
          '🧤 Insulated gloves',
          '🧣 Warm scarf',
          '👢 Waterproof boots',
          '🎿 Thermal layers'
        ],
        icon: '🐧'
      };
    } else if (temp < 5) {
      return {
        title: '❄️ Winter Warrior Outfit',
        advice: `${Math.round(temp)}°C calls for serious bundling up!`,
        items: [
          '🧥 Warm coat',
          '🧤 Gloves',
          '🧣 Scarf',
          '👢 Warm boots',
          '👖 Long pants'
        ],
        icon: '🥶'
      };
    } else if (temp < 15) {
      return {
        title: '🧥 Cozy Layer Season',
        advice: `Perfect ${Math.round(temp)}°C sweater weather!`,
        items: [
          '🧥 Light jacket or sweater',
          '👖 Long pants',
          '👟 Closed shoes',
          '🧣 Light scarf (optional)',
          '☂️ Umbrella if cloudy'
        ],
        icon: '🍂'
      };
    } else if (temp < 25) {
      return {
        title: '👕 Comfortable Casual',
        advice: `Lovely ${Math.round(temp)}°C - perfect for light layers!`,
        items: [
          '👕 T-shirt or light top',
          '👖 Jeans or light pants',
          '👟 Comfortable shoes',
          '🧥 Light cardigan for evening',
          '🕶️ Sunglasses'
        ],
        icon: '😊'
      };
    } else {
      return {
        title: '☀️ Summer Vibes Only!',
        advice: `Hot ${Math.round(temp)}°C - time for maximum comfort!`,
        items: [
          '👕 Light, breathable top',
          '🩳 Shorts or light dress',
          '👡 Sandals or breathable shoes',
          '🧴 Sunscreen SPF 30+',
          '🕶️ Sunglasses',
          '🧢 Hat for sun protection'
        ],
        icon: '🌞'
      };
    }
  };

  const advice = getDressAdvice();
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnimation }
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <Animated.Text 
          style={[
            styles.icon,
            { transform: [{ rotate: spin }] }
          ]}
        >
          {advice.icon}
        </Animated.Text>
        <Text style={styles.title}>{advice.title}</Text>
      </View>
      
      <Text style={styles.advice}>{advice.advice}</Text>
      
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>👗 Outfit Checklist:</Text>
        {advice.items.map((item, index) => (
          <Animated.View
            key={index}
            style={[
              styles.item,
              {
                opacity: scaleAnim,
                transform: [{
                  translateX: scaleAnim.interpolate({
                    inputRange: [0.9, 1],
                    outputRange: [20, 0],
                  })
                }]
              }
            ]}
          >
            <Text style={styles.itemText}>• {item}</Text>
          </Animated.View>
        ))}
      </View>
      
      {weatherData && weatherData.current.uvIndex >= 6 && (
        <View style={styles.uvWarning}>
          <Text style={styles.uvText}>
            ☀️ High UV Index ({weatherData.current.uvIndex}) - Don't forget sun protection!
          </Text>
        </View>
      )}
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
    borderLeftColor: '#8B5CF6',
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
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  advice: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  itemsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  item: {
    marginBottom: 4,
  },
  itemText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  uvWarning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  uvText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#92400E',
  },
}); 