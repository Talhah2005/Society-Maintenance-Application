// routes/authRoutes.js - Updated with team member verification support
import express from 'express';
import fileUpload from 'express-fileupload';
import { 
  register, 
  login, 
  verifyEmail,
  resendVerificationEmail,
  resendTeamMemberVerification,
  forgotPassword, 
  resetPassword,
  sendPasswordResetOTPController,
  verifyOTPAndResetPassword,
  downloadHouseHelpCertificate,
  downloadDriverCertificate
} from '../controllers/authController.js';
import User from '../models/User.js';
import TeamMember from '../models/TeamMember.js';
import { sendWelcomeEmail } from '../utils/emailService.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure file upload middleware
const fileUploadOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: "File size limit exceeded (5MB max)",
  useTempFiles: false,
  debug: false
};

// Public routes
router.post('/register', fileUpload(fileUploadOptions), register);
router.post('/login', login);

// Email verification routes
router.get('/verify-email', verifyEmail); // API endpoint (for app)
router.post('/resend-verification', resendVerificationEmail);
router.post('/resend-team-verification', resendTeamMemberVerification); // NEW: For team members

// Web-based verification route (for email clients/browsers) - NOW SUPPORTS BOTH USERS AND TEAM MEMBERS
router.get('/verify-email-web', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 50px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #FF6B6B; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verification Failed</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <p style="color: #2C2C2E; font-size: 18px; line-height: 1.6;">
                Invalid verification token. Please check your email for the correct link.
              </p>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Check in User collection first
    let user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    let isTeamMember = false;

    // If not found in User collection, check TeamMember collection
    if (!user) {
      user = await TeamMember.findOne({ 
        verificationToken: token,
        verificationTokenExpiry: { $gt: Date.now() }
      });
      isTeamMember = true;
    }

    if (!user) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 50px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background-color: #FF6B6B; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verification Failed</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <p style="color: #2C2C2E; font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                This verification link is invalid or has expired.
              </p>
              <p style="color: #8E8E93; font-size: 14px;">
                Verification links expire after 24 hours. Please request a new verification email from the app.
              </p>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Update user/team member verification status
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.log('Welcome email error:', emailError.message);
    }

    const userType = isTeamMember ? 'Team Member' : 'User';
    console.log(`Email verified successfully via web for ${userType}: ${user.email}`);

    // Generate dynamic account info based on user type
    const accountInfo = isTeamMember 
      ? `<strong>Account Type:</strong> Team Member`
      : `<strong>House No:</strong> ${user.houseNo}<br><strong>Account Type:</strong> User`;

    const nextSteps = isTeamMember
      ? 'Start managing collections'
      : 'Start managing your society account';

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified Successfully</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 50px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #4CAF50; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Email Verified!</h1>
          </div>
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background-color: #E8F5E9; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 48px; color: #4CAF50;">✓</span>
              </div>
              <h2 style="color: #2C2C2E; margin: 0 0 10px 0;">Account Successfully Verified</h2>
              <p style="color: #8E8E93; font-size: 16px; line-height: 1.6;">
                Your ${isTeamMember ? 'team member' : 'user'} account has been verified and is now active.
              </p>
            </div>
            
            <div style="background-color: #f8f8f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; color: #2C2C2E; font-size: 14px;">
                <strong>Email:</strong> ${user.email}<br>
                <strong>Name:</strong> ${user.name}<br>
                ${accountInfo}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #2C2C2E; font-size: 16px; margin-bottom: 20px;">
                You can now close this window and login to the Society Management app.
              </p>
              <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin-top: 20px; text-align: left;">
                <p style="margin: 0; color: #1976D2; font-size: 14px;">
                  <strong>Next Steps:</strong><br>
                  1. Open the Society Management app<br>
                  2. Login with your email and password<br>
                  3. ${nextSteps}
                </p>
              </div>
            </div>
          </div>
          
          <div style="background-color: #f8f8f9; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">
            <p style="color: #8E8E93; font-size: 14px; margin: 0;">
              © 2025 Society Management System. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Web email verification error:', error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Error</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 50px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #FF6B6B; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Error</h1>
          </div>
          <div style="padding: 40px 30px; text-align: center;">
            <p style="color: #2C2C2E; font-size: 18px; line-height: 1.6;">
              An error occurred during verification. Please try again or contact support.
            </p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// Password reset (legacy token-based)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Password reset (OTP-based)
router.post('/send-otp', sendPasswordResetOTPController);
router.post('/verify-otp-reset', verifyOTPAndResetPassword);

// Protected routes
router.get('/download-house-help-certificate/:userId/:helpIndex', authenticateJWT, downloadHouseHelpCertificate);
router.get('/download-driver-certificate/:userId', authenticateJWT, downloadDriverCertificate);

export default router;