import { WeatherData, LocationData } from '@/types/weather';

interface AIResponse {
  suggestions: Array<{
    type: 'dress' | 'activity' | 'preparation' | 'quirky';
    title: string;
    description: string;
    icon: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: string;
  }>;
  quirkyMessage: {
    title: string;
    message: string;
    icon: string;
  };
}

export class AIService {
  private static readonly API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';

  static async generatePersonalizedSuggestions(
    weatherData: WeatherData,
    location: LocationData,
    timeOfDay: 'morning' | 'afternoon' | 'evening'
  ): Promise<AIResponse> {
    if (!this.API_KEY) {
      console.log('OpenAI API key not found, using fallback suggestions');
      return this.getFallbackResponse(weatherData, timeOfDay);
    }

    try {
      const prompt = this.buildPrompt(weatherData, location, timeOfDay);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a fun, quirky weather assistant that gives personalized advice. Be creative, use emojis, and make suggestions engaging and slightly humorous while being practical.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      return aiResponse;
    } catch (error) {
      console.error('AI Service error:', error);
      return this.getFallbackResponse(weatherData, timeOfDay);
    }
  }

  private static buildPrompt(
    weatherData: WeatherData,
    location: LocationData,
    timeOfDay: string
  ): string {
    const temp = Math.round(weatherData.current.temperature);
    const weatherCode = weatherData.current.weatherCode;
    const humidity = weatherData.current.humidity;
    const windSpeed = Math.round(weatherData.current.windSpeed);
    const uvIndex = weatherData.current.uvIndex;
    const city = location.city || 'your location';

    const weatherCondition = this.getWeatherCondition(weatherCode);

    return `
Current weather in ${city}:
- Temperature: ${temp}°C
- Condition: ${weatherCondition}
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} km/h
- UV Index: ${uvIndex}
- Time of day: ${timeOfDay}

Please generate a JSON response with:
1. "suggestions" array (3-4 items) with practical and fun advice for:
   - What to wear (dress advice)
   - Activities to do or avoid
   - Things to prepare/bring
   - Quirky weather observations

2. "quirkyMessage" object with a fun welcome message for this time of day

Each suggestion should have:
- type: "dress", "activity", "preparation", or "quirky"
- title: catchy title with emoji
- description: detailed, fun explanation
- icon: single emoji
- priority: "high", "medium", or "low"
- actionable: true/false
- action: short action text if actionable

Make it personal, fun, and weather-appropriate. Use humor and personality!

Example format:
{
  "suggestions": [
    {
      "type": "dress",
      "title": "🧥 Layer Like an Onion!",
      "description": "It's ${temp}°C - perfect for the layering game! Start with a base, add a cozy middle, and top it off with style!",
      "icon": "🧅",
      "priority": "high",
      "actionable": true,
      "action": "Grab layers"
    }
  ],
  "quirkyMessage": {
    "title": "🌤️ Weather Buddy Says...",
    "message": "Good ${timeOfDay}! The weather is feeling chatty today at ${temp}°C!",
    "icon": "☀️"
  }
}
`;
  }

  private static getWeatherCondition(weatherCode: number): string {
    if (weatherCode <= 1) return 'Clear/Sunny';
    if (weatherCode <= 3) return 'Partly Cloudy';
    if (weatherCode <= 48) return 'Cloudy/Foggy';
    if (weatherCode <= 65) return 'Rainy';
    if (weatherCode <= 82) return 'Showers';
    if (weatherCode <= 94) return 'Snow';
    return 'Thunderstorms';
  }

  private static getFallbackResponse(weatherData: WeatherData, timeOfDay: string): AIResponse {
    const temp = Math.round(weatherData.current.temperature);
    const weatherCode = weatherData.current.weatherCode;
    
    const suggestions = [];
    
    // Dress advice
    if (temp < 10) {
      suggestions.push({
        type: 'dress' as const,
        title: '🧥 Bundle Up Time!',
        description: `It's ${temp}°C - time to channel your inner cozy bear! Layers, warm coat, and maybe a hot drink to go!`,
        icon: '🐻',
        priority: 'high' as const,
        actionable: true,
        action: 'Grab warm clothes'
      });
    } else if (temp > 25) {
      suggestions.push({
        type: 'dress' as const,
        title: '☀️ Summer Vibes!',
        description: `${temp}°C is calling for light, breezy clothes! Think comfort meets style with a splash of sun protection!`,
        icon: '🌞',
        priority: 'high' as const,
        actionable: true,
        action: 'Light clothes + sunscreen'
      });
    } else {
      suggestions.push({
        type: 'dress' as const,
        title: '👕 Perfect Weather Outfit',
        description: `${temp}°C is the goldilocks of temperatures - not too hot, not too cold, just right for your favorite outfit!`,
        icon: '✨',
        priority: 'medium' as const,
        actionable: true,
        action: 'Comfortable casual'
      });
    }

    // Activity suggestion
    if (weatherCode <= 1 && temp >= 15 && temp <= 25) {
      suggestions.push({
        type: 'activity' as const,
        title: '🌟 Perfect Day Alert!',
        description: 'The weather gods are showing off today! Perfect for outdoor adventures, walks, or just soaking up the good vibes!',
        icon: '🚶‍♀️',
        priority: 'medium' as const,
        actionable: true,
        action: 'Plan outdoor time'
      });
    }

    // Preparation advice
    if (weatherCode >= 51 && weatherCode <= 65) {
      suggestions.push({
        type: 'preparation' as const,
        title: '☔ Umbrella Squad!',
        description: 'Rain is on the menu today! Grab your umbrella and embrace the cozy, pitter-patter vibes!',
        icon: '☂️',
        priority: 'high' as const,
        actionable: true,
        action: 'Pack umbrella'
      });
    }

    const quirkyMessages = {
      morning: {
        title: '🌅 Rise and Shine!',
        message: `Good morning, weather warrior! It's ${temp}°C and ready for whatever adventure you have planned!`,
        icon: '☀️'
      },
      afternoon: {
        title: '🌞 Midday Check-in!',
        message: `Afternoon vibes at ${temp}°C! Hope you're having an awesome day so far!`,
        icon: '🌤️'
      },
      evening: {
        title: '🌙 Evening Wisdom',
        message: `Evening at ${temp}°C - perfect time to wind down and reflect on the day's weather adventures!`,
        icon: '✨'
      }
    };

    return {
      suggestions,
      quirkyMessage: quirkyMessages[timeOfDay as keyof typeof quirkyMessages] || quirkyMessages.morning
    };
  }

  static async generateQuirkyNotification(
    weatherData: WeatherData,
    location: LocationData
  ): Promise<{ title: string; body: string }> {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    try {
      const response = await this.generatePersonalizedSuggestions(weatherData, location, timeOfDay);
      return {
        title: response.quirkyMessage.title,
        body: response.quirkyMessage.message
      };
    } catch (error) {
      console.error('Error generating quirky notification:', error);
      return {
        title: '🌤️ Weather Check-in',
        body: `Just checking in! It's ${Math.round(weatherData.current.temperature)}°C - hope you're having a great day!`
      };
    }
  }

  // Generate welcome message when app opens
  static async generateWelcomeMessage(
    weatherData: WeatherData,
    location: LocationData
  ): Promise<{ title: string; body: string }> {
    try {
      if (!this.API_KEY) {
        return this.getFallbackWelcomeMessage(weatherData, location);
      }

      const temp = Math.round(weatherData.current.temperature);
      const condition = this.getWeatherCondition(weatherData.current.weatherCode);
      const city = location.city || 'your location';

      const prompt = `
Generate a fun, quirky welcome message for a weather app user in ${city}.

Current weather: ${temp}°C, ${condition}

Create a welcome notification that:
1. Is funny and engaging
2. Mentions the weather briefly
3. Encourages them to check the "For You" page for personalized suggestions
4. Has personality and makes them smile
5. Is under 100 characters for the body

Return JSON format:
{
  "title": "Catchy title with emoji (max 40 chars)",
  "body": "Fun message encouraging them to check For You page (max 100 chars)"
}

Examples of tone:
- "🎉 Weather Buddy here! It's ${temp}°C and I've got some wild suggestions waiting for you!"
- "☀️ Plot twist: ${temp}°C weather + your For You page = perfect day combo!"
`;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a quirky, fun weather app assistant. Generate engaging welcome messages that make users smile.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      return {
        title: aiResponse.title,
        body: aiResponse.body
      };
    } catch (error) {
      console.error('AI welcome message error:', error);
      return this.getFallbackWelcomeMessage(weatherData, location);
    }
  }

  // Generate time-based quirky notifications (morning/evening)
  static async generateQuirkyTimeBasedNotification(
    weatherData: WeatherData,
    location: LocationData,
    timeOfDay: 'morning' | 'evening'
  ): Promise<{ title: string; body: string }> {
    try {
      if (!this.API_KEY) {
        return this.getFallbackTimeBasedMessage(weatherData, location, timeOfDay);
      }

      const temp = Math.round(weatherData.current.temperature);
      const condition = this.getWeatherCondition(weatherData.current.weatherCode);
      const city = location.city || 'your location';

      const prompt = `
Generate a ${timeOfDay} weather notification for ${city}.

Current weather: ${temp}°C, ${condition}
Time: ${timeOfDay}

Create a ${timeOfDay} notification that:
1. Is funny, quirky, and full of personality
2. Mentions the weather creatively
3. Encourages checking the "For You" page
4. Matches the ${timeOfDay} vibe
5. Makes the user excited about weather

${timeOfDay === 'morning' ? 
  'Morning vibes: energetic, motivational, ready-to-conquer-the-day' : 
  'Evening vibes: reflective, cozy, prep-for-tomorrow'}

Return JSON format:
{
  "title": "Catchy ${timeOfDay} title with emoji (max 45 chars)",
  "body": "Fun ${timeOfDay} message about weather + For You page (max 120 chars)"
}

Examples:
Morning: "🌅 Rise & Shine Weather Warrior! ${temp}°C awaits your conquest!"
Evening: "🌙 Weather Wisdom Time! ${temp}°C + tomorrow's secrets in For You!"
`;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a quirky weather app that brings personality and fun to weather updates. Make every notification memorable and engaging.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      return {
        title: aiResponse.title,
        body: aiResponse.body
      };
    } catch (error) {
      console.error('AI time-based notification error:', error);
      return this.getFallbackTimeBasedMessage(weatherData, location, timeOfDay);
    }
  }

  private static getFallbackWelcomeMessage(weatherData: WeatherData, location: LocationData): { title: string; body: string } {
    const temp = Math.round(weatherData.current.temperature);
    const welcomeMessages = [
      {
        title: '🎉 Weather Buddy Alert!',
        body: `${temp}°C and counting! Your For You page has some surprises waiting! 🌟`
      },
      {
        title: '☀️ Plot Twist Time!',
        body: `${temp}°C weather + your personalized suggestions = perfect combo! Check For You! 🚀`
      },
      {
        title: '🌤️ Weather Magic Incoming!',
        body: `${temp}°C vibes detected! Your For You page is loaded with weather wisdom! ✨`
      }
    ];
    
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  private static getFallbackTimeBasedMessage(
    weatherData: WeatherData, 
    location: LocationData, 
    timeOfDay: 'morning' | 'evening'
  ): { title: string; body: string } {
    const temp = Math.round(weatherData.current.temperature);
    
    const morningMessages = [
      {
        title: '🌅 Rise & Shine Weather Warrior!',
        body: `${temp}°C awaits your conquest! Check For You for today's battle plan! ⚔️`
      },
      {
        title: '☀️ Morning Weather Plot!',
        body: `${temp}°C is just the beginning! Your For You page has the full story! 📖`
      },
      {
        title: '🌤️ Weather Adventure Begins!',
        body: `${temp}°C and ready to roll! Your personalized journey starts in For You! 🚀`
      }
    ];

    const eveningMessages = [
      {
        title: '🌙 Evening Weather Wisdom!',
        body: `${temp}°C reflections + tomorrow's secrets await in For You! 🔮`
      },
      {
        title: '✨ Twilight Weather Tales!',
        body: `${temp}°C stories + prep for tomorrow! Your For You page knows all! 📚`
      },
      {
        title: '🌆 Weather Wind-Down Time!',
        body: `${temp}°C vibes + tomorrow's forecast magic in For You! 🎭`
      }
    ];

    const messages = timeOfDay === 'morning' ? morningMessages : eveningMessages;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Enhance weather alerts with AI creativity
  static async enhanceWeatherAlert(alert: any): Promise<{ title: string; body: string }> {
    try {
      if (!this.API_KEY) {
        return { title: alert.title, body: alert.message };
      }

      const prompt = `
Enhance this weather alert to make it more creative, engaging, and helpful:

Original Alert:
- Type: ${alert.type}
- Severity: ${alert.severity}
- Title: ${alert.title}
- Message: ${alert.message}
- Conditions: ${alert.conditions.join(', ')}

Make it:
1. More creative and engaging
2. Include practical advice
3. Add personality and humor where appropriate
4. Keep the important safety information
5. Make it memorable and fun to read

Return JSON format:
{
  "title": "Enhanced creative title with emoji (max 50 chars)",
  "body": "Enhanced message with personality and practical advice (max 150 chars)"
}

Examples of enhanced style:
- Instead of "Rain Alert" → "☔ Umbrella Squad Assemble!"
- Instead of "Hot weather" → "🔥 Sizzle Alert: Your AC's Time to Shine!"
- Instead of "Perfect weather" → "🌟 Weather Jackpot: Nature's Showing Off!"
`;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a creative weather alert enhancer. Make weather notifications engaging, helpful, and memorable while keeping safety information intact.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = JSON.parse(data.choices[0].message.content);
      
      return {
        title: aiResponse.title,
        body: aiResponse.body
      };
    } catch (error) {
      console.error('AI alert enhancement error:', error);
      return { title: alert.title, body: alert.message };
    }
  }
} 