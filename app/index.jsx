import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../src/store/authStore';

const { width } = Dimensions.get('window');
const HAS_SEEN_WELCOME_KEY = 'hasSeenWelcome';

const onboardingData = [
  {
    id: 1,
    icon: '⚕️',
    title: 'Welcome to MyHealthLink',
    subtitle: 'Your health, always at hand',
    description: 'Store and organize all your health information in one secure place.',
    color: '#16a34a',
  },
  {
    id: 2,
    icon: '🔒',
    title: 'Secure & Private',
    subtitle: 'Your data is protected',
    description: 'Bank-level encryption keeps your medical information safe and private.',
    color: '#0891b2',
  },
  {
    id: 3,
    icon: '📱',
    title: 'Share Instantly',
    subtitle: 'One link, unlimited access',
    description: 'Generate a unique link or QR code to share with healthcare providers instantly.',
    color: '#7c3aed',
  },
  {
    id: 4,
    icon: '🚨',
    title: 'Emergency Ready',
    subtitle: 'Life-saving information',
    description: 'Critical health info accessible to first responders when it matters most.',
    color: '#dc2626',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Default to true to avoid flash
  const [isChecking, setIsChecking] = useState(true);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Check if user has seen welcome screen
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY);
        setHasSeenWelcome(!!hasSeen);
      } catch (error) {
        console.error('Error checking welcome status:', error);
      } finally {
        setIsChecking(false);
      }
    };
    checkWelcomeStatus();
  }, []);

  // Auto-redirect if user has seen welcome
  useEffect(() => {
    if (!isChecking && hasSeenWelcome) {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/login');
      }
    }
  }, [hasSeenWelcome, isChecking, isAuthenticated, router]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(currentIndex + 1);
        scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
      setCurrentIndex(onboardingData.length - 1);
      scrollViewRef.current?.scrollTo({ x: (onboardingData.length - 1) * width, animated: true });
    } catch (error) {
      console.error('Error saving welcome status:', error);
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
      router.push('/register');
    } catch (error) {
      console.error('Error saving welcome status:', error);
      router.push('/register');
    }
  };

  const handleAlreadyHaveAccount = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, 'true');
      router.push('/login');
    } catch (error) {
      console.error('Error saving welcome status:', error);
      router.push('/login');
    }
  };

  const currentScreen = onboardingData[currentIndex];
  const isLastScreen = currentIndex === onboardingData.length - 1;

  // Don't render until we've checked storage
  if (isChecking) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Skip button */}
      {!isLastScreen && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Main content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          if (newIndex !== currentIndex) {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
            setCurrentIndex(newIndex);
          }
        }}
        style={styles.scrollView}
      >
        {onboardingData.map((item) => (
          <View key={item.id} style={styles.slide}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>

              {/* Text content */}
              <View style={styles.textContent}>
                <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
                { backgroundColor: index === currentIndex ? currentScreen.color : '#d1d5db' }
              ]}
            />
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {!isLastScreen ? (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: currentScreen.color }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: currentScreen.color }]}
                onPress={handleGetStarted}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleAlreadyHaveAccount}
              >
                <Text style={[styles.secondaryButtonText, { color: currentScreen.color }]}>
                  I already have an account
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#ffffff',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
    fontWeight: '400',
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
    backgroundColor: '#ffffff',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    gap: 12,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});