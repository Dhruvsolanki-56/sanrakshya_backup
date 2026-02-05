import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation, route }) => {
  const [selectedRole, setSelectedRole] = useState(route?.params?.role || 'parent');
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const roleIndicatorAnim = useRef(new Animated.Value(selectedRole === 'parent' ? 0 : 1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Role switch animation with spring for more natural movement
    Animated.spring(roleIndicatorAnim, {
      toValue: selectedRole === 'parent' ? 0 : 1,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [selectedRole]);

  const handleSendResetEmail = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // TODO: Implement forgot password logic
    console.log('Password reset requested for:', { email, role: selectedRole });
    
    // Simulate email sent
    setIsEmailSent(true);
    
    // Show success message
    Alert.alert(
      'Reset Email Sent',
      `We've sent password reset instructions to ${email}. Please check your inbox and follow the instructions.`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
  };

  const roleIndicatorPosition = roleIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '52%'],
  });

  const parentTextColor = roleIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#666666'],
  });

  const doctorTextColor = roleIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#666666', '#ffffff'],
  });

  const getButtonColors = () => {
    return selectedRole === 'parent' 
      ? ['#4285F4', '#2A75F3'] // Google blue for parent
      : ['#34A853', '#2E9549']; // Google green for doctor
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color="#202124" />
            </TouchableOpacity>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you instructions to reset your password
            </Text>
          </View>

          {/* Role Selector - Google/Apple Style Segmented Control */}
          <View style={styles.roleSelectorContainer}>
            <Animated.View 
              style={[
                styles.roleIndicator, 
                { left: roleIndicatorPosition }
              ]} 
            />
            <TouchableOpacity 
              style={styles.roleOption} 
              onPress={() => setSelectedRole('parent')}
              activeOpacity={0.7}
            >
              <Animated.Text style={[styles.roleOptionText, { color: parentTextColor }]}>
                Parent
              </Animated.Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.roleOption} 
              onPress={() => setSelectedRole('doctor')}
              activeOpacity={0.7}
            >
              <Animated.Text style={[styles.roleOptionText, { color: doctorTextColor }]}>
                Doctor
              </Animated.Text>
            </TouchableOpacity>
          </View>

          {/* Reset Form */}
          <View style={styles.formContainer}>
            <View style={[
              styles.inputContainer, 
              emailFocused && styles.inputContainerFocused
            ]}>
              <MaterialIcons name="email" size={22} color={emailFocused ? "#4285F4" : "#757575"} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#757575"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isEmailSent}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleSendResetEmail}
              disabled={isEmailSent}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={getButtonColors()}
                style={styles.resetButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.resetButtonText}>
                  {isEmailSent ? 'Email sent' : 'Send reset email'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isEmailSent && (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={24} color="#34A853" style={styles.successIcon} />
                <Text style={styles.successText}>
                  Check your email for reset instructions
                </Text>
                <Text style={styles.successSubtext}>
                  Didn't receive the email? Check your spam folder or try again in a few minutes.
                </Text>
              </View>
            )}
          </View>

          {/* Back to Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginPrompt}>Remember your password?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    lineHeight: 22,
  },
  roleSelectorContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#f1f3f4',
    borderRadius: 24,
    marginBottom: 32,
    position: 'relative',
    alignItems: 'center',
  },
  roleIndicator: {
    position: 'absolute',
    width: '46%',
    height: '84%',
    backgroundColor: '#4285F4',
    borderRadius: 22,
    top: '8%',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  roleOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    height: '100%',
  },
  roleOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  inputContainerFocused: {
    borderColor: '#4285F4',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#202124',
    marginLeft: 12,
  },
  resetButton: {
    marginBottom: 24,
    borderRadius: 4,
    overflow: 'hidden',
    elevation: 1,
  },
  resetButtonGradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  successContainer: {
    backgroundColor: '#e6f4ea',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e8e3e',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginPrompt: {
    color: '#5f6368',
    fontSize: 15,
  },
  loginLink: {
    color: '#4285F4',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 5,
  },
});


export default ForgotPasswordScreen;
