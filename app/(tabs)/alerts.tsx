import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  RefreshControl, 
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationService } from '@/services/locationService';
import { WeatherService } from '@/services/weatherService';
import { NotificationService } from '@/services/notificationService';
import { AIService } from '@/services/aiService';
import { WeatherData, LocationData } from '@/types/weather';
import { SuggestionCard } from '@/components/SuggestionCard';
import { QuirkyNotificationCard } from '@/components/QuirkyNotificationCard';
import { ModernNewsCard } from '@/components/ModernNewsCard';
import { WeatherAlertService } from '@/services/weatherAlertService';
import { CalendarService, CalendarEvent as RealCalendarEvent } from '@/services/calendarService';

interface SimpleSuggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  type?: 'dress' | 'activity' | 'preparation' | 'quirky' | 'calendar';
}

// Use the CalendarEvent from CalendarService
type CalendarEvent = RealCalendarEvent;

export default function SuggestionsScreen() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [suggestions, setSuggestions] = useState<SimpleSuggestion[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [welcomeNotificationSent, setWelcomeNotificationSent] = useState(false);
  
  // Animation values
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const bounceAnimation = Animated.add(bounceAnim, new Animated.Value(0));

  useEffect(() => {
    fetchData();
    startBounceAnimation();
  }, []);

  // Send welcome notification when app opens (only once per day)
  useEffect(() => {
    if (weatherData && location && !welcomeNotificationSent) {
      sendWelcomeNotification();
      setWelcomeNotificationSent(true);
    }
  }, [weatherData, location, welcomeNotificationSent]);

  const startBounceAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data for suggestions...');
      
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);
      console.log('📍 Location fetched:', locationData?.city);

      const data = await WeatherService.getCurrentWeather(locationData);
      setWeatherData(data);
      console.log('🌤️ Weather fetched:', data?.current?.temperature);

      // Try AI-powered suggestions first
      let generatedSuggestions: SimpleSuggestion[] = [];
      try {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        const aiResponse = await AIService.generatePersonalizedSuggestions(data, locationData, timeOfDay);
        
        generatedSuggestions = aiResponse.suggestions.map((suggestion, index) => ({
          id: `ai-${index}`,
          title: suggestion.title,
          description: suggestion.description,
          icon: suggestion.icon,
          priority: suggestion.priority,
          type: suggestion.type as 'dress' | 'activity' | 'preparation' | 'quirky' | 'calendar'
        }));
        console.log('🤖 AI suggestions generated:', generatedSuggestions.length);
      } catch (aiError) {
        console.log('🔄 AI failed, using basic suggestions');
        generatedSuggestions = generateSimpleSuggestions(data);
      }
      
      setSuggestions(generatedSuggestions);

      // Fetch calendar events
      const events = await fetchCalendarEvents();
      setCalendarEvents(events);

      // Check for weather alerts
      if (data && locationData) {
        await WeatherAlertService.checkForWeatherAlerts(data, locationData);
        console.log('🔍 Weather alert check completed');
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error);
      // Generate fallback suggestions
      const fallbackSuggestions = generateFallbackSuggestions();
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSimpleSuggestions = (weather: WeatherData): SimpleSuggestion[] => {
    const suggestions: SimpleSuggestion[] = [];
    const temp = weather.current.temperature;
    const weatherCode = weather.current.weatherCode;

    // Temperature-based clothing advice
    if (temp < 5) {
      suggestions.push({
        id: 'cold-weather',
        title: '🧥 Bundle Up!',
        description: `It's ${Math.round(temp)}°C - time for your warmest coat, gloves, and a cozy hat!`,
        icon: '🥶',
        priority: 'high'
      });
    } else if (temp < 15) {
      suggestions.push({
        id: 'cool-weather',
        title: '🧥 Jacket Weather',
        description: `${Math.round(temp)}°C calls for a good jacket or sweater. Perfect layering weather!`,
        icon: '🧣',
        priority: 'medium'
      });
    } else if (temp < 25) {
      suggestions.push({
        id: 'mild-weather',
        title: '👕 Comfortable Day',
        description: `Nice ${Math.round(temp)}°C! Light layers work great - maybe a long sleeve or light sweater.`,
        icon: '😊',
        priority: 'low'
      });
    } else {
      suggestions.push({
        id: 'warm-weather',
        title: '☀️ Summer Vibes',
        description: `${Math.round(temp)}°C is perfect for shorts, t-shirts, and don't forget sunscreen!`,
        icon: '🌞',
        priority: 'medium'
      });
    }

    // Weather condition advice
    if (weatherCode >= 51 && weatherCode <= 65) {
      suggestions.push({
        id: 'rain-advice',
        title: '☔ Rain Alert',
        description: 'Grab your umbrella and maybe some waterproof shoes. Puddle jumping optional!',
        icon: '🌧️',
        priority: 'high'
      });
    }

    // UV advice
    if (weather.current.uvIndex >= 6) {
      suggestions.push({
        id: 'uv-protection',
        title: '🕶️ UV Protection',
        description: `UV index is ${weather.current.uvIndex}! Sunglasses, hat, and SPF 30+ recommended.`,
        icon: '☀️',
        priority: 'high'
      });
    }

    // Activity suggestions
    if (weatherCode <= 1 && temp >= 15 && temp <= 25) {
      suggestions.push({
        id: 'perfect-day',
        title: '🌟 Perfect Weather',
        description: 'Ideal conditions for outdoor activities! Great day for a walk, picnic, or sports.',
        icon: '🚶‍♀️',
        priority: 'medium'
      });
    }

    return suggestions;
  };

  const generateFallbackSuggestions = (): SimpleSuggestion[] => {
    return [
      {
        id: 'fallback-1',
        title: '🌤️ Weather Check',
        description: 'Unable to get current weather, but it\'s always good to check conditions before heading out!',
        icon: '📱',
        priority: 'medium'
      },
      {
        id: 'fallback-2',
        title: '🧥 Layer Smart',
        description: 'When in doubt, layer up! You can always remove clothes if it gets warmer.',
        icon: '👕',
        priority: 'low'
      }
         ];
   };

   const sendWelcomeNotification = async () => {
     try {
       // Send welcome notification when app opens
       if (weatherData && location) {
         await NotificationService.sendWelcomeNotificationIfNeeded(weatherData, location);
         console.log('🎉 Welcome notification process completed');
       }
       
       // Schedule daily notifications (only once)
       await NotificationService.scheduleDailyNotificationsIfNeeded();
       
       // Check if we should send time-based quirky notification
       const hour = new Date().getHours();
       const isMorning = hour >= 7 && hour <= 10;
       const isEvening = hour >= 18 && hour <= 21;
       
       if ((isMorning || isEvening) && weatherData && location) {
         await NotificationService.sendQuirkyWeatherNotification(weatherData, location);
       }
     } catch (error) {
       console.error('Error in welcome notification process:', error);
     }
   };

   const fetchCalendarEvents = async (): Promise<CalendarEvent[]> => {
     // Simulate calendar integration attempt
     console.log('📅 Attempting to access device calendar...');
     
     // Use real calendar service
     const realEvents = await CalendarService.getTodaysEvents();
     
     if (realEvents.length > 0) {
       console.log(`📅 Successfully loaded ${realEvents.length} real calendar events`);
       return realEvents;
     }
     
     // Fallback to mock events if no real events found
     const mockEvents: CalendarEvent[] = [
       {
         id: '1',
         title: 'Morning Jog',
         startTime: '07:00',
         endTime: '08:00',
         isOutdoor: true,
         allDay: false
       },
       {
         id: '2',
         title: 'Lunch Meeting',
         startTime: '12:30',
         endTime: '13:30',
         location: 'Downtown Cafe',
         isOutdoor: false,
         allDay: false
       },
       {
         id: '3',
         title: 'Evening Walk',
         startTime: '18:00',
         endTime: '19:00',
         isOutdoor: true,
         allDay: false
       }
     ];
     
     console.log('📅 Using fallback mock events - found', mockEvents.length, 'events');
     return mockEvents;
   };

   const getWeatherAdviceForEvent = (event: CalendarEvent): string => {
     if (!weatherData) return "Check weather before heading out!";
     
     const temp = weatherData.current.temperature;
     const weatherCode = weatherData.current.weatherCode;
     const hour = parseInt(event.startTime.split(':')[0]);
     
     let advice = "";
     
     if (event.isOutdoor) {
       if (weatherCode >= 51 && weatherCode <= 65) {
         advice = "Bring an umbrella and waterproof gear! ";
       } else if (temp < 5) {
         advice = "Bundle up warm - it's quite cold! ";
       } else if (temp > 30) {
         advice = "Stay hydrated and wear sunscreen! ";
       } else if (weatherCode <= 1) {
         advice = "Perfect weather for outdoor activities! ";
       }
       
       if (hour >= 11 && hour <= 15 && weatherData.current.uvIndex >= 6) {
         advice += "Don't forget sunscreen! 🧴";
       }
     } else {
       if (weatherCode >= 51 && weatherCode <= 65) {
         advice = "Great choice to stay indoors with this weather! ";
    } else {
         advice = "Indoor event - weather won't be a concern! ";
       }
     }
     
     return advice || "Enjoy your event! 🌟";
   };

   const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const sendTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification();
      console.log('Test notification sent!');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const testWeatherAlerts = async () => {
    try {
      if (weatherData && location) {
        await WeatherAlertService.triggerAlertCheck(weatherData, location);
        console.log('🧪 Manual weather alert check triggered');
      }
    } catch (error) {
      console.error('Error testing weather alerts:', error);
    }
  };

  const clearAlertHistory = async () => {
    try {
      await WeatherAlertService.clearAlertHistory();
      console.log('🧹 Alert history cleared');
    } catch (error) {
      console.error('Error clearing alert history:', error);
    }
  };

  const testWelcomeNotification = async () => {
    try {
      if (weatherData && location) {
        await NotificationService.forceSendWelcomeNotification(weatherData, location);
        console.log('🎉 Welcome notification test triggered');
      }
    } catch (error) {
      console.error('Error testing welcome notification:', error);
    }
  };

  const checkNotificationStatus = async () => {
    try {
      const status = await NotificationService.getNotificationStatus();
      const scheduledInfo = await NotificationService.getScheduledNotificationsInfo();
      
      console.log('📊 Notification Status:', {
        welcomeSentToday: status.welcomeSentToday,
        morningSentToday: status.morningSentToday,
        eveningSentToday: status.eveningSentToday,
        dailyScheduled: status.dailyScheduled,
        scheduledCount: status.scheduledCount,
        lastWelcomeDate: status.lastWelcomeDate,
        lastMorningDate: status.lastMorningDate,
        lastEveningDate: status.lastEveningDate
      });
      
      console.log('📅 Scheduled Notifications:', scheduledInfo);
      
      // Format scheduled notifications for display
      const scheduledText = scheduledInfo.length > 0 
        ? scheduledInfo.map(notif => `• ${notif.type}: ${notif.scheduleInfo}`).join('\n')
        : 'None scheduled';
      
      // Show alert with status
      Alert.alert('📊 Notification Status', `
Welcome sent today: ${status.welcomeSentToday ? '✅' : '❌'}
Morning sent today: ${status.morningSentToday ? '✅' : '❌'}
Evening sent today: ${status.eveningSentToday ? '✅' : '❌'}
Daily scheduled: ${status.dailyScheduled ? '✅' : '❌'}
Scheduled count: ${status.scheduledCount}

Last dates:
Welcome: ${status.lastWelcomeDate || 'Never'}
Morning: ${status.lastMorningDate || 'Never'}
Evening: ${status.lastEveningDate || 'Never'}

📅 Scheduled Notifications:
${scheduledText}

Check console for full details.`);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const clearAllNotificationHistory = async () => {
    try {
      await NotificationService.clearAllNotificationHistory();
      console.log('🧹 All notification history cleared');
    } catch (error) {
      console.error('Error clearing all notification history:', error);
    }
  };

  const checkCalendarStatus = async () => {
    try {
      const permissionStatus = await CalendarService.getPermissionStatus();
      const calendars = await CalendarService.getAvailableCalendars();
      const events = await CalendarService.getTodaysEvents();
      
      console.log('📅 Calendar Status:', {
        permissionStatus,
        availableCalendars: calendars.length,
        todaysEvents: events.length
      });
      
      console.log('📅 Available Calendars:', calendars);
      console.log('📅 Today\'s Events:', events);
      
      Alert.alert('📅 Calendar Status', `
Permission: ${permissionStatus === 'granted' ? '✅ Granted' : permissionStatus === 'denied' ? '❌ Denied' : '⏳ Not Requested'}
Available Calendars: ${calendars.length}
Today's Events: ${events.length}

${calendars.length > 0 ? 'Calendars:\n' + calendars.map(cal => `• ${cal.title} (${cal.source})`).join('\n') : ''}

${events.length > 0 ? '\nToday\'s Events:\n' + events.slice(0, 3).map(event => `• ${event.title} (${event.startTime})`).join('\n') : ''}

Check console for full details.`);
    } catch (error) {
      console.error('Error checking calendar status:', error);
      Alert.alert('Error', 'Failed to check calendar status');
    }
  };

  const requestCalendarPermissions = async () => {
    try {
      const granted = await CalendarService.requestPermissions();
      if (granted) {
        Alert.alert('✅ Success', 'Calendar permissions granted! Refresh to load your events.');
        // Refresh data to load real calendar events
        fetchData();
      } else {
        Alert.alert('❌ Denied', 'Calendar permissions were denied. The app will use simulated events.');
      }
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      Alert.alert('Error', 'Failed to request calendar permissions');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>🔮 Getting your personalized suggestions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💡 Daily Suggestions</Text>
        <Text style={styles.headerSubtitle}>Smart advice ordered from high-low priority</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Location Info */}
          {location && (
            <View style={styles.locationCard}>
              <Text style={styles.locationText}>
                📍 {location.city}, {location.region}
              </Text>
              {weatherData && (
                <Text style={styles.temperatureText}>
                  {Math.round(weatherData.current.temperature)}°C
                </Text>
              )}
            </View>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(suggestion.priority) }]}>
                      <Text style={styles.priorityText}>{suggestion.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noSuggestionsCard}>
              <Text style={styles.noSuggestionsText}>🤔 No suggestions available</Text>
              <Text style={styles.noSuggestionsSubtext}>Pull down to refresh</Text>
            </View>
                     )}

          {/* Calendar Events */}
          {calendarEvents.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>📅 Today's Events & Weather Tips</Text>
              {calendarEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventIcon}>
                      {event.isOutdoor ? '🌳' : '🏢'}
                    </Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {event.allDay ? 'All Day' : `${event.startTime} - ${event.endTime}`}
                        {event.location && ` • ${event.location}`}
                      </Text>
                      {event.notes && (
                        <Text style={styles.eventNotes} numberOfLines={1}>
                          {event.notes}
                        </Text>
                      )}
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
          </View>
            ))}
          </View>
        )}

          {/* Modern Weather News */}
          <ModernNewsCard 
            weatherData={weatherData}
            location={location}
            bounceAnimation={bounceAnimation}
          />

          {/* Test Buttons */}
          <View style={styles.testButtonsContainer}>
            <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
              <Text style={styles.testButtonText}>🔔 Test Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testButton} onPress={testWeatherAlerts}>
              <Text style={styles.testButtonText}>🌦️ Test Weather Alerts</Text>
          </TouchableOpacity>
        </View>

          <View style={styles.testButtonsContainer}>
            <TouchableOpacity style={styles.testButton} onPress={testWelcomeNotification}>
              <Text style={styles.testButtonText}>🎉 Test Welcome</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testButton} onPress={checkNotificationStatus}>
              <Text style={styles.testButtonText}>📊 Check Status</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.testButtonsContainer}>
            <TouchableOpacity style={styles.testButton} onPress={checkCalendarStatus}>
              <Text style={styles.testButtonText}>📅 Calendar Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.testButton, { backgroundColor: '#10B981' }]} onPress={requestCalendarPermissions}>
              <Text style={styles.testButtonText}>🔓 Request Calendar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.testButtonsContainer}>
            <TouchableOpacity style={[styles.testButton, { backgroundColor: '#EF4444' }]} onPress={clearAlertHistory}>
              <Text style={styles.testButtonText}>🧹 Clear Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.testButton, { backgroundColor: '#DC2626' }]} onPress={clearAllNotificationHistory}>
              <Text style={styles.testButtonText}>🗑️ Clear All History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  temperatureText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  suggestionTitle: {
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
    color: '#FFFFFF',
  },
  suggestionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 20,
  },
  noSuggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  noSuggestionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  noSuggestionsSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
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
  eventNotes: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
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
    color: '#FFFFFF',
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
});