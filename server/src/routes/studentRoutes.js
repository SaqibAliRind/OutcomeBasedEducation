import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
    getStudentProfile,
    updatePersonalInfo,
    updateGuardianInfo,
    updateAcademicInfo,
    uploadDocument,
    deleteDocument
} from '../controllers/studentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getStudentDashboard } from '../controllers/studentDashController.js';


const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename(req, file, cb) {
        cb(null, `student-${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Dashboard
router.get('/dashboard', protect, getStudentDashboard);

// Profile endpoints
router.route('/:userId')
    .get(protect, getStudentProfile);

router.route('/:userId/personal')
    .put(protect, updatePersonalInfo);

router.route('/:userId/guardian')
    .put(protect, updateGuardianInfo);

router.route('/:userId/academic')
    .put(protect, updateAcademicInfo);

// Documents
router.route('/:userId/documents')
    .post(protect, upload.single('file'), uploadDocument);

router.route('/:userId/documents/:docId')
    .delete(protect, deleteDocument);

export default router;