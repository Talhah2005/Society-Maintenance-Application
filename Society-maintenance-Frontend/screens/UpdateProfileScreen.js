// screens/UpdateProfileScreen.js - Complete with all fields from RegisterScreen
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function UpdateProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phoneNumber: '', whatsappNumber: '',
    houseNo: '', floor: 'ground', nic: '', status: 'standalone owner',
    solorInstalled: false, SSGC_ID: '', KE_ID: '', KWSB_ID: '',
    tenant1: '', tenant2: '', tenant3: '', tenant4: ''
  });

  // Multiple vehicles state
  const [carRegistrations, setCarRegistrations] = useState(['']);
  const [motorcycleRegistrations, setMotorcycleRegistrations] = useState(['']);

  // House help with criminal records
  const [houseHelps, setHouseHelps] = useState([{ 
    name: '', nic: '', phoneNumber: '', hasCriminalRecord: false,
    policeCharacterCertificate: null
  }]);
  
  // Driver with criminal record
  const [driver, setDriver] = useState({ 
    name: '', nic: '', licenseNo: '', phoneNumber: '',
    hasCriminalRecord: false, policeCharacterCertificate: null
  });
  const [hasDriver, setHasDriver] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        navigation.goBack();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Set basic form data
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          whatsappNumber: data.whatsappNumber || '',
          houseNo: data.houseNo || '',
          floor: data.floor || 'ground',
          nic: data.nic || '',
          status: data.status || 'standalone owner',
          solorInstalled: data.solorInstalled || false,
          SSGC_ID: data.SSGC_ID || '',
          KE_ID: data.KE_ID || '',
          KWSB_ID: data.KWSB_ID || '',
          tenant1: data.tenantInfo?.tenant1 || '',
          tenant2: data.tenantInfo?.tenant2 || '',
          tenant3: data.tenantInfo?.tenant3 || '',
          tenant4: data.tenantInfo?.tenant4 || ''
        });

        // Set vehicle registrations
        if (data.carRegistrationNumbers && data.carRegistrationNumbers.length > 0) {
          setCarRegistrations(data.carRegistrationNumbers);
        }
        if (data.motorcycleRegistrationNumbers && data.motorcycleRegistrationNumbers.length > 0) {
          setMotorcycleRegistrations(data.motorcycleRegistrationNumbers);
        }

        // Set house helps with criminal record info
        if (data.houseHelp && data.houseHelp.length > 0) {
          setHouseHelps(data.houseHelp.map(help => ({
            name: help.name || '',
            nic: help.nic || '',
            phoneNumber: help.phoneNumber || '',
            hasCriminalRecord: help.hasCriminalRecord || false,
            policeCharacterCertificate: help.policeCharacterCertificate ? {
              name: help.policeCharacterCertificate.originalName,
              existing: true
            } : null
          })));
        }

        // Set driver info with criminal record
        if (data.driver) {
          setDriver({
            name: data.driver.name || '',
            nic: data.driver.nic || '',
            licenseNo: data.driver.licenseNo || '',
            phoneNumber: data.driver.phoneNumber || '',
            hasCriminalRecord: data.driver.hasCriminalRecord || false,
            policeCharacterCertificate: data.driver.policeCharacterCertificate ? {
              name: data.driver.policeCharacterCertificate.originalName,
              existing: true
            } : null
          });
          setHasDriver(true);
        }

      } else {
        Alert.alert('Error', 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Car registration functions
  const addCarRegistration = () => {
    if (carRegistrations.length < 10) {
      setCarRegistrations([...carRegistrations, '']);
    } else {
      Alert.alert('Limit Reached', 'Maximum 10 car registrations allowed');
    }
  };

  const removeCarRegistration = (index) => {
    if (carRegistrations.length > 1) {
      setCarRegistrations(carRegistrations.filter((_, i) => i !== index));
    }
  };

  const updateCarRegistration = (index, value) => {
    const newRegs = [...carRegistrations];
    newRegs[index] = value;
    setCarRegistrations(newRegs);
  };

  // Motorcycle registration functions
  const addMotorcycleRegistration = () => {
    if (motorcycleRegistrations.length < 10) {
      setMotorcycleRegistrations([...motorcycleRegistrations, '']);
    } else {
      Alert.alert('Limit Reached', 'Maximum 10 motorcycle registrations allowed');
    }
  };

  const removeMotorcycleRegistration = (index) => {
    if (motorcycleRegistrations.length > 1) {
      setMotorcycleRegistrations(motorcycleRegistrations.filter((_, i) => i !== index));
    }
  };

  const updateMotorcycleRegistration = (index, value) => {
    const newRegs = [...motorcycleRegistrations];
    newRegs[index] = value;
    setMotorcycleRegistrations(newRegs);
  };

  // House help functions
  const addHouseHelp = () => {
    if (houseHelps.length < 5) {
      setHouseHelps([...houseHelps, { 
        name: '', nic: '', phoneNumber: '', hasCriminalRecord: false,
        policeCharacterCertificate: null
      }]);
    } else {
      Alert.alert('Limit Reached', 'Maximum 5 house helps allowed');
    }
  };

  const removeHouseHelp = (index) => {
    if (houseHelps.length > 1) {
      setHouseHelps(houseHelps.filter((_, i) => i !== index));
    }
  };

  const updateHouseHelp = (index, field, value) => {
    const newHouseHelps = [...houseHelps];
    newHouseHelps[index][field] = value;
    
    if (field === 'hasCriminalRecord' && !value) {
      newHouseHelps[index].policeCharacterCertificate = null;
    }
    
    setHouseHelps(newHouseHelps);
  };

  const updateDriver = (field, value) => {
    setDriver(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'hasCriminalRecord' && !value) {
        updated.policeCharacterCertificate = null;
      }
      return updated;
    });
  };

  const pickDocumentForHouseHelp = async (index) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          Alert.alert('File Too Large', 'Certificate must be less than 5MB');
          return;
        }

        const newHouseHelps = [...houseHelps];
        newHouseHelps[index].policeCharacterCertificate = {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size,
          existing: false
        };
        setHouseHelps(newHouseHelps);
        Alert.alert('File Selected', `Selected: ${file.name}`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const removeDocumentForHouseHelp = (index) => {
    const newHouseHelps = [...houseHelps];
    newHouseHelps[index].policeCharacterCertificate = null;
    setHouseHelps(newHouseHelps);
  };

  const pickDocumentForDriver = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          Alert.alert('File Too Large', 'Certificate must be less than 5MB');
          return;
        }

        setDriver(prev => ({
          ...prev,
          policeCharacterCertificate: {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
            size: file.size,
            existing: false
          }
        }));
        Alert.alert('File Selected', `Selected: ${file.name}`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const removeDocumentForDriver = () => {
    setDriver(prev => ({ ...prev, policeCharacterCertificate: null }));
  };

  const validateForm = () => {
    const { name, email, whatsappNumber, houseNo, nic, status, floor } = formData;
    
    if (!name || !email || !whatsappNumber || !houseNo || !nic || !status || !floor || formData.solorInstalled === undefined) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    const nicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (!nicPattern.test(nic)) {
      Alert.alert('Error', 'NIC format should be XXXXX-XXXXXXX-X');
      return false;
    }

    for (let i = 0; i < houseHelps.length; i++) {
      const help = houseHelps[i];
      if (help.name || help.nic || help.phoneNumber) {
        if (!help.name || !help.nic) {
          Alert.alert('Error', `Please provide both name and NIC for House Help ${i + 1}`);
          return false;
        }
        if (!nicPattern.test(help.nic)) {
          Alert.alert('Error', `Invalid NIC format for House Help ${i + 1}`);
          return false;
        }
      }
    }

    if (hasDriver && (driver.name || driver.nic || driver.licenseNo || driver.phoneNumber)) {
      if (!driver.name || !driver.nic) {
        Alert.alert('Error', 'Driver name and NIC are required');
        return false;
      }
      if (!nicPattern.test(driver.nic)) {
        Alert.alert('Error', 'Invalid NIC format for driver');
        return false;
      }
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('authToken');

      const validHouseHelps = houseHelps.filter(help => 
        help.name.trim() || help.nic.trim() || help.phoneNumber.trim()
      );

      const validCarRegs = carRegistrations.filter(reg => reg && reg.trim() !== '');
      const validMotorcycleRegs = motorcycleRegistrations.filter(reg => reg && reg.trim() !== '');

      const formDataToSend = new FormData();
      
      // Add all basic fields (excluding email - cannot be updated)
      Object.keys(formData).forEach(key => {
        if (key !== 'email') {
          formDataToSend.append(key, formData[key]);
        }
      });

      formDataToSend.append('tenantInfo', JSON.stringify({
        tenant1: formData.tenant1 || '-',
        tenant2: formData.tenant2 || '-',
        tenant3: formData.tenant3 || '-',
        tenant4: formData.tenant4 || '-',
      }));

      // Add vehicle registrations
      formDataToSend.append('carRegistrationNumbers', JSON.stringify(validCarRegs));
      formDataToSend.append('motorcycleRegistrationNumbers', JSON.stringify(validMotorcycleRegs));

      // Add house help data
      formDataToSend.append('houseHelp', JSON.stringify(validHouseHelps.map(help => ({
        name: help.name,
        nic: help.nic,
        phoneNumber: help.phoneNumber,
        hasCriminalRecord: help.hasCriminalRecord
      }))));

      // Add house help certificates (only new uploads)
      validHouseHelps.forEach((help, index) => {
        if (help.hasCriminalRecord && help.policeCharacterCertificate && !help.policeCharacterCertificate.existing) {
          formDataToSend.append(`houseHelpCertificate_${index}`, {
            uri: help.policeCharacterCertificate.uri,
            type: help.policeCharacterCertificate.type,
            name: help.policeCharacterCertificate.name,
          });
        }
      });

      // Add driver data
      const driverToSend = (hasDriver && (driver.name || driver.nic || driver.licenseNo || driver.phoneNumber)) 
        ? {
            name: driver.name,
            nic: driver.nic,
            licenseNo: driver.licenseNo,
            phoneNumber: driver.phoneNumber,
            hasCriminalRecord: driver.hasCriminalRecord
          }
        : null;
      
      formDataToSend.append('driver', JSON.stringify(driverToSend));

      // Add driver certificate (only new upload)
      if (driverToSend && driver.hasCriminalRecord && driver.policeCharacterCertificate && !driver.policeCharacterCertificate.existing) {
        formDataToSend.append('driverCertificate', {
          uri: driver.policeCharacterCertificate.uri,
          type: driver.policeCharacterCertificate.type,
          name: driver.policeCharacterCertificate.name,
        });
      }

      const response = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Update Failed', data.msg || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const renderCertificateUpload = (certificate, onPickDocument, onRemoveDocument) => {
    if (!certificate) {
      return (
        <TouchableOpacity style={styles.filePickerButton} onPress={onPickDocument}>
          <Ionicons name="cloud-upload-outline" size={20} color="#FF6B6B" />
          <Text style={styles.filePickerText}>Select Certificate</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.selectedFileContainer}>
        <View style={styles.fileInfo}>
          <Ionicons name="document-outline" size={16} color="#4CAF50" />
          <Text style={styles.fileName}>
            {certificate.existing ? `${certificate.name} (Current)` : certificate.name}
          </Text>
          {certificate.size && (
            <Text style={styles.fileSize}>
              {(certificate.size / (1024 * 1024)).toFixed(2)} MB
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.removeFileButton} onPress={onRemoveDocument}>
          <Ionicons name="close-circle" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>House No. *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.houseNo}
                  onChangeText={(value) => updateFormData('houseNo', value)}
                  placeholder="Enter house number"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder="Enter your full name"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email (Cannot be changed)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={formData.email}
                  editable={false}
                  placeholder="Email address"
                  placeholderTextColor="#A0A0A0"
                />
                <Text style={styles.helperText}>Email cannot be modified after registration</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PTCL Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData('phoneNumber', value)}
                  keyboardType="phone-pad"
                  placeholder="Enter PTCL number"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>WhatsApp Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.whatsappNumber}
                  onChangeText={(value) => updateFormData('whatsappNumber', value)}
                  keyboardType="phone-pad"
                  placeholder="Enter WhatsApp number"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>NIC # *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nic}
                  onChangeText={(value) => updateFormData('nic', value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <Text style={styles.sectionTitle}>Property Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Status *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.status}
                    style={styles.picker}
                    onValueChange={(value) => updateFormData('status', value)}
                  >
                    <Picker.Item label="Standalone Owner" value="standalone owner" />
                    <Picker.Item label="Tenant" value="tenant" />
                  </Picker>
                </View>
              </View>

              {formData.status === 'tenant' && (
                <View>
                  {['tenant1', 'tenant2', 'tenant3', 'tenant4'].map((tenant, index) => (
                    <View key={tenant} style={styles.inputContainer}>
                      <Text style={styles.label}>Tenant {index + 1}</Text>
                      <TextInput
                        style={styles.input}
                        value={formData[tenant]}
                        onChangeText={(value) => updateFormData(tenant, value)}
                        placeholder={`Tenant ${index + 1} name`}
                        placeholderTextColor="#A0A0A0"
                      />
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Floor *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.floor}
                    style={styles.picker}
                    onValueChange={(value) => updateFormData('floor', value)}
                  >
                    <Picker.Item label="Ground" value="ground" />
                    <Picker.Item label="1st Floor" value="1st" />
                    <Picker.Item label="2nd Floor" value="2nd" />
                    <Picker.Item label="3rd Floor" value="3rd" />
                    <Picker.Item label="4th Floor" value="4th" />
                  </Picker>
                </View>
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Solar Installed *</Text>
                <Switch
                  value={formData.solorInstalled}
                  onValueChange={(value) => updateFormData('solorInstalled', value)}
                  trackColor={{ false: '#E5E5E7', true: '#FF6B6B' }}
                  thumbColor={formData.solorInstalled ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <Text style={styles.sectionTitle}>Utility Information</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>KE ID</Text>
                <TextInput
                  style={styles.input}
                  value={formData.KE_ID}
                  onChangeText={(value) => updateFormData('KE_ID', value)}
                  placeholder="K-Electric ID"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>SSGC ID</Text>
                <TextInput
                  style={styles.input}
                  value={formData.SSGC_ID}
                  onChangeText={(value) => updateFormData('SSGC_ID', value)}
                  placeholder="SSGC ID"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>KWSB ID</Text>
                <TextInput
                  style={styles.input}
                  value={formData.KWSB_ID}
                  onChangeText={(value) => updateFormData('KWSB_ID', value)}
                  placeholder="KWSB ID"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <Text style={styles.sectionTitle}>Vehicle Information</Text>

              {/* Car Registrations */}
              <Text style={styles.label}>Car Registration Numbers</Text>
              {carRegistrations.map((reg, index) => (
                <View key={`car-${index}`} style={styles.vehicleInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={reg}
                    onChangeText={(value) => updateCarRegistration(index, value)}
                    placeholder={`Car ${index + 1} registration`}
                    placeholderTextColor="#A0A0A0"
                  />
                  {carRegistrations.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeVehicleButton}
                      onPress={() => removeCarRegistration(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addCarRegistration}>
                <Ionicons name="add" size={20} color="#FF6B6B" />
                <Text style={styles.addButtonText}>Add Another Car</Text>
              </TouchableOpacity>

              {/* Motorcycle Registrations */}
              <Text style={styles.label}>Motorcycle Registration Numbers</Text>
              {motorcycleRegistrations.map((reg, index) => (
                <View key={`motorcycle-${index}`} style={styles.vehicleInputContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={reg}
                    onChangeText={(value) => updateMotorcycleRegistration(index, value)}
                    placeholder={`Motorcycle ${index + 1} registration`}
                    placeholderTextColor="#A0A0A0"
                  />
                  {motorcycleRegistrations.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeVehicleButton}
                      onPress={() => removeMotorcycleRegistration(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addMotorcycleRegistration}>
                <Ionicons name="add" size={20} color="#FF6B6B" />
                <Text style={styles.addButtonText}>Add Another Motorcycle</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>House Help Information</Text>

              {houseHelps.map((help, index) => (
                <View key={index} style={styles.houseHelpContainer}>
                  <View style={styles.houseHelpHeader}>
                    <Text style={styles.houseHelpTitle}>House Help {index + 1}</Text>
                    {houseHelps.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeHouseHelp(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={help.name}
                      onChangeText={(value) => updateHouseHelp(index, 'name', value)}
                      placeholder="House help name"
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>NIC #</Text>
                    <TextInput
                      style={styles.input}
                      value={help.nic}
                      onChangeText={(value) => updateHouseHelp(index, 'nic', value)}
                      placeholder="XXXXX-XXXXXXX-X"
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      value={help.phoneNumber}
                      onChangeText={(value) => updateHouseHelp(index, 'phoneNumber', value)}
                      placeholder="House help phone number"
                      placeholderTextColor="#A0A0A0"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.switchContainer}>
                    <Text style={styles.label}>Has criminal record?</Text>
                    <Switch
                      value={help.hasCriminalRecord}
                      onValueChange={(value) => updateHouseHelp(index, 'hasCriminalRecord', value)}
                      trackColor={{ false: '#E5E5E7', true: '#FF6B6B' }}
                      thumbColor={help.hasCriminalRecord ? '#FFFFFF' : '#FFFFFF'}
                    />
                  </View>

                  {help.hasCriminalRecord && (
                    <View style={styles.criminalRecordContainer}>
                      <Text style={styles.label}>Police Character Certificate</Text>
                      <Text style={styles.fileRequirement}>
                        PDF, JPG, PNG - Max 5MB
                      </Text>
                      
                      {renderCertificateUpload(
                        help.policeCharacterCertificate,
                        () => pickDocumentForHouseHelp(index),
                        () => removeDocumentForHouseHelp(index)
                      )}
                    </View>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addButton} onPress={addHouseHelp}>
                <Ionicons name="add" size={20} color="#FF6B6B" />
                <Text style={styles.addButtonText}>Add Another House Help</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Driver Information</Text>

              <View style={styles.switchContainer}>
                <Text style={styles.label}>Have Driver</Text>
                <Switch
                  value={hasDriver}
                  onValueChange={setHasDriver}
                  trackColor={{ false: '#E5E5E7', true: '#FF6B6B' }}
                  thumbColor={hasDriver ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              {hasDriver && (
                <View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Driver Name</Text>
                    <TextInput
                      style={styles.input}
                      value={driver.name}
                      onChangeText={(value) => updateDriver('name', value)}
                      placeholder="Driver name"
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Driver NIC #</Text>
                    <TextInput
                      style={styles.input}
                      value={driver.nic}
                      onChangeText={(value) => updateDriver('nic', value)}
                      placeholder="XXXXX-XXXXXXX-X"
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>License No</Text>
                    <TextInput
                      style={styles.input}
                      value={driver.licenseNo}
                      onChangeText={(value) => updateDriver('licenseNo', value)}
                      placeholder="Driver license number"
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={styles.input}
                      value={driver.phoneNumber}
                      onChangeText={(value) => updateDriver('phoneNumber', value)}
                      placeholder="Driver phone number"
                      placeholderTextColor="#A0A0A0"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.switchContainer}>
                    <Text style={styles.label}>Has criminal record?</Text>
                    <Switch
                      value={driver.hasCriminalRecord}
                      onValueChange={(value) => updateDriver('hasCriminalRecord', value)}
                      trackColor={{ false: '#E5E5E7', true: '#FF6B6B' }}
                      thumbColor={driver.hasCriminalRecord ? '#FFFFFF' : '#FFFFFF'}
                    />
                  </View>

                  {driver.hasCriminalRecord && (
                    <View style={styles.criminalRecordContainer}>
                      <Text style={styles.label}>Police Character Certificate</Text>
                      <Text style={styles.fileRequirement}>
                        PDF, JPG, PNG - Max 5MB
                      </Text>
                      
                      {renderCertificateUpload(
                        driver.policeCharacterCertificate,
                        pickDocumentForDriver,
                        removeDocumentForDriver
                      )}
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 16,
    marginTop: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  disabledInput: {
    backgroundColor: '#E5E5E7',
    color: '#8E8E93',
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    backgroundColor: '#F8F8F9',
  },
  picker: {
    height: 50,
    color: '#2C2C2E',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  vehicleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeVehicleButton: {
    marginLeft: 8,
    padding: 4,
  },
  criminalRecordContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  fileRequirement: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  filePickerText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileName: {
    color: '#2C2C2E',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  fileSize: {
    color: '#8E8E93',
    fontSize: 10,
    marginLeft: 8,
  },
  removeFileButton: {
    padding: 4,
  },
  houseHelpContainer: {
    backgroundColor: '#F8F8F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  houseHelpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  houseHelpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  updateButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});