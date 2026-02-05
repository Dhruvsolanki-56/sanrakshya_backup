
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import SplashScreen from './screens/auth/SplashScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import QuickGuideScreen from './screens/auth/QuickGuideScreen';
import ParentBottomTabNavigator from './navigation/ParentBottomTabNavigator';
import DoctorBottomTabNavigator from './navigation/DoctorBottomTabNavigator';
import AddHealthRecordScreen from './screens/parent/AddHealthRecordScreen';
import AddMilestoneScreen from './screens/parent/AddMilestoneScreen';
import AddVaccinationScreen from './screens/parent/AddVaccinationScreen';
import AddSymptomsScreen from './screens/parent/AddSymptomsScreen';
import AddMeasurementScreen from './screens/parent/AddMeasurementScreen';
import AddAppointmentScreen from './screens/parent/AddAppointmentScreen';
import GrowthChartScreen from './screens/parent/GrowthChartScreen';
import SymptomCheckerScreen from './screens/parent/SymptomCheckerScreen';
import VaccinePlannerScreen from './screens/parent/VaccinePlannerScreen';
import { useTheme, getNavigationTheme } from './theme/ThemeProvider';
import AddMealsScreen from './screens/parent/AddMealsScreen';

// A placeholder for your main app screen

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { theme } = useTheme();
  const navigationTheme = getNavigationTheme(theme);
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="QuickGuide" component={QuickGuideScreen} />
        <Stack.Screen name="ParentHome" component={ParentBottomTabNavigator} />
        <Stack.Screen name="DoctorHome" component={DoctorBottomTabNavigator} />
        <Stack.Screen name="AddHealthRecord" component={AddHealthRecordScreen} />
        <Stack.Screen name="AddMilestone" component={AddMilestoneScreen} />
        <Stack.Screen name="AddVaccination" component={AddVaccinationScreen} />
        <Stack.Screen name="AddSymptoms" component={AddSymptomsScreen} />
        <Stack.Screen name="AddMeals" component={AddMealsScreen} />
        <Stack.Screen name="AddMeasurement" component={AddMeasurementScreen} />
        <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} />
        <Stack.Screen name="GrowthChart" component={GrowthChartScreen} />
        <Stack.Screen name="SymptomChecker" component={SymptomCheckerScreen} />
        <Stack.Screen name="VaccinePlanner" component={VaccinePlannerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

