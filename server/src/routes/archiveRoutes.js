import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getArchives, restoreArchive, permanentDeleteArchive } from '../controllers/archiveController.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getArchives);

router.route('/:id/restore')
    .put(protect, admin, restoreArchive);

router.route('/:id/permanent')
    .delete(protect, admin, permanentDeleteArchive);

export default router;
