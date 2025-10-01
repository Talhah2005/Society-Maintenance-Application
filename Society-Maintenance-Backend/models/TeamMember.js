// models/TeamMember.js - Updated with email verification
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const teamMemberSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  nic: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'team' },
  
  // Email verification fields
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default model('TeamMember', teamMemberSchema);