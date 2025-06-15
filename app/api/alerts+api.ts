import { WeatherService } from '@/services/weatherService';
import { NotificationService } from '@/services/notificationService';
import { LocationData } from '@/types/weather';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const location: LocationData = { latitude, longitude };
    const weatherData = await WeatherService.getCurrentWeather(location);
    const alerts = WeatherService.generateWeatherAlerts(weatherData);

    // Send notifications for high severity alerts
    const highSeverityAlerts = alerts.filter(alert => 
      alert.severity === 'high' || alert.severity === 'extreme'
    );

    for (const alert of highSeverityAlerts) {
      await NotificationService.sendImmediateAlert(alert);
    }

    return new Response(JSON.stringify({ alerts, sent: highSeverityAlerts.length }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate alerts' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}