import express from 'express';
import { getUsers, createUser, bulkCreateUsers, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword } from '../controllers/userController.js';
import { protect, admin, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',                          protect, authorize('SuperAdmin', 'UniversityAdmin', 'Dean', 'HOD', 'ProgramCoordinator', 'Teacher'), getUsers);
router.post('/',                         protect, admin, createUser);
router.post('/bulk',                     protect, admin, bulkCreateUsers);
router.put('/:id',                       protect, admin, updateUser);
router.delete('/:id',                    protect, admin, deleteUser);
router.put('/:id/status',                protect, admin, toggleUserStatus);
router.put('/:id/reset-password',        protect, admin, adminResetUserPassword);

export default router;
