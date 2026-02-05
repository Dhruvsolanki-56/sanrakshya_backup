import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SelectedWorkplaceProvider } from '../contexts/SelectedWorkplaceContext';

// Import Doctor Screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorVerificationScreen from '../screens/doctor/DoctorVerificationScreen';
import DoctorScheduleScreen from '../screens/doctor/DoctorScheduleScreen';
import PatientListScreen from '../screens/doctor/PatientListScreen';
import DoctorMessagesScreen from '../screens/doctor/DoctorMessagesScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';
import PatientDetailsScreen from '../screens/doctor/PatientDetailsScreen';
import VisitSummaryScreen from '../screens/doctor/VisitSummaryScreen';
import JoinWorkplaceScreen from '../screens/doctor/JoinWorkplaceScreen';
import DoctorTeamAndRequestsScreen from '../screens/doctor/DoctorTeamAndRequestsScreen';
import DoctorDoctorRequestsScreen from '../screens/doctor/DoctorDoctorRequestsScreen';
import DoctorTeamMembersScreen from '../screens/doctor/DoctorTeamMembersScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ScheduleStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorScheduleMain" component={DoctorScheduleScreen} />
      <Stack.Screen name="VisitSummary" component={VisitSummaryScreen} />
    </Stack.Navigator>
  );
};

const PatientStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientListMain" component={PatientListScreen} />
      <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
    </Stack.Navigator>
  );
};

const DashboardStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorDashboardMain" component={DoctorDashboardScreen} />
      <Stack.Screen name="Verification" component={DoctorVerificationScreen} />
      <Stack.Screen name="JoinWorkplace" component={JoinWorkplaceScreen} />
      <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
    </Stack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DoctorProfileMain" component={DoctorProfileScreen} />
      <Stack.Screen name="DoctorTeamAndRequests" component={DoctorTeamAndRequestsScreen} />
      <Stack.Screen name="DoctorDoctorRequests" component={DoctorDoctorRequestsScreen} />
      <Stack.Screen name="DoctorTeamMembers" component={DoctorTeamMembersScreen} />
    </Stack.Navigator>
  );
};

const getIcon = (routeName, focused) => {
  const color = focused ? '#667eea' : '#7f8c8d';
  const size = 26;
  let iconName;

  switch (routeName) {
    case 'Dashboard':
      iconName = focused ? 'apps' : 'apps-outline';
      break;
    case 'Schedule':
      iconName = focused ? 'calendar' : 'calendar-outline';
      break;
    case 'Patients':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'Messages':
      iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person-circle' : 'person-circle-outline';
      break;
    default:
      iconName = 'ellipse-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

const CustomDoctorTabBar = ({ state, descriptors, navigation }) => {
  const getHide = (route) => {
    if (!route) return false;
    if (route.params && route.params.hideTabBar) return true;
    const childState = route.state;
    if (childState && childState.routes && typeof childState.index === 'number') {
      return getHide(childState.routes[childState.index]);
    }
    return false;
  };
  const focusedRoute = state.routes[state.index];
  if (getHide(focusedRoute)) return null;
  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={40} tint="light" style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <TouchableOpacity key={route.key} style={styles.tabButton} onPress={onPress}>
              <Text style={[styles.tabIcon, isFocused && styles.focusedTabIcon]}>
                {getIcon(route.name, isFocused)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

const DoctorBottomTabNavigator = () => {
  return (
    <SelectedWorkplaceProvider>
      <Tab.Navigator
        tabBar={(props) => <CustomDoctorTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
        <Tab.Screen name="Schedule" component={ScheduleStackNavigator} />
        <Tab.Screen name="Patients" component={PatientStackNavigator} />
        <Tab.Screen name="Messages" component={DoctorMessagesScreen} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>
    </SelectedWorkplaceProvider>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    height: 65,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 10,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 28,
    color: '#5a6c7d',
    fontWeight: '400',
  },
  focusedTabIcon: {
    color: '#667eea',
    fontWeight: '600',
  },
});

export default DoctorBottomTabNavigator;
