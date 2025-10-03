// screens/RegisterScreen.js - Complete file with multiple vehicle support
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const API_BASE_URL = 'http://192.168.1.9:5001/api';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    houseNo: '', name: '', email: '', phoneNumber: '', whatsappNumber: '',
    password: '', confirmPassword: '', nic: '', status: 'standalone owner',
    floor: 'ground', solorInstalled: false,
    SSGC_ID: '', KE_ID: '', KWSB_ID: '',
    tenant1: '', tenant2: '', tenant3: '', tenant4: ''
  });

  // Multiple vehicles state
  const [carRegistrations, setCarRegistrations] = useState(['']);
  const [motorcycleRegistrations, setMotorcycleRegistrations] = useState(['']);

  const [houseHelps, setHouseHelps] = useState([{ 
    name: '', nic: '', phoneNumber: '', hasCriminalRecord: false,
    policeCharacterCertificate: null
  }]);
  
  const [driver, setDriver] = useState({ 
    name: '', nic: '', licenseNo: '', phoneNumber: '',
    hasCriminalRecord: false, policeCharacterCertificate: null
  });
  const [hasDriver, setHasDriver] = useState(false);
  const [loading, setLoading] = useState(false);

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
          size: file.size
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
            size: file.size
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
    const { houseNo, name, email, whatsappNumber, password, confirmPassword, nic, status, floor } = formData;
    
    if (!houseNo || !name || !email || !whatsappNumber || !password || !confirmPassword || !nic || !status || !floor || formData.solorInstalled === undefined) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
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

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const validHouseHelps = houseHelps.filter(help => 
        help.name.trim() || help.nic.trim() || help.phoneNumber.trim()
      );

      // Filter out empty vehicle registrations
      const validCarRegs = carRegistrations.filter(reg => reg && reg.trim() !== '');
      const validMotorcycleRegs = motorcycleRegistrations.filter(reg => reg && reg.trim() !== '');

      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
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

      formDataToSend.append('houseHelp', JSON.stringify(validHouseHelps.map(help => ({
        name: help.name,
        nic: help.nic,
        phoneNumber: help.phoneNumber,
        hasCriminalRecord: help.hasCriminalRecord
      }))));

      validHouseHelps.forEach((help, index) => {
        if (help.hasCriminalRecord && help.policeCharacterCertificate) {
          formDataToSend.append(`houseHelpCertificate_${index}`, {
            uri: help.policeCharacterCertificate.uri,
            type: help.policeCharacterCertificate.type,
            name: help.policeCharacterCertificate.name,
          });
        }
      });

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

      if (driverToSend && driver.hasCriminalRecord && driver.policeCharacterCertificate) {
        formDataToSend.append('driverCertificate', {
          uri: driver.policeCharacterCertificate.uri,
          type: driver.policeCharacterCertificate.type,
          name: driver.policeCharacterCertificate.name,
        });
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Registration Successful!',
          'Please check your email to verify your account before logging in.',
          [{ 
            text: 'OK', 
            onPress: () => navigation.navigate('Login') 
          }]
        );
      } else {
        Alert.alert('Registration Failed', data.msg || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
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
          <Text style={styles.fileName}>{certificate.name}</Text>
          <Text style={styles.fileSize}>
            {(certificate.size / (1024 * 1024)).toFixed(2)} MB
          </Text>
        </View>
        <TouchableOpacity style={styles.removeFileButton} onPress={onRemoveDocument}>
          <Ionicons name="close-circle" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

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
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter your email"
                  placeholderTextColor="#A0A0A0"
                />
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry
                  placeholder="Enter password"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry
                  placeholder="Confirm password"
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
                style={styles.registerButton}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
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
  registerButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});