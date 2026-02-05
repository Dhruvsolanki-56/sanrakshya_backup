import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ScheduleScreen from '../screens/parent/ScheduleScreen';
import AddScreen from '../screens/parent/AddScreen';
import ChatScreen from '../screens/parent/ChatScreen';
import ProfileScreen from '../screens/parent/ProfileScreen';
import ParentProfileEditScreen from '../screens/parent/ParentProfileEditScreen';
import ChildEditScreen from '../screens/parent/ChildEditScreen';
import ChildRegistrationScreen from '../screens/parent/ChildRegistrationScreen';
import HealthProfileScreen from '../screens/parent/HealthProfileScreen';
import AIHealthReportsScreen from '../screens/parent/AIHealthReportsScreen';
import NutritionLifestyleScreen from '../screens/parent/NutritionLifestyleScreen';
import FindDoctorsScreen from '../screens/parent/FindDoctorsScreen';
import CommunityScreen from '../screens/parent/CommunityScreen';
import ForumScreen from '../screens/parent/ForumScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// Home Stack Navigator
const CommunityStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityMain" component={CommunityScreen} />
      <Stack.Screen name="Forum" component={ForumScreen} />
    </Stack.Navigator>
  );
};

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={ParentHomeScreen} />
      <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
      <Stack.Screen name="AIHealthReports" component={AIHealthReportsScreen} />
      <Stack.Screen name="BalMitraChat" component={ChatScreen} />
      <Stack.Screen name="NutritionLifestyle" component={NutritionLifestyleScreen} />
      <Stack.Screen name="FindDoctors" component={FindDoctorsScreen} />
    </Stack.Navigator>
  );
};

const getIcon = (routeName, focused) => {
  const color = focused ? '#0284C7' : '#94A3B8'; // Active: Sky Blue, Inactive: Slate Gray
  const size = 24;
  let iconName;

  switch (routeName) {
    case 'Home':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Schedule':
      iconName = focused ? 'calendar' : 'calendar-outline';
      break;
    case 'Community':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    default:
      iconName = 'ellipse-outline';
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Ionicons name={iconName} size={size} color={color} />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const focusedRoute = state.routes[state.index];
  const focusedOptions = descriptors[focusedRoute.key]?.options || {};

  if (focusedOptions.tabBarStyle && focusedOptions.tabBarStyle.display === 'none') {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      {/* Main Floating Pill */}
      <View style={styles.floatingPill}>

        {/* Left Tabs */}
        {state.routes.slice(0, 2).map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity key={route.key} style={styles.tabButton} onPress={onPress}>
              {getIcon(route.name, isFocused)}
            </TouchableOpacity>
          );
        })}

        {/* Spacer for Center Button */}
        <View style={styles.centerSpacer} />

        {/* Right Tabs */}
        {state.routes.slice(3, 5).map((route, index) => {
          const isFocused = state.index === index + 3;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity key={route.key} style={styles.tabButton} onPress={onPress}>
              {getIcon(route.name, isFocused)}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Center Button (Absolute Positioned) */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => navigation.navigate('Add')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#0EA5E9', '#2563EB']} // Sky to Blue
          style={styles.centerButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const ParentBottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
          const hideTabBar = routeName === 'AIHealthReports' || routeName === 'BalMitraChat';
          return {
            tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
          };
        }}
      />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Community" component={CommunityStackNavigator} />
      <Tab.Screen name="Profile">
        {() => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="ParentProfileEdit" component={ParentProfileEditScreen} />
            <Stack.Screen name="ChildEdit" component={ChildEditScreen} />
            <Stack.Screen name="ChildRegistration" component={ChildRegistrationScreen} />
          </Stack.Navigator>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: width * 0.9,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // Soft Shadow
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerSpacer: {
    width: 60, // Space for the center button
  },
  centerButton: {
    position: 'absolute',
    top: -20, // Pop out half way
    alignSelf: 'center',
    // Shadow for button
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  centerButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#F8FAFC', // Match background color to create "gap" effect
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0284C7',
    marginTop: 4,
  }
});

export default ParentBottomTabNavigator;
