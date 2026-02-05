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
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeProvider';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { useSelectedChild } from '../../contexts/SelectedChildContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { reloadChildren } = useSelectedChild();

  // State
  const [selectedRole, setSelectedRole] = useState('parent');
  const [email, setEmail] = useState('ashwinsolanki9898@gmail.com');
  const [password, setPassword] = useState('Ashwin@123');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerHeightAnim = useRef(new Animated.Value(height * 0.35)).current; // Start slightly larger

  // Dynamic Header Colors
  // Parent: Blue-ish
  // Doctor: Teal-ish
  const headerColor1 = selectedRole === 'parent' ? '#3B82F6' : '#0D9488'; // Blue vs Teal
  const headerColor2 = selectedRole === 'parent' ? '#2563EB' : '#0F766E';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await authService.login(selectedRole, email, password);
      if (selectedRole === 'parent') {
        try { await userService.refreshParentHome(); } catch (_) { }
        try { await reloadChildren(); } catch (_) { }
        navigation.replace('ParentHome');
      } else {
        navigation.replace('DoctorHome');
      }
    } catch (err) {
      if (err?.status === 401) setError('Invalid credentials.');
      else setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Section (30%) - Visual Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeightAnim }]}>
        <LinearGradient
          colors={[headerColor1, headerColor2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative shapes in background */}
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />

          {/* Dynamic Icon/Illustration */}
          <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={selectedRole === 'parent' ? "people" : "medical"}
                size={60}
                color={selectedRole === 'parent' ? '#3B82F6' : '#0D9488'}
              />
            </View>
            <Text style={styles.headerTitle}>
              {selectedRole === 'parent' ? 'Parent Portal' : 'Doctor Portal'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {selectedRole === 'parent' ? 'Manage your child\'s health' : 'Manage your patients'}
            </Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Bottom Section (70%) - Form */}
      <View style={styles.bottomContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={[styles.formContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                {/* Role Switcher - Floating on the split line */}
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleButton, selectedRole === 'parent' && styles.roleActive]}
                    onPress={() => setSelectedRole('parent')}
                  >
                    <Text style={[styles.roleText, selectedRole === 'parent' && styles.roleTextActive]}>Parent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, selectedRole === 'doctor' && styles.roleActive]}
                    onPress={() => setSelectedRole('doctor')}
                  >
                    <Text style={[styles.roleText, selectedRole === 'doctor' && styles.roleTextActive]}>Doctor</Text>
                  </TouchableOpacity>
                </View>

                {/* Welcome Text */}
                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeTitle}>Welcome Back</Text>
                  <Text style={styles.welcomeSubtitle}>Please sign in to continue</Text>
                </View>

                {/* Form Inputs */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
                    <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      autoCapitalize="none"
                      placeholder="name@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      secureTextEntry={!isPasswordVisible}
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={[styles.forgotPasswordText, { color: headerColor1 }]}>Forgot Password?</Text>
                </TouchableOpacity>

                {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

                <TouchableOpacity
                  onPress={handleLogin}
                  activeOpacity={0.9}
                  disabled={loading}
                  style={styles.loginButtonShadow}
                >
                  <LinearGradient
                    colors={[headerColor1, headerColor2]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.loginButtonText}>Log In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register', { role: selectedRole })}>
                    <Text style={[styles.signupText, { color: headerColor1 }]}>Sign up</Text>
                  </TouchableOpacity>
                </View>

              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Top Header (30%)
  headerContainer: {
    width: '100%',
    borderBottomLeftRadius: 32, // Smooth curve
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -20,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // Bottom Form (70%)
  bottomContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  formContent: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    alignSelf: 'center',
    width: '100%',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12, // Cleaner radius
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: '#3B82F6', // Will be overridden by dynamic color? No, blue is safe for focus usually
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    height: '100%',
  },
  eyeIcon: {
    padding: 10,
    marginRight: 6,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButtonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LoginScreen;
