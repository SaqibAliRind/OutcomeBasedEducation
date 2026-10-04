import CourseFile from '../models/CourseFile.js';
import { CourseOffering, Mark, Attendance, QuestionMapping, Blueprint, Rubric } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POPULATE = (q) => q
    .populate({ path: 'courseOffering', populate: [{ path: 'course', select: 'name code creditHours type' }, { path: 'section', select: 'name' }, { path: 'semester', select: 'name status' }, { path: 'program', select: 'name' }] })
    .populate('teacher', 'name email')
    .populate('lessonPlan.clo', 'code description')
    .populate('closingLoop.weakCLO', 'code description');

// ─── COMPLETENESS ──────────────────────────────────────────────────────────────
const calcCompleteness = (cf) => {
    let score = 0, total = 7;
    if (cf.courseOutline?.length > 0) score++;
    if (cf.lessonPlan?.length > 0) score++;
    if (cf.teachingMaterial?.length > 0) score++;
    if (cf.assessmentPapers?.length > 0) score++;
    if (cf.sampleStudentWork?.length > 0) score++;
    if (cf.closingLoop?.length > 0) score++;
    if (cf.supportingEvidence?.length > 0) score++;
    return Math.round((score / total) * 100);
};

// @desc  Get all course files (teacher sees own; admin sees all)
// @route GET /api/course-files
export const getCourseFiles = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'Teacher') filter.teacher = req.user._id;
        if (req.user.role === 'HOD' && req.user.department) {
            const deptOfferings = await CourseOffering.find({ department: req.user.department }).select('_id');
            filter.courseOffering = { $in: deptOfferings.map(o => o._id) };
        }
        if (req.user.role === 'ProgramCoordinator' && req.user.program) {
            const progOfferings = await CourseOffering.find({ program: req.user.program }).select('_id');
            filter.courseOffering = { $in: progOfferings.map(o => o._id) };
        }
        if (req.query.courseOffering) filter.courseOffering = req.query.courseOffering;
        if (req.query.status) filter.status = req.query.status;

        const files = await POPULATE(CourseFile.find(filter)).sort({ updatedAt: -1 });
        res.json(files);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Get one course file by courseOffering id
// @route GET /api/course-files/offering/:offeringId
export const getByOffering = async (req, res) => {
    try {
        // Guard: reject non-ObjectId strings immediately to prevent Mongoose CastError → 500
        if (!req.params.offeringId || !/^[a-f\d]{24}$/i.test(req.params.offeringId)) {
            return res.status(400).json({ message: 'Invalid offering ID format' });
        }
        let cf = await POPULATE(CourseFile.findOne({ courseOffering: req.params.offeringId }));

        if (!cf) {
            // Auto-create empty file if it is opened for the first time
            const offering = await CourseOffering.findById(req.params.offeringId);
            if (!offering) return res.status(404).json({ message: 'Offering not found' });
            cf = await CourseFile.create({ courseOffering: req.params.offeringId, teacher: offering.teacher });
            cf = await POPULATE(CourseFile.findById(cf._id));
        }

        // Attach live stats from other modules
        const [markRecords, attendanceRecords, mappings, blueprints, rubrics] = await Promise.all([
            Mark.find({ courseOffering: req.params.offeringId }).populate('assessment', 'name type totalMarks'),
            Attendance.find({ courseOffering: req.params.offeringId }),
            QuestionMapping.find({ assessment: { $exists: true } }).limit(50),
            Blueprint.find({ course: cf.courseOffering?.course?._id || '' }),
            Rubric.find({ course: cf.courseOffering?.course?._id || '', teacher: req.user._id })
        ]);

        // Grade distribution from aggregated marks per student
        const gradeMap = {};
        let totalObtained = 0, totalPossible = 0, passCount = 0, failCount = 0;
        
        // Aggregate marks per student
        const studentAgg = {};
        const totalCourseMarks = markRecords.reduce((sum, mr) => sum + (mr.assessment?.totalMarks || 0), 0);
        
        markRecords.forEach(mr => {
            mr.students.forEach(s => {
                if (!studentAgg[s.student]) studentAgg[s.student] = { obtained: 0 };
                studentAgg[s.student].obtained += s.obtainedMarks;
            });
        });

        const totalStudents = Object.keys(studentAgg).length;
        
        Object.values(studentAgg).forEach(s => {
            const pct = totalCourseMarks > 0 ? (s.obtained / totalCourseMarks) * 100 : 0;
            const grade = pct >= 90 ? 'A+' : pct >= 85 ? 'A' : pct >= 80 ? 'A-' : pct >= 75 ? 'B+' : pct >= 70 ? 'B' : pct >= 65 ? 'B-' : pct >= 60 ? 'C+' : pct >= 55 ? 'C' : pct >= 50 ? 'D' : 'F';
            gradeMap[grade] = (gradeMap[grade] || 0) + 1;
            totalObtained += s.obtained;
            totalPossible += totalCourseMarks;
            if (pct >= 50) passCount++; else failCount++;
        });

        const liveStats = {
            marks: { gradeDistribution: gradeMap, passCount, failCount, totalStudents, avgPercentage: totalPossible > 0 ? ((totalObtained / totalPossible) * 100).toFixed(1) : 0 },
            attendance: { total: attendanceRecords.length },
            mappings: mappings.length,
            blueprints: blueprints.length,
            rubrics: rubrics.length
        };

        res.json({ courseFile: cf, liveStats });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Update a section of the course file
// @route PATCH /api/course-files/:id/section
export const updateSection = async (req, res) => {
    try {
        const { section, data } = req.body;
        const allowed = ['courseOutline', 'lessonPlan', 'teachingMaterial', 'assessmentPapers', 'sampleStudentWork', 'supportingEvidence', 'additionalDocs', 'closingLoop'];
        if (!allowed.includes(section)) return res.status(400).json({ message: 'Invalid section' });

        const cf = await CourseFile.findById(req.params.id);
        if (!cf) return res.status(404).json({ message: 'Course file not found' });
        if (cf.teacher.toString() !== req.user._id.toString() && !['UniversityAdmin', 'SuperAdmin', 'HOD', 'QEC'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (['Approved', 'Archived'].includes(cf.status)) return res.status(403).json({ message: 'File is locked' });

        cf[section] = data;
        cf.completeness = calcCompleteness(cf);
        await cf.save();
        const updated = await POPULATE(CourseFile.findById(cf._id));
        res.json(updated);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Update status (workflow)
// @route PATCH /api/course-files/:id/status
export const updateStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const cf = await CourseFile.findById(req.params.id);
        if (!cf) return res.status(404).json({ message: 'Not found' });

        cf.workflowHistory.push({ fromStatus: cf.status, toStatus: status, changedBy: req.user._id, remarks });
        cf.status = status;
        if (status === 'Approved') cf.version += 1;
        await cf.save();
        res.json(cf);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Upload a document file and attach to a course file section
// @route POST /api/course-files/:id/upload
export const uploadDocument = async (req, res) => {
    try {
        const { section, version } = req.body;
        if (!req.files || !req.files.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!section) return res.status(400).json({ message: 'Section is required' });

        const cf = await CourseFile.findById(req.params.id);
        if (!cf) return res.status(404).json({ message: 'Course file not found' });
        if (['Approved', 'Archived'].includes(cf.status)) return res.status(403).json({ message: 'File is locked' });

        const uploadedFile = req.files.file;
        const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}_${safeName}`;

        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'course-files');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const filePath = path.join(uploadsDir, fileName);
        await uploadedFile.mv(filePath);

        const url = `/uploads/course-files/${fileName}`;
        const docEntry = {
            name: uploadedFile.name,
            url,
            version: version || 'v1.0',
            uploadedBy: req.user._id,
            uploadedAt: new Date()
        };

        cf[section] = [...(cf[section] || []), docEntry];
        cf.completeness = calcCompleteness(cf);
        await cf.save();

        const updated = await POPULATE(CourseFile.findById(cf._id));
        res.json(updated);
    } catch (e) {
        console.error('Upload error:', e);
        res.status(500).json({ message: e.message });
    }
};

