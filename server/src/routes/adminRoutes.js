import express from 'express';
const router = express.Router();
import {
    createUniversityAdmin,
    updateUniversityAdmin,
    getUniversityAdmins,
    deleteUniversityAdmin,
    resetAdminPassword,
    toggleAdminStatus
} from '../controllers/UniversityAdminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// List + Create
router.route('/university-admin')
    .get(protect, admin, getUniversityAdmins)
    .post(protect, admin, createUniversityAdmin);

// Update + Delete individual admin
router.route('/university-admin/:id')
    .put(protect, admin, updateUniversityAdmin)
    .delete(protect, admin, deleteUniversityAdmin);

// Specialized action routes
router.put('/university-admin/:id/reset-password', protect, admin, resetAdminPassword);
router.patch('/university-admin/:id/status', protect, admin, toggleAdminStatus);

export default router;