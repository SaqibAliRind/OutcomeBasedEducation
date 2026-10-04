import express from 'express';
const router = express.Router();
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/roleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, admin, getRoles)
    .post(protect, admin, createRole);

router.route('/:id')
    .put(protect, admin, updateRole)
    .delete(protect, admin, deleteRole);

export default router;
