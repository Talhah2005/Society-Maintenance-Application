// controllers/authController.js - Complete with email verification & multiple vehicles
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import PasswordResetOTP from '../models/PasswordResetOTP.js';
import { 
  sendPasswordResetEmail, 
  sendWelcomeEmail, 
  sendPasswordResetOTP, 
  generateOTP,
  sendVerificationEmail 
} from '../utils/emailService.js';

// Register a new user with email verification
export const register = async (req, res) => {
  try {
    const { 
      name, email, phoneNumber, whatsappNumber, password, 
      houseNo, floor, nic, status, tenantInfo, solorInstalled,
      carRegistrationNumbers, motorcycleRegistrationNumbers,
      SSGC_ID, KE_ID, KWSB_ID, houseHelp, driver
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists with this email' });
    }

    if (!name || !email || !whatsappNumber || !password || !houseNo || !nic || !status || !floor || solorInstalled === undefined) {
      return res.status(400).json({ msg: 'All required fields must be provided' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const userData = {
      name, email,
      phoneNumber: phoneNumber || '',
      whatsappNumber,
      password: hashedPassword,
      houseNo, floor, nic, status,
      tenantInfo: tenantInfo || { tenant1: '-', tenant2: '-', tenant3: '-', tenant4: '-' },
      solorInstalled: Boolean(solorInstalled),
      SSGC_ID: SSGC_ID || 'None',
      KE_ID: KE_ID || 'None',
      KWSB_ID: KWSB_ID || 'None',
      houseHelp: [],
      driver: null,
      role: 'user',
      verified: false,
      verificationToken,
      verificationTokenExpiry: tokenExpiry,
      carRegistrationNumbers: [],
      motorcycleRegistrationNumbers: []
    };

    if (carRegistrationNumbers && Array.isArray(carRegistrationNumbers)) {
      userData.carRegistrationNumbers = carRegistrationNumbers.filter(num => num && num.trim() !== '');
    }

    if (motorcycleRegistrationNumbers && Array.isArray(motorcycleRegistrationNumbers)) {
      userData.motorcycleRegistrationNumbers = motorcycleRegistrationNumbers.filter(num => num && num.trim() !== '');
    }

    if (houseHelp && Array.isArray(houseHelp)) {
      userData.houseHelp = await Promise.all(houseHelp.map(async (help, index) => {
        const helpData = {
          name: help.name || '',
          nic: help.nic || '',
          phoneNumber: help.phoneNumber || '',
          hasCriminalRecord: Boolean(help.hasCriminalRecord)
        };

        if (helpData.hasCriminalRecord && req.files) {
          const certificateFieldName = `houseHelpCertificate_${index}`;
          const file = req.files[certificateFieldName];
          
          if (file) {
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
              throw new Error(`Police Character Certificate for House Help ${index + 1} must be less than 5MB`);
            }

            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.mimetype)) {
              throw new Error(`Police Character Certificate for House Help ${index + 1} must be a PDF, JPG, or PNG file`);
            }

            helpData.policeCharacterCertificate = {
              filename: `house_help_${index}_cert_${Date.now()}_${file.name}`,
              originalName: file.name,
              mimeType: file.mimetype,
              size: file.size,
              uploadDate: new Date(),
              fileData: file.data
            };
          }
        }

        return helpData;
      }));
    }

    if (driver && (driver.name || driver.nic || driver.licenseNo || driver.phoneNumber)) {
      const driverData = {
        name: driver.name || '',
        nic: driver.nic || '',
        licenseNo: driver.licenseNo || '',
        phoneNumber: driver.phoneNumber || '',
        hasCriminalRecord: Boolean(driver.hasCriminalRecord)
      };

      if (driverData.hasCriminalRecord && req.files && req.files.driverCertificate) {
        const file = req.files.driverCertificate;
        
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          return res.status(400).json({ msg: 'Driver Police Character Certificate must be less than 5MB' });
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ msg: 'Driver Police Character Certificate must be a PDF, JPG, or PNG file' });
        }

        driverData.policeCharacterCertificate = {
          filename: `driver_cert_${Date.now()}_${file.name}`,
          originalName: file.name,
          mimeType: file.mimetype,
          size: file.size,
          uploadDate: new Date(),
          fileData: file.data
        };
      }

      userData.driver = driverData;
    }

    const newUser = new User(userData);
    await newUser.save();

    try {
      const emailResult = await sendVerificationEmail(email, name, verificationToken);
      if (emailResult.success) {
        console.log(`Verification email sent to ${email}`);
      } else {
        console.log(`Failed to send verification email to ${email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.log('Verification email error:', emailError.message);
    }

    res.status(201).json({ 
      msg: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        verified: newUser.verified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: error.message || 'Server error during registration' });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ msg: 'Verification token is required', success: false });
    }

    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        msg: 'Invalid or expired verification token',
        success: false 
      });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.log('Welcome email error:', emailError.message);
    }

    console.log(`Email verified successfully for: ${user.email}`);

    res.status(200).json({ 
      msg: 'Email verified successfully! You can now login.',
      success: true 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      msg: 'Server error during email verification',
      success: false 
    });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required', success: false });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    if (user.verified) {
      return res.status(400).json({ msg: 'Email already verified', success: false });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = tokenExpiry;
    await user.save();

    const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);

    if (emailResult.success) {
      res.status(200).json({ 
        msg: 'Verification email sent successfully',
        success: true 
      });
    } else {
      res.status(500).json({ 
        msg: 'Failed to send verification email',
        success: false 
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      msg: 'Server error',
      success: false 
    });
  }
};

// Resend verification email for team members
export const resendTeamMemberVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required', success: false });
    }

    const teamMember = await TeamMember.findOne({ email: email.toLowerCase().trim() });

    if (!teamMember) {
      return res.status(404).json({ msg: 'Team member not found', success: false });
    }

    if (teamMember.verified) {
      return res.status(400).json({ msg: 'Email already verified', success: false });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    teamMember.verificationToken = verificationToken;
    teamMember.verificationTokenExpiry = tokenExpiry;
    await teamMember.save();

    const emailResult = await sendVerificationEmail(teamMember.email, teamMember.name, verificationToken);

    if (emailResult.success) {
      res.status(200).json({ 
        msg: 'Verification email sent successfully',
        success: true 
      });
    } else {
      res.status(500).json({ 
        msg: 'Failed to send verification email',
        success: false 
      });
    }
  } catch (error) {
    console.error('Resend team member verification error:', error);
    res.status(500).json({ 
      msg: 'Server error',
      success: false 
    });
  }
};

// Login user (check if verified)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    let userType = 'user';
    
    if (!user) {
      user = await TeamMember.findOne({ email });
      userType = 'team';
      
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }
    }

    if (!user.verified) {
      return res.status(403).json({ 
        msg: 'Please verify your email before logging in. Check your inbox for the verification link.',
        verified: false,
        email: user.email,
        userType: userType
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const role = user.role || userType;
    const token = jwt.sign(
      { userId: user._id, role: role, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '365d' }
    );

    console.log(`Successful login: ${email} (${role})`);

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role,
        verified: user.verified || true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
};

// Download certificates
export const downloadHouseHelpCertificate = async (req, res) => {
  try {
    const { userId, helpIndex } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const helpIndexNum = parseInt(helpIndex);
    if (!user.houseHelp || helpIndexNum >= user.houseHelp.length) {
      return res.status(404).json({ msg: 'House help not found' });
    }

    const houseHelp = user.houseHelp[helpIndexNum];
    if (!houseHelp.policeCharacterCertificate || !houseHelp.policeCharacterCertificate.fileData) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }

    const certificate = houseHelp.policeCharacterCertificate;
    
    res.set({
      'Content-Type': certificate.mimeType,
      'Content-Disposition': `attachment; filename="${certificate.originalName}"`,
      'Content-Length': certificate.size
    });

    res.send(certificate.fileData);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const downloadDriverCertificate = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.driver || !user.driver.policeCharacterCertificate || !user.driver.policeCharacterCertificate.fileData) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }

    const certificate = user.driver.policeCharacterCertificate;
    
    res.set({
      'Content-Type': certificate.mimeType,
      'Content-Disposition': `attachment; filename="${certificate.originalName}"`,
      'Content-Length': certificate.size
    });

    res.send(certificate.fileData);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

// OTP functions
export const sendPasswordResetOTPController = async (req, res) => {
  const { email } = req.body;
  
  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email is required', success: false });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      user = await TeamMember.findOne({ email: email.toLowerCase().trim() });
    }
    
    if (!user) {
      return res.status(200).json({ 
        msg: 'If an account exists, you will receive an OTP.',
        success: true 
      });
    }

    await PasswordResetOTP.deleteMany({ email: email.toLowerCase().trim() });

    const otp = generateOTP();
    console.log(`Generated OTP for ${email}: ${otp}`);

    const passwordResetOTP = new PasswordResetOTP({
      userId: user._id,
      email: email.toLowerCase().trim(),
      otp: otp,
    });

    await passwordResetOTP.save();

    const emailResult = await sendPasswordResetOTP(email, user.name, otp);
      
    if (emailResult.success) {
      res.status(200).json({ 
        msg: 'OTP sent to your email',
        success: true 
      });
    } else {
      await PasswordResetOTP.findByIdAndDelete(passwordResetOTP._id);
      res.status(500).json({ 
        msg: 'Failed to send OTP',
        success: false 
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ msg: 'Server error', success: false });
  }
};

export const verifyOTPAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: 'All fields required', success: false });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be 6+ characters', success: false });
    }

    const otpRecord = await PasswordResetOTP.findOne({ 
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      isUsed: false 
    });
    
    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired OTP', success: false });
    }

    if (otpRecord.attempts >= 3) {
      await PasswordResetOTP.findByIdAndDelete(otpRecord._id);
      return res.status(400).json({ msg: 'Max attempts exceeded', success: false });
    }

    otpRecord.attempts += 1;
    await otpRecord.save();

    let user = await User.findById(otpRecord.userId);
    if (!user) {
      user = await TeamMember.findById(otpRecord.userId);
    }

    if (!user) {
      await PasswordResetOTP.findByIdAndDelete(otpRecord._id);
      return res.status(404).json({ msg: 'User not found', success: false });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await PasswordResetOTP.findByIdAndDelete(otpRecord._id);

    res.status(200).json({ msg: 'Password reset successful', success: true });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ msg: 'Server error', success: false });
  }
};

// Legacy functions
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await TeamMember.findOne({ email });
    }
    
    if (!user) {
      return res.status(200).json({ msg: 'If account exists, you will receive a reset link' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const passwordResetToken = new PasswordResetToken({
      userId: user._id,
      token: hashedToken,
    });

    await passwordResetToken.save();

    const emailResult = await sendPasswordResetEmail(email, user.name, resetToken);
      
    if (emailResult.success) {
      res.status(200).json({ msg: 'Password reset email sent' });
    } else {
      await PasswordResetToken.findByIdAndDelete(passwordResetToken._id);
      res.status(500).json({ msg: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const passwordResetToken = await PasswordResetToken.findOne({ token: hashedToken });
    
    if (!passwordResetToken) {
      return res.status(400).json({ msg: 'Invalid or expired token' });
    }

    let user = await User.findById(passwordResetToken.userId);
    if (!user) {
      user = await TeamMember.findById(passwordResetToken.userId);
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    await PasswordResetToken.findByIdAndDelete(passwordResetToken._id);

    res.status(200).json({ msg: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};