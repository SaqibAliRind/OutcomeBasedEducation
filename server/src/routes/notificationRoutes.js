import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    sendNotification,
    markAsRead,
    getAdminNotifications,
    cancelNotification,
    resendNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getNotifications)
    .post(admin, sendNotification);

router.get('/admin', admin, getAdminNotifications);

router.route('/:id/read')
    .put(markAsRead);

router.patch('/:id/cancel', admin, cancelNotification);
router.post('/:id/resend', admin, resendNotification);

export default router;
