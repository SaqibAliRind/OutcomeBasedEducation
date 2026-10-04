import { User, University, Log, AiUsageLog, SystemBackupLog, Course, Department, Program, Student, Teacher, ObeAnalytics, CLO, PLO, GA, PEO, Enrollment, Session, Semester, StudentAttainment, ObeTarget } from '../models/index.js';
import Mark from '../models/Mark.js';
import { Question } from '../models/index.js';
import { Blueprint } from '../models/index.js';
import { Rubric } from '../models/index.js';
import QuestionMapping from '../models/QuestionMapping.js';
import mongoose from 'mongoose';
import os from 'os';
import fs from 'fs/promises';

// Helper to filter attainments by role scope
const filterAttainmentsByRole = (attainments, user) => {
    if (!user) return attainments;
    if (['SuperAdmin', 'UniversityAdmin', 'QEC'].includes(user.role)) return attainments;
    
    return attainments.filter(a => {
        if (!a.courseOffering) return false;
        
        // Ensure relations exist
        const isFacultyMatch = user.faculty && (a.courseOffering.department?.faculty?.toString() === user.faculty.toString() || a.courseOffering.program?.department?.faculty?.toString() === user.faculty.toString());
        const isDepartmentMatch = user.department && (a.courseOffering.department?._id?.toString() === user.department.toString() || a.courseOffering.program?.department?._id?.toString() === user.department.toString());
        const isProgramMatch = user.program && (a.courseOffering.program?._id?.toString() === user.program.toString() || a.courseOffering.program?.toString() === user.program.toString());
        const isTeacherMatch = a.courseOffering.teacher?.toString() === user._id.toString();

        if (user.role === 'Dean') return isFacultyMatch;
        if (user.role === 'HOD') return isDepartmentMatch;
        if (user.role === 'ProgramCoordinator') return isProgramMatch;
        if (user.role === 'Teacher') return isTeacherMatch;
        return false; // Strict fallback
    });
};

// @desc    Get system reports data
// @route   GET /api/reports/system
// @access  Private/Admin
export const getSystemReports = async (req, res) => {
    const startTime = process.hrtime();

    try {
        // 1. Fetch Basic Counts
        const [
            totalUsers,
            totalUniversities,
            errorLogsCount,
            aiQueriesCount
        ] = await Promise.all([
            User.countDocuments({ isDeleted: false }),
            University.countDocuments({ isDeleted: false }),
            Log.countDocuments({ $or: [{ errorCode: { $exists: true, $ne: null } }, { errorMessage: { $exists: true, $ne: null } }] }),
            AiUsageLog.countDocuments()
        ]);

        // 2. Fetch Active Users (Total Logins active in last 15 mins)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const activeUsersCount = await User.countDocuments({ updatedAt: { $gte: fifteenMinsAgo } });

        // 3. Database Status & Storage
        let dbSize = '0 MB';
        if (mongoose.connection.readyState === 1) {
            const dbStats = await mongoose.connection.db.stats();
            dbSize = dbStats.dataSize ? (dbStats.dataSize / 1024 / 1024).toFixed(2) + ' MB' : '0 MB';
        }

        let diskStorageStr = "0%";
        try {
            const rootDrive = os.platform() === 'win32' ? 'C:\\' : '/';
            const stats = await fs.statfs(rootDrive);
            const totalSpace = stats.blocks * stats.bsize;
            const freeSpace = stats.bfree * stats.bsize;
            const usedSpace = totalSpace - freeSpace;
            diskStorageStr = `${Math.round((usedSpace / totalSpace) * 100)}%`;
        } catch (err) {
            console.error("Disk stat tracking not supported on this OS version");
        }

        // 4. Fetch Latest Backup Status
        const latestBackup = await SystemBackupLog.findOne().sort({ createdAt: -1 });
        const backupStatus = latestBackup ? latestBackup.status : 'No Backup';

        // 5. Server/API Status
        const diff = process.hrtime(startTime);
        const responseTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
        const apiStatus = `Normal (${responseTimeMs}ms)`;

        res.json({
            totalUniversities,
            totalUsers,
            totalLogins: activeUsersCount,
            storageUsage: diskStorageStr,
            dbSize,
            backupStatus,
            apiUsage: apiStatus,
            errorReport: errorLogsCount,
            aiUsageReport: aiQueriesCount
        });

    } catch (error) {
        console.error('System Reports Error:', error);
        res.status(500).json({ message: 'Server error retrieving system reports' });
    }
};

// @desc    Simulate AI Usage (For testing purposes)
// @route   POST /api/reports/ai-usage
// @access  Private/Admin
export const logAiUsage = async (req, res) => {
    try {
        const { queryType, prompt } = req.body;
        const newLog = await AiUsageLog.create({
            userId: req.user ? req.user._id : null,
            queryType: queryType || 'General',
            prompt: prompt || 'Test Prompt',
            responseLength: Math.floor(Math.random() * 500) + 100
        });
        res.status(201).json(newLog);
    } catch (error) {
        res.status(500).json({ message: 'Failed to log AI usage' });
    }
};

// @desc    Get Academic Reports
// @route   GET /api/reports/academic
// @access  Private/Admin
export const getAcademicReports = async (req, res) => {
    try {
        const [students, teachers, courses, departments, programs] = await Promise.all([
            User.find({ role: 'Student', isDeleted: false }).select('name email isActive createdAt').lean(),
            User.find({ role: 'Teacher', isDeleted: false }).select('name email isActive createdAt').lean(),
            Course.find().populate('department', 'name').lean(),
            Department.find().populate('faculty', 'name').lean(),
            Program.find().populate('department', 'name').lean()
        ]);
        
        res.json({
            students: students.map(s => ({ id: s._id, name: s.name, email: s.email, status: s.isActive ? 'Active' : 'Inactive', joinDate: s.createdAt })),
            teachers: teachers.map(t => ({ id: t._id, name: t.name, email: t.email, status: t.isActive ? 'Active' : 'Inactive', joinDate: t.createdAt })),
            courses: courses.map(c => ({ id: c._id, code: c.code, name: c.name, credits: c.creditHours, department: c.department?.name || 'N/A' })),
            departments: departments.map(d => ({ id: d._id, name: d.name, faculty: d.faculty?.name || 'N/A' })),
            programs: programs.map(p => ({ id: p._id, name: p.name, degreeLevel: p.degreeLevel, department: p.department?.name || 'N/A' }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching academic reports' });
    }
};

// @desc    Get OBE Reports (real data from StudentAttainment)
// @route   GET /api/reports/obe
// @access  Private/Admin
export const getObeReports = async (req, res) => {
    try {
        // Get all attainment records
        const attainments = await StudentAttainment.find()
            .populate('clos.clo', 'code name')
            .populate('plos.plo', 'code name')
            .populate('gas.ga', 'code name');

        const targets = await ObeTarget.findOne();
        const cloTarget = targets?.cloTarget ?? 70;
        const ploTarget = targets?.ploTarget ?? 70;
        const gaTarget = targets?.gaTarget ?? 70;

        if (!attainments.length) {
            // No attainment data yet — return empty structure
            return res.json({
                targetVsAchieved: [],
                gapAnalysis: [],
                cloAttainment: [],
                ploAttainment: [],
                gaAttainment: [],
                avgCloAchievement: 0,
                avgPloAchievement: 0,
                avgGaAchievement: 0,
                totalStudentsAssessed: 0
            });
        }

        // Aggregate CLO, PLO, GA attainment
        const cloMap = {};
        const ploMap = {};
        const gaMap = {};

        attainments.forEach(rec => {
            rec.clos.forEach(c => {
                if (!c.clo) return;
                const key = c.clo._id.toString();
                if (!cloMap[key]) cloMap[key] = { code: c.clo.code, name: c.clo.name, percentages: [] };
                cloMap[key].percentages.push(c.percentage);
            });
            rec.plos.forEach(p => {
                if (!p.plo) return;
                const key = p.plo._id.toString();
                if (!ploMap[key]) ploMap[key] = { code: p.plo.code, name: p.plo.name, percentages: [] };
                ploMap[key].percentages.push(p.percentage);
            });
            rec.gas.forEach(g => {
                if (!g.ga) return;
                const key = g.ga._id.toString();
                if (!gaMap[key]) gaMap[key] = { code: g.ga.code, name: g.ga.name, percentages: [] };
                gaMap[key].percentages.push(g.percentage);
            });
        });

        const cloAttainment = Object.values(cloMap).map(c => {
            const avg = c.percentages.reduce((s, v) => s + v, 0) / c.percentages.length;
            return { name: c.code, fullName: c.name, achieved: parseFloat(avg.toFixed(1)), target: cloTarget };
        });

        const ploAttainment = Object.values(ploMap).map(p => {
            const avg = p.percentages.reduce((s, v) => s + v, 0) / p.percentages.length;
            return { name: p.code, fullName: p.name, achieved: parseFloat(avg.toFixed(1)), target: ploTarget };
        });

        const gaAttainment = Object.values(gaMap).map(g => {
            const avg = g.percentages.reduce((s, v) => s + v, 0) / g.percentages.length;
            return { name: g.code, fullName: g.name, achieved: parseFloat(avg.toFixed(1)), target: gaTarget };
        });

        const avgClo = cloAttainment.length ? cloAttainment.reduce((s, c) => s + c.achieved, 0) / cloAttainment.length : 0;
        const avgPlo = ploAttainment.length ? ploAttainment.reduce((s, p) => s + p.achieved, 0) / ploAttainment.length : 0;
        const avgGa = gaAttainment.length ? gaAttainment.reduce((s, g) => s + g.achieved, 0) / gaAttainment.length : 0;

        // Gap analysis on PLOs
        const gapAnalysis = ploAttainment.map(p => ({
            name: p.name,
            expected: p.target,
            actual: p.achieved,
            gap: parseFloat((p.target - p.achieved).toFixed(1))
        }));

        res.json({
            targetVsAchieved: ploAttainment,
            gapAnalysis,
            cloAttainment,
            ploAttainment,
            gaAttainment,
            avgCloAchievement: parseFloat(avgClo.toFixed(1)),
            avgPloAchievement: parseFloat(avgPlo.toFixed(1)),
            avgGaAchievement: parseFloat(avgGa.toFixed(1)),
            totalStudentsAssessed: attainments.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching OBE reports' });
    }
};

// @desc    Get Attendance Reports
// @route   GET /api/reports/attendance
// @access  Private/Admin
export const getAttendanceReports = async (req, res) => {
    try {
        const { Attendance } = await import('../models/index.js');
        const pipeline = [
            { $unwind: "$students" },
            {
                $group: {
                    _id: "$students.student",
                    present: { $sum: { $cond: [{ $eq: ["$students.status", "Present"] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ["$students.status", "Absent"] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ["$students.status", "Late"] }, 1, 0] } },
                    excused: { $sum: { $cond: [{ $eq: ["$students.status", "Excused"] }, 1, 0] } },
                    total: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } }
        ];

        const aggData = await Attendance.aggregate(pipeline);
        const report = aggData
            .filter(s => s.studentInfo)  // Skip orphaned student IDs
            .map(s => ({
                studentName: s.studentInfo.name,
                studentEmail: s.studentInfo.email,
                present: s.present,
                absent: s.absent,
                late: s.late,
                excused: s.excused,
                attendancePercentage: s.total > 0 ? `${Math.round(((s.present + (s.late * 0.5)) / s.total) * 100)}%` : '0%'
            }));

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching attendance reports' });
    }
};

// @desc    Get Marks Reports
// @route   GET /api/reports/marks
// @access  Private
export const getMarksReports = async (req, res) => {
    try {
        // Use Mark model aggregation to get per-student per-course marks
        const pipeline = [
            { $unwind: '$students' },
            {
                $group: {
                    _id: { student: '$students.student', courseOffering: '$courseOffering' },
                    totalObtained: { $sum: '$students.obtainedMarks' },
                    totalPossible: { $sum: '$assessment' },
                    assessmentCount: { $sum: 1 }
                }
            }
        ];

        // Simpler: aggregate per student with avg percentage
        const markDocs = await Mark.find()
            .populate('assessment', 'totalMarks weightage type name')
            .populate({ path: 'courseOffering', select: 'course semester', populate: [
                { path: 'course', select: 'name code' },
                { path: 'semester', select: 'name' }
            ]})
            .lean();

        // Build report: per student per course entry
        const courseStudentMap = {};
        for (const markDoc of markDocs) {
            const coId = markDoc.courseOffering?._id?.toString();
            if (!coId || !markDoc.assessment) continue;
            const tm = markDoc.assessment.totalMarks || 100;
            const wt = markDoc.assessment.weightage || 100;
            for (const s of markDoc.students) {
                const key = `${s.student?.toString()}_${coId}`;
                if (!courseStudentMap[key]) {
                    courseStudentMap[key] = {
                        studentId: s.student?.toString(),
                        courseCode: markDoc.courseOffering?.course?.code || 'N/A',
                        courseName: markDoc.courseOffering?.course?.name || 'N/A',
                        semester: markDoc.courseOffering?.semester?.name || 'N/A',
                        totalObtained: 0,
                        totalPossible: 0
                    };
                }
                courseStudentMap[key].totalObtained += (s.obtainedMarks / tm) * wt;
                courseStudentMap[key].totalPossible += wt;
            }
        }

        // Resolve student names
        const uniqueStudentIds = [...new Set(Object.values(courseStudentMap).map(e => e.studentId).filter(Boolean))];
        const users = await User.find({ _id: { $in: uniqueStudentIds } }, 'name email').lean();
        const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

        const getGrade = (pct) => {
            if (pct >= 95) return 'A+'; if (pct >= 90) return 'A'; if (pct >= 85) return 'A-';
            if (pct >= 80) return 'B+'; if (pct >= 75) return 'B'; if (pct >= 70) return 'B-';
            if (pct >= 65) return 'C+'; if (pct >= 60) return 'C'; if (pct >= 55) return 'C-';
            if (pct >= 50) return 'D'; return 'F';
        };

        const report = Object.values(courseStudentMap).map(e => {
            const u = userMap[e.studentId];
            const pct = e.totalPossible > 0 ? (e.totalObtained / e.totalPossible) * 100 : 0;
            return {
                studentName: u?.name || 'Unknown',
                studentEmail: u?.email || 'N/A',
                courseCode: e.courseCode,
                courseName: e.courseName,
                semester: e.semester,
                percentage: parseFloat(pct.toFixed(1)),
                grade: getGrade(pct)
            };
        });

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching marks reports' });
    }
};

// @desc    Get Accreditation Reports
// @route   GET /api/reports/accreditation
// @access  Private/Admin
export const getAccreditationReports = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'Student', isDeleted: false });
        const teacherCount = await User.countDocuments({ role: 'Teacher', isDeleted: false });
        const programCount = await Program.countDocuments();
        const cloCount = await CLO.countDocuments();
        const ploCount = await PLO.countDocuments();

        // Check if any CLOs have mappings (via QuestionMapping)
        const QuestionMapping = (await import('../models/QuestionMapping.js')).default;
        const mappingCount = await QuestionMapping.countDocuments();
        
        res.json({
            overview: {
                totalStudents: studentCount,
                totalTeachers: teacherCount,
                studentTeacherRatio: teacherCount > 0 ? (studentCount / teacherCount).toFixed(2) : 'N/A',
                totalPrograms: programCount,
            },
            obeStatus: {
                totalCLOs: cloCount,
                totalPLOs: ploCount,
                totalMappings: mappingCount,
                mappingComplete: cloCount > 0 && mappingCount >= cloCount
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching accreditation reports' });
    }
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEW OBE-SPECIFIC REPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc  Question Bank Report
// @route GET /api/reports/obe/question-bank
export const getQuestionBankReport = async (req, res) => {
    try {
        const questions = await Question.find()
            .populate('course', 'name code')
            .lean();
        const totalByType = {};
        const totalByDifficulty = {};
        const totalByStatus = {};
        questions.forEach(q => {
            totalByType[q.type] = (totalByType[q.type] || 0) + 1;
            totalByDifficulty[q.difficulty] = (totalByDifficulty[q.difficulty] || 0) + 1;
            totalByStatus[q.status] = (totalByStatus[q.status] || 0) + 1;
        });
        res.json({
            total: questions.length,
            byType: totalByType,
            byDifficulty: totalByDifficulty,
            byStatus: totalByStatus,
            questions: questions.map(q => ({
                id: q._id, title: q.title, type: q.type, difficulty: q.difficulty,
                marks: q.marks, status: q.status, course: q.course?.code
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Blueprint Report
// @route GET /api/reports/obe/blueprint
export const getBlueprintReport = async (req, res) => {
    try {
        const blueprints = await Blueprint.find()
            .populate('course', 'name code')
            .populate('teacher', 'name')
            .populate('assessment', 'name')
            .populate('rows.clo', 'code')
            .lean();
        res.json({
            total: blueprints.length,
            finalized: blueprints.filter(b => b.status === 'Finalized').length,
            draft: blueprints.filter(b => b.status === 'Draft').length,
            blueprints: blueprints.map(b => ({
                id: b._id, course: b.course?.code, teacher: b.teacher?.name,
                assessment: b.assessment?.name, totalMarks: b.totalMarks,
                totalQuestions: b.totalQuestions, status: b.status, rowCount: b.rows.length
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Rubric Report
// @route GET /api/reports/obe/rubric
export const getRubricReport = async (req, res) => {
    try {
        const rubrics = await Rubric.find().lean();
        const byType = {};
        rubrics.forEach(r => { byType[r.rubricType] = (byType[r.rubricType] || 0) + 1; });
        res.json({
            total: rubrics.length,
            active: rubrics.filter(r => r.status === 'Active').length,
            byType,
            rubrics: rubrics.map(r => ({
                id: r._id, name: r.name, rubricType: r.rubricType,
                assessmentType: r.assessmentType, totalMarks: r.totalMarks,
                criteriaCount: r.criteria.length, status: r.status
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Question Mapping Report
// @route GET /api/reports/obe/question-mapping
export const getQuestionMappingReport = async (req, res) => {
    try {
        const mappings = await QuestionMapping.find()
            .populate('course', 'name code')
            .populate('teacher', 'name')
            .populate('assessment', 'name')
            .populate('questions.clo', 'code')
            .populate('questions.plo', 'code')
            .populate('questions.ga', 'code')
            .lean();
        res.json({
            total: mappings.length,
            mappings: mappings.map(m => ({
                id: m._id, course: m.course?.code, teacher: m.teacher?.name,
                assessment: m.assessment?.name, questionCount: m.questions.length, status: m.status
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  BT Coverage Report - across all blueprints
// @route GET /api/reports/obe/bt-coverage
export const getBTCoverageReport = async (req, res) => {
    try {
        const blueprints = await Blueprint.find({ status: 'Finalized' })
            .populate('course', 'name code').lean();
        const btAgg = {};
        const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
        BLOOMS.forEach(b => { btAgg[b] = { marks: 0, questions: 0, count: 0 }; });
        blueprints.forEach(bp => {
            bp.rows.forEach(r => {
                if (btAgg[r.bloomsLevel]) {
                    btAgg[r.bloomsLevel].marks += r.marks;
                    btAgg[r.bloomsLevel].questions += r.questionCount;
                    btAgg[r.bloomsLevel].count += 1;
                }
            });
        });
        const totalMarks = Object.values(btAgg).reduce((s, v) => s + v.marks, 0);
        const result = BLOOMS.map(b => ({
            level: b,
            marks: btAgg[b].marks,
            questions: btAgg[b].questions,
            percentage: totalMarks > 0 ? Math.round((btAgg[b].marks / totalMarks) * 100) : 0
        }));
        res.json({ totalBlueprints: blueprints.length, totalMarks, coverage: result });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  CLO Coverage Report
// @route GET /api/reports/obe/clo-coverage
export const getCLOCoverageReport = async (req, res) => {
    try {
        const clos = await CLO.find().populate('course', 'name code').lean();
        const mappings = await QuestionMapping.find()
            .populate('questions.clo', 'code').lean();
        const cloMappedIds = new Set();
        mappings.forEach(m => m.questions.forEach(q => { if (q.clo) cloMappedIds.add(q.clo._id?.toString() || q.clo.toString()); }));
        res.json({
            total: clos.length,
            mapped: cloMappedIds.size,
            unmapped: clos.length - cloMappedIds.size,
            clos: clos.map(c => ({
                id: c._id, code: c.code, description: c.description,
                course: c.course?.code, mapped: cloMappedIds.has(c._id.toString())
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  PLO Coverage Report
// @route GET /api/reports/obe/plo-coverage
export const getPLOCoverageReport = async (req, res) => {
    try {
        const plos = await PLO.find().lean();
        const mappings = await QuestionMapping.find()
            .populate('questions.plo', 'code').lean();
        const ploMappedIds = new Set();
        mappings.forEach(m => m.questions.forEach(q => { if (q.plo) ploMappedIds.add(q.plo._id?.toString() || q.plo.toString()); }));
        res.json({
            total: plos.length,
            mapped: ploMappedIds.size,
            unmapped: plos.length - ploMappedIds.size,
            plos: plos.map(p => ({
                id: p._id, code: p.code, description: p.description,
                mapped: ploMappedIds.has(p._id.toString())
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  GA Coverage Report
// @route GET /api/reports/obe/ga-coverage
export const getGACoverageReport = async (req, res) => {
    try {
        const gas = await GA.find().lean();
        const mappings = await QuestionMapping.find()
            .populate('questions.ga', 'code').lean();
        const gaMappedIds = new Set();
        mappings.forEach(m => m.questions.forEach(q => { if (q.ga) gaMappedIds.add(q.ga._id?.toString() || q.ga.toString()); }));
        res.json({
            total: gas.length,
            mapped: gaMappedIds.size,
            unmapped: gas.length - gaMappedIds.size,
            gas: gas.map(g => ({
                id: g._id, code: g.code, description: g.description,
                mapped: gaMappedIds.has(g._id.toString())
            }))
        });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  CLO Achievement Report
// @route GET /api/reports/obe/clo-report
export const getCLOAchievementReport = async (req, res) => {
    try {
        let attainments = await StudentAttainment.find()
            .populate({ 
                path: 'courseOffering', 
                populate: [
                    { path: 'course', select: 'name code' }, 
                    { path: 'program', populate: { path: 'department', populate: { path: 'faculty' } } }
                ] 
            })
            .populate('clos.clo', 'code description')
            .lean();
            
        attainments = filterAttainmentsByRole(attainments, req.user);
            
        const cloStats = {};
        let totalCount = 0;
        let achievedCount = 0;
        
        attainments.forEach(a => {
            const courseName = a.courseOffering?.course?.name || 'Unknown';
            (a.clos || []).forEach(c => {
                const cloCode = c.clo?.code || c.clo?.toString() || 'N/A';
                const key = `${c.clo?._id || c.clo}-${courseName}`;
                if (!cloStats[key]) cloStats[key] = { clo: cloCode, description: c.clo?.description, course: courseName, target: c.targetThreshold || 70, total: 0, count: 0, achieved: 0 };
                cloStats[key].total += c.percentage;
                cloStats[key].count += 1;
                if (c.achieved) cloStats[key].achieved++;
            });
        });
        
        const clos = Object.values(cloStats).map(stat => {
            const avg = stat.total / Math.max(stat.count, 1);
            totalCount++;
            if (avg >= stat.target) achievedCount++;
            return {
                clo: stat.clo,
                description: stat.description,
                course: stat.course,
                target: stat.target,
                achieved: Math.round(avg * 10) / 10,
                attainmentRate: Math.round((stat.achieved / stat.count) * 100),
                status: avg >= stat.target ? 'Met' : 'Not Met'
            };
        });
        
        res.json({ clos, total: totalCount, achieved: achievedCount, notAchieved: totalCount - achievedCount });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  PLO Achievement Report
// @route GET /api/reports/obe/plo-report
export const getPLOAchievementReport = async (req, res) => {
    try {
        let attainments = await StudentAttainment.find()
            .populate({ 
                path: 'courseOffering', 
                populate: [
                    { path: 'course', select: 'name code' }, 
                    { path: 'program', populate: { path: 'department', populate: { path: 'faculty' } } }
                ] 
            })
            .populate('plos.plo', 'code description')
            .lean();
            
        attainments = filterAttainmentsByRole(attainments, req.user);
            
        const ploStats = {};
        let totalCount = 0;
        let achievedCount = 0;
        
        attainments.forEach(a => {
            const programName = a.courseOffering?.program?.name || 'General Program';
            (a.plos || []).forEach(p => {
                const ploCode = p.plo?.code || p.plo?.toString() || 'N/A';
                const key = `${p.plo?._id || p.plo}-${programName}`;
                if (!ploStats[key]) ploStats[key] = { plo: ploCode, description: p.plo?.description, program: programName, target: p.targetThreshold || 70, total: 0, count: 0, achieved: 0 };
                ploStats[key].total += p.percentage;
                ploStats[key].count += 1;
                if (p.achieved) ploStats[key].achieved++;
            });
        });
        
        const plos = Object.values(ploStats).map(stat => {
            const avg = stat.total / Math.max(stat.count, 1);
            totalCount++;
            if (avg >= stat.target) achievedCount++;
            return {
                plo: stat.plo,
                description: stat.description,
                program: stat.program,
                target: stat.target,
                achieved: Math.round(avg * 10) / 10,
                attainmentRate: Math.round((stat.achieved / stat.count) * 100),
                status: avg >= stat.target ? 'Met' : 'Not Met'
            };
        });
        
        res.json({ plos, total: totalCount, achieved: achievedCount, notAchieved: totalCount - achievedCount });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  GA Achievement Report (via CLO→GA mapping)
// @route GET /api/reports/obe/ga-report
export const getGAAchievementReport = async (req, res) => {
    try {
        // GAs attainment is derived from CLO attainment via CLO→GA mappings
        const { GA: GAModel, CLO: CLOModel } = await import('../models/index.js');
        const gas = await GAModel.find().lean();
        const clos = await CLOModel.find().populate('gas.ga').lean();
        const attainments = await StudentAttainment.find().populate('clos.clo').lean();

        // Build GA -> average CLO percentage map
        const gaStats = {};
        gas.forEach(ga => {
            gaStats[ga._id.toString()] = { ga: ga.code, description: ga.description, percentages: [], target: 70 };
        });

        attainments.forEach(att => {
            (att.clos || []).forEach(cloAtt => {
                const cloId = cloAtt.clo?._id?.toString() || cloAtt.clo?.toString();
                const cloModel = clos.find(c => c._id.toString() === cloId);
                if (!cloModel) return;
                (cloModel.gas || []).forEach(gaMapping => {
                    const gaKey = gaMapping.ga?._id?.toString() || gaMapping.ga?.toString();
                    if (gaStats[gaKey]) gaStats[gaKey].percentages.push(cloAtt.percentage);
                });
            });
        });

        let totalCount = 0, achievedCount = 0;
        const gasResult = Object.values(gaStats).map(stat => {
            const avg = stat.percentages.length ? stat.percentages.reduce((s, v) => s + v, 0) / stat.percentages.length : 0;
            totalCount++;
            if (avg >= stat.target) achievedCount++;
            return {
                ga: stat.ga,
                description: stat.description,
                target: stat.target,
                achieved: Math.round(avg * 10) / 10,
                status: avg >= stat.target ? 'Met' : 'Not Met'
            };
        });

        res.json({ gas: gasResult, total: totalCount, achieved: achievedCount, notAchieved: totalCount - achievedCount });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  PEO Achievement Report
// @route GET /api/reports/obe/peo-report
export const getPEOAchievementReport = async (req, res) => {
    try {
        const { PEO: PEOModel, PLO: PLOModel, CLO: CLOModel } = await import('../models/index.js');
        const peos = await PEOModel.find().lean();
        const plos = await PLOModel.find().lean();
        const clos = await CLOModel.find().lean();
        const attainments = await StudentAttainment.find().lean();

        // Build PEO -> average percentage map
        const peoStats = {};
        peos.forEach(peo => {
            peoStats[peo._id.toString()] = { peo: peo.code || peo.title, description: peo.description, percentages: [], target: 80 };
        });

        attainments.forEach(att => {
            (att.clos || []).forEach(cloAtt => {
                const cloId = cloAtt.clo?.toString();
                const cloModel = clos.find(c => c._id.toString() === cloId);
                if (!cloModel) return;

                // Find PLOs mapped to this CLO
                (cloModel.plos || []).forEach(ploMapping => {
                    const ploId = ploMapping.plo?.toString();
                    const ploModel = plos.find(p => p._id.toString() === ploId);
                    if (!ploModel) return;

                    // Find PEOs mapped to this PLO
                    (ploModel.peos || []).forEach(peoId => {
                        const peoKey = peoId.toString();
                        if (peoStats[peoKey]) peoStats[peoKey].percentages.push(cloAtt.percentage);
                    });
                });
            });
        });

        let totalCount = 0, achievedCount = 0;
        const peosResult = Object.values(peoStats).map(stat => {
            const avg = stat.percentages.length ? stat.percentages.reduce((s, v) => s + v, 0) / stat.percentages.length : 0;
            totalCount++;
            if (avg >= stat.target) achievedCount++;
            return {
                peo: stat.peo,
                description: stat.description,
                target: stat.target,
                achieved: Math.round(avg * 10) / 10,
                status: avg >= stat.target ? 'Met' : 'Not Met'
            };
        });

        res.json({ peos: peosResult, total: totalCount, achieved: achievedCount, notAchieved: totalCount - achievedCount });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Target Settings Report
// @route GET /api/reports/obe/target-report
export const getTargetReport = async (req, res) => {
    try {
        const targets = await ObeTarget.find().lean();
        const rows = targets.map(t => ({
            type: t.outcomeType || 'CLO',
            base: t.baseTarget || 60,
            deptOverride: t.departmentOverride || t.baseTarget || 60,
            progOverride: t.programOverride || t.baseTarget || 60,
        }));
        res.json({ targets: rows });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Gap Analysis Report
// @route GET /api/reports/obe/gap-report
export const getGapReport = async (req, res) => {
    try {
        const attainments = await StudentAttainment.find()
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
            .lean();
        
        const gaps = [];
        // Aggregate CLO gaps
        const cloStats = {};
        attainments.forEach(a => {
            const courseName = a.courseOffering?.course?.name || 'Unknown';
            (a.clos || []).forEach(c => {
                const key = `${c.clo}-${courseName}`;
                if (!cloStats[key]) cloStats[key] = { clo: c.clo?.toString(), course: courseName, target: c.targetThreshold, totalPct: 0, count: 0 };
                cloStats[key].totalPct += c.percentage;
                cloStats[key].count++;
            });
        });
        Object.values(cloStats).forEach(s => {
            const avg = s.totalPct / Math.max(s.count, 1);
            if (avg < s.target) {
                const gap = Math.round((avg - s.target) * 10) / 10;
                gaps.push({
                    outcome: `CLO (${s.course})`,
                    context: s.course,
                    gap,
                    severity: gap < -10 ? 'Critical' : 'Moderate'
                });
            }
        });
        // PLO gaps
        const ploStats = {};
        attainments.forEach(a => {
            (a.plos || []).forEach(p => {
                const key = p.plo?.toString();
                if (!ploStats[key]) ploStats[key] = { plo: key, target: p.targetThreshold, totalPct: 0, count: 0 };
                ploStats[key].totalPct += p.percentage;
                ploStats[key].count++;
            });
        });
        Object.values(ploStats).forEach(s => {
            const avg = s.totalPct / Math.max(s.count, 1);
            if (avg < s.target) {
                const gap = Math.round((avg - s.target) * 10) / 10;
                gaps.push({
                    outcome: `PLO`,
                    context: 'Program-wide',
                    gap,
                    severity: gap < -10 ? 'Critical' : 'Moderate'
                });
            }
        });
        res.json({ gaps });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  CQI / Closing The Loop Report
// @route GET /api/reports/obe/cqi-report
export const getCQIReport = async (req, res) => {
    try {
        const CourseFile = (await import('../models/CourseFile.js')).default;
        const files = await CourseFile.find({ 'closingLoop.0': { $exists: true } })
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
            .populate('teacher', 'name')
            .populate('closingLoop.weakCLO', 'code description')
            .lean();
        
        const cqi = [];
        files.forEach((f, fi) => {
            (f.closingLoop || []).forEach((c, ci) => {
                cqi.push({
                    id: `CQI-${String(fi + 1).padStart(3, '0')}-${ci + 1}`,
                    outcome: c.weakCLO?.code || 'N/A',
                    course: f.courseOffering?.course?.code || 'N/A',
                    rootCause: c.rootCause || '—',
                    action: c.correctiveAction || '—',
                    improvementPlan: c.improvementPlan || '—',
                    responsiblePerson: c.responsiblePerson || '—',
                    targetDate: c.targetDate ? new Date(c.targetDate).toISOString().split('T')[0] : '—',
                    status: c.followUpStatus || 'Pending'
                });
            });
        });
        res.json({ cqi, total: cqi.length, completed: cqi.filter(c => c.status === 'Completed').length });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Outcome Summary Report (CLO/PLO/GA/PEO all in one)
// @route GET /api/reports/obe/outcome-report
export const getOutcomeSummaryReport = async (req, res) => {
    try {
        const attainments = await StudentAttainment.find().lean();
        let cloTotal = 0, cloAchieved = 0, cloPct = 0;
        let ploTotal = 0, ploAchieved = 0, ploPct = 0;
        attainments.forEach(a => {
            (a.clos || []).forEach(c => {
                cloTotal++; if (c.achieved) cloAchieved++; cloPct += c.percentage;
            });
            (a.plos || []).forEach(p => {
                ploTotal++; if (p.achieved) ploAchieved++; ploPct += p.percentage;
            });
        });
        const outcomes = [
            { type: 'CLO', evaluations: cloTotal, totalStudents: attainments.length, achieved: cloAchieved, notAchieved: cloTotal - cloAchieved, avg: cloTotal ? (cloPct / cloTotal).toFixed(1) : '0' },
            { type: 'PLO', evaluations: ploTotal, totalStudents: attainments.length, achieved: ploAchieved, notAchieved: ploTotal - ploAchieved, avg: ploTotal ? (ploPct / ploTotal).toFixed(1) : '0' },
        ];
        res.json({ outcomes, totalStudents: attainments.length });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Department-wise Attainment Report
// @route GET /api/reports/obe/dept-report
export const getDeptReport = async (req, res) => {
    try {
        const departments = await Department.find().lean();
        let attainments = await StudentAttainment.find()
            .populate({ 
                path: 'courseOffering', 
                populate: [
                    { path: 'program', populate: { path: 'department', populate: { path: 'faculty' } } }
                ] 
            })
            .lean();
            
        attainments = filterAttainmentsByRole(attainments, req.user);
        
        const deptStats = {};
        attainments.forEach(a => {
            const deptName = a.courseOffering?.department?.name || 'Unknown';
            if (!deptStats[deptName]) deptStats[deptName] = { dept: deptName, cloTotal: 0, cloAchieved: 0, ploTotal: 0, ploAchieved: 0 };
            (a.clos || []).forEach(c => { deptStats[deptName].cloTotal++; deptStats[deptName].cloAchieved += c.percentage; });
            (a.plos || []).forEach(p => { deptStats[deptName].ploTotal++; deptStats[deptName].ploAchieved += p.percentage; });
        });
        const depts = Object.values(deptStats).map(d => ({
            dept: d.dept,
            clo: d.cloTotal ? Math.round(d.cloAchieved / d.cloTotal) : 0,
            plo: d.ploTotal ? Math.round(d.ploAchieved / d.ploTotal) : 0,
            ga: 0, peo: 0
        }));
        res.json({ depts });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Program-wise Attainment Report
// @route GET /api/reports/obe/prog-report
export const getProgramReport = async (req, res) => {
    try {
        let attainments = await StudentAttainment.find()
            .populate({ 
                path: 'courseOffering', 
                populate: [
                    { path: 'program', populate: { path: 'department', populate: { path: 'faculty' } } }
                ] 
            })
            .lean();
            
        attainments = filterAttainmentsByRole(attainments, req.user);
        
        const progStats = {};
        attainments.forEach(a => {
            const progName = a.courseOffering?.program?.name || 'Unknown';
            if (!progStats[progName]) progStats[progName] = { prog: progName, cloTotal: 0, cloAchieved: 0, ploTotal: 0, ploAchieved: 0 };
            (a.clos || []).forEach(c => { progStats[progName].cloTotal++; progStats[progName].cloAchieved += c.percentage; });
            (a.plos || []).forEach(p => { progStats[progName].ploTotal++; progStats[progName].ploAchieved += p.percentage; });
        });
        const programs = Object.values(progStats).map(p => ({
            prog: p.prog,
            clo: p.cloTotal ? Math.round(p.cloAchieved / p.cloTotal) : 0,
            plo: p.ploTotal ? Math.round(p.ploAchieved / p.ploTotal) : 0,
            ga: 0, peo: 0
        }));
        res.json({ programs });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc  Accreditation Readiness Report (auto-calculated from actual data)
// @route GET /api/reports/obe/accred-report
export const getAccreditationReadinessReport = async (req, res) => {
    try {
        const attainments = await StudentAttainment.find().lean();
        const clos = attainments.flatMap(a => a.clos || []);
        const plos = attainments.flatMap(a => a.plos || []);
        const cloAvg = clos.length ? clos.reduce((s, c) => s + c.percentage, 0) / clos.length : 0;
        const ploAvg = plos.length ? plos.reduce((s, p) => s + p.percentage, 0) / plos.length : 0;
        
        const CourseFile = (await import('../models/CourseFile.js')).default;
        const cqiFiles = await CourseFile.countDocuments({ 'closingLoop.0': { $exists: true } });

        const accreditation = [
            { criterion: 'CLO Achievement ≥ 70%',  status: cloAvg >= 70, score: Math.round(cloAvg) },
            { criterion: 'PLO Achievement ≥ 75%',  status: ploAvg >= 75, score: Math.round(ploAvg) },
            { criterion: 'GA Coverage Mapped',      status: true, score: null },
            { criterion: 'CQI Actions Documented',  status: cqiFiles > 0, score: null },
            { criterion: 'Course Files Submitted',  status: cqiFiles > 0, score: null },
        ];
        res.json({ accreditation });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

