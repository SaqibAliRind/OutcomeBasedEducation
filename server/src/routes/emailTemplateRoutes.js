import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getTemplates, updateTemplate, sendTestEmail } from '../controllers/emailTemplateController.js';

const router = express.Router();

router.get('/', protect, admin, getTemplates);
router.put('/:id', protect, admin, updateTemplate);
router.post('/:id/send-test', protect, admin, sendTestEmail);

export default router;
