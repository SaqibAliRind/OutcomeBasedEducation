import { Notification, User } from '../models/index.js';

// @desc    Get user notifications (for individual bell icon/in-app)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            $or: [
                { recipient: req.user._id },
                { targetAudience: 'All Users', university: req.user.university },
                // We'd have more logic here for role matching, but simplified for now
            ],
            status: 'Sent' // Only show sent ones to users
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'name email role')
            .lean();
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving notifications' });
    }
};

// @desc    Get all notifications for admin dashboard
// @route   GET /api/notifications/admin
// @access  Private/Admin
export const getAdminNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ university: req.user.university })
            .sort({ createdAt: -1 })
            .populate('sender', 'name')
            .lean();
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Create/Schedule notification
// @route   POST /api/notifications
// @access  Private/Admin
export const sendNotification = async (req, res) => {
    try {
        const { targetAudience, targetGroup, recipient, type, title, message, channels, scheduledFor } = req.body;
        
        let status = 'Sent';
        if (scheduledFor && new Date(scheduledFor) > new Date()) {
            status = 'Pending';
        }

        const notification = new Notification({
            university: req.user.university,
            sender: req.user._id,
            targetAudience: targetAudience || 'Individual User',
            targetGroup,
            recipient: recipient || null,
            type: type || 'System',
            title,
            message,
            channels: channels || ['In-App'],
            scheduledFor,
            status
        });

        await notification.save();
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'Server error sending notification' });
    }
};

// @desc    Cancel Notification
// @route   PATCH /api/notifications/:id/cancel
// @access  Private/Admin
export const cancelNotification = async (req, res) => {
    try {
        const notif = await Notification.findById(req.params.id);
        if (!notif) return res.status(404).json({ message: 'Not found' });
        notif.status = 'Cancelled';
        await notif.save();
        res.json(notif);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend Notification
// @route   POST /api/notifications/:id/resend
// @access  Private/Admin
export const resendNotification = async (req, res) => {
    try {
        const notif = await Notification.findById(req.params.id);
        if (!notif) return res.status(404).json({ message: 'Not found' });
        
        const newNotif = new Notification({
            university: notif.university,
            sender: req.user._id,
            targetAudience: notif.targetAudience,
            targetGroup: notif.targetGroup,
            recipient: notif.recipient,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            channels: notif.channels,
            status: 'Sent'
        });
        await newNotif.save();
        res.json(newNotif);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error marking notification as read' });
    }
};
