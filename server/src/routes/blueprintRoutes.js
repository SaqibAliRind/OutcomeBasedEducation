import express from 'express';
import {
    getBlueprints,
    createBlueprint,
    updateBlueprint,
    deleteBlueprint,
    copyBlueprint
} from '../controllers/blueprintController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getBlueprints)
    .post(protect, createBlueprint);

router.post('/copy', protect, copyBlueprint);

router.route('/:id')
    .put(protect, updateBlueprint)
    .delete(protect, admin, deleteBlueprint);

export default router;
