import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
    getTeacherProfile,
    updatePersonalInfo,
    updateProfessionalInfo,
    addQualification,
    deleteQualification,
    addExperience,
    deleteExperience,
    uploadDocument,
    deleteDocument,
    getTeacherDashboard,
    getAssignedCourses
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

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
        cb(null, `${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ======= Dashboard & Courses (must be before /:userId wildcard) =======
router.get('/dashboard', protect, authorize('Teacher', 'HOD', 'Dean', 'ProgramCoordinator', 'QEC', 'UniversityAdmin', 'SuperAdmin'), getTeacherDashboard);
router.get('/courses', protect, authorize('Teacher', 'HOD', 'Dean', 'ProgramCoordinator', 'QEC', 'UniversityAdmin', 'SuperAdmin'), getAssignedCourses);

// Profile endpoints — these come AFTER static routes
router.route('/:userId')
    .get(protect, getTeacherProfile);

router.route('/:userId/personal')
    .put(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean', 'Teacher'), updatePersonalInfo);

router.route('/:userId/professional')
    .put(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean'), updateProfessionalInfo);

// Arrays (Qualifications & Experience)
router.route('/:userId/qualifications')
    .post(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean'), addQualification);

router.route('/:userId/qualifications/:qualId')
    .delete(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean'), deleteQualification);

router.route('/:userId/experience')
    .post(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean'), addExperience);

router.route('/:userId/experience/:expId')
    .delete(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean'), deleteExperience);;

// Documents
router.route('/:userId/documents')
    .post(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean', 'Teacher'), upload.single('file'), uploadDocument);

router.route('/:userId/documents/:docId')
    .delete(protect, authorize('UniversityAdmin', 'SuperAdmin', 'HOD', 'Dean', 'Teacher'), deleteDocument);

export default router;
