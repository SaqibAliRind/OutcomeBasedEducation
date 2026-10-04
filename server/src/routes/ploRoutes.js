import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getPLOs, 
    createPLO, 
    updatePLO, 
    deletePLO,
    mapPLOtoPEOs,
    mapPLOtoGAs
} from '../controllers/ploController.js';

const router = express.Router();

router.get('/', protect, getPLOs);
router.post('/', protect, admin, createPLO);
router.put('/:id', protect, admin, updatePLO);
router.delete('/:id', protect, admin, deletePLO);
router.put('/:id/map-peos', protect, admin, mapPLOtoPEOs);
router.put('/:id/map-gas', protect, admin, mapPLOtoGAs);

export default router;
