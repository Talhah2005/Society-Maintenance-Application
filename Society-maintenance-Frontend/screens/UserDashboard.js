// screens/UserDashboard.js - Complete with Fixed Notifications UI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function UserDashboard({ navigation, onLogout }) {
  const [userInfo, setUserInfo] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    };
  };

  const fetchUserData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers,
      });

      const paymentResponse = await fetch(`${API_BASE_URL}/payments/history`, {
        method: 'GET',
        headers,
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserInfo(profileData);
        console.log('User profile loaded:', profileData.name);
      } else {
        console.error('Failed to fetch user profile:', profileResponse.status);
        Alert.alert('Error', 'Failed to load user profile');
      }

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentData(paymentData);
        console.log('Payment data loaded');
      } else {
        console.error('Failed to fetch payment data:', paymentResponse.status);
        Alert.alert('Error', 'Failed to load payment information');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        console.log('Notifications loaded:', data.notifications.length);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/notifications/mark-read/${notificationId}`, {
        method: 'PUT',
        headers,
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers,
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        setNotifications(notifications.filter(n => n._id !== notificationId));
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
    fetchNotifications();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: onLogout }
      ]
    );
  };

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const getCurrentMonthStatus = () => {
    if (!paymentData || !paymentData.paymentHistory) return 'Not Paid';
    const currentMonth = getCurrentMonth();
    const currentPayment = paymentData.paymentHistory.find(p => p.month === currentMonth);
    return currentPayment?.status || 'Not Paid';
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? '#4CAF50' : '#FF6B6B';
  };

  const getStatusIcon = (status) => {
    return status === 'Paid' ? 'checkmark-circle' : 'close-circle';
  };

  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  const handleContactSupport = () => {
    const duesMessage = paymentData && paymentData.totalDues > 0 
      ? `I have outstanding dues of PKR ${paymentData.totalDues.toLocaleString()} for ${paymentData.monthsUnpaid} month(s). `
      : 'I need assistance with my maintenance account. ';
    
    Alert.alert(
      'Contact Support',
      'For any queries regarding your maintenance bills, please contact the management office.',
      [
        {
          text: 'Call Office',
          onPress: () => Alert.alert('Demo', 'In live version, this would dial the office number')
        },
        {
          text: 'Email',
          onPress: () => Alert.alert('Demo', `In live version, this would open email with message: "${duesMessage}"`)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#FF6B6B"
              colors={['#FF6B6B']}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{userInfo?.name}</Text>
              </View>
              <View style={styles.headerButtons}>
                {/* Notification Bell */}
                <TouchableOpacity 
                  style={styles.notificationButton} 
                  onPress={() => setNotificationModalVisible(true)}
                >
                  <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Dues Alert Card */}
          {paymentData && paymentData.totalDues > 0 && (
            <View style={styles.duesCard}>
              <View style={styles.duesHeader}>
                <Ionicons name="warning" size={24} color="#FFFFFF" />
                <Text style={styles.duesTitle}>Outstanding Dues</Text>
              </View>
              <Text style={styles.duesAmount}>PKR {paymentData.totalDues.toLocaleString()}</Text>
              <Text style={styles.duesDetails}>
                You have unpaid dues for {paymentData.monthsUnpaid} month(s)
              </Text>
              <Text style={styles.duesNote}>
                Monthly fee: PKR {paymentData.monthlyFee.toLocaleString()}
              </Text>
            </View>
          )}

          {/* User Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="home-outline" size={24} color="#FF6B6B" />
              <Text style={styles.infoTitle}>Property Information</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>House No:</Text>
              <Text style={styles.infoValue}>{userInfo?.houseNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Floor:</Text>
              <Text style={styles.infoValue}>{userInfo?.floor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{userInfo?.status}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact:</Text>
              <Text style={styles.infoValue}>{userInfo?.whatsappNumber || userInfo?.phoneNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateProfile}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Summary */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { 
              backgroundColor: getCurrentMonthStatus() === 'Paid' ? '#4CAF50' : '#FF6B6B' 
            }]}>
              <Ionicons 
                name={getCurrentMonthStatus() === 'Paid' ? 'checkmark-circle' : 'time-outline'} 
                size={32} 
                color="#FFFFFF" 
              />
              <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>This Month</Text>
              <Text style={[styles.summaryValue, { color: '#FFFFFF' }]}>
                {getCurrentMonthStatus()}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
              <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Paid</Text>
              <Text style={[styles.summaryValue, { color: '#FFFFFF' }]}>
                {paymentData ? paymentData.monthsPaid : 0}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#FF6B6B' }]}>
              <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
              <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Due</Text>
              <Text style={[styles.summaryValue, { color: '#FFFFFF' }]}>
                {paymentData ? paymentData.monthsUnpaid : 0}
              </Text>
            </View>
          </View>

          {/* Payment History */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Ionicons name="receipt-outline" size={24} color="#FF6B6B" />
              <Text style={styles.historyTitle}>Payment History</Text>
            </View>

            {paymentData && paymentData.paymentHistory ? (
              paymentData.paymentHistory.map((payment, index) => (
                <View key={index} style={styles.paymentRow}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentMonth}>{payment.month}</Text>
                    <Text style={styles.paymentAmount}>
                      PKR {paymentData.monthlyFee.toLocaleString()}
                    </Text>
                    {payment.paidDate && (
                      <Text style={styles.paymentDate}>
                        Paid on: {new Date(payment.paidDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                    <Ionicons 
                      name={getStatusIcon(payment.status)} 
                      size={16} 
                      color="#FFFFFF" 
                      style={styles.statusIcon}
                    />
                    <Text style={styles.statusText}>{payment.status}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>Loading payment history...</Text>
            )}
          </View>

          {/* Contact Info */}
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Ionicons name="call-outline" size={24} color="#FF6B6B" />
              <Text style={styles.contactTitle}>Need Help?</Text>
            </View>
            <Text style={styles.contactText}>
              Contact the management office for any queries regarding your maintenance bills or society services.
            </Text>
            {paymentData && paymentData.totalDues > 0 && (
              <Text style={styles.contactDuesText}>
                Outstanding Amount: PKR {paymentData.totalDues.toLocaleString()}
              </Text>
            )}
            <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Notification Modal - FIXED UI */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={notificationModalVisible}
          onRequestClose={() => setNotificationModalVisible(false)}
          statusBarTranslucent={false}
        >
          <SafeAreaProvider>
            <SafeAreaView style={styles.notificationModalContainer} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.notificationModalHeader}>
              <View style={styles.headerTitleContainer}>
                <Ionicons name="notifications" size={24} color="#FF6B6B" />
                <Text style={styles.notificationModalTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity 
                    onPress={markAllNotificationsAsRead}
                    style={styles.markAllReadButton}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#FF6B6B" />
                    <Text style={styles.markAllReadText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => setNotificationModalVisible(false)}
                  style={styles.closeModalButton}
                >
                  <Ionicons name="close-circle" size={32} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification List */}
            <ScrollView 
              style={styles.notificationList}
              contentContainerStyle={styles.notificationListContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="notifications-off-outline" size={64} color="#E0E0E0" />
                  </View>
                  <Text style={styles.emptyNotificationsTitle}>No notifications yet</Text>
                  <Text style={styles.emptyNotificationsText}>
                    You'll see payment confirmations and updates here
                  </Text>
                </View>
              ) : (
                <>
                  {notifications.map((notification, index) => (
                    <TouchableOpacity
                      key={notification._id}
                      style={[
                        styles.notificationItem,
                        !notification.isRead && styles.unreadNotification,
                      ]}
                      onPress={() => {
                        if (!notification.isRead) {
                          markNotificationAsRead(notification._id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      {/* Notification Icon */}
                      <View style={styles.notificationIconContainer}>
                        <View style={[
                          styles.notificationIconCircle,
                          { 
                            backgroundColor: notification.type === 'payment' ? '#4CAF50' : '#FF6B6B',
                            opacity: notification.isRead ? 0.6 : 1
                          }
                        ]}>
                          <Ionicons 
                            name={notification.type === 'payment' ? 'checkmark-circle' : 'information-circle'} 
                            size={28} 
                            color="#FFFFFF" 
                          />
                        </View>
                        {!notification.isRead && (
                          <View style={styles.unreadIndicator} />
                        )}
                      </View>

                      {/* Notification Content */}
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={[
                            styles.notificationTitle,
                            !notification.isRead && styles.unreadTitle
                          ]}>
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {formatNotificationDate(notification.createdAt)}
                          </Text>
                        </View>
                        
                        <Text style={styles.notificationMessage}>
                          {notification.message}
                        </Text>

                        {notification.amount && (
                          <View style={styles.notificationMeta}>
                            <View style={styles.metaItem}>
                              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                              <Text style={styles.metaText}>{notification.month}</Text>
                            </View>
                            <View style={styles.metaItem}>
                              <Ionicons name="cash-outline" size={14} color="#8E8E93" />
                              <Text style={styles.metaText}>PKR {notification.amount.toLocaleString()}</Text>
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Delete Button */}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Notification',
                            'Are you sure you want to delete this notification?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => deleteNotification(notification._id)
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.notificationFooter}>
                    <Text style={styles.footerText}>
                      {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  duesCard: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  duesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  duesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  duesAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  duesDetails: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 4,
  },
  duesNote: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
  },
  updateButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginTop: 4,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginLeft: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 16,
    paddingVertical: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
  },
  paymentAmount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  paymentDate: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    marginBottom: 12,
  },
  contactDuesText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // FIXED Notification Modal Styles
  notificationModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  notificationModalHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginLeft: 12,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllReadText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 6,
  },
  closeModalButton: {
    padding: 4,
  },
  notificationList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  notificationListContent: {
    paddingBottom: 100,
    backgroundColor: '#FFFFFF',
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyNotificationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginBottom: 8,
  },
  emptyNotificationsText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationItem: {
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  unreadNotification: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 14,
  },
  notificationIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#000000',
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#5C5C5C',
    lineHeight: 20,
    marginBottom: 10,
  },
  notificationMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#5C5C5C',
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  notificationFooter: {
    paddingVertical: 20,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
});