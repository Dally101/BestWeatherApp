import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Platform, 
  TouchableOpacity, 
  Linking, 
  Image,
  Alert,
  Share
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { WeatherData, LocationData } from '@/types/weather';
import { RealNewsService } from '@/services/realNewsService';

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

interface ModernNewsCardProps {
  weatherData: WeatherData | null;
  location: LocationData | null;
  bounceAnimation: Animated.AnimatedAddition<number>;
}

export function ModernNewsCard({ 
  weatherData, 
  location, 
  bounceAnimation 
}: ModernNewsCardProps) {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [dismissedArticles, setDismissedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWeatherNews();
    
    // Animate card entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [weatherData, location]);

  const fetchWeatherNews = async () => {
    if (!weatherData || !location) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📰 Fetching real weather news with Google Search + OpenAI...');
      
      // Use the real news service with Google Search API and OpenAI
      const realNews = await RealNewsService.getWeatherNews(weatherData, location);
      
      if (realNews.length > 0) {
        console.log(`✅ Real news service returned ${realNews.length} articles`);
        setNewsArticles(realNews);
      } else {
        console.log('⚠️ No real news found, using curated content');
        setNewsArticles(getCuratedWeatherNews(weatherData, location));
      }
    } catch (error) {
      console.error('❌ Error fetching real news:', error);
      setError('Unable to load news');
      setNewsArticles(getCuratedWeatherNews(weatherData, location));
    } finally {
      setLoading(false);
    }
  };



  const getCuratedWeatherNews = (weather: WeatherData, loc: LocationData): NewsArticle[] => {
    const temp = weather.current.temperature;
    const condition = getWeatherCondition(weather.current.weatherCode);
    
    return [
      {
        id: 'curated-1',
        title: `${condition} Weather Continues in ${loc.city}`,
        description: `Current temperature of ${Math.round(temp)}°C with ${condition.toLowerCase()} conditions. Local weather services provide updates on changing patterns.`,
        url: 'https://weather.gov',
        source: 'National Weather Service',
        publishedAt: new Date().toISOString(),
        relevance: 'high'
      },
      {
        id: 'curated-2',
        title: 'Understanding Your Local Weather Patterns',
        description: 'Meteorologists explain how atmospheric conditions create the weather you experience daily in your area.',
        url: 'https://weather.com/science',
        source: 'Weather Science',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        relevance: 'medium'
      }
    ];
  };



  const getWeatherCondition = (code: number): string => {
    if (code <= 1) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Cloudy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    return 'Stormy';
  };

  const handleArticlePress = async (article: NewsArticle) => {
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('Error', 'Unable to open this article');
      }
    } catch (error) {
      console.error('Error opening article:', error);
      Alert.alert('Error', 'Unable to open this article');
    }
  };

  const handleShare = async (article: NewsArticle) => {
    try {
      await Share.share({
        message: `${article.title}\n\n${article.description}\n\nRead more: ${article.url}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const dismissArticle = (articleId: string) => {
    setDismissedArticles(prev => new Set([...prev, articleId]));
    console.log(`📰 Article dismissed: ${articleId}`);
  };

  const undoDismiss = (articleId: string) => {
    setDismissedArticles(prev => {
      const newSet = new Set(prev);
      newSet.delete(articleId);
      return newSet;
    });
    console.log(`📰 Article restored: ${articleId}`);
  };

  const getRelevanceBadgeColor = (relevance: string) => {
    switch (relevance) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Swipeable Article Component
  const SwipeableArticle = ({ article, index }: { article: NewsArticle; index: number }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const isDismissed = dismissedArticles.has(article.id);

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: any) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX, velocityX } = event.nativeEvent;
        
        // Dismiss if swiped left more than 100px or with high velocity
        if (translationX < -100 || velocityX < -500) {
          // Animate out
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -400,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            dismissArticle(article.id);
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    };

    if (isDismissed) {
      return (
        <View style={styles.dismissedCard}>
          <Text style={styles.dismissedText}>Article dismissed</Text>
          <TouchableOpacity 
            style={styles.undoButton}
            onPress={() => undoDismiss(article.id)}
          >
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.swipeContainer,
            {
              transform: [{ translateX }],
              opacity,
            }
          ]}
        >

          
          <TouchableOpacity
            style={[styles.articleCard, index === 0 && styles.featuredCard]}
            onPress={() => {
              // Touching the card area triggers dismiss gesture
              // Only "Read More" button opens the article
              dismissArticle(article.id);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.articleContent}>
              <View style={styles.articleHeader}>
                <View style={styles.articleMeta}>
                  <Text style={styles.sourceName}>{article.source}</Text>
                  <Text style={styles.timeAgo}>{formatTimeAgo(article.publishedAt)}</Text>
                </View>
                <View style={[styles.relevanceBadge, { backgroundColor: getRelevanceBadgeColor(article.relevance) }]}>
                  <Text style={styles.relevanceText}>{article.relevance.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={[styles.articleTitle, index === 0 && styles.featuredTitle]} numberOfLines={2}>
                {article.title}
              </Text>
              
              <Text style={styles.articleDescription} numberOfLines={3}>
                {article.description}
              </Text>
              
              <Text style={styles.dismissHint}>Tap card to dismiss • Swipe left to dismiss</Text>
              
              <View style={styles.articleFooter}>
                <TouchableOpacity 
                  style={styles.readMoreButton}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card dismiss
                    handleArticlePress(article);
                  }}
                >
                  <Text style={styles.readMoreText}>Read More</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card dismiss
                    handleShare(article);
                  }}
                >
                  <Text style={styles.shareText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {article.urlToImage && (
              <Image 
                source={{ uri: article.urlToImage }} 
                style={styles.articleImage}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📰 Weather News</Text>
          <Text style={styles.subtitle}>Loading latest updates...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Fetching news...</Text>
        </View>
      </View>
    );
  }

  if (error && newsArticles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📰 Weather News</Text>
          <Text style={styles.subtitle}>Unable to load news</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWeatherNews}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: bounceAnimation }
          ]
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📰 Weather News</Text>
        <Text style={styles.subtitle}>Stay informed about weather updates</Text>
      </View>

      {newsArticles.map((article, index) => (
        <SwipeableArticle 
          key={article.id} 
          article={article} 
          index={index} 
        />
      ))}
      
      <TouchableOpacity style={styles.refreshButton} onPress={fetchWeatherNews}>
        <Text style={styles.refreshText}>🔄 Refresh News</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  articleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featuredCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  articleContent: {
    flex: 1,
    marginRight: 12,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleMeta: {
    flex: 1,
  },
  sourceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  relevanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relevanceText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 6,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  articleDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  dismissHint: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readMoreButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  // Swipe gesture styles
  swipeContainer: {
    position: 'relative',
  },
  dismissedCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dismissedText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  undoButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  undoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 