// routes/userRoutes.js - Updated with file upload support
import express from 'express';
import fileUpload from 'express-fileupload';
import { 
  getUserProfile, 
  updateUserInfo, 
  getUserPaymentStatus, 
  updateUserPassword 
} from '../controllers/userController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure file upload middleware for updates
const fileUploadOptions = {
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  abortOnLimit: true,
  responseOnLimit: "File size limit exceeded (5MB max)",
  useTempFiles: false,
  debug: false
};

// Get user profile (complete information)
router.get('/profile', authenticateJWT, getUserProfile);

// Update user information with file upload support
router.put('/update', authenticateJWT, fileUpload(fileUploadOptions), updateUserInfo);

// Get user payment status only
router.get('/payment-status', authenticateJWT, getUserPaymentStatus);

// Update user password
router.put('/update-password', authenticateJWT, updateUserPassword);

export default router;