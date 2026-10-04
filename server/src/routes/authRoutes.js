import express from 'express';
import { authUser, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);

export default router;
