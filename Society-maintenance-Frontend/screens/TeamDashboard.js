// screens/TeamDashboard.js - Updated with Outstanding Dues Section
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
  TextInput,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function TeamDashboard({ navigation, onLogout }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [duesModalVisible, setDuesModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'outstanding'

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    };
  };

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/team/users`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
        setFilteredUsers(userData);
        console.log('Users fetched for team:', userData.length);
      } else {
        console.error('Failed to fetch users:', response.status);
        Alert.alert('Error', 'Failed to load user data');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.houseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber.includes(searchQuery) ||
      user.whatsappNumber.includes(searchQuery)
    );
    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
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

  const getCurrentMonthStatus = (user) => {
    const currentMonth = getCurrentMonth();
    const paymentStatus = user.paymentStatus?.find(p => p.month === currentMonth);
    return paymentStatus?.status || 'Not Paid';
  };

  const handlePaymentConfirmation = (user, month = null) => {
    setSelectedUser(user);
    setSelectedMonth(month || getCurrentMonth());
    setConfirmModalVisible(true);
  };

  const handleViewOutstandingDues = (user) => {
    setSelectedUser(user);
    setDuesModalVisible(true);
  };

  const confirmPayment = async () => {
    if (!selectedUser || !selectedMonth) return;

    setProcessingPayment(true);
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/team/mark-paid`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: selectedUser._id,
          month: selectedMonth,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          `Payment marked as paid for ${selectedUser.name}. Confirmation email sent successfully!`
        );
        
        // Update local state
        const updatedUsers = users.map(user => {
          if (user._id === selectedUser._id) {
            const updatedPaymentStatus = user.paymentStatus?.map(p => 
              p.month === selectedMonth 
                ? { ...p, status: 'Paid', paidDate: new Date() }
                : p
            ) || [];
            
            if (!updatedPaymentStatus.find(p => p.month === selectedMonth)) {
              updatedPaymentStatus.push({
                month: selectedMonth,
                status: 'Paid',
                paidDate: new Date()
              });
            }
            
            return { ...user, paymentStatus: updatedPaymentStatus };
          }
          return user;
        });
        
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setDuesModalVisible(false);
      } else {
        Alert.alert('Error', data.msg || 'Failed to mark payment as paid');
      }
    } catch (error) {
      console.error('Error marking payment:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setProcessingPayment(false);
      setConfirmModalVisible(false);
      setSelectedUser(null);
      setSelectedMonth(null);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Paid' ? '#4CAF50' : '#FF6B6B';
  };

  const getStatusIcon = (status) => {
    return status === 'Paid' ? 'checkmark-circle' : 'close-circle';
  };

  const getPaidCount = () => {
    return filteredUsers.filter(user => getCurrentMonthStatus(user) === 'Paid').length;
  };

  const getDueCount = () => {
    return filteredUsers.filter(user => getCurrentMonthStatus(user) === 'Not Paid').length;
  };

  const getUsersWithOutstandingDues = () => {
    const currentMonth = getCurrentMonth();
    
    return filteredUsers.filter(user => {
      const unpaidMonths = user.unpaidMonths || [];
      // Exclude current month from outstanding dues
      const pastDueMonths = unpaidMonths.filter(month => month !== currentMonth);
      return pastDueMonths.length > 0;
    }).map(user => {
      const unpaidMonths = user.unpaidMonths || [];
      const pastDueMonths = unpaidMonths.filter(month => month !== currentMonth);
      return {
        ...user,
        unpaidMonths: pastDueMonths,
        monthsUnpaid: pastDueMonths.length,
        totalDues: pastDueMonths.length * 3000
      };
    }).sort((a, b) => b.monthsUnpaid - a.monthsUnpaid);
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading collection data...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const usersWithDues = getUsersWithOutstandingDues();
  const displayUsers = activeTab === 'current' ? filteredUsers : usersWithDues;

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
                <Text style={styles.welcomeText}>Collection Portal</Text>
                <Text style={styles.currentMonth}>{getCurrentMonth()}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'current' && styles.activeTab]}
              onPress={() => setActiveTab('current')}
            >
              <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
                Current Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'outstanding' && styles.activeTab]}
              onPress={() => setActiveTab('outstanding')}
            >
              <Text style={[styles.tabText, activeTab === 'outstanding' && styles.activeTabText]}>
                Outstanding Dues ({usersWithDues.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, house no, or phone"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Summary Cards */}
          {activeTab === 'current' && (
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
                <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Collected</Text>
                <Text style={[styles.summaryValue, { color: '#FFFFFF' }]}>{getPaidCount()}</Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
                <Text style={[styles.summaryTitle, { color: '#FFFFFF' }]}>Pending</Text>
                <Text style={[styles.summaryValue, { color: '#FFFFFF' }]}>{getDueCount()}</Text>
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="home" size={32} color="#FF6B6B" />
                <Text style={styles.summaryTitle}>Total Houses</Text>
                <Text style={styles.summaryValue}>{filteredUsers.length}</Text>
              </View>
            </View>
          )}

          {activeTab === 'outstanding' && (
            <View style={styles.outstandingHeader}>
              <Ionicons name="warning" size={24} color="#FF6B6B" />
              <Text style={styles.outstandingHeaderText}>
                {usersWithDues.length} {usersWithDues.length === 1 ? 'house has' : 'houses have'} outstanding dues
              </Text>
            </View>
          )}

          {/* Users List */}
          <View style={styles.usersCard}>
            <View style={styles.usersHeader}>
              <Ionicons name="list-outline" size={24} color="#FF6B6B" />
              <Text style={styles.usersTitle}>
                {activeTab === 'current' ? `Collection List (${displayUsers.length})` : `Outstanding Dues (${displayUsers.length})`}
              </Text>
            </View>

            {displayUsers.length === 0 ? (
              <Text style={styles.noDataText}>
                {activeTab === 'current' ? 'No houses found' : 'No outstanding dues'}
              </Text>
            ) : (
              displayUsers.map((user, index) => {
                const currentStatus = getCurrentMonthStatus(user);
                const hasDues = user.monthsUnpaid > 0;
                
                return (
                  <View key={user._id || index} style={styles.userRow}>
                    <View style={styles.userInfo}>
                      <View style={styles.userMainInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userDetails}>
                          House {user.houseNo} • {user.floor} Floor
                        </Text>
                        <View style={styles.contactInfo}>
                          <Ionicons name="call" size={14} color="#8E8E93" />
                          <Text style={styles.phoneText}>{user.whatsappNumber || user.phoneNumber}</Text>
                        </View>
                        {activeTab === 'outstanding' && hasDues && (
                          <View style={styles.duesInfo}>
                            <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                            <Text style={styles.duesText}>
                              {user.monthsUnpaid} month(s) • PKR {user.totalDues?.toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.paymentSection}>
                      {activeTab === 'current' ? (
                        <>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
                            <Ionicons 
                              name={getStatusIcon(currentStatus)} 
                              size={16} 
                              color="#FFFFFF" 
                              style={styles.statusIcon}
                            />
                            <Text style={styles.statusText}>{currentStatus}</Text>
                          </View>

                          {currentStatus === 'Not Paid' && (
                            <TouchableOpacity
                              style={styles.collectButton}
                              onPress={() => handlePaymentConfirmation(user)}
                            >
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              <Text style={styles.collectButtonText}>Collected</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.viewDuesButton}
                          onPress={() => handleViewOutstandingDues(user)}
                        >
                          <Text style={styles.viewDuesButtonText}>View & Collect</Text>
                          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={confirmModalVisible}
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="help-circle" size={48} color="#FF6B6B" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Confirm Collection</Text>
              <Text style={styles.modalMessage}>
                Have you collected the maintenance bill from {selectedUser?.name} at House {selectedUser?.houseNo} for {selectedMonth}?
              </Text>
              <Text style={styles.modalWarning}>
                This will send a confirmation email to the resident.
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmPayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Yes, Collected</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Outstanding Dues Detail Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={duesModalVisible}
          onRequestClose={() => setDuesModalVisible(false)}
          statusBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setDuesModalVisible(false)}
            />
            <View style={styles.duesModalContent}>
              <View style={styles.duesModalHeader}>
                <View>
                  <Text style={styles.duesModalTitle}>{selectedUser?.name}</Text>
                  <Text style={styles.duesModalSubtitle}>House {selectedUser?.houseNo} • {selectedUser?.floor} Floor</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setDuesModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={32} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <View style={styles.duesModalSummary}>
                <Text style={styles.duesModalSummaryTitle}>Total Outstanding</Text>
                <Text style={styles.duesModalSummaryAmount}>PKR {selectedUser?.totalDues?.toLocaleString()}</Text>
                <Text style={styles.duesModalSummaryMonths}>{selectedUser?.monthsUnpaid} unpaid months</Text>
              </View>

              <ScrollView style={styles.duesModalList}>
                <Text style={styles.duesModalListTitle}>Unpaid Months:</Text>
                {selectedUser?.unpaidMonths?.map((month, index) => (
                  <View key={index} style={styles.duesMonthItem}>
                    <View style={styles.duesMonthInfo}>
                      <Text style={styles.duesMonthText}>{month}</Text>
                      <Text style={styles.duesMonthAmount}>PKR 3,000</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.duesMonthCollectButton}
                      onPress={() => {
                        setDuesModalVisible(false);
                        handlePaymentConfirmation(selectedUser, month);
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.duesMonthCollectText}>Collect</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
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
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  currentMonth: {
    color: '#FFFFFF',
    fontSize: 24,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#3A3A3C',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  outstandingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  outstandingHeaderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C2C2E',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginTop: 4,
  },
  usersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  usersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  usersTitle: {
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
  userRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfo: {
    marginBottom: 12,
  },
  userMainInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
  },
  userDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  duesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF3F3',
    padding: 8,
    borderRadius: 8,
  },
  duesText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 6,
  },
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  collectButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  collectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewDuesButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  viewDuesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#2C2C2E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#2C2C2E',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  duesModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    maxHeight: '75%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1,
  },
  duesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 4,
    marginTop: -4,
  },
  duesModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2E',
  },
  duesModalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  duesModalSummary: {
    backgroundColor: '#FFF3F3',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E0',
  },
  duesModalSummaryTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  duesModalSummaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  duesModalSummaryMonths: {
    fontSize: 16,
    color: '#8E8E93',
  },
  duesModalList: {
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
  },
  duesModalListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  duesMonthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  duesMonthInfo: {
    flex: 1,
  },
  duesMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2E',
  },
  duesMonthAmount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  duesMonthCollectButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  duesMonthCollectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});