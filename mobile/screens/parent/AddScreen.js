import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AddScreen = ({ navigation }) => {
  const addOptions = [
    { title: 'Health Record', icon: 'medical-outline', color: '#667eea', description: 'Log new health information', screen: 'AddHealthRecord' },
    { title: 'Milestone', icon: 'trophy-outline', color: '#10ac84', description: 'Track developmental milestones', screen: 'AddMilestone' },
    { title: 'Vaccination', icon: 'shield-outline', color: '#ff6b6b', description: 'Record vaccination details', screen: 'AddVaccination' },
    { title: 'Symptoms', icon: 'thermometer-outline', color: '#ffa726', description: 'Track symptoms or concerns', screen: 'AddSymptoms' },
    { title: 'Meals', icon: 'restaurant-outline', color: '#4A90E2', description: 'Add meals & foods', screen: 'AddMeals' },
    { title: 'Measurement', icon: 'resize-outline', color: '#ab47bc', description: 'Record height, weight, etc.', screen: 'AddMeasurement' },
    { title: 'Appointment', icon: 'calendar-outline', color: '#26c6da', description: 'Book doctor visit', screen: 'AddAppointment' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Record</Text>
          <Text style={styles.subtitle}>What would you like to add today?</Text>
        </View>

        <View style={styles.optionsContainer}>
          {addOptions.map((option, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.optionCard}
              onPress={() => navigation.navigate(option.screen)}
            >
              <LinearGradient 
                colors={[option.color, option.color + '80']} 
                style={styles.iconContainer}
              >
                <Ionicons name={option.icon} size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 100,
  },
});

export default AddScreen;
