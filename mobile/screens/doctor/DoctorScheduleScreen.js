import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const DoctorScheduleScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const appointments = {
    '2025-09-27': [
      { id: '1', patient: 'Emma Johnson', time: '10:30 AM', reason: 'MMR Vaccination', avatar: 'https://randomuser.me/api/portraits/women/32.jpg', status: 'Confirmed' },
      { id: '2', patient: 'Alex Chen', time: '11:00 AM', reason: 'Regular Checkup', avatar: 'https://randomuser.me/api/portraits/men/33.jpg', status: 'Confirmed' },
      { id: '3', patient: 'Sophie Williams', time: '11:45 AM', reason: 'Growth Assessment', avatar: 'https://randomuser.me/api/portraits/women/34.jpg', status: 'Pending' },
    ],
    '2025-09-28': [
      { id: '4', patient: 'Liam Brown', time: '09:00 AM', reason: 'Fever & Cough', avatar: 'https://randomuser.me/api/portraits/men/35.jpg', status: 'Confirmed' },
    ],
    '2025-10-01': [
        { id: '5', patient: 'Olivia Garcia', time: '02:00 PM', reason: 'Allergy Test', avatar: 'https://randomuser.me/api/portraits/women/36.jpg', status: 'Confirmed' },
        { id: '6', patient: 'Noah Martinez', time: '03:30 PM', reason: 'Follow-up Visit', avatar: 'https://randomuser.me/api/portraits/men/37.jpg', status: 'Cancelled' },
    ]
  };

  const markedDates = {};
  for (const date in appointments) {
    if (appointments[date].length > 0) {
      markedDates[date] = { marked: true, dotColor: '#667eea' };
    }
  }
  if (selectedDate) {
    markedDates[selectedDate] = { ...markedDates[selectedDate], selected: true, selectedColor: '#667eea' };
  }

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const AnimatedAppointmentItem = ({ item, index }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(itemAnim, {
            toValue: 1,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
        }).start();
    }, [selectedDate]);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Confirmed': return { backgroundColor: '#E8F5E9', color: '#4CAF50' };
            case 'Pending': return { backgroundColor: '#FFF3E0', color: '#FF9800' };
            case 'Cancelled': return { backgroundColor: '#FFEBEE', color: '#F44336' };
            default: return { backgroundColor: '#F5F5F5', color: '#616161' };
        }
    }

    return (
        <TouchableOpacity onPress={() => navigation.navigate('VisitSummary', { patient: item })}>
        <Animated.View style={[styles.appointmentItem, { opacity: itemAnim, transform: [{ translateY: itemAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Image source={{ uri: item.avatar }} style={styles.patientAvatar} />
            <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{item.patient}</Text>
                <Text style={styles.appointmentReason}>{item.reason}</Text>
                <Text style={styles.appointmentTime}>{item.time}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(item.status).backgroundColor }]}>
                <Text style={[styles.statusText, { color: getStatusStyle(item.status).color }]}>{item.status}</Text>
            </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#f8f9ff',
          calendarBackground: '#fff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#667eea',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#667eea',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#667eea',
          selectedDotColor: '#ffffff',
          arrowColor: '#667eea',
          monthTextColor: '#2c3e50',
          indicatorColor: '#667eea',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
      />

      {/* Agenda */}
      <View style={styles.agendaContainer}>
        <Text style={styles.agendaTitle}>Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <FlatList
            data={appointments[selectedDate] || []}
            renderItem={({ item, index }) => <AnimatedAppointmentItem item={item} index={index} />}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="checkmark-done-circle-outline" size={60} color="#c5d0e0" />
                    <Text style={styles.emptyStateText}>No appointments scheduled for this day.</Text>
                </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#667eea',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    borderBottomWidth: 1,
    borderColor: '#f1f3f4',
  },
  agendaContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appointmentReason: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  },
  emptyStateText: {
      fontSize: 16,
      color: '#7f8c8d',
      marginTop: 16,
      textAlign: 'center',
  },
});

export default DoctorScheduleScreen;
