import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getRegistrations,
    registerSemester,
    freezeRegistration,
    dropRegistration
} from '../controllers/semesterRegistrationController.js';

const router = express.Router();

router.get('/', protect, getRegistrations);
router.post('/', protect, registerSemester);
router.patch('/:id/freeze', protect, freezeRegistration);
router.patch('/:id/drop', protect, dropRegistration);

export default router;
