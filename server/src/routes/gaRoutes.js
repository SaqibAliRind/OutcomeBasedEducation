import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getGAs, 
    createGA, 
    updateGA, 
    deleteGA,
    mapGAtoPLOs,
    bulkInitGAs
} from '../controllers/gaController.js';

const router = express.Router();

router.route('/')
    .get(protect, getGAs)
    .post(protect, admin, createGA);

router.post('/bulk-init', protect, admin, bulkInitGAs);

router.route('/:id')
    .put(protect, admin, updateGA)
    .delete(protect, admin, deleteGA);

router.put('/:id/map-plos', protect, admin, mapGAtoPLOs);

export default router;
