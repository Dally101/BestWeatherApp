import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LocationData } from '@/types/weather';

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    try {
      // For web, use browser geolocation API as fallback
      if (Platform.OS === 'web') {
        return await this.getWebLocation();
      }

      // Request permissions for mobile
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted. Please enable location services to get accurate weather data.');
      }

      // Get current position with balanced accuracy for better performance
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      // Get address information with retry logic
      let addressInfo = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!addressInfo && retryCount < maxRetries) {
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (addresses && addresses.length > 0) {
            addressInfo = addresses[0];
            break;
          }
        } catch (geocodeError) {
          console.warn(`Reverse geocoding attempt ${retryCount + 1} failed:`, geocodeError);
          retryCount++;
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Build location data with fallbacks
      let city = 'Unknown';
      let region = 'Unknown';
      let country = 'Unknown';

      if (addressInfo) {
        city = addressInfo.city ?? 
               addressInfo.subregion ?? 
               addressInfo.district ?? 
               addressInfo.name ?? 
               'Unknown';

        region = addressInfo.region ?? 'Unknown';
        country = addressInfo.country ?? 'Unknown';
      }

      // If we still have unknowns, try to get location from coordinates
      if (city === 'Unknown' || region === 'Unknown') {
        try {
          const coordinateLocation = await this.getLocationFromCoordinates(
            location.coords.latitude, 
            location.coords.longitude
          );
          
          if (coordinateLocation) {
            if (city === 'Unknown') city = coordinateLocation.city ?? 'Unknown';
            if (region === 'Unknown') region = coordinateLocation.region ?? 'Unknown';
            if (country === 'Unknown') country = coordinateLocation.country ?? 'Unknown';
          }
        } catch (fallbackError) {
          console.warn('Coordinate fallback failed:', fallbackError);
        }
      }

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city,
        region,
        country
      };

      return locationData;

    } catch (error) {
      console.error('Location service error:', error);
      throw new Error('Unable to get your location. Please check your location settings and try again.');
    }
  }

  private static async getWebLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Try to get location name from coordinates
            const coordinateLocation = await this.getLocationFromCoordinates(latitude, longitude);
            
            resolve({
              latitude,
              longitude,
              city: coordinateLocation?.city || 'Unknown',
              region: coordinateLocation?.region || 'Unknown',
              country: coordinateLocation?.country || 'Unknown'
            });
          } catch (error) {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city: 'Unknown',
              region: 'Unknown',
              country: 'Unknown'
            });
          }
        },
        (error) => {
          console.error('Web geolocation error:', error);
          reject(new Error('Unable to get your location. Please enable location services in your browser.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  private static async getLocationFromCoordinates(lat: number, lon: number): Promise<LocationData | null> {
    // Simple coordinate-based location detection for major cities
    const locations = [
      { lat: 37.7749, lon: -122.4194, city: 'San Francisco', region: 'California', country: 'United States' },
      { lat: 40.7128, lon: -74.0060, city: 'New York', region: 'New York', country: 'United States' },
      { lat: 34.0522, lon: -118.2437, city: 'Los Angeles', region: 'California', country: 'United States' },
      { lat: 41.8781, lon: -87.6298, city: 'Chicago', region: 'Illinois', country: 'United States' },
      { lat: 51.5074, lon: -0.1278, city: 'London', region: 'England', country: 'United Kingdom' },
      { lat: 48.8566, lon: 2.3522, city: 'Paris', region: 'Île-de-France', country: 'France' },
      { lat: 35.6762, lon: 139.6503, city: 'Tokyo', region: 'Tokyo', country: 'Japan' },
      { lat: -33.8688, lon: 151.2093, city: 'Sydney', region: 'New South Wales', country: 'Australia' },
      { lat: 43.6532, lon: -79.3832, city: 'Toronto', region: 'Ontario', country: 'Canada' },
      { lat: 52.5200, lon: 13.4050, city: 'Berlin', region: 'Berlin', country: 'Germany' },
    ];

    // Find the closest major city (within ~50km)
    const threshold = 0.5; // roughly 50km in degrees
    
    for (const location of locations) {
      const distance = Math.sqrt(
        Math.pow(lat - location.lat, 2) + Math.pow(lon - location.lon, 2)
      );
      
      if (distance < threshold) {
        return {
          latitude: lat,
          longitude: lon,
          city: location.city,
          region: location.region,
          country: location.country
        };
      }
    }

    return null;
  }

  static async hasLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return 'geolocation' in navigator;
    }
    
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  }
}