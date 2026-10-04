import express from 'express';
const router = express.Router();
import {
    createUniversity,
    getUniversities,
    updateUniversity,
    deleteUniversity
} from '../controllers/UniversityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/')
    .post(protect, admin, createUniversity)
    .get(protect, admin, getUniversities);

router.route('/:id')
    .put(protect, admin, updateUniversity)
    .delete(protect, admin, deleteUniversity);

export default router;