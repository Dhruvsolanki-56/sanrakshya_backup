import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthTips } from '../data/healthTips';

const HealthFeed = ({ childAge }) => {
  // In a real app, this data would be dynamically generated and personalized
  const feedItems = [
    {
      type: 'appointment',
      title: 'Upcoming Appointment',
      description: 'Dr. Smith - Annual Checkup',
      date: 'Tomorrow, 10:30 AM',
      icon: 'calendar-outline',
      colors: ['#667eea', '#764ba2'],
    },
    {
      type: 'vaccine',
      title: 'Vaccination Reminder',
      description: 'MMR vaccine due this month',
      date: 'Due in 2 weeks',
      icon: 'medical-outline',
      colors: ['#ff6b6b', '#ee609c'],
    },
    ...healthTips
      .filter(tip => childAge >= tip.ageRange[0] && childAge <= tip.ageRange[1])
      .map(tip => ({ ...tip, type: 'tip' })),
  ];

  const renderItem = ({ item }) => {
    switch (item.type) {
      case 'appointment':
      case 'vaccine':
        return (
          <TouchableOpacity style={styles.card}>
            <LinearGradient colors={item.colors} style={styles.cardGradient}>
              <View style={styles.cardHeader}>
                <Ionicons name={item.icon} size={24} color="#fff" />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      case 'tip':
        return (
          <TouchableOpacity style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name={item.icon} size={24} color="#10ac84" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{item.title}</Text>
              <Text style={styles.tipDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>For You</Text>
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  card: {
    width: 280,
    marginRight: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tipCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  tipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(16, 172, 132, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tipDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

export default HealthFeed;
