import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const AddScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const addOptions = [
    {
      title: 'Health Record',
      subtitle: 'Upload Reports',
      icon: 'file-document-outline',
      gradient: ['#6366F1', '#818CF8'],
      screen: 'AddHealthRecord',
      iconLib: MaterialCommunityIcons
    },
    {
      title: 'Vaccination',
      subtitle: 'Log Dose',
      icon: 'shield-check-outline',
      gradient: ['#10B981', '#34D399'],
      screen: 'AddVaccination',
      iconLib: MaterialCommunityIcons
    },
    {
      title: 'Appointment',
      subtitle: 'Book Visit',
      icon: 'calendar-clock-outline',
      gradient: ['#F59E0B', '#FBBF24'],
      screen: 'AddAppointment',
      iconLib: MaterialCommunityIcons
    },
    {
      title: 'Growth Log',
      subtitle: 'Height & Weight',
      icon: 'chart-timeline-variant',
      gradient: ['#EC4899', '#F472B6'],
      screen: 'AddMeasurement',
      iconLib: MaterialCommunityIcons
    },
    {
      title: 'Symptoms',
      subtitle: 'Check & Track',
      icon: 'thermometer',
      gradient: ['#EF4444', '#F87171'],
      screen: 'AddSymptoms',
      iconLib: MaterialCommunityIcons
    },
    {
      title: 'Milestone',
      subtitle: 'New Skill',
      icon: 'trophy-variant-outline',
      gradient: ['#8B5CF6', '#A78BFA'],
      screen: 'AddMilestone',
      iconLib: MaterialCommunityIcons
    },
    {
      title: 'Daily Meal',
      subtitle: 'Food Tracker',
      icon: 'food-apple-outline',
      gradient: ['#14B8A6', '#2DD4BF'],
      screen: 'AddMeals',
      iconLib: MaterialCommunityIcons
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Quick Actions</Text>
              <Text style={styles.headerSubtitle}>What would you like to add?</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Grid */}
          <Animated.View style={[styles.gridContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {addOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate(option.screen)}
              >
                <View style={[styles.cardBg, { backgroundColor: '#FFF' }]} />

                <LinearGradient
                  colors={option.gradient}
                  style={styles.iconCircle}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <option.iconLib name={option.icon} size={32} color="#FFF" />
                </LinearGradient>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                </View>

                {/* Artifact Icon */}
                <View style={styles.artifactContainer}>
                  <option.iconLib name={option.icon} size={80} color={option.gradient[0]} style={{ opacity: 0.1 }} />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, color: '#64748B', marginTop: 4 },
  closeBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },

  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: '100%',
    height: 100,
    marginBottom: 16,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row', // Horizontal layout
    alignItems: 'center',
    backgroundColor: '#FFF',

    // Shadow
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    overflow: 'hidden', // Clip artifacts
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  artifactContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ rotate: '-15deg' }],
  },
});

export default AddScreen;
