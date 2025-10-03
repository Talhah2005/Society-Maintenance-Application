// routes/adminRoutes.js - Complete with update team endpoint
import express from 'express';
import { 
  getAllUsers, 
  getAllTeamMembers,
  addTeamMember,
  deleteUser,
  deleteTeamMember,
  updateUserRecord,
  updateTeamMemberRecord,  // NEW
  getAdminDashboardStats,
  getYearlyReport,
  getAvailableYears,
  getUsersWithDues,
  getDuesOverview,
  getMonthPaymentDetails,
  getCollectedPayments
} from '../controllers/adminController.js';
import authenticateJWT, { adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateJWT);
router.use(adminOnly);

// User management
router.get('/users', getAllUsers);
router.delete('/delete-user/:userId', deleteUser);
router.put('/update-user/:userId', updateUserRecord);

// Team management
router.get('/team-members', getAllTeamMembers);
router.post('/add-team', addTeamMember);
router.delete('/delete-team/:teamMemberId', deleteTeamMember);
router.put('/update-team/:teamMemberId', updateTeamMemberRecord);  // NEW

// Dashboard and reports
router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/yearly-report/:year', getYearlyReport);
router.get('/available-years', getAvailableYears);

// Detailed payment reports
router.get('/month-details/:year/:month', getMonthPaymentDetails);
router.get('/collected-payments/:year', getCollectedPayments);

// Dues management
router.get('/users-with-dues', getUsersWithDues);
router.get('/dues-overview', getDuesOverview);

export default router;