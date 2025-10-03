// screens/LoginScreen.js
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
  ScrollView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'

  useEffect(() => {
    clearStoredData();
    checkServerConnection();
  }, []);

  const clearStoredData = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userId']);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  };

  const checkServerConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        setServerStatus('connected');
        console.log('Backend connected successfully');
      } else {
        setServerStatus('disconnected');
        console.log('Backend responded but with error');
      }
    } catch (error) {
      setServerStatus('disconnected');
      console.log('Backend connection failed:', error.message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (serverStatus === 'disconnected') {
      Alert.alert(
        'Server Unavailable',
        'Cannot connect to the server. Please check your network connection and try again.',
        [
          { text: 'Retry', onPress: checkServerConnection },
          { text: 'Cancel' }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login...');
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful');
        await onLogin(data.token, data.user.role);
        Alert.alert('Success', `Welcome back, ${data.user.name}!`);
      } else {
        Alert.alert('Login Failed', data.msg || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('Network request failed')) {
        setServerStatus('disconnected');
        Alert.alert(
          'Network Error', 
          'Cannot connect to server. Please check your network connection.',
          [
            { text: 'Retry', onPress: () => {
              checkServerConnection();
              setTimeout(() => handleLogin(), 1000);
            }},
            { text: 'Cancel' }
          ]
        );
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    await clearStoredData();
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = async () => {
    await clearStoredData();
    navigation.navigate('Register');
  };

  const getServerStatusColor = () => {
    switch (serverStatus) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#FF6B6B';
      default: return '#FFC107';
    }
  };

  const getServerStatusText = () => {
    switch (serverStatus) {
      case 'connected': return 'Server Connected';
      case 'disconnected': return 'Server Disconnected';
      default: return 'Checking Server...';
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Society Maintenance</Text>
              <Text style={styles.subtitle}>Welcome Back</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Server Status Indicator */}
              <View style={[styles.serverStatus, { backgroundColor: getServerStatusColor() }]}>
                <Ionicons 
                  name={serverStatus === 'connected' ? 'checkmark-circle' : serverStatus === 'disconnected' ? 'alert-circle' : 'time'} 
                  size={16} 
                  color="#FFFFFF" 
                  style={styles.statusIcon}
                />
                <Text style={styles.serverStatusText}>{getServerStatusText()}</Text>
                {serverStatus === 'disconnected' && (
                  <TouchableOpacity onPress={checkServerConnection} style={styles.retryButton}>
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Enter your password"
                  placeholderTextColor="#A0A0A0"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton, 
                  (loading || serverStatus === 'disconnected') && styles.disabledButton
                ]}
                onPress={handleLogin}
                disabled={loading || serverStatus === 'disconnected'}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <Text style={styles.dividerText}>Don't have an account?</Text>
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusIcon: {
    marginRight: 8,
  },
  serverStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 20,
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
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
  },
});