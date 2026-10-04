import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import logRoutes from './routes/logRoutes.js';
import deanRoutes from './routes/deanRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import semesterRegistrationRoutes from './routes/semesterRegistrationRoutes.js';
import academicRecordRoutes from './routes/academicRecordRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import peoRoutes from './routes/peoRoutes.js';
import ploRoutes from './routes/ploRoutes.js';
import cloRoutes from './routes/cloRoutes.js';
import gaRoutes from './routes/gaRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import targetRoutes from './routes/targetRoutes.js';
import assessmentDefinitionRoutes from './routes/assessmentDefinitionRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import questionMappingRoutes from './routes/questionMappingRoutes.js';
import blueprintRoutes from './routes/blueprintRoutes.js';
import rubricRoutes from './routes/rubricRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import markRoutes from './routes/markRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import qecRoutes from './routes/qecRoutes.js';
import archiveRoutes from './routes/archiveRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import universitySettingsRoutes from './routes/universitySettingsRoutes.js';
import emailTemplateRoutes from './routes/emailTemplateRoutes.js';
import courseFileRoutes from './routes/courseFileRoutes.js';
import obeRoutes from './routes/obeRoutes.js';
import cqiRoutes from './routes/cqiRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import { protect, admin } from './middleware/authMiddleware.js';
import fileUpload from 'express-fileupload';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// CORS — allow localhost dev + production Vercel deployments
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
        ];
        // Allow any Vercel deployment (*.vercel.app) and undefined origin (server-to-server)
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use('/uploads', express.static(uploadsDir));
app.use(express.json());
app.use(fileUpload()); // required for restore database features
app.use(express.urlencoded({ extended: true }));

// Debug: log every incoming request
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', protect, academicRoutes);
app.use('/api/assignments', assignmentRoutes);
// ... other middleware
app.use('/api/universities', universityRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', protect, admin, logRoutes);
app.use('/api/dean', deanRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/semester-registration', semesterRegistrationRoutes);
app.use('/api/academic-record', academicRecordRoutes);
app.use('/api/curriculums', curriculumRoutes);
app.use('/api/peos', peoRoutes);
app.use('/api/plos', ploRoutes);
app.use('/api/clos', cloRoutes);
app.use('/api/gas', gaRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/qec', qecRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/university-settings', universitySettingsRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/course-files', courseFileRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/assessments-def', assessmentDefinitionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/question-mappings', questionMappingRoutes);
app.use('/api/blueprints', blueprintRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/obe', obeRoutes);
app.use('/api/cqi', cqiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/audit-logs', auditLogRoutes);

app.get('/', (req, res) => {
    res.send('Al-Kawthar University API is running...');
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

export default app;
