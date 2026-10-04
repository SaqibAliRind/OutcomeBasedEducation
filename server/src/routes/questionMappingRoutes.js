import express from 'express';
import {
    getMappings,
    createMapping,
    updateMapping,
    deleteMapping,
    copyMapping
} from '../controllers/questionMappingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMappings)
    .post(protect, createMapping);

router.post('/copy', protect, copyMapping);

router.route('/:id')
    .put(protect, updateMapping)
    .delete(protect, admin, deleteMapping);

export default router;
