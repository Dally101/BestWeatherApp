import { WeatherService } from '@/services/weatherService';
import { LocationData } from '@/types/weather';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const latitude = url.searchParams.get('latitude');
    const longitude = url.searchParams.get('longitude');

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const location: LocationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const weatherData = await WeatherService.getCurrentWeather(location);
    
    return new Response(JSON.stringify(weatherData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather data' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

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

    return new Response(JSON.stringify({ weatherData, alerts }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Weather API POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process weather request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}