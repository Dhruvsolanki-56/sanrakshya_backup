import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CommunityScreen = ({ navigation }) => {
  /* -------------------------------------------------------------------------- */
  /*                               Logic/Data                                   */
  /* -------------------------------------------------------------------------- */
  // EXACT Original Data
  const forums = [
    { id: '1', name: 'Newborns (0-3 months)', description: 'Discussions about feeding, sleeping, and caring for a newborn.', icon: 'baby-carriage', color: '#667eea' },
    { id: '2', name: 'Toddlers (1-3 years)', description: 'Share tips on managing tantrums, potty training, and more.', icon: 'walk', color: '#10ac84' },
    { id: '3', name: 'Allergies & Conditions', description: 'A place to discuss managing allergies and other health conditions.', icon: 'medkit', color: '#ff6b6b' },
    { id: '4', name: 'General Parenting', description: 'A general forum for all parenting questions and support.', icon: 'people', color: '#ffa726' },
  ];

  /* -------------------------------------------------------------------------- */
  /*                               UI Render                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#F8FAFC', '#EFF6FF', '#E0F2FE']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Forums</Text>

          {forums.map(forum => (
            <TouchableOpacity
              key={forum.id}
              style={styles.forumCard}
              onPress={() => navigation.navigate('Forum', { forumName: forum.name })}
              activeOpacity={0.9}
            >
              <View style={[styles.iconContainer, { backgroundColor: forum.color }]}>
                <Ionicons name={forum.icon} size={24} color="#fff" />
              </View>
              <View style={styles.forumTextContainer}>
                <Text style={styles.forumName}>{forum.name}</Text>
                <Text style={styles.forumDescription}>{forum.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 24, paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },

  content: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 16 },

  /* Glassmorphism Card Style */
  forumCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#64748B', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    borderWidth: 1, borderColor: '#E2E8F0'
  },
  iconContainer: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
  },
  forumTextContainer: { flex: 1, marginRight: 8 },
  forumName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  forumDescription: { fontSize: 13, color: '#64748B', lineHeight: 18 }
});

export default CommunityScreen;
