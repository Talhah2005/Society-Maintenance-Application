// models/User.js - Updated with email verification and multiple vehicles
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  houseNo: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String }, // PTCL Number - optional
  whatsappNumber: { type: String, required: true }, // WhatsApp - required
  password: { type: String, required: true },
  nic: { type: String, required: true },
  status: { type: String, enum: ['standalone owner', 'tenant'], required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Email verification
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  
  // Registration tracking
  registrationDate: { type: Date, default: Date.now },
  paymentTrackingStartMonth: { type: String }, // e.g., "September 2025"
  
  tenantInfo: {
    tenant1: { type: String, default: '-' },
    tenant2: { type: String, default: '-' },
    tenant3: { type: String, default: '-' },
    tenant4: { type: String, default: '-' },
  },
  floor: { type: String, required: true },
  solorInstalled: { type: Boolean, required: true },
  
  // Multiple vehicle registration numbers
  carRegistrationNumbers: [{ type: String, trim: true }],
  motorcycleRegistrationNumbers: [{ type: String, trim: true }],
  
  // Utility IDs - optional
  SSGC_ID: { type: String, default: 'None' },
  KE_ID: { type: String, default: 'None' },
  KWSB_ID: { type: String, default: 'None' },
  
  // House Help - Array with individual criminal record info
  houseHelp: [{
    name: { type: String },
    nic: { type: String },
    phoneNumber: { type: String },
    hasCriminalRecord: { type: Boolean, default: false },
    policeCharacterCertificate: {
      filename: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      uploadDate: { type: Date },
      fileData: { type: Buffer }, // Store file as binary data
    }
  }],
  
  // Driver Info with individual criminal record
  driver: {
    name: { type: String },
    nic: { type: String },
    licenseNo: { type: String },
    phoneNumber: { type: String },
    hasCriminalRecord: { type: Boolean, default: false },
    policeCharacterCertificate: {
      filename: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      uploadDate: { type: Date },
      fileData: { type: Buffer }, // Store file as binary data
    }
  },
  
  paymentStatus: [
    {
      month: { type: String },
      status: { type: String, enum: ['Paid', 'Not Paid'], default: 'Not Paid' },
      paidDate: { type: Date },
      amount: { type: Number, default: 3000 }
    },
  ],
}, { timestamps: true });

// Pre-save middleware to set payment tracking start month
userSchema.pre('save', function(next) {
  // Set payment tracking start month on first save (registration)
  if (this.isNew && !this.paymentTrackingStartMonth) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const registrationDate = this.registrationDate || new Date();
    const month = months[registrationDate.getMonth()];
    const year = registrationDate.getFullYear();
    this.paymentTrackingStartMonth = `${month} ${year}`;
  }
  
  // Remove empty house help entries
  if (this.houseHelp) {
    this.houseHelp = this.houseHelp.filter(help => 
      (help.name && help.name.trim() !== '') || 
      (help.nic && help.nic.trim() !== '') || 
      (help.phoneNumber && help.phoneNumber.trim() !== '')
    );
  }
  
  // Remove driver object if all fields are empty
  if (this.driver && 
      (!this.driver.name || this.driver.name.trim() === '') && 
      (!this.driver.nic || this.driver.nic.trim() === '') && 
      (!this.driver.licenseNo || this.driver.licenseNo.trim() === '') &&
      (!this.driver.phoneNumber || this.driver.phoneNumber.trim() === '') &&
      !this.driver.hasCriminalRecord) {
    this.driver = undefined;
  }
  
  // Remove empty vehicle registration numbers
  if (this.carRegistrationNumbers) {
    this.carRegistrationNumbers = this.carRegistrationNumbers.filter(
      reg => reg && reg.trim() !== ''
    );
  }
  
  if (this.motorcycleRegistrationNumbers) {
    this.motorcycleRegistrationNumbers = this.motorcycleRegistrationNumbers.filter(
      reg => reg && reg.trim() !== ''
    );
  }
  
  next();
});

export default model('User', userSchema);