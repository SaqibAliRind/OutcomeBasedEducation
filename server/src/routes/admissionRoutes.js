import express from 'express';
import { admitStudent } from '../controllers/admissionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/new', protect, admin, admitStudent);

export default router;