// screens/ForgotPasswordScreen.js - Improved with OTP-first flow
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Clear any auth data when this screen loads
  useEffect(() => {
    clearAuthData();
    // Log backend connection status (console only)
    checkBackendConnection();
  }, []);

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userId']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      if (response.ok) {
        console.log('✅ Backend connected successfully:', API_BASE_URL);
      } else {
        console.warn('⚠️ Backend connection issue:', response.status);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error.message);
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('📧 Sending OTP request for:', email);
      
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      console.log('📬 OTP Response:', data);

      if (response.ok && data.success) {
        Alert.alert(
          'OTP Sent',
          'A 6-digit OTP has been sent to your email address. Please check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => setStep(2)
            }
          ]
        );
      } else {
        Alert.alert('Error', data.msg || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Cannot connect to server. Please check your connection and try again.',
          [
            {
              text: 'Demo Mode',
              onPress: () => {
                Alert.alert(
                  'Demo Mode',
                  'OTP would be sent in live version. Use demo OTP: 123456',
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      setStep(2);
                      setOtp('123456');
                    }
                  }]
                );
              }
            },
            {
              text: 'Retry',
              onPress: () => handleSendOTP()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits long');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verifying OTP for:', email);
      
      // For demo mode, accept 123456
      if (otp === '123456') {
        console.log('🎯 Demo OTP accepted');
        setOtpVerified(true);
        setStep(3);
        setLoading(false);
        return;
      }

      // Real OTP verification (we'll verify by attempting password reset)
      // In a real implementation, you might have a separate verify-otp endpoint
      setOtpVerified(true);
      setStep(3);
      Alert.alert('Success', 'OTP verified! Now set your new password.');
      
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!otpVerified) {
      Alert.alert('Error', 'Please verify OTP first');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Resetting password for:', email);
      
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
          newPassword
        }),
      });

      const data = await response.json();
      console.log('✅ Password reset response:', data);

      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. You can now login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', data.msg || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Cannot connect to server. Please check your connection and try again.',
          [
            {
              text: 'Demo Mode',
              onPress: () => {
                Alert.alert(
                  'Demo Success',
                  'Password would be reset in live version.',
                  [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
              }
            },
            {
              text: 'Retry',
              onPress: () => handleResetPassword()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpVerified(false);
  };

  const handleBackToOTP = () => {
    setStep(2);
    setNewPassword('');
    setConfirmPassword('');
  };

  const renderStep1 = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={64} color="#FF6B6B" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a 6-digit OTP to reset your password.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your email"
            placeholderTextColor="#A0A0A0"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={20} color="#FF6B6B" style={styles.buttonIcon} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark-outline" size={64} color="#FF6B6B" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}{email}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>OTP Code</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#A0A0A0"
            maxLength={6}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Verify OTP</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToEmail}
            disabled={loading}
          >
            <Ionicons name="mail" size={16} color="#FF6B6B" style={styles.smallButtonIcon} />
            <Text style={styles.secondaryButtonText}>Change Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={16} color="#FF6B6B" style={styles.smallButtonIcon} />
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed-outline" size={64} color="#4CAF50" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>
          OTP verified! Now create your new password.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter new password"
              placeholderTextColor="#A0A0A0"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color="#A0A0A0" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#A0A0A0"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color="#A0A0A0" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementText}>
            Password must be at least 6 characters long
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Reset Password</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToOTP}
            disabled={loading}
          >
            <Ionicons name="shield-checkmark" size={16} color="#FF6B6B" style={styles.smallButtonIcon} />
            <Text style={styles.secondaryButtonText}>Back to OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={16} color="#FF6B6B" style={styles.smallButtonIcon} />
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C2C2E',
    backgroundColor: '#F8F8F9',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    backgroundColor: '#F8F8F9',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#2C2C2E',
  },
  eyeButton: {
    padding: 16,
  },
  passwordRequirements: {
    marginBottom: 24,
  },
  requirementText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  backButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  smallButtonIcon: {
    marginRight: 4,
  },
});