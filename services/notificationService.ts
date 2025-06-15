import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WeatherAlert } from '@/types/weather';
import { AIService } from './aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Check if we're running in Expo Go (which has limitations)
const isExpoGo = () => {
  return __DEV__ && Platform.OS !== 'web';
};

export class NotificationService {
  private static isInitialized = false;
  private static readonly STORAGE_KEYS = {
    LAST_WELCOME: 'lastWelcomeNotification',
    LAST_MORNING: 'lastMorningNotification',
    LAST_EVENING: 'lastEveningNotification',
    DAILY_SCHEDULED: 'dailyNotificationsScheduled'
  };

  static async initialize(): Promise<boolean> {
    try {
      // Skip initialization on web or if already initialized
      if (Platform.OS === 'web' || this.isInitialized) {
        return true;
      }

      // Show info message for Expo Go users
      if (isExpoGo()) {
        console.log('📱 Running in Expo Go - some notification features are limited. Use a development build for full functionality.');
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Note: Push token registration is not supported in Expo Go for SDK 53
      // This would work in a development build or production app
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('weather-alerts', {
            name: 'Weather Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        } catch (channelError) {
          console.log('Android notification channel setup skipped in Expo Go');
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('Notification initialization completed with limitations in Expo Go');
      this.isInitialized = true; // Still mark as initialized for basic functionality
      return true;
    }
  }

  static async scheduleWeatherAlert(alert: WeatherAlert): Promise<void> {
    try {
      // Skip on web or if not initialized
      if (Platform.OS === 'web' || !this.isInitialized) {
        console.log('Notification scheduled (simulated):', alert.title);
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.description,
          data: { 
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity 
          },
        },
        trigger: null, // Send immediately
      });

      console.log('Weather alert notification scheduled:', alert.title);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  static async scheduleMultipleAlerts(alerts: WeatherAlert[]): Promise<void> {
    for (const alert of alerts) {
      await this.scheduleWeatherAlert(alert);
      // Add small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('All notifications cancelled (simulated)');
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All weather notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      if (Platform.OS === 'web') {
        return [];
      }

      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // For development builds only - not supported in Expo Go SDK 53
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        console.warn('Push notifications not supported on web');
        return null;
      }

      // This will only work in development builds, not Expo Go
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your actual project ID
      });

      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.warn('Push token registration failed (expected in Expo Go):', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // Request notification permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true; // Assume granted on web
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  // Send immediate alert notification
  static async sendImmediateAlert(alert: WeatherAlert): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Immediate alert sent (simulated):', alert.title);
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.description,
          data: { 
            alertId: alert.id,
            type: alert.type,
            severity: alert.severity 
          },
        },
        trigger: null, // Send immediately
      });

      console.log('Immediate alert notification sent:', alert.title);
    } catch (error) {
      console.error('Failed to send immediate alert:', error);
    }
  }

  // Schedule background weather check (placeholder for now)
  static async scheduleBackgroundWeatherCheck(): Promise<void> {
    console.log('Background weather check scheduled');
    // This would typically schedule periodic background checks
    // For now, it's just a placeholder
  }

  // Test notification function
  static async sendTestNotification(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Test notification sent (simulated)');
        alert('🌟 Weather Buddy says: Notifications are working perfectly! Get ready for some fun weather updates! 🎉');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌟 Weather Buddy Test',
          body: 'Notifications are working! Get ready for some quirky weather updates! 🎉',
          data: { test: true },
        },
        trigger: null, // Send immediately
      });

      console.log('Test notification scheduled');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  // Send welcome notification when app opens (only once per day)
  static async sendWelcomeNotificationIfNeeded(weatherData: any, location: any): Promise<void> {
    try {
      const today = new Date().toDateString();
      const lastWelcome = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_WELCOME);
      
      if (lastWelcome === today) {
        console.log('Welcome notification already sent today');
        return;
      }

      // Generate AI welcome message
      const welcomeMessage = await AIService.generateWelcomeMessage(weatherData, location);
      
      if (Platform.OS === 'web') {
        console.log(`🎉 Welcome: ${welcomeMessage.title} - ${welcomeMessage.body}`);
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: welcomeMessage.title,
          body: welcomeMessage.body,
          data: { 
            type: 'welcome',
            action: 'open-for-you-page'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2, // Small delay to let app load
        },
      });

      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_WELCOME, today);
      console.log('🎉 Welcome notification sent');
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
    }
  }

  // Schedule daily notifications (only once, not every time page loads)
  static async scheduleDailyNotificationsIfNeeded(): Promise<void> {
    try {
      const isScheduled = await AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_SCHEDULED);
      
      if (isScheduled === 'true') {
        console.log('Daily notifications already scheduled');
        return;
      }

      if (Platform.OS === 'web') {
        console.log('Daily notifications scheduled (simulated)');
        await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_SCHEDULED, 'true');
        return;
      }

      // Cancel any existing daily notifications first
      await this.cancelDailyNotifications();

      // Morning notification (8 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Weather Buddy Wake-Up Call!',
          body: 'Rise and shine! Your personalized weather adventure awaits in the For You page! ☀️',
          data: { 
            type: 'daily-morning',
            action: 'open-for-you-page'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 0,
        },
      });

      // Evening notification (7 PM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Evening Weather Wisdom',
          body: 'Time to prep for tomorrow! Check what weather surprises we\'ve prepared for you! ✨',
          data: { 
            type: 'daily-evening',
            action: 'open-for-you-page'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 19,
          minute: 0,
        },
      });

      await AsyncStorage.setItem(this.STORAGE_KEYS.DAILY_SCHEDULED, 'true');
      console.log('Daily notifications scheduled');
    } catch (error) {
      console.error('Failed to schedule daily notifications:', error);
    }
  }

  // Cancel daily notifications
  static async cancelDailyNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Daily notifications cancelled (simulated)');
        return;
      }

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const dailyNotifications = scheduledNotifications.filter(notification => 
        notification.content.data?.type === 'daily-morning' || 
        notification.content.data?.type === 'daily-evening'
      );

      for (const notification of dailyNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      await AsyncStorage.removeItem(this.STORAGE_KEYS.DAILY_SCHEDULED);
      console.log('Daily notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel daily notifications:', error);
    }
  }

  // Send quirky weather notifications using AI (improved)
  static async sendQuirkyWeatherNotification(weatherData: any, location: any): Promise<void> {
    try {
      const hour = new Date().getHours();
      const today = new Date().toDateString();
      
      // Check if we should send morning or evening notification
      const isMorning = hour >= 7 && hour <= 10;
      const isEvening = hour >= 18 && hour <= 21;
      
      if (!isMorning && !isEvening) {
        console.log('Not morning or evening time, skipping quirky notification');
        return;
      }

      // Check if we already sent notification today for this time
      const storageKey = isMorning ? this.STORAGE_KEYS.LAST_MORNING : this.STORAGE_KEYS.LAST_EVENING;
      const lastSent = await AsyncStorage.getItem(storageKey);
      
      if (lastSent === today) {
        console.log(`${isMorning ? 'Morning' : 'Evening'} notification already sent today`);
        return;
      }

      // Generate AI notification
      const timeOfDay = isMorning ? 'morning' : 'evening';
      const aiNotification = await AIService.generateQuirkyTimeBasedNotification(weatherData, location, timeOfDay);
      
      if (Platform.OS === 'web') {
        console.log(`🎭 ${timeOfDay} notification: ${aiNotification.title} - ${aiNotification.body}`);
        await AsyncStorage.setItem(storageKey, today);
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: aiNotification.title,
          body: aiNotification.body,
          data: { 
            type: `quirky-${timeOfDay}`,
            temperature: weatherData?.current?.temperature || 20,
            weatherCode: weatherData?.current?.weatherCode || 0,
            location: location?.city || 'your location',
            action: 'open-for-you-page'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });

      await AsyncStorage.setItem(storageKey, today);
      console.log(`🎭 ${timeOfDay} quirky notification sent:`, aiNotification.title);
    } catch (error) {
      console.error('Failed to send quirky notification:', error);
    }
  }

  // Send weather alert notifications
  static async sendWeatherAlert(alert: WeatherAlert): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log(`🚨 Weather Alert: ${alert.title} - ${alert.description}`);
        return;
      }

      // Use the same notification structure as other notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.description,
          data: { 
            type: 'weather-alert',
            alertType: alert.type,
            severity: alert.severity,
            alertId: alert.id,
            action: 'open-for-you-page'
          },
        },
        trigger: null, // Send immediately
      });

      console.log('🚨 Weather alert notification sent:', alert.title);
    } catch (error) {
      console.error('Failed to send weather alert:', error);
    }
  }

  // Clear welcome notification history (for testing)
  static async clearWelcomeHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.LAST_WELCOME);
      console.log('Welcome notification history cleared');
    } catch (error) {
      console.error('Error clearing welcome history:', error);
    }
  }

  // Clear all notification histories (for testing)
  static async clearAllNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.LAST_WELCOME,
        this.STORAGE_KEYS.LAST_MORNING,
        this.STORAGE_KEYS.LAST_EVENING,
        this.STORAGE_KEYS.DAILY_SCHEDULED
      ]);
      console.log('All notification history cleared');
    } catch (error) {
      console.error('Error clearing all notification history:', error);
    }
  }

  // Get notification status for debugging
  static async getNotificationStatus(): Promise<{
    welcomeSentToday: boolean;
    morningSentToday: boolean;
    eveningSentToday: boolean;
    dailyScheduled: boolean;
    scheduledCount: number;
    lastWelcomeDate: string | null;
    lastMorningDate: string | null;
    lastEveningDate: string | null;
  }> {
    try {
      const today = new Date().toDateString();
      const [lastWelcome, lastMorning, lastEvening, dailyScheduled] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.LAST_WELCOME),
        AsyncStorage.getItem(this.STORAGE_KEYS.LAST_MORNING),
        AsyncStorage.getItem(this.STORAGE_KEYS.LAST_EVENING),
        AsyncStorage.getItem(this.STORAGE_KEYS.DAILY_SCHEDULED)
      ]);

      let scheduledCount = 0;
      if (Platform.OS !== 'web') {
        const scheduled = await this.getScheduledNotifications();
        scheduledCount = scheduled.length;
      }

      return {
        welcomeSentToday: lastWelcome === today,
        morningSentToday: lastMorning === today,
        eveningSentToday: lastEvening === today,
        dailyScheduled: dailyScheduled === 'true',
        scheduledCount,
        lastWelcomeDate: lastWelcome,
        lastMorningDate: lastMorning,
        lastEveningDate: lastEvening
      };
    } catch (error) {
      console.error('Error getting notification status:', error);
      return {
        welcomeSentToday: false,
        morningSentToday: false,
        eveningSentToday: false,
        dailyScheduled: false,
        scheduledCount: 0,
        lastWelcomeDate: null,
        lastMorningDate: null,
        lastEveningDate: null
      };
    }
  }

  // Force send welcome notification (for testing)
  static async forceSendWelcomeNotification(weatherData: any, location: any): Promise<void> {
    try {
      // Clear the welcome history first
      await this.clearWelcomeHistory();
      
      // Then send the welcome notification
      await this.sendWelcomeNotificationIfNeeded(weatherData, location);
      
      console.log('🎉 Welcome notification forced');
    } catch (error) {
      console.error('Failed to force welcome notification:', error);
    }
  }

  // Get detailed scheduled notifications info
  static async getScheduledNotificationsInfo(): Promise<Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    scheduleInfo: string;
  }>> {
    try {
      if (Platform.OS === 'web') {
        return [];
      }

      const scheduled = await this.getScheduledNotifications();
      return scheduled.map(notification => {
        let scheduleInfo = 'Unknown schedule';
        
        // Extract schedule information from trigger
        if (notification.trigger && typeof notification.trigger === 'object') {
          const trigger = notification.trigger as any;
          
          if (trigger.type === 'calendar' && trigger.dateComponents) {
            const hour = trigger.dateComponents.hour;
            const minute = trigger.dateComponents.minute || 0;
            const repeats = trigger.repeats ? ' (Daily)' : ' (Once)';
            scheduleInfo = `${hour}:${minute.toString().padStart(2, '0')}${repeats}`;
          } else if (trigger.type === 'timeInterval') {
            scheduleInfo = `In ${trigger.seconds} seconds`;
          } else if (trigger.seconds) {
            scheduleInfo = `In ${trigger.seconds} seconds`;
          }
        }

        return {
          id: notification.identifier,
          title: notification.content.title || 'No title',
          body: notification.content.body || 'No body',
          type: (notification.content.data?.type as string) || 'unknown',
          scheduleInfo
        };
      });
    } catch (error) {
      console.error('Error getting scheduled notifications info:', error);
      return [];
    }
  }
}