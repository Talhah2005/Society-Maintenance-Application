// screens/AdminDashboard.js - Complete with Edit Profile functionality
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
  Modal,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function AdminDashboard({ navigation, onLogout }) {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [duesOverview, setDuesOverview] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Modals
  const [addTeamModalVisible, setAddTeamModalVisible] = useState(false);
  const [yearlyReportModalVisible, setYearlyReportModalVisible] = useState(false);
  const [monthDetailsModalVisible, setMonthDetailsModalVisible] = useState(false);
  const [collectedPaymentsModalVisible, setCollectedPaymentsModalVisible] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [editTeamModalVisible, setEditTeamModalVisible] = useState(false);
  
  // Data states
  const [yearlyReportData, setYearlyReportData] = useState(null);
  const [monthDetailsData, setMonthDetailsData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [collectedPaymentsData, setCollectedPaymentsData] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  
  const [teamForm, setTeamForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    nic: '',
    password: '',
    confirmPassword: ''
  });

  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    houseNo: '',
    floor: '',
    nic: '',
    status: 'Owner',
    carRegistrationNo: '',
    motorcycleRegNo: '',
  });

  const [editTeamForm, setEditTeamForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    nic: '',
  });

  useEffect(() => {
    fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      const [statsResponse, usersResponse, teamResponse, duesResponse, yearsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/dashboard-stats`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/admin/users`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/admin/team-members`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/admin/dues-overview`, { method: 'GET', headers }),
        fetch(`${API_BASE_URL}/admin/available-years`, { method: 'GET', headers })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDashboardStats(statsData);
      }

      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        setUsers(userData);
        setFilteredUsers(userData);
      }

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData);
      }

      if (duesResponse.ok) {
        const duesData = await duesResponse.json();
        setDuesOverview(duesData);
      }

      if (yearsResponse.ok) {
        const yearsData = await yearsResponse.json();
        setAvailableYears(yearsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Network error occurred while fetching data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchYearlyReport = async (year) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/yearly-report/${year}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const reportData = await response.json();
        setYearlyReportData(reportData);
        setYearlyReportModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch yearly report');
      }
    } catch (error) {
      console.error('Error fetching yearly report:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const fetchMonthDetails = async (month, year) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/month-details/${year}/${month}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const monthData = await response.json();
        setMonthDetailsData(monthData);
        setSelectedMonth(`${month} ${year}`);
        setMonthDetailsModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch month details');
      }
    } catch (error) {
      console.error('Error fetching month details:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const fetchCollectedPayments = async (year) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/admin/collected-payments/${year}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const collectedData = await response.json();
        setCollectedPaymentsData(collectedData);
        setCollectedPaymentsModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to fetch collected payments');
      }
    } catch (error) {
      console.error('Error fetching collected payments:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      whatsappNumber: user.whatsappNumber || '',
      houseNo: user.houseNo || '',
      floor: user.floor || '',
      nic: user.nic || '',
      status: user.status || 'Owner',
      carRegistrationNo: user.carRegistrationNo || '',
      motorcycleRegNo: user.motorcycleRegNo || '',
    });
    setEditUserModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/admin/update-user/${selectedUser._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editUserForm),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'User updated successfully', [
          { text: 'OK', onPress: () => {
            setEditUserModalVisible(false);
            fetchAllData();
          }}
        ]);
      } else {
        Alert.alert('Error', data.msg || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleEditTeamMember = (member) => {
    setSelectedTeamMember(member);
    setEditTeamForm({
      name: member.name || '',
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      nic: member.nic || '',
    });
    setEditTeamModalVisible(true);
  };

  const handleUpdateTeamMember = async () => {
    if (!editTeamForm.name || !editTeamForm.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/admin/update-team/${selectedTeamMember._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editTeamForm),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Team member updated successfully', [
          { text: 'OK', onPress: () => {
            setEditTeamModalVisible(false);
            fetchAllData();
          }}
        ]);
      } else {
        Alert.alert('Error', data.msg || 'Failed to update team member');
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      Alert.alert('Error', 'Network error occurred');
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
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
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

  const handleAddTeamMember = async () => {
    if (!teamForm.name || !teamForm.email || !teamForm.phoneNumber || !teamForm.nic || !teamForm.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (teamForm.password !== teamForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const nicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (!nicPattern.test(teamForm.nic)) {
      Alert.alert('Error', 'NIC format should be XXXXX-XXXXXXX-X');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/admin/add-team`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: teamForm.name,
          email: teamForm.email,
          phoneNumber: teamForm.phoneNumber,
          nic: teamForm.nic,
          password: teamForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          'Team member added successfully. A verification email has been sent to their email address.',
          [{ text: 'OK', onPress: () => {
            setTeamForm({
              name: '',
              email: '',
              phoneNumber: '',
              nic: '',
              password: '',
              confirmPassword: ''
            });
            setAddTeamModalVisible(false);
            fetchAllData();
          }}]
        );
      } else {
        Alert.alert('Error', data.msg || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUser(user._id) }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/admin/delete-user/${userId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'User deleted successfully');
        fetchAllData();
      } else {
        Alert.alert('Error', data.msg || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleDeleteTeamMember = (teamMember) => {
    Alert.alert(
      'Delete Team Member',
      `Are you sure you want to delete ${teamMember.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTeamMember(teamMember._id) }
      ]
    );
  };

  const deleteTeamMember = async (teamMemberId) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/admin/delete-team/${teamMemberId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Team member deleted successfully');
        fetchAllData();
      } else {
        Alert.alert('Error', data.msg || 'Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const renderDashboardTab = () => (
    <ScrollView style={styles.tabContent}>
      {dashboardStats && (
        <>
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Collection Overview</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="cash" size={32} color="#FFFFFF" />
                <Text style={[styles.statTitle, { color: '#FFFFFF' }]}>Total Collected</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>
                  PKR {dashboardStats.yearlyStats.totalCollected.toLocaleString()}
                </Text>
                <Text style={[styles.statSubtitle, { color: '#FFFFFF' }]}>
                  {dashboardStats.yearlyStats.year}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="alert-circle" size={32} color="#FFFFFF" />
                <Text style={[styles.statTitle, { color: '#FFFFFF' }]}>Outstanding</Text>
                <Text style={[styles.statValue, { color: '#FFFFFF' }]}>
                  PKR {dashboardStats.yearlyStats.totalOutstanding.toLocaleString()}
                </Text>
                <Text style={[styles.statSubtitle, { color: '#FFFFFF' }]}>
                  {dashboardStats.yearlyStats.overdueUsers} users
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>This Month - {dashboardStats.currentMonth}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-done" size={28} color="#4CAF50" />
                <Text style={styles.statTitle}>Paid</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {dashboardStats.currentMonthStats.paid}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="time" size={28} color="#FF6B6B" />
                <Text style={styles.statTitle}>Due</Text>
                <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                  {dashboardStats.currentMonthStats.due}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={28} color="#FF6B6B" />
                <Text style={styles.statTitle}>Collection Rate</Text>
                <Text style={styles.statValue}>
                  {dashboardStats.currentMonthStats.collectionRate}%
                </Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="people" size={28} color="#FF6B6B" />
                <Text style={styles.statTitle}>Total Users</Text>
                <Text style={styles.statValue}>
                  {dashboardStats.totalUsers}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => fetchYearlyReport(dashboardStats.yearlyStats.year)}
              >
                <Ionicons name="bar-chart" size={24} color="#FF6B6B" />
                <Text style={styles.actionButtonText}>Yearly Report</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setActiveTab('dues')}
              >
                <Ionicons name="warning" size={24} color="#FF6B6B" />
                <Text style={styles.actionButtonText}>View Dues</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderUsersTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.contentCard}>
        <View style={styles.contentHeader}>
          <Ionicons name="people-outline" size={24} color="#FF6B6B" />
          <Text style={styles.contentTitle}>Users ({filteredUsers.length})</Text>
        </View>

        {filteredUsers.length === 0 ? (
          <Text style={styles.noDataText}>No users found</Text>
        ) : (
          filteredUsers.map((user, index) => (
            <View key={user._id || index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{user.name}</Text>
                <Text style={styles.itemDetails}>
                  House {user.houseNo} • {user.floor} Floor • {user.email}
                </Text>
                <Text style={styles.itemPhone}>
                  {user.whatsappNumber || user.phoneNumber}
                </Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditUser(user)}
                >
                  <Ionicons name="create" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteUser(user)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderTeamTab = () => (
    <ScrollView style={styles.tabContent}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setAddTeamModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Team Member</Text>
      </TouchableOpacity>

      <View style={styles.contentCard}>
        <View style={styles.contentHeader}>
          <Ionicons name="shield-outline" size={24} color="#FF6B6B" />
          <Text style={styles.contentTitle}>Team Members ({teamMembers.length})</Text>
        </View>

        {teamMembers.length === 0 ? (
          <Text style={styles.noDataText}>No team members found</Text>
        ) : (
          teamMembers.map((member, index) => (
            <View key={member._id || index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <View style={styles.memberNameRow}>
                  <Text style={styles.itemName}>{member.name}</Text>
                  {!member.verified && (
                    <View style={styles.unverifiedBadge}>
                      <Text style={styles.unverifiedText}>Unverified</Text>
                    </View>
                  )}
                  {member.verified && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={{marginLeft: 8}} />
                  )}
                </View>
                <Text style={styles.itemDetails}>
                  {member.email} • {member.phoneNumber}
                </Text>
                <Text style={styles.itemNIC}>NIC: {member.nic}</Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditTeamMember(member)}
                >
                  <Ionicons name="create" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTeamMember(member)}
                >
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderDuesTab = () => (
    <ScrollView style={styles.tabContent}>
      {duesOverview && (
        <>
          <View style={styles.duesSummarySection}>
            <Text style={styles.sectionTitle}>Dues Summary</Text>
            
            <View style={styles.duesSummaryGrid}>
              <View style={[styles.duesSummaryCard, { backgroundColor: '#FF6B6B' }]}>
                <Ionicons name="alert-circle-outline" size={36} color="#FFFFFF" />
                <Text style={styles.duesSummaryLabel}>Total Pending</Text>
                <Text style={styles.duesSummaryValue}>
                  PKR {duesOverview.summary.totalPendingDues.toLocaleString()}
                </Text>
                <Text style={styles.duesSummarySubtext}>
                  {duesOverview.summary.totalUsersWithDues} users
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.duesSummaryCard, { backgroundColor: '#4CAF50' }]}
                onPress={() => fetchCollectedPayments(new Date().getFullYear())}
              >
                <Ionicons name="checkmark-circle-outline" size={36} color="#FFFFFF" />
                <Text style={styles.duesSummaryLabel}>Total Collected</Text>
                <Text style={styles.duesSummaryValue}>
                  PKR {duesOverview.summary.totalCollected.toLocaleString()}
                </Text>
                <Text style={styles.duesSummarySubtext}>
                  From {duesOverview.summary.totalUsers} users
                </Text>
                <Text style={styles.clickToViewText}>Tap to view details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.duesInfoCard}>
              <View style={styles.duesInfoRow}>
                <Text style={styles.duesInfoLabel}>Monthly Fee:</Text>
                <Text style={styles.duesInfoValue}>
                  PKR {duesOverview.summary.monthlyFee.toLocaleString()}
                </Text>
              </View>
              <View style={styles.duesInfoRow}>
                <Text style={styles.duesInfoLabel}>Total Users:</Text>
                <Text style={styles.duesInfoValue}>{duesOverview.summary.totalUsers}</Text>
              </View>
              <View style={styles.duesInfoRow}>
                <Text style={styles.duesInfoLabel}>Users with Dues:</Text>
                <Text style={[styles.duesInfoValue, { color: '#FF6B6B', fontWeight: 'bold' }]}>
                  {duesOverview.summary.totalUsersWithDues}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.duesListSection}>
            <View style={styles.duesListHeader}>
              <Ionicons name="list-outline" size={24} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Users with Pending Dues</Text>
            </View>

            {duesOverview.usersWithDues.length === 0 ? (
              <View style={styles.noDuesCard}>
                <Ionicons name="checkmark-done-circle" size={64} color="#4CAF50" />
                <Text style={styles.noDuesText}>All Dues Collected!</Text>
                <Text style={styles.noDuesSubtext}>
                  No users have pending dues at this time.
                </Text>
              </View>
            ) : (
              duesOverview.usersWithDues.map((user, index) => (
                <View key={user._id} style={styles.duesUserCard}>
                  <View style={styles.duesUserHeader}>
                    <View style={styles.duesUserInfo}>
                      <Text style={styles.duesUserName}>{user.name}</Text>
                      <Text style={styles.duesUserHouse}>House {user.houseNo} • {user.floor} Floor</Text>
                    </View>
                    <View style={styles.duesAmountContainer}>
                      <Text style={styles.duesAmount}>
                        PKR {user.totalDues.toLocaleString()}
                      </Text>
                      <Text style={styles.duesMonths}>{user.monthsUnpaid} months</Text>
                    </View>
                  </View>

                  <View style={styles.duesUserDetails}>
                    <View style={styles.duesDetailRow}>
                      <Ionicons name="mail-outline" size={16} color="#8E8E93" />
                      <Text style={styles.duesDetailText}>{user.email}</Text>
                    </View>
                    <View style={styles.duesDetailRow}>
                      <Ionicons name="call-outline" size={16} color="#8E8E93" />
                      <Text style={styles.duesDetailText}>
                        {user.whatsappNumber || user.phoneNumber}
                      </Text>
                    </View>
                    {user.lastPaymentDate && (
                      <View style={styles.duesDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                        <Text style={styles.duesDetailText}>
                          Last Payment: {new Date(user.lastPaymentDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {user.unpaidMonths && user.unpaidMonths.length > 0 && (
                    <View style={styles.unpaidMonthsContainer}>
                      <Text style={styles.unpaidMonthsLabel}>Unpaid Months:</Text>
                      <View style={styles.unpaidMonthsTags}>
                        {user.unpaidMonths.slice(0, 3).map((month, idx) => (
                          <View key={idx} style={styles.monthTag}>
                            <Text style={styles.monthTagText}>{month}</Text>
                          </View>
                        ))}
                        {user.unpaidMonths.length > 3 && (
                          <View style={styles.monthTag}>
                            <Text style={styles.monthTagText}>
                              +{user.unpaidMonths.length - 3} more
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );

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
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Admin Portal</Text>
                <Text style={styles.currentMonth}>
                  {dashboardStats ? dashboardStats.currentMonth : 'Loading...'}
                </Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
              onPress={() => setActiveTab('dashboard')}
            >
              <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
                Dashboard
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'users' && styles.activeTab]}
              onPress={() => setActiveTab('users')}
            >
              <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
                Users ({users.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'team' && styles.activeTab]}
              onPress={() => setActiveTab('team')}
            >
              <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>
                Team ({teamMembers.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'dues' && styles.activeTab]}
              onPress={() => setActiveTab('dues')}
            >
              <Text style={[styles.tabText, activeTab === 'dues' && styles.activeTabText]}>
                Dues {duesOverview && duesOverview.summary.totalUsersWithDues > 0 ? `(${duesOverview.summary.totalUsersWithDues})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'team' && renderTeamTab()}
          {activeTab === 'dues' && renderDuesTab()}
        </ScrollView>

        {/* Edit User Modal */}
        <Modal
          visible={editUserModalVisible}
          animationType="slide"
          onRequestClose={() => setEditUserModalVisible(false)}
        >
          <SafeAreaView style={styles.fullScreenModal}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalTopTitle}>Edit User Profile</Text>
              <TouchableOpacity 
                onPress={() => setEditUserModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollArea} contentContainerStyle={{paddingBottom: 50}}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.name}
                  onChangeText={(value) => setEditUserForm({...editUserForm, name: value})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.email}
                  onChangeText={(value) => setEditUserForm({...editUserForm, email: value})}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.phoneNumber}
                  onChangeText={(value) => setEditUserForm({...editUserForm, phoneNumber: value})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>WhatsApp Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.whatsappNumber}
                  onChangeText={(value) => setEditUserForm({...editUserForm, whatsappNumber: value})}
                  placeholder="Enter WhatsApp number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>House No</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.houseNo}
                  onChangeText={(value) => setEditUserForm({...editUserForm, houseNo: value})}
                  placeholder="Enter house number"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Floor</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.floor}
                  onChangeText={(value) => setEditUserForm({...editUserForm, floor: value})}
                  placeholder="Enter floor"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>NIC #</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.nic}
                  onChangeText={(value) => setEditUserForm({...editUserForm, nic: value})}
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Car Registration No</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.carRegistrationNo}
                  onChangeText={(value) => setEditUserForm({...editUserForm, carRegistrationNo: value})}
                  placeholder="Enter car registration"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Motorcycle Reg No</Text>
                <TextInput
                  style={styles.formInput}
                  value={editUserForm.motorcycleRegNo}
                  onChangeText={(value) => setEditUserForm({...editUserForm, motorcycleRegNo: value})}
                  placeholder="Enter motorcycle registration"
                />
              </View>

              <TouchableOpacity 
                style={styles.formSubmitBtn} 
                onPress={handleUpdateUser}
              >
                <Text style={styles.formSubmitText}>Update User</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit Team Member Modal */}
        <Modal
          visible={editTeamModalVisible}
          animationType="slide"
          onRequestClose={() => setEditTeamModalVisible(false)}
        >
          <SafeAreaView style={styles.fullScreenModal}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalTopTitle}>Edit Team Member</Text>
              <TouchableOpacity 
                onPress={() => setEditTeamModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollArea} contentContainerStyle={{paddingBottom: 50}}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editTeamForm.name}
                  onChangeText={(value) => setEditTeamForm({...editTeamForm, name: value})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editTeamForm.email}
                  onChangeText={(value) => setEditTeamForm({...editTeamForm, email: value})}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editTeamForm.phoneNumber}
                  onChangeText={(value) => setEditTeamForm({...editTeamForm, phoneNumber: value})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>NIC #</Text>
                <TextInput
                  style={styles.formInput}
                  value={editTeamForm.nic}
                  onChangeText={(value) => setEditTeamForm({...editTeamForm, nic: value})}
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </View>

              <TouchableOpacity 
                style={styles.formSubmitBtn} 
                onPress={handleUpdateTeamMember}
              >
                <Text style={styles.formSubmitText}>Update Team Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add Team Member Modal */}
        <Modal
          visible={addTeamModalVisible}
          animationType="slide"
          onRequestClose={() => setAddTeamModalVisible(false)}
        >
          <SafeAreaView style={styles.fullScreenModal}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalTopTitle}>Add Team Member</Text>
              <TouchableOpacity 
                onPress={() => setAddTeamModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollArea} contentContainerStyle={{paddingBottom: 50}}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={teamForm.name}
                  onChangeText={(value) => setTeamForm({...teamForm, name: value})}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={styles.formInput}
                  value={teamForm.email}
                  onChangeText={(value) => setTeamForm({...teamForm, email: value})}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={teamForm.phoneNumber}
                  onChangeText={(value) => setTeamForm({...teamForm, phoneNumber: value})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>NIC # *</Text>
                <TextInput
                  style={styles.formInput}
                  value={teamForm.nic}
                  onChangeText={(value) => setTeamForm({...teamForm, nic: value})}
                  placeholder="XXXXX-XXXXXXX-X"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Password *</Text>
                <TextInput
                  style={styles.formInput}
                  value={teamForm.password}
                  onChangeText={(value) => setTeamForm({...teamForm, password: value})}
                  placeholder="Enter password"
                  secureTextEntry
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Confirm Password *</Text>
                <TextInput
                  style={styles.formInput}
                  value={teamForm.confirmPassword}
                  onChangeText={(value) => setTeamForm({...teamForm, confirmPassword: value})}
                  placeholder="Confirm password"
                  secureTextEntry
                />
              </View>

              <View style={styles.verificationNotice}>
                <Ionicons name="information-circle" size={20} color="#2196F3" />
                <Text style={styles.verificationNoticeText}>
                  A verification email will be sent to the team member. They must verify their email before they can login.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.formSubmitBtn} 
                onPress={handleAddTeamMember}
              >
                <Text style={styles.formSubmitText}>Add Team Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Yearly Report Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={yearlyReportModalVisible}
          onRequestClose={() => setYearlyReportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentImproved}>
              <View style={styles.modalHeaderImproved}>
                <Text style={styles.modalTitle}>Yearly Report {selectedYear}</Text>
                <TouchableOpacity onPress={() => setYearlyReportModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {yearlyReportData && (
                <ScrollView style={styles.reportContent}>
                  <View style={styles.yearSelector}>
                    <Text style={styles.sectionTitleDark}>Select Year</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearButtons}>
                      {availableYears.map((yearData, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.yearButton,
                            yearData.year === selectedYear && styles.selectedYearButton
                          ]}
                          onPress={() => {
                            setSelectedYear(yearData.year);
                            fetchYearlyReport(yearData.year);
                          }}
                        >
                          <Text style={[
                            styles.yearButtonText,
                            yearData.year === selectedYear && styles.selectedYearButtonText
                          ]}>
                            {yearData.year}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.reportSummary}>
                    <Text style={styles.sectionTitleDark}>Summary</Text>
                    <View style={styles.summaryGrid}>
                      <TouchableOpacity 
                        style={styles.summaryItem}
                        onPress={() => fetchCollectedPayments(selectedYear)}
                      >
                        <Text style={styles.summaryLabel}>Total Collection</Text>
                        <Text style={styles.summaryValue}>
                          PKR {yearlyReportData.totalAmount.toLocaleString()}
                        </Text>
                        <Text style={styles.tapToViewSmall}>Tap to view</Text>
                      </TouchableOpacity>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Collection Rate</Text>
                        <Text style={styles.summaryValue}>
                          {yearlyReportData.summary.collectionRate}%
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Payments</Text>
                        <Text style={styles.summaryValue}>
                          {yearlyReportData.summary.totalPayments}
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Monthly Average</Text>
                        <Text style={styles.summaryValue}>
                          PKR {yearlyReportData.summary.averageCollection.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.monthlyBreakdown}>
                    <Text style={styles.sectionTitleDark}>Monthly Breakdown</Text>
                    <Text style={styles.tapInstructionText}>Tap on any month to view payment details</Text>
                    {yearlyReportData.monthlyBreakdown.map((month, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.monthRowClickable}
                        onPress={() => fetchMonthDetails(month.month, selectedYear)}
                      >
                        <Text style={styles.monthName}>{month.month}</Text>
                        <View style={styles.monthStats}>
                          <Text style={styles.monthAmount}>
                            PKR {month.amount.toLocaleString()}
                          </Text>
                          <Text style={styles.monthPayments}>
                            {month.paymentsCount} payments
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Month Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={monthDetailsModalVisible}
          onRequestClose={() => setMonthDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentImproved}>
              <View style={styles.modalHeaderImproved}>
                <Text style={styles.modalTitle}>Payment Details - {selectedMonth}</Text>
                <TouchableOpacity onPress={() => setMonthDetailsModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {monthDetailsData && (
                <ScrollView style={styles.reportContent}>
                  <View style={styles.monthDetailsSummary}>
                    <View style={styles.monthSummaryCard}>
                      <Text style={styles.monthSummaryLabel}>Total Collected</Text>
                      <Text style={styles.monthSummaryValue}>
                        PKR {monthDetailsData.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.monthSummaryCard}>
                      <Text style={styles.monthSummaryLabel}>Total Payments</Text>
                      <Text style={styles.monthSummaryValue}>
                        {monthDetailsData.paymentsCount}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitleDark}>Users Who Paid</Text>
                  {monthDetailsData.users.length === 0 ? (
                    <Text style={styles.noDataText}>No payments received this month</Text>
                  ) : (
                    monthDetailsData.users.map((user, index) => (
                      <View key={index} style={styles.userPaymentCard}>
                        <View style={styles.userPaymentHeader}>
                          <Text style={styles.userPaymentName}>{user.name}</Text>
                          <Text style={styles.userPaymentAmount}>
                            PKR {user.amount.toLocaleString()}
                          </Text>
                        </View>
                        <Text style={styles.userPaymentDetails}>
                          House {user.houseNo} • {user.email}
                        </Text>
                        <Text style={styles.userPaymentDate}>
                          Paid on: {new Date(user.paidDate).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Collected Payments Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={collectedPaymentsModalVisible}
          onRequestClose={() => setCollectedPaymentsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentImproved}>
              <View style={styles.modalHeaderImproved}>
                <Text style={styles.modalTitle}>Collected Payments {selectedYear}</Text>
                <TouchableOpacity onPress={() => setCollectedPaymentsModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {collectedPaymentsData && (
                <ScrollView style={styles.reportContent}>
                  <View style={styles.collectedSummary}>
                    <View style={[styles.summaryCard, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="cash-outline" size={32} color="#FFFFFF" />
                      <Text style={[styles.summaryCardLabel, { color: '#FFFFFF' }]}>
                        Total Collected
                      </Text>
                      <Text style={[styles.summaryCardValue, { color: '#FFFFFF' }]}>
                        PKR {collectedPaymentsData.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#2196F3' }]}>
                      <Ionicons name="people-outline" size={32} color="#FFFFFF" />
                      <Text style={[styles.summaryCardLabel, { color: '#FFFFFF' }]}>
                        Total Payments
                      </Text>
                      <Text style={[styles.summaryCardValue, { color: '#FFFFFF' }]}>
                        {collectedPaymentsData.totalPayments}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitleDark}>Payment Breakdown by User</Text>
                  {collectedPaymentsData.users.map((user, index) => (
                    <View key={index} style={styles.collectedUserCard}>
                      <View style={styles.collectedUserHeader}>
                        <View>
                          <Text style={styles.collectedUserName}>{user.name}</Text>
                          <Text style={styles.collectedUserHouse}>House {user.houseNo}</Text>
                        </View>
                        <View style={styles.collectedUserStats}>
                          <Text style={styles.collectedUserAmount}>
                            PKR {user.totalPaid.toLocaleString()}
                          </Text>
                          <Text style={styles.collectedUserMonths}>
                            {user.monthsPaid} month(s)
                          </Text>
                        </View>
                      </View>
                      <View style={styles.collectedMonthsList}>
                        <Text style={styles.collectedMonthsLabel}>Paid Months:</Text>
                        <View style={styles.collectedMonthsTags}>
                          {user.paidMonths.slice(0, 6).map((month, idx) => (
                            <View key={idx} style={styles.paidMonthTag}>
                              <Text style={styles.paidMonthTagText}>{month}</Text>
                            </View>
                          ))}
                          {user.paidMonths.length > 6 && (
                            <Text style={styles.moreMonthsText}>
                              +{user.paidMonths.length - 6} more
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C2C2E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C2C2E' },
  loadingText: { color: '#FFFFFF', marginTop: 16, fontSize: 16 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: '#FFFFFF', fontSize: 16, opacity: 0.8 },
  currentMonth: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#FF6B6B', padding: 12, borderRadius: 12, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FF6B6B' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#8E8E93', textAlign: 'center' },
  activeTabText: { color: '#FFFFFF' },
  tabContent: { flex: 1 },
  statsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  sectionTitleDark: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2E', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', width: '48%', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  statTitle: { fontSize: 14, color: '#8E8E93', marginTop: 8, fontWeight: '500', textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2E', marginTop: 4, textAlign: 'center' },
  statSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2, textAlign: 'center' },
  actionsSection: { marginBottom: 20 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  actionButtonText: { color: '#FF6B6B', fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  searchContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#2C2C2E' },
  addButton: { backgroundColor: '#FF6B6B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  contentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  contentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  contentTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2E', marginLeft: 8 },
  noDataText: { textAlign: 'center', color: '#8E8E93', fontSize: 16, paddingVertical: 20 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', borderRadius: 8, marginBottom: 8 },
  itemInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#2C2C2E' },
  unverifiedBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  unverifiedText: { fontSize: 10, color: '#856404', fontWeight: '600' },
  itemDetails: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  itemPhone: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  itemNIC: { fontSize: 12, color: '#A0A0A0', marginTop: 2 },
  actionButtonsRow: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#2196F3', padding: 8, borderRadius: 8 },
  deleteButton: { backgroundColor: '#FF6B6B', padding: 8, borderRadius: 8 },
  duesSummarySection: { marginBottom: 24 },
  duesSummaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  duesSummaryCard: { width: '48%', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  duesSummaryLabel: { fontSize: 13, color: '#FFFFFF', marginTop: 8, fontWeight: '500', textAlign: 'center' },
  duesSummaryValue: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginTop: 8, textAlign: 'center' },
  duesSummarySubtext: { fontSize: 12, color: '#FFFFFF', opacity: 0.9, marginTop: 4, textAlign: 'center' },
  clickToViewText: { fontSize: 11, color: '#FFFFFF', opacity: 0.8, marginTop: 8, fontStyle: 'italic' },
  duesInfoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  duesInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  duesInfoLabel: { fontSize: 15, color: '#2C2C2E', fontWeight: '500' },
  duesInfoValue: { fontSize: 15, color: '#2C2C2E', fontWeight: '600' },
  duesListSection: { marginBottom: 20 },
  duesListHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  noDuesCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  noDuesText: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50', marginTop: 16 },
  noDuesSubtext: { fontSize: 14, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  duesUserCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#FF6B6B', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  duesUserHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  duesUserInfo: { flex: 1 },
  duesUserName: { fontSize: 17, fontWeight: 'bold', color: '#2C2C2E' },
  duesUserHouse: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  duesAmountContainer: { alignItems: 'flex-end' },
  duesAmount: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B' },
  duesMonths: { fontSize: 12, color: '#FF6B6B', marginTop: 2 },
  duesUserDetails: { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  duesDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  duesDetailText: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },
  unpaidMonthsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  unpaidMonthsLabel: { fontSize: 13, fontWeight: '600', color: '#2C2C2E', marginBottom: 8 },
  unpaidMonthsTags: { flexDirection: 'row', flexWrap: 'wrap' },
  monthTag: { backgroundColor: '#FFE5E5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  monthTagText: { fontSize: 11, color: '#FF6B6B', fontWeight: '500' },
  fullScreenModal: { flex: 1, backgroundColor: '#FFFFFF' },
  modalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F8F8F8', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTopTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C2C2E' },
  modalCloseBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FF6B6B', borderRadius: 6 },
  modalCloseText: { color: '#FFFFFF', fontWeight: '600' },
  modalScrollArea: { flex: 1, padding: 20 },
  formField: { marginBottom: 20 },
  formLabel: { fontSize: 16, fontWeight: '600', color: '#2C2C2E', marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#FFFFFF', color: '#2C2C2E' },
  verificationNotice: { flexDirection: 'row', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, marginTop: 10, marginBottom: 20 },
  verificationNoticeText: { flex: 1, fontSize: 13, color: '#1976D2', marginLeft: 8, lineHeight: 18 },
  formSubmitBtn: { backgroundColor: '#FF6B6B', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 20 },
  formSubmitText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end', paddingTop: 60 },
  modalContentImproved: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
  modalHeaderImproved: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C2C2E' },
  reportContent: { padding: 20 },
  yearSelector: { marginBottom: 20 },
  yearButtons: { flexDirection: 'row' },
  yearButton: { backgroundColor: '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  selectedYearButton: { backgroundColor: '#FF6B6B' },
  yearButtonText: { color: '#2C2C2E', fontSize: 14, fontWeight: '600' },
  selectedYearButtonText: { color: '#FFFFFF' },
  reportSummary: { marginBottom: 24 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  summaryItem: { width: '48%', backgroundColor: '#F8F8F9', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#8E8E93', textAlign: 'center', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2E', textAlign: 'center' },
  tapToViewSmall: { fontSize: 10, color: '#2196F3', marginTop: 4, fontStyle: 'italic' },
  monthlyBreakdown: { marginBottom: 20 },
  tapInstructionText: { fontSize: 13, color: '#8E8E93', marginBottom: 12, fontStyle: 'italic' },
  monthRowClickable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', borderRadius: 8, backgroundColor: '#F8F8F9', marginBottom: 8 },
  monthName: { fontSize: 16, color: '#2C2C2E', flex: 1, fontWeight: '500' },
  monthStats: { alignItems: 'flex-end', marginRight: 8 },
  monthAmount: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  monthPayments: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  monthDetailsSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  monthSummaryCard: { width: '48%', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 16, alignItems: 'center' },
  monthSummaryLabel: { fontSize: 13, color: '#1976D2', fontWeight: '500' },
  monthSummaryValue: { fontSize: 20, fontWeight: 'bold', color: '#1976D2', marginTop: 8 },
  userPaymentCard: { backgroundColor: '#F8F8F9', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  userPaymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userPaymentName: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2E' },
  userPaymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  userPaymentDetails: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  userPaymentDate: { fontSize: 12, color: '#8E8E93' },
  collectedSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  summaryCard: { width: '48%', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  summaryCardLabel: { fontSize: 13, fontWeight: '500', marginTop: 8, textAlign: 'center' },
  summaryCardValue: { fontSize: 22, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  collectedUserCard: { backgroundColor: '#F8F8F9', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  collectedUserHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  collectedUserName: { fontSize: 16, fontWeight: 'bold', color: '#2C2C2E' },
  collectedUserHouse: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  collectedUserStats: { alignItems: 'flex-end' },
  collectedUserAmount: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  collectedUserMonths: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  collectedMonthsList: { borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 12 },
  collectedMonthsLabel: { fontSize: 13, fontWeight: '600', color: '#2C2C2E', marginBottom: 8 },
  collectedMonthsTags: { flexDirection: 'row', flexWrap: 'wrap' },
  paidMonthTag: { backgroundColor: '#C8E6C9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 },
  paidMonthTagText: { fontSize: 11, color: '#2E7D32', fontWeight: '500' },
  moreMonthsText: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
});