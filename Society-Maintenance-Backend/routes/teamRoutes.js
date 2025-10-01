// routes/teamRoutes.js - FIXED with proper middleware
import express from 'express';
import { getTeamUsers, markBillAsPaid } from '../controllers/teamController.js'; // Fixed import name
import authenticateJWT, { teamOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all users for team member to collect payments from
router.get('/users', authenticateJWT, teamOnly, getTeamUsers);

// Mark a bill as paid and send WhatsApp message
router.post('/mark-paid', authenticateJWT, teamOnly, markBillAsPaid);

export default router;