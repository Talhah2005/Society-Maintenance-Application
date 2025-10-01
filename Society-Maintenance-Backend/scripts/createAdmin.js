// scripts/createAdmin.js
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail } from '../utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'talhasmit310622@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      console.log('Verified status:', existingAdmin.verified);
      process.exit(0);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create admin with verification token
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminUser = new User({
      houseNo: 'ADMIN',
      name: 'System Administrator',
      email: 'talhasmit310622@gmail.com',
      phoneNumber: '+923001234567',
      whatsappNumber: '+923001234567',
      password: hashedPassword,
      nic: '42101-1234567-1',
      status: 'standalone owner',
      role: 'admin',
      floor: 'ground',
      solorInstalled: false,
      verified: true,
      verificationToken: verificationToken,
      verificationTokenExpiry: tokenExpiry
    });

    await adminUser.save();
    console.log('Admin user created successfully!');

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(
        adminUser.email, 
        adminUser.name, 
        verificationToken
      );
      
      if (emailResult.success) {
        console.log('✓ Verification email sent successfully to:', adminUser.email);
      } else {
        console.log('✗ Failed to send verification email:', emailResult.error);
      }
    } catch (emailError) {
      // console.error('Email sending error:', emailError.message);
    }

    console.log('\n=== Admin Account Details ===');
    console.log('Email:', adminUser.email);
    console.log('Password: 123456');
    console.log('Role: admin');
    console.log('Verified:', adminUser.verified);
    // console.log('Verification token valid for: 24 hours');
    // console.log('Please check your email to verify the account.');
    console.log('============================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createDefaultAdmin();