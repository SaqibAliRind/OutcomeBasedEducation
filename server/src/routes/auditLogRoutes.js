import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getAuditLogs } from '../controllers/auditLogController.js';

const router = express.Router();

router.get('/', protect, authorize('SystemAdmin', 'UniversityAdmin', 'QEC'), getAuditLogs);

export default router;
