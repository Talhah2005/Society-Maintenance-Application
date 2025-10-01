// routes/paymentRoutes.js - New routes for payment operations
import express from 'express';
import { 
  calculateUserDues, 
  getUserPaymentHistory 
} from '../controllers/paymentController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// User payment routes
router.get('/dues', authenticateJWT, calculateUserDues);
router.get('/history', authenticateJWT, getUserPaymentHistory);

export default router;