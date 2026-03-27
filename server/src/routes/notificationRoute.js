import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// Get all notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark a notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

export default router;
