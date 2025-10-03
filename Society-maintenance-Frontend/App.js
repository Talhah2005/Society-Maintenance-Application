import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Import screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import UserDashboard from './screens/UserDashboard';
import TeamDashboard from './screens/TeamDashboard';
import AdminDashboard from './screens/AdminDashboard';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import UpdateProfileScreen from './screens/UpdateProfileScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always start fresh to prevent navigation issues
    clearAuthAndStart();
  }, []);

  const clearAuthAndStart = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userId']);
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (error) {
      console.error('Error clearing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (token, role) => {
    try {
      await AsyncStorage.multiSet([
        ['authToken', token],
        ['userRole', role],
        ['userId', `${role}-${Date.now()}`]
      ]);
      setIsAuthenticated(true);
      setUserRole(role);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userRole', 'userId']);
    } catch (error) {
      console.error('Error clearing auth:', error);
    } finally {
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  if (loading) {
    return null;
  }

  const DashboardComponent = (props) => {
    if (userRole === 'admin') {
      return <AdminDashboard {...props} onLogout={handleLogout} />;
    } else if (userRole === 'team') {
      return <TeamDashboard {...props} onLogout={handleLogout} />;
    } else {
      return <UserDashboard {...props} onLogout={handleLogout} />;
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor="#FF6B6B" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FF6B6B',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen 
                name="Login" 
                options={{ headerShown: false }}
              >
                {props => <LoginScreen {...props} onLogin={handleLogin} />}
              </Stack.Screen>
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen}
                options={{ title: 'Create Account' }}
              />
              <Stack.Screen 
                name="ForgotPassword" 
                component={ForgotPasswordScreen}
                options={{ title: 'Forgot Password' }}
              />
              <Stack.Screen 
                name="ResetPassword" 
                component={ResetPasswordScreen}
                options={{ title: 'Reset Password' }}
              />
            </>
          ) : (
            <>
              <Stack.Screen 
                name="Dashboard"
                component={DashboardComponent}
                options={{ 
                  title: `${userRole?.charAt(0).toUpperCase()}${userRole?.slice(1)} Portal`,
                  headerLeft: null
                }}
              />
              <Stack.Screen 
                name="UpdateProfile" 
                component={UpdateProfileScreen}
                options={{ title: 'Update Profile' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}