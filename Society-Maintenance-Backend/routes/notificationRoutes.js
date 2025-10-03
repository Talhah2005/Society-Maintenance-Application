// routes/notificationRoutes.js
import express from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead
} from '../controllers/notificationController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read/:notificationId', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
router.delete('/clear/read', deleteAllRead);

export default router;