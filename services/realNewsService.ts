import { WeatherData, LocationData } from '@/types/weather';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
  relevance: 'high' | 'medium' | 'low';
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  pagemap?: {
    metatags?: Array<{
      'og:title'?: string;
      'og:description'?: string;
      'og:image'?: string;
      'article:published_time'?: string;
    }>;
  };
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
}

export class RealNewsService {
  private static readonly OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  private static readonly GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  private static readonly GOOGLE_CX = process.env.EXPO_PUBLIC_GOOGLE_CX;
  private static readonly NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
  
  private static readonly GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';
  private static readonly OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly NEWS_API_URL = 'https://newsapi.org/v2/everything';

  static async getWeatherNews(
    weatherData: WeatherData | null,
    location: LocationData | null
  ): Promise<NewsArticle[]> {
    console.log('🔍 Starting real news fetch with Google Search + OpenAI...');
    
    if (!weatherData || !location) {
      console.log('⚠️ Missing weather data or location');
      return this.getFallbackNews();
    }

    try {
      // Step 1: Get raw search results from Google
      const searchResults = await this.fetchGoogleSearchResults(weatherData, location);
      console.log(`📊 Google Search returned ${searchResults.length} results`);
      
      if (searchResults.length === 0) {
        console.log('⚠️ No Google search results, trying News API...');
        const newsApiResults = await this.fetchNewsAPIResults(weatherData, location);
        if (newsApiResults.length > 0) {
          console.log(`✅ News API returned ${newsApiResults.length} articles`);
          return newsApiResults;
        }
        console.log('⚠️ No results from News API either, using fallback');
        return this.getFallbackNews();
      }

      // Step 2: Use OpenAI to filter, rank, and enhance the results
      const processedNews = await this.processWithOpenAI(searchResults, weatherData, location);
      console.log(`🤖 OpenAI processed ${processedNews.length} relevant articles`);
      
      return processedNews.slice(0, 5); // Return top 5 articles
      
    } catch (error) {
      console.error('❌ Real news fetch failed:', error);
      return this.getFallbackNews();
    }
  }

  private static async fetchGoogleSearchResults(
    weatherData: WeatherData,
    location: LocationData
  ): Promise<GoogleSearchResult[]> {
    if (!this.GOOGLE_API_KEY || !this.GOOGLE_CX) {
      throw new Error('Google API credentials not configured');
    }

    const queries = this.buildSearchQueries(weatherData, location);
    const allResults: GoogleSearchResult[] = [];

    for (const query of queries.slice(0, 3)) { // Limit to 3 simple queries
      try {
        // Simple search parameters focused on recent news
        const searchUrl = `${this.GOOGLE_SEARCH_URL}?key=${this.GOOGLE_API_KEY}&cx=${this.GOOGLE_CX}&q=${encodeURIComponent(query)}&num=8&sort=date&dateRestrict=w1`;
        
        console.log(`🔍 Google search: "${query}"`);
        
        const response = await fetch(searchUrl);
        if (!response.ok) {
          console.log(`❌ Google search failed: ${response.status}`);
          continue;
        }

        const data: GoogleSearchResponse = await response.json();
        if (data.items && data.items.length > 0) {
          // Filter results to only include weather-focused content
          const filteredItems = data.items.filter(item => this.isWeatherFocused(item));
          console.log(`✅ Found ${data.items.length} results, ${filteredItems.length} relevant for: "${query}"`);
          allResults.push(...filteredItems);
        }
      } catch (error) {
        console.log(`❌ Query "${query}" failed:`, error);
      }
    }

    return allResults;
  }

  private static async fetchNewsAPIResults(
    weatherData: WeatherData,
    location: LocationData
  ): Promise<NewsArticle[]> {
    if (!this.NEWS_API_KEY) {
      throw new Error('News API key not configured');
    }

    try {
      // Enhanced query to focus on weather news and exclude sports
      const query = `weather ${location.city} OR climate ${location.region} -sports -game -team -player`;
      const url = `${this.NEWS_API_URL}?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=15&apiKey=${this.NEWS_API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`News API error: ${response.status}`);
      }

      const data = await response.json();
      
      const articles = data.articles?.filter((article: any) => {
        // Filter out sports content
        const title = article.title?.toLowerCase() || '';
        const description = article.description?.toLowerCase() || '';
        const source = article.source?.name?.toLowerCase() || '';
        
        const sportsKeywords = [
          'espn', 'sports', 'game', 'team', 'player', 'match', 'season',
          'football', 'basketball', 'baseball', 'hockey', 'soccer', 'tennis',
          'nfl', 'nba', 'mlb', 'nhl', 'ncaa', 'playoff', 'championship'
        ];
        
        const isSports = sportsKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword) || source.includes(keyword)
        );
        
        // Check if content is primarily about weather
        const weatherKeywords = [
          'weather', 'storm', 'rain', 'snow', 'temperature', 'climate',
          'forecast', 'meteorologist', 'severe', 'warning', 'alert'
        ];
        
        const weatherCount = weatherKeywords.filter(keyword => 
          title.includes(keyword) || description.includes(keyword)
        ).length;
        
        const isWeatherFocused = weatherCount >= 2;
        
        if (isSports) {
          console.log(`🚫 News API: Excluding sports article: "${article.title}"`);
        }
        
        return !isSports && isWeatherFocused;
      }).map((article: any, index: number) => ({
        id: `newsapi-${Date.now()}-${index}`,
        title: article.title,
        description: article.description || article.content?.substring(0, 200) + '...',
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage,
        relevance: 'medium' as const
      })) || [];
      
      console.log(`📰 News API: Filtered to ${articles.length} weather-focused articles`);
      return articles;
      
    } catch (error) {
      console.error('News API failed:', error);
      return [];
    }
  }

  private static buildSearchQueries(weatherData: WeatherData, location: LocationData): string[] {
    const city = location.city;
    const region = location.region;
    
    // Enhanced queries that focus on weather news and exclude sports
    return [
      `"${city}" weather news -sports -game -team`,
      `"${city}" severe weather news -sports`,
      `"${region}" weather alert news -sports -game`,
      `"${city}" storm news weather -sports -team`,
      `"${city}" weather breaking news -sports -game -player`,
      `"${region}" climate weather news -sports`
    ];
  }

  private static async processWithOpenAI(
    searchResults: GoogleSearchResult[],
    weatherData: WeatherData,
    location: LocationData
  ): Promise<NewsArticle[]> {
    if (!this.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not available, using basic processing');
      return this.convertGoogleResults(searchResults);
    }

    try {
      const prompt = this.buildOpenAIPrompt(searchResults, weatherData, location);
      
      const response = await fetch(this.OPENAI_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a weather news analyst. Analyze search results and return relevant weather news in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse the AI response
      const processedArticles = this.parseAIResponse(aiResponse, searchResults);
      return processedArticles;
      
    } catch (error) {
      console.error('OpenAI processing failed:', error);
      return this.convertGoogleResults(searchResults);
    }
  }

  private static buildOpenAIPrompt(
    searchResults: GoogleSearchResult[],
    weatherData: WeatherData,
    location: LocationData
  ): string {
    const resultsText = searchResults.map((result, index) => 
      `${index + 1}. TITLE: "${result.title}"\n   URL: ${result.link}\n   SNIPPET: "${result.snippet}"\n   SOURCE: ${result.displayLink}`
    ).join('\n\n');

    return `
You are analyzing search results to find ACTUAL WEATHER NEWS ARTICLES for ${location.city}, ${location.region}.

Current weather: ${Math.round(weatherData.current.temperature)}°C, ${this.getWeatherCondition(weatherData.current.weatherCode)}

SEARCH RESULTS:
${resultsText}

CRITICAL FILTERING RULES:
1. ANALYZE BOTH TITLE AND SNIPPET CONTENT - The majority of the content must be about weather
2. EXCLUDE ALL SPORTS ARTICLES - Even if they mention weather, reject anything from sports sites or about sports events
3. FOCUS ON WEATHER CONTENT - Accept any content primarily about weather (news, forecasts, reports, discussions, etc.)
4. NO FORMAT RESTRICTIONS - Don't worry if it's news vs forecast vs report, just focus on weather relevance

GOOD CONTENT (include these):
- "Storm brings heavy rain to Milwaukee area" + snippet about flooding, damage, emergency response
- "Weather alert issued for Wisconsin residents" + snippet about warnings, safety measures
- "Milwaukee sees record temperatures this week" + snippet about heat records, health impacts
- "Weekend weather forecast for Milwaukee" + snippet about upcoming conditions
- "Climate change affects local farming" + snippet about agricultural impacts, farmer interviews
- "How to prepare for severe weather" + snippet about safety tips, preparation advice

BAD CONTENT (EXCLUDE these):
- ANY sports articles mentioning weather: "Game delayed due to rain", "Weather affects football practice"
- Sports sites: ESPN, Yahoo Sports, Fox Sports, etc. - even if weather-related
- Shopping/commercial: "Weather gear on sale", "Best umbrellas for rain"
- Non-weather topics: Politics, entertainment, food, etc. even if they briefly mention weather

SPORTS EXCLUSION: If the source is a sports website (ESPN, Yahoo Sports, Fox Sports, etc.) or the title/snippet mentions sports, games, teams, players, or athletic events - REJECT IT completely.

CONTENT ANALYSIS: For each result, check if the snippet shows the content is primarily about weather phenomena, weather impacts, weather forecasts, meteorological topics, or weather-related discussions. If the snippet suggests the content is mainly about something else (sports, politics, entertainment) with only minor weather mentions, REJECT IT.

Select up to 5 pieces of content that are genuinely weather-focused. If fewer than 5 meet the criteria, return fewer articles.

Return ONLY this JSON format:
[
  {
    "title": "Exact title from search results",
    "description": "Brief summary based on snippet (max 120 chars)",
    "url": "Exact URL from search results",
    "source": "Clean source name",
    "relevance": "high|medium|low"
  }
]`;
  }

  private static parseAIResponse(aiResponse: string, originalResults: GoogleSearchResult[]): NewsArticle[] {
    try {
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedArticles = JSON.parse(jsonMatch[0]);
      
      return parsedArticles.map((article: any, index: number) => ({
        id: `ai-processed-${Date.now()}-${index}`,
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source,
        publishedAt: new Date().toISOString(),
        relevance: article.relevance || 'medium',
        urlToImage: this.findImageForArticle(article.url, originalResults)
      }));
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.convertGoogleResults(originalResults);
    }
  }

  private static convertGoogleResults(results: GoogleSearchResult[]): NewsArticle[] {
    return results.slice(0, 5).map((result, index) => ({
      id: `google-${Date.now()}-${index}`,
      title: result.title,
      description: result.snippet,
      url: result.link,
      source: this.extractSourceName(result.displayLink),
      publishedAt: this.extractPublishDate(result) || new Date().toISOString(),
      relevance: this.calculateRelevance(result.title, result.snippet),
      urlToImage: this.extractImage(result)
    }));
  }

  private static findImageForArticle(url: string, results: GoogleSearchResult[]): string | undefined {
    const matchingResult = results.find(result => result.link === url);
    return this.extractImage(matchingResult);
  }

  private static extractImage(result?: GoogleSearchResult): string | undefined {
    return result?.pagemap?.metatags?.[0]?.['og:image'];
  }

  private static extractSourceName(displayLink: string): string {
    return displayLink.split('.')[0].replace('www.', '').toUpperCase();
  }

  private static extractPublishDate(result: GoogleSearchResult): string | null {
    return result.pagemap?.metatags?.[0]?.['article:published_time'] || null;
  }

  private static calculateRelevance(title: string, snippet: string): 'high' | 'medium' | 'low' {
    const text = (title + ' ' + snippet).toLowerCase();
    
    const highPriorityTerms = ['alert', 'warning', 'severe', 'emergency', 'breaking', 'urgent'];
    const mediumPriorityTerms = ['weather', 'forecast', 'temperature', 'storm', 'rain', 'snow'];
    
    if (highPriorityTerms.some(term => text.includes(term))) return 'high';
    if (mediumPriorityTerms.some(term => text.includes(term))) return 'medium';
    return 'low';
  }

  private static getWeatherCondition(code: number): string {
    if (code <= 1) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Cloudy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  }

  private static isWeatherFocused(item: GoogleSearchResult): boolean {
    const url = item.link.toLowerCase();
    const title = item.title.toLowerCase();
    const snippet = item.snippet.toLowerCase();
    const source = item.displayLink.toLowerCase();
    
    // First check: Exclude sports content completely
    const sportsIndicators = [
      'espn', 'yahoo sports', 'fox sports', 'sports illustrated', 'bleacher report',
      'nfl.com', 'nba.com', 'mlb.com', 'nhl.com', 'ncaa',
      'game', 'match', 'team', 'player', 'season', 'playoff', 'championship',
      'football', 'basketball', 'baseball', 'hockey', 'soccer', 'tennis',
      'stadium', 'arena', 'coach', 'athlete', 'sport'
    ];
    
    const isSportsContent = sportsIndicators.some(indicator => 
      source.includes(indicator) || title.includes(indicator) || snippet.includes(indicator)
    );
    
    if (isSportsContent) {
      console.log(`🚫 Excluding sports content: "${title}"`);
      return false;
    }
    
    // Check if content is primarily about weather (no format restrictions)
    const weatherContentIndicators = [
      'weather', 'storm', 'rain', 'snow', 'temperature', 'climate', 'forecast',
      'meteorologist', 'atmospheric', 'precipitation', 'humidity', 'wind',
      'flooding', 'drought', 'severe', 'warning', 'alert', 'hurricane', 
      'tornado', 'blizzard', 'heat wave', 'cold front', 'warm front',
      'barometric', 'pressure', 'thunderstorm', 'lightning', 'hail',
      'visibility', 'dew point', 'wind chill', 'heat index'
    ];
    
    const weatherWordCount = weatherContentIndicators.filter(word => 
      title.includes(word) || snippet.includes(word)
    ).length;
    
    const totalWords = (title + ' ' + snippet).split(' ').length;
    const weatherDensity = weatherWordCount / Math.max(totalWords, 1);
    
    // More lenient weather focus - accept if weather density is good OR has multiple weather words
    const hasWeatherFocus = weatherDensity >= 0.08 || weatherWordCount >= 2;
    
    // Exclude only obvious non-weather content
    const excludePatterns = [
      'shopping', 'buy', 'sale', 'price', 'product', 'review',
      'recipe', 'cooking', 'food', 'restaurant',
      'movie', 'entertainment', 'celebrity', 'music',
      'politics', 'election', 'government', 'policy'
    ];
    
    const isNonWeatherContent = excludePatterns.some(pattern => 
      title.includes(pattern) || snippet.includes(pattern)
    );
    
    const result = hasWeatherFocus && !isNonWeatherContent;
    
    if (!result) {
      console.log(`🚫 Filtered out: "${title}" (weather focus: ${hasWeatherFocus}, weather density: ${weatherDensity.toFixed(2)})`);
    } else {
      console.log(`✅ Weather focused: "${title}" (density: ${weatherDensity.toFixed(2)}, words: ${weatherWordCount})`);
    }
    
    return result;
  }

  private static isHomepage(url: string): boolean {
    const homepagePatterns = [
      /\/$/, // ends with just /
      /\/index\./,
      /\/home\./,
      /\/default\./,
      /^https?:\/\/[^\/]+\/?$/  // just domain with optional trailing slash
    ];
    
    return homepagePatterns.some(pattern => pattern.test(url.toLowerCase()));
  }

  private static isRelevantToLocation(item: GoogleSearchResult, location: LocationData): boolean {
    const text = (item.title + ' ' + item.snippet + ' ' + item.link).toLowerCase();
    const city = location.city?.toLowerCase() || '';
    const region = location.region?.toLowerCase() || '';
    
    // Check if the content mentions the specific location
    return (city && text.includes(city)) || 
           (region && text.includes(region)) || 
           text.includes('milwaukee') || text.includes('wisconsin') || text.includes('wi');
  }

  private static getFallbackNews(): NewsArticle[] {
    return [
      {
        id: 'fallback-1',
        title: '🌤️ Weather Services Provide Daily Updates',
        description: 'Local meteorological services continue to monitor weather conditions and provide regular updates to keep communities informed.',
        url: 'https://weather.gov',
        source: 'National Weather Service',
        publishedAt: new Date().toISOString(),
        relevance: 'medium'
      },
      {
        id: 'fallback-2',
        title: '📊 Understanding Weather Patterns',
        description: 'Meteorologists explain how atmospheric conditions create the weather patterns we experience in our daily lives.',
        url: 'https://weather.com/science',
        source: 'Weather Channel',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        relevance: 'low'
      }
    ];
  }
} 