import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    getWorkflowRequests, 
    getWorkflowById,
    createWorkflowRequest, 
    actionWorkflowRequest, 
    deleteWorkflowRequest,
    getWorkflowStats
} from '../controllers/workflowController.js';

const router = express.Router();

// Stats endpoint must come before /:id to avoid conflicts
router.get('/stats', protect, getWorkflowStats);

router.route('/')
    .get(protect, getWorkflowRequests)
    .post(protect, createWorkflowRequest);

router.route('/:id')
    .get(protect, getWorkflowById)
    .delete(protect, deleteWorkflowRequest);

router.route('/:id/action')
    .put(protect, actionWorkflowRequest);

export default router;
