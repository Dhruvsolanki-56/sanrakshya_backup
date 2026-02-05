import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, StatusBar, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// "Clean Medical Luxury" Aesthetic
// Pure white background, crisp typography, subtle premium motion.
// Similar to: Health apps, Finance apps (Revolut/Coinbase style), High-end clinics.

export default function SplashScreen({ navigation }) {
  // Animation Values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo pop-in (Elegantly)
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ])
    ]).start();

    // 2. Line Expansion
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(lineScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();

    // 3. Text Rise & Fade
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
      ])
    ]).start();

    // Navigation
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Modern Minimal Background - Pure White to very subtle Off-White */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']} // Pure white -> Very light gray
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.content}>

        {/* Minimal Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] }
          ]}
        >
          {/* Subtle Shadow Layer */}
          <View style={styles.shadowLayer} />

          {/* Main Logo Shape */}
          <View style={styles.logoBadge}>
            <Ionicons name="shield-checkmark" size={42} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Divider Line */}
        <Animated.View
          style={[
            styles.divider,
            { transform: [{ scaleX: lineScale }] }
          ]}
        />

        {/* Typography */}
        <Animated.View
          style={[
            styles.textWrapper,
            { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }
          ]}
        >
          <Text style={styles.title}>SANRAKSHYA</Text>
          <Text style={styles.subtitle}>CHILD HEALTHCARE</Text>
        </Animated.View>

      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>SECURE • TRUSTED • CARING</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowLayer: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#3B82F6', // Blue shadow base
    opacity: 0.3,
    transform: [{ translateY: 10 }],
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: '#2563EB', // Royal Blue (Trustworthy)
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0', // Light Gray Divider
    borderRadius: 2,
    marginBottom: 24,
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A', // Slate 900 (Dark, almost black)
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B', // Slate 500
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 2,
    fontWeight: '500',
  }
});
