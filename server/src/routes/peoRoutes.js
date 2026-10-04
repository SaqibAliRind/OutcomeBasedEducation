import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getPEOs, 
    createPEO, 
    updatePEO, 
    deletePEO,
    mapPEOtoPLOs
} from '../controllers/peoController.js';

const router = express.Router();

router.get('/', protect, getPEOs);
router.post('/', protect, admin, createPEO);
router.put('/:id', protect, admin, updatePEO);
router.delete('/:id', protect, admin, deletePEO);
router.put('/:id/map-plos', protect, admin, mapPEOtoPLOs);

export default router;
