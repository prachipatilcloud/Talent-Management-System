import Notification from "../models/Notification.js";

// Get all notifications for the current user
export const getNotifications = async (req, res, next) => {
    try {
        const { unreadOnly = false } = req.query;
        
        let query = { recipient: req.user._id };
        
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .populate('candidate', 'firstName lastName jobRole')
            .sort({ createdAt: -1 })
            .limit(100);

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });

    } catch (error) {
        next(error);
    }
};

// Mark a notification as read
export const markAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Verify the notification belongs to the current user
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this notification'
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification
        });

    } catch (error) {
        next(error);
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        next(error);
    }
};

// Delete a notification
export const deleteNotification = async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Verify the notification belongs to the current user
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this notification'
            });
        }

        await Notification.findByIdAndDelete(notificationId);

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        next(error);
    }
};

// Get unread notification count
export const getUnreadCount = async (req, res, next) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error) {
        next(error);
    }
};
