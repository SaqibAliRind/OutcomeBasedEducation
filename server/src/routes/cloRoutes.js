import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getCLOs, 
    createCLO, 
    updateCLO, 
    deleteCLO,
    mapCLOtoPLOs,
    mapCLOtoGAs
} from '../controllers/cloController.js';

const router = express.Router();

router.get('/', protect, getCLOs);
router.post('/', protect, admin, createCLO);
router.put('/:id', protect, admin, updateCLO);
router.delete('/:id', protect, admin, deleteCLO);
router.put('/:id/map-plos', protect, admin, mapCLOtoPLOs);
router.put('/:id/map-gas', protect, admin, mapCLOtoGAs);

export default router;
