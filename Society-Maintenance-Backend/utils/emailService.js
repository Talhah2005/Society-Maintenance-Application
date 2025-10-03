// utils/emailService.js - Updated with payment confirmation email
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

const createTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

export const verifyEmailConfig = async () => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    await transporter.verify();
    console.log('Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    console.error('Please check your EMAIL_USER and EMAIL_APP_PASSWORD in .env file');
    return false;
  }
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email verification email
export const sendVerificationEmail = async (userEmail, userName, verificationToken) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://192.168.1.9:5001';
    const verificationUrl = `${backendUrl}/api/auth/verify-email-web?token=${verificationToken}`;

    const mailOptions = {
      from: {
        name: 'Society Management System',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Verify Your Email - Society Management',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #4CAF50; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Society Management!</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Please verify your email address</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #2C2C2E; margin: 0 0 20px 0;">Hello ${userName},</h2>
              
              <p style="color: #2C2C2E; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for registering with Society Management System. To complete your registration and 
                activate your account, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #4CAF50; 
                          color: #ffffff; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;">
                  Verify My Account
                </a>
              </div>
              
              <p style="color: #8E8E93; line-height: 1.6; margin: 30px 0 20px 0; font-size: 14px;">
                If the button doesn't work, copy and paste this link in your browser:
              </p>
              
              <div style="background-color: #f8f8f9; padding: 15px; border-radius: 8px; word-break: break-all;">
                <a href="${verificationUrl}" style="color: #4CAF50; text-decoration: none; font-size: 14px;">${verificationUrl}</a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e7;">
                <p style="color: #8E8E93; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>Important:</strong> This verification link will expire in 24 hours.
                  If you didn't create this account, please ignore this email.
                </p>
              </div>
            </div>
            
            <div style="background-color: #f8f8f9; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="color: #8E8E93; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Society Management Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Society Management!
        
        Hello ${userName},
        
        Thank you for registering. Please verify your email address by visiting:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        Best regards,
        Society Management Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// NEW: Send payment confirmation email
export const sendPaymentConfirmationEmail = async (userEmail, userName, month, amount, paidDate) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const formattedDate = new Date(paidDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(paidDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const mailOptions = {
      from: {
        name: 'Society Management System',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: `Maintenance Charges Paid - ${month}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #4CAF50; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Received</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Maintenance Charges Confirmation</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #2C2C2E; margin: 0 0 20px 0;">Dear ${userName},</h2>
              
              <p style="color: #2C2C2E; line-height: 1.6; margin: 0 0 20px 0;">
                Your maintenance charges for the month of <strong>${month}</strong> have been successfully paid.
              </p>
              
              <div style="background-color: #f8f8f9; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h3 style="color: #2C2C2E; margin: 0 0 15px 0; font-size: 18px;">Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #8E8E93; font-size: 14px;">Month:</td>
                    <td style="padding: 10px 0; color: #2C2C2E; font-weight: 600; text-align: right;">${month}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #8E8E93; font-size: 14px;">Amount:</td>
                    <td style="padding: 10px 0; color: #2C2C2E; font-weight: 600; text-align: right;">PKR ${amount.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #8E8E93; font-size: 14px;">Date:</td>
                    <td style="padding: 10px 0; color: #2C2C2E; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #8E8E93; font-size: 14px;">Time:</td>
                    <td style="padding: 10px 0; color: #2C2C2E; font-weight: 600; text-align: right;">${formattedTime}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #2C2C2E; font-size: 14px; line-height: 1.6;">
                  <strong>Thank you for your timely payment!</strong><br>
                  Your payment has been recorded in our system. You can view this transaction in your dashboard.
                </p>
              </div>
              
              <p style="color: #8E8E93; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If you have any questions regarding this payment, please contact the management office.
              </p>
            </div>
            
            <div style="background-color: #f8f8f9; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="color: #8E8E93; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Society Management Team</strong>
              </p>
              <p style="color: #8E8E93; font-size: 12px; margin: 10px 0 0 0;">
                © 2025 Society Management System. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Maintenance Charges Paid
        
        Dear ${userName},
        
        Your maintenance charges for the month of ${month} have been successfully paid on ${formattedDate} at ${formattedTime}.
        
        Payment Details:
        - Month: ${month}
        - Amount: PKR ${amount.toLocaleString()}
        - Date: ${formattedDate}
        - Time: ${formattedTime}
        
        Thank you for your timely payment!
        
        Best regards,
        Society Management Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent successfully to:', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetOTP = async (userEmail, userName, otp) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: {
        name: 'Society Management System',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Society Management - Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #FF6B6B; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Society Management</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Password Reset OTP</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #2C2C2E; margin: 0 0 20px 0;">Hello ${userName},</h2>
              
              <p style="color: #2C2C2E; line-height: 1.6; margin: 0 0 20px 0;">
                You have requested to reset your password for the Society Management App. 
                Use the OTP below to proceed with password reset.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f8f9; 
                           border: 2px dashed #FF6B6B; 
                           border-radius: 12px; 
                           padding: 20px; 
                           display: inline-block;
                           min-width: 200px;">
                  <p style="margin: 0 0 10px 0; color: #8E8E93; font-size: 14px; font-weight: 600;">
                    Your OTP Code
                  </p>
                  <p style="margin: 0; 
                           font-size: 32px; 
                           font-weight: bold; 
                           color: #FF6B6B; 
                           letter-spacing: 8px;
                           font-family: 'Courier New', monospace;">
                    ${otp}
                  </p>
                </div>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                  <strong>Important:</strong>
                  <br>• This OTP is valid for 10 minutes only
                  <br>• Do not share this OTP with anyone
                  <br>• If you didn't request this, please ignore this email
                </p>
              </div>
            </div>
            
            <div style="background-color: #f8f8f9; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="color: #8E8E93; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Society Management Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset OTP
        
        Hello ${userName},
        
        Your OTP Code: ${otp}
        
        This OTP is valid for 10 minutes only.
        
        Best regards,
        Society Management Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent successfully to:', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Society Management System',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Society Maintenance App - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #FF6B6B; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Society Management</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #2C2C2E; margin: 0 0 20px 0;">Hello ${userName},</h2>
              
              <p style="color: #2C2C2E; line-height: 1.6; margin: 0 0 30px 0;">
                To reset your password, click the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #FF6B6B; 
                          color: #ffffff; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold; 
                          font-size: 16px;
                          display: inline-block;">
                  Reset My Password
                </a>
              </div>
            </div>
            
            <div style="background-color: #f8f8f9; padding: 20px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="color: #8E8E93; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Society Management Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: {
        name: 'Society Management System',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: 'Welcome to Society Management System',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0;">Welcome to Society Management!</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e5e7; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2C2C2E;">Hello ${userName}!</h2>
            <p style="color: #2C2C2E; line-height: 1.6;">
              Your account has been successfully created and verified. You can now access your society maintenance portal.
            </p>
            <p style="color: #2C2C2E; margin-top: 30px;">
              Best regards,<br>
              <strong>Society Management Team</strong>
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', userEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};