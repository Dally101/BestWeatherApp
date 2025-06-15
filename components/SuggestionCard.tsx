import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';

interface Suggestion {
  id: string;
  type: 'dress' | 'activity' | 'preparation' | 'quirky' | 'calendar';
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  delay?: number;
}

export function SuggestionCard({ suggestion, delay = 0 }: SuggestionCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dress': return '#8B5CF6';
      case 'activity': return '#06B6D4';
      case 'preparation': return '#F59E0B';
      case 'quirky': return '#EC4899';
      case 'calendar': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          borderLeftColor: getTypeColor(suggestion.type),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{suggestion.icon}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{suggestion.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(suggestion.priority) }]}>
            <Text style={styles.priorityText}>{suggestion.priority.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.description}>{suggestion.description}</Text>
      
      {suggestion.actionable && suggestion.action && (
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>✓ {suggestion.action}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
}); 