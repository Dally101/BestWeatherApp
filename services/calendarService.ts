import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOutdoor: boolean;
  allDay: boolean;
  notes?: string;
}

export class CalendarService {
  private static hasPermission = false;

  // Request calendar permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('📅 Calendar permissions granted (web simulation)');
        return true;
      }

      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status === 'granted') {
        this.hasPermission = true;
        console.log('📅 Calendar permissions granted');
        return true;
      } else {
        console.log('📅 Calendar permissions denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting calendar permissions:', error);
      return false;
    }
  }

  // Get today's calendar events
  static async getTodaysEvents(): Promise<CalendarEvent[]> {
    try {
      if (Platform.OS === 'web') {
        console.log('📅 Using simulated calendar events for web');
        return this.getSimulatedEvents();
      }

      // Request permissions if not already granted
      if (!this.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          console.log('📅 No calendar permissions, using simulated events');
          return this.getSimulatedEvents();
        }
      }

      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log(`📅 Found ${calendars.length} calendars on device`);

      if (calendars.length === 0) {
        console.log('📅 No calendars found, using simulated events');
        return this.getSimulatedEvents();
      }

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      console.log(`📅 Fetching events for ${startOfDay.toDateString()}`);

      // Get events from all calendars for today
      const allEvents: Calendar.Event[] = [];
      
      for (const calendar of calendars) {
        try {
          const events = await Calendar.getEventsAsync(
            [calendar.id],
            startOfDay,
            endOfDay
          );
          allEvents.push(...events);
          console.log(`📅 Found ${events.length} events in calendar: ${calendar.title}`);
        } catch (calendarError) {
          console.log(`⚠️ Could not access calendar: ${calendar.title}`);
        }
      }

      if (allEvents.length === 0) {
        console.log('📅 No events found for today, using simulated events');
        return this.getSimulatedEvents();
      }

      // Convert to our CalendarEvent format
      const formattedEvents = allEvents.map(event => this.formatCalendarEvent(event));
      
      // Sort by start time
      formattedEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

      console.log(`📅 Successfully loaded ${formattedEvents.length} real calendar events`);
      return formattedEvents;

    } catch (error) {
      console.error('❌ Error fetching calendar events:', error);
      console.log('📅 Falling back to simulated events');
      return this.getSimulatedEvents();
    }
  }

  // Format expo-calendar event to our format
  private static formatCalendarEvent(event: Calendar.Event): CalendarEvent {
    const startTime = event.startDate ? new Date(event.startDate) : new Date();
    const endTime = event.endDate ? new Date(event.endDate) : new Date(startTime.getTime() + 60 * 60 * 1000);

    // Determine if event is likely outdoor based on title and notes
    const isOutdoor = this.determineIfOutdoor(event.title, event.notes || '');

    return {
      id: event.id || `event-${Date.now()}`,
      title: event.title || 'Untitled Event',
      startTime: this.formatTime(startTime),
      endTime: this.formatTime(endTime),
      location: event.location || undefined,
      isOutdoor,
      allDay: event.allDay || false,
      notes: event.notes || undefined
    };
  }

  // Determine if an event is likely outdoor based on keywords
  private static determineIfOutdoor(title: string, notes: string): boolean {
    const text = `${title} ${notes}`.toLowerCase();
    
    const outdoorKeywords = [
      'walk', 'jog', 'run', 'hike', 'bike', 'cycling', 'outdoor', 'park', 'beach', 'garden',
      'picnic', 'bbq', 'barbecue', 'golf', 'tennis', 'soccer', 'football', 'baseball',
      'swimming', 'pool', 'lake', 'river', 'fishing', 'camping', 'festival', 'market',
      'fair', 'concert', 'sports', 'game', 'match', 'race', 'marathon', 'workout',
      'exercise', 'training', 'practice', 'field', 'court', 'stadium', 'playground'
    ];

    const indoorKeywords = [
      'meeting', 'office', 'work', 'conference', 'call', 'zoom', 'teams', 'appointment',
      'doctor', 'dentist', 'hospital', 'clinic', 'restaurant', 'cafe', 'mall', 'store',
      'shopping', 'movie', 'theater', 'cinema', 'gym', 'class', 'lesson', 'study',
      'library', 'home', 'house', 'apartment', 'indoor', 'inside'
    ];

    const outdoorScore = outdoorKeywords.filter(keyword => text.includes(keyword)).length;
    const indoorScore = indoorKeywords.filter(keyword => text.includes(keyword)).length;

    // If outdoor keywords outweigh indoor keywords, consider it outdoor
    // Default to indoor if unclear
    return outdoorScore > indoorScore;
  }

  // Format time to HH:MM string
  private static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  }

  // Get simulated events for fallback
  private static getSimulatedEvents(): CalendarEvent[] {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate realistic events based on current time
    const events: CalendarEvent[] = [];

    // Morning events
    if (currentHour < 10) {
      events.push({
        id: 'sim-morning-1',
        title: 'Morning Jog',
        startTime: '07:00',
        endTime: '08:00',
        isOutdoor: true,
        allDay: false,
        location: 'Local Park'
      });
    }

    // Midday events
    if (currentHour < 15) {
      events.push({
        id: 'sim-lunch-1',
        title: 'Lunch Meeting',
        startTime: '12:30',
        endTime: '13:30',
        location: 'Downtown Cafe',
        isOutdoor: false,
        allDay: false
      });
    }

    // Afternoon/Evening events
    if (currentHour < 20) {
      events.push({
        id: 'sim-evening-1',
        title: 'Evening Walk',
        startTime: '18:00',
        endTime: '19:00',
        isOutdoor: true,
        allDay: false
      });
    }

    // Always include at least one event for demonstration
    if (events.length === 0) {
      events.push({
        id: 'sim-default-1',
        title: 'Free Time',
        startTime: `${(currentHour + 1).toString().padStart(2, '0')}:00`,
        endTime: `${(currentHour + 2).toString().padStart(2, '0')}:00`,
        isOutdoor: false,
        allDay: false,
        notes: 'Perfect time to check the weather and plan activities!'
      });
    }

    return events;
  }

  // Check calendar permissions status
  static async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true;
      }

      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      return this.hasPermission;
    } catch (error) {
      console.error('❌ Error checking calendar permissions:', error);
      return false;
    }
  }

  // Get calendar permission status for UI
  static async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      if (Platform.OS === 'web') {
        return 'granted';
      }

      const { status } = await Calendar.getCalendarPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch (error) {
      console.error('❌ Error getting permission status:', error);
      return 'undetermined';
    }
  }

  // Get available calendars for debugging
  static async getAvailableCalendars(): Promise<Array<{ id: string; title: string; source: string }>> {
    try {
      if (Platform.OS === 'web') {
        return [{ id: 'web-sim', title: 'Simulated Calendar', source: 'Web' }];
      }

      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        source: cal.source?.name || 'Unknown'
      }));
    } catch (error) {
      console.error('❌ Error getting calendars:', error);
      return [];
    }
  }
} 