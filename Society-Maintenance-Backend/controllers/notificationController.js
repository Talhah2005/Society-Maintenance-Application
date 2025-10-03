// controllers/notificationController.js
import Notification from '../models/Notification.js';

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.user;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ msg: 'Server error while fetching notifications' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ 
      msg: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.user;

    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ msg: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json({ msg: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteAllRead = async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await Notification.deleteMany({
      userId,
      isRead: true
    });

    res.json({ 
      msg: 'All read notifications deleted',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};