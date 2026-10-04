import express from 'express';
import { 
    getAllRecords, 
    getRecordById, 
    createRecord, 
    updateRecord, 
    deleteRecord,
    setActiveSession
} from '../controllers/academicController.js';

const router = express.Router();

// Extract the 'module' parameter dynamically (e.g. /api/academic/Faculty to map to Faculty model)
router.get('/:moduleName', getAllRecords);
router.get('/:moduleName/:id', getRecordById);
router.post('/:moduleName', createRecord);
router.put('/:moduleName/:id', updateRecord);
router.delete('/:moduleName/:id', deleteRecord);
router.put('/sessions/:id/activate', setActiveSession);

export default router;
