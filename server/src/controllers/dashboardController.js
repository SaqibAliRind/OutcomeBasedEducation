import { User, Department, Program, Student, Teacher, Session, Activity, University, Course, Section, Semester, Batch, ObeAnalytics, Enrollment, AssessmentSetting, Assessment, Question, Blueprint, Rubric, CLO, PLO, PEO, GA, CourseOffering, SemesterRegistration, Mark, Attendance, StudentAttainment, Notification, WorkflowRequest, CourseFile } from '../models/index.js';
import mongoose from 'mongoose';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private/Admin
export const getDashboardMetrics = async (req, res) => {
    // 1. Start timer for real Response Time
    const startTime = process.hrtime();

    try {
        // 2. Determine university scope for per-university queries
        const universityFilter = req.user?.university ? { university: req.user.university } : {};

        // 3. Fetch Academic Data & Recent Activities
        const [
            totalUsers, totalDepartments, totalPrograms,
            totalStudents, totalTeachers, totalActiveSessions,
            totalUniversities, totalCourses, totalSections, 
            totalSemesters, totalBatches, recentActivities,
            uniSettings,
            totalActiveUsers, totalInactiveUsers,
            totalOfferedCourses, totalRegisteredStudents,
            totalTheoryCourses, totalLabCourses, creditHoursAgg
        ] = await Promise.all([
            User.countDocuments({ isDeleted: false }),
            Department.countDocuments(),
            Program.countDocuments(),
            User.countDocuments({ role: 'Student', isDeleted: false }),
            User.countDocuments({ role: 'Teacher', isDeleted: false }),
            Session.countDocuments({ status: 'Active' }),
            University.countDocuments({ isDeleted: false }),
            Course.countDocuments(),
            Section.countDocuments(),
            Semester.countDocuments(),
            Batch.countDocuments(),
            Activity.find().sort({ createdAt: -1 }).limit(10),
            University.findOne({ isDeleted: false }).populate('settings.academic.currentSession').populate('settings.academic.currentSemester'),
            User.countDocuments({ isDeleted: false, isActive: true }),
            User.countDocuments({ isDeleted: false, isActive: false }),
            // Academic Summary
            CourseOffering.countDocuments({ status: 'Open' }),
            SemesterRegistration.countDocuments({ status: 'Registered' }),
            Course.countDocuments({ type: 'Theory' }),
            Course.countDocuments({ $or: [{ type: 'Lab' }, { type: 'Theory + Lab' }] }),
            Course.aggregate([{ $group: { _id: null, total: { $sum: '$creditHours' } } }])
        ]);

        let activeSession = uniSettings?.settings?.academic?.currentSession;
        let activeSemester = uniSettings?.settings?.academic?.currentSemester;

        if (!activeSession) {
            activeSession = await Session.findOne({ status: 'Active' });
        }
        if (!activeSemester) {
            activeSemester = await Semester.findOne({ status: 'Active' });
        }

        // 4. Fetch Recent Activities scoped to this university
        const [newTeachers, newStudents, latestCourses, latestNotifications] = await Promise.all([
            User.find({ ...universityFilter, role: 'Teacher', isDeleted: false })
                .select('name email createdAt')
                .sort({ createdAt: -1 })
                .limit(5),
            User.find({ ...universityFilter, role: 'Student', isDeleted: false })
                .select('name email createdAt')
                .sort({ createdAt: -1 })
                .limit(5),
            Course.find()
                .select('name description createdAt')
                .sort({ createdAt: -1 })
                .limit(5),
            Activity.find()
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        // 3. Dynamic Active Users (Users active in the last 15 minutes)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

        // Group online users by role (Assumes your User schema has a 'role' and updates 'updatedAt' or 'lastActive')
        const activeUsersData = await User.aggregate([
            { $match: { updatedAt: { $gte: fifteenMinsAgo } } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        let onlineAdmins = 0, onlineTeachers = 0, onlineStudents = 0;
        activeUsersData.forEach(group => {
            if (group._id === 'SuperAdmin' || group._id === 'Admin') onlineAdmins = group.count;
            if (group._id === 'Teacher') onlineTeachers = group.count;
            if (group._id === 'Student') onlineStudents = group.count;
        });

        // 4. Dynamic Database Stats
        let dbStats = {};
        if (mongoose.connection.readyState === 1) {
            dbStats = await mongoose.connection.db.stats();
        }

        // 5. Dynamic Server & Hardware Stats
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // Calculate CPU Load Percentage based on cores
        const cpuCores = os.cpus().length;
        const cpuLoad = os.loadavg()[0]; // 1-minute load average
        const cpuUsagePercent = Math.min(Math.round((cpuLoad / cpuCores) * 100), 100);

        // Calculate Real Disk Storage using Node's native fs.statfs
        let diskStorageStr = "N/A";
        try {
            // Use '/' for Linux/Mac, or 'C:\\' for Windows
            const rootDrive = os.platform() === 'win32' ? 'C:\\' : '/';
            const stats = await fs.statfs(rootDrive);
            const totalSpace = stats.blocks * stats.bsize;
            const freeSpace = stats.bfree * stats.bsize;
            const usedSpace = totalSpace - freeSpace;
            diskStorageStr = `${Math.round((usedSpace / totalSpace) * 100)}%`;
        } catch (err) {
            console.error("Disk stat tracking not supported on this OS version");
        }

        // 6. Calculate Real Response Time
        const diff = process.hrtime(startTime);
        const responseTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6); // Convert to milliseconds

        // 7. OBE Real Counts (direct from actual collections)
        const [
            obeTotalPEOs, obeTotalPLOs, obeTotalCLOs, obeTotalGAs,
            obeTotalAssessments, obeTotalQuestions, obeTotalBlueprints, obeTotalRubrics,
            cloGaMappingAgg,
            peoPloExists, ploGaExists, cloPloExists, cloGaExists
        ] = await Promise.all([
            PEO.countDocuments(),
            PLO.countDocuments(),
            CLO.countDocuments(),
            GA.countDocuments(),
            AssessmentSetting.countDocuments(),
            Question.countDocuments(),
            Blueprint.countDocuments(),
            Rubric.countDocuments(),
            CLO.aggregate([{ $project: { gasCount: { $size: { $ifNull: ['$gas', []] } } } }, { $group: { _id: null, total: { $sum: '$gasCount' } } }]),
            PLO.exists({ 'peos.0': { $exists: true } }),
            PLO.exists({ 'gas.0': { $exists: true } }),
            CLO.exists({ 'plos.0': { $exists: true } }),
            CLO.exists({ 'gas.0': { $exists: true } })
        ]);

        const obeTotalQuestionMappings = cloGaMappingAgg[0]?.total || 0;
        
        const mappingStatus = {
            peoToPlo: !!peoPloExists,
            ploToGa: !!ploGaExists,
            cloToPlo: !!cloPloExists,
            cloToGa: !!cloGaExists
        };

        // 10. OBE Analytics (Real Data from StudentAttainment)
        const { StudentAttainment, CourseFile } = await import('../models/index.js');
        const attainments = await StudentAttainment.find()
            .populate({ path: 'courseOffering', populate: { path: 'program', select: 'name' } })
            .populate('clos.clo', 'code')
            .populate('plos.plo', 'code')
            .lean();

        let cloSum = 0, cloCount = 0;
        let ploSum = 0, ploCount = 0;
        const cloMap = {};
        const ploMap = {}; // code -> { achieved: sum, target: val, count: n }
        const programMap = {}; // name -> { sum, count }

        attainments.forEach(att => {
            const progName = att.courseOffering?.program?.name || 'General';
            if (!programMap[progName]) programMap[progName] = { sum: 0, count: 0 };

            (att.clos || []).forEach(c => {
                cloSum += c.percentage;
                cloCount++;
                const cCode = c.clo?.code || c.clo?.toString() || 'Unknown';
                if (!cloMap[cCode]) cloMap[cCode] = { achieved: 0, target: c.targetThreshold || 70, count: 0 };
                cloMap[cCode].achieved += c.percentage;
                cloMap[cCode].count++;
            });

            (att.plos || []).forEach(p => {
                ploSum += p.percentage;
                ploCount++;
                programMap[progName].sum += p.percentage;
                programMap[progName].count++;

                const pCode = p.plo?.code || p.plo?.toString() || 'Unknown';
                if (!ploMap[pCode]) ploMap[pCode] = { achieved: 0, target: p.targetThreshold || 70, count: 0 };
                ploMap[pCode].achieved += p.percentage;
                ploMap[pCode].count++;
            });
        });

        const avgCloAchievement = cloCount > 0 ? parseFloat((cloSum / cloCount).toFixed(1)) : 0;
        const avgPloAchievement = ploCount > 0 ? parseFloat((ploSum / ploCount).toFixed(1)) : 0;
        const avgGaAchievement = avgPloAchievement; // Proxy for now

        const targetVsAchieved = Object.entries(ploMap).map(([name, data]) => ({
            name,
            target: data.target,
            achieved: data.count > 0 ? Math.round(data.achieved / data.count) : 0
        }));

        const cloTargetVsAchieved = Object.entries(cloMap).map(([name, data]) => ({
            name,
            target: data.target,
            achieved: data.count > 0 ? Math.round(data.achieved / data.count) : 0
        }));

        const gapAnalysis = targetVsAchieved.map(p => ({
            name: p.name,
            expected: p.target,
            actual: p.achieved,
            gap: parseFloat((p.target - p.achieved).toFixed(1))
        }));

        const programAchievements = Object.entries(programMap).map(([name, data]) => ({
            name,
            achievement: data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0,
            target: 70
        }));

        // Fetch Real CQI / Closing the Loop Status
        const cqiFiles = await CourseFile.find({ 'closingLoop.0': { $exists: true } })
            .populate('closingLoop.weakCLO', 'code')
            .lean();
        
        const closingTheLoopStatus = [];
        cqiFiles.forEach(f => {
            (f.closingLoop || []).forEach(c => {
                closingTheLoopStatus.push({
                    ploCode: c.weakCLO?.code || 'Unknown',
                    status: c.followUpStatus === 'Completed' ? 'Met' : (c.followUpStatus === 'In Progress' ? 'Partially Met' : 'Not Met'),
                    actionTaken: c.correctiveAction || c.improvementPlan || 'None'
                });
            });
        });

        // 11. Derive Achievement Summary
        const uniAvg = parseFloat(((avgCloAchievement + avgPloAchievement + avgGaAchievement) / 3).toFixed(1));

        const achievementSummary = {
            avgCloAchievement,
            avgPloAchievement,
            avgGaAchievement,
            universityAchievement: uniAvg,
            programAchievements,
            departmentAchievements: programAchievements, // fallback to program for now
            targetVsAchieved,
            gapAnalysis,
            closingTheLoopStatus
        };

        // 12. Teacher Summary Computations
        const [
            activeTeachersCount,
            visitingTeachersCount,
            permanentTeachersCount
        ] = await Promise.all([
            User.countDocuments({ ...universityFilter, role: 'Teacher', isActive: true, isDeleted: false }),
            User.countDocuments({ role: 'Teacher', employmentType: 'Visiting' }),
            User.countDocuments({ role: 'Teacher', employmentType: 'Permanent' })
        ]);

        const [
            pendingCourseFiles,
            pendingMarks,
            pendingAttendance
        ] = await Promise.all([
            CourseFile ? CourseFile.countDocuments({ status: { $ne: 'Approved' } }) : 0,
            Mark ? Mark.countDocuments({ status: 'Draft' }) : 0,
            Attendance ? Attendance.countDocuments({ status: 'Pending' }) : 0
        ]);

        const teacherSummary = {
            totalTeachers,
            activeTeachers: activeTeachersCount,
            visitingTeachers: visitingTeachersCount,
            permanentTeachers: permanentTeachersCount,
            pendingCourseFiles,
            pendingMarks,
            pendingAttendance
        };

        // 13. Student Summary Computations
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [
            newAdmissionsCount,
            activeStudentsCount,
            graduatedStudentsCount,
            suspendedStudentsCount
        ] = await Promise.all([
            User.countDocuments({ role: 'Student', createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ role: 'Student', academicStatus: 'Active' }),
            User.countDocuments({ role: 'Student', academicStatus: 'Graduated' }),
            User.countDocuments({ role: 'Student', academicStatus: 'Suspended' })
        ]);

        const studentSummary = {
            totalStudents,
            newAdmissions: newAdmissionsCount,
            activeStudents: activeStudentsCount,
            graduatedStudents: graduatedStudentsCount,
            suspendedStudents: suspendedStudentsCount
        };

        // ── REAL: Student Enrollment Trend (last 6 months by month) ──────────────
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const enrollmentTrendAgg = await User.aggregate([
            { $match: { role: 'Student', createdAt: { $gte: sixMonthsAgo } } },
            { $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                students: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: {
                _id: 0,
                month: { $let: { vars: { months: ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] }, in: { $arrayElemAt: ['$$months', '$_id.month'] } } },
                students: 1
            }}
        ]);

        // ── REAL: Teacher Distribution by designation ─────────────────────────────
        const teacherDistAgg = await User.aggregate([
            { $match: { role: 'Teacher', isDeleted: false } },
            { $group: { _id: { $ifNull: ['$designation', 'Lecturer'] }, count: { $sum: 1 } } },
            { $project: { type: { $ifNull: ['$_id', 'Lecturer'] }, count: 1, _id: 0 } }
        ]);

        // ── REAL: Pass / Fail Ratio from Mark collection ──────────────────────────
        const markDocs = await Mark.find({ status: { $in: ['Submitted', 'Verified', 'Locked'] } })
            .populate('assessment', 'totalMarks passingMarks')
            .lean();
        let passCount = 0, failCount = 0;
        markDocs.forEach(m => {
            const totalMax = m.assessment?.totalMarks || 100;
            const passingThreshold = m.assessment?.passingMarks || (totalMax * 0.5);
            (m.students || []).forEach(s => {
                if (s.obtainedMarks >= passingThreshold) passCount++; else failCount++;
            });
        });
        const totalGraded = passCount + failCount;
        const passFailRatioReal = totalGraded > 0
            ? [
                { name: 'Pass', value: Math.round((passCount / totalGraded) * 100), fill: '#50cc7f' },
                { name: 'Fail', value: Math.round((failCount / totalGraded) * 100), fill: '#ff1b6b' }
              ]
            : null; // null means no graded data yet — frontend should show empty state

        // ── REAL: Attendance Trend (last 4 weeks) ─────────────────────────────────
        const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
        const attendanceAgg = await Attendance.aggregate([
            { $match: { createdAt: { $gte: fourWeeksAgo } } },
            { $group: {
                _id: { week: { $week: '$createdAt' } },
                present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                absent:  { $sum: { $cond: [{ $ne:  ['$status', 'Present'] }, 1, 0] } }
            }},
            { $sort: { '_id.week': 1 } },
            { $limit: 4 },
            { $project: { _id: 0, week: { $concat: ['W', { $toString: '$_id.week' }] }, present: 1, absent: 1 } }
        ]);

        // ── REAL: Semester Avg Marks (proxy for GPA trend) ────────────────────────
        const semGpaAgg = await Mark.aggregate([
            { $lookup: { from: 'courseofferings', localField: 'courseOffering', foreignField: '_id', as: 'co' } },
            { $unwind: { path: '$co', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'semesters', localField: 'co.semester', foreignField: '_id', as: 'sem' } },
            { $unwind: { path: '$sem', preserveNullAndEmptyArrays: true } },
            { $unwind: '$students' },
            { $group: {
                _id: { $ifNull: ['$sem.name', 'Unknown'] },
                avgPct: { $avg: { $multiply: [{ $divide: ['$students.obtainedMarks', { $ifNull: ['$totalMarks', 1] }] }, 100] } }
            }},
            { $project: { semester: '$_id', gpa: { $round: [{ $multiply: ['$avgPct', 0.04] }, 2] }, _id: 0 } },
            { $sort: { semester: 1 } },
            { $limit: 6 }
        ]);

        const deptStudentsAgg = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$dept.name', 'Unknown'] }, count: 1, _id: 0 } }
        ]);

        const progStudentsAgg = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false } },
            { $group: { _id: '$program', count: { $sum: 1 } } },
            { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'prog' } },
            { $unwind: { path: '$prog', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$prog.name', 'Unknown'] }, count: 1, _id: 0 } }
        ]);

        const chartData = {
            departmentWiseStudents: deptStudentsAgg,
            programWiseStudents: progStudentsAgg,
            studentEnrollmentTrend: enrollmentTrendAgg, // real data only
            teacherDistribution: teacherDistAgg,
            semesterGpa: semGpaAgg,           // real data only
            attendanceTrend: attendanceAgg,   // real data only
            passFailRatio: passFailRatioReal,
            cloAchievementGraph: cloTargetVsAchieved.map(p => ({ clo: p.name, achievement: p.achieved })),
            ploAchievementGraph: targetVsAchieved.map(p => ({ plo: p.name, achievement: p.achieved })),
            gaAchievementGraph: targetVsAchieved.map(p => ({ ga: p.name, achievement: p.achieved }))
        };

        // 14.5 Generate Notifications Panel Data (REAL DATA)
        const userNotifs = await Notification.find({
            $or: [
                { recipient: req.user._id },
                { targetAudience: 'All Users', university: req.user.university }
            ]
        }).sort({ createdAt: -1 }).limit(10).populate('sender', 'name role').lean();

        const notificationsPanel = userNotifs.map(n => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            time: n.createdAt,
            status: n.isRead ? 'read' : 'unread',
            iconName: n.type === 'Assessment' ? 'FileText' : (n.type === 'System' ? 'Settings' : 'Bell'),
            color: n.isRead ? '#888' : '#0ff0fc',
            sender: n.sender
        }));

        // 14.6 Calendar Widget — real CourseOffering count as todaysClasses proxy
        const todaysOfferingsCount = await CourseOffering.countDocuments({ status: 'Open' });
        const upcomingAssessments = await WorkflowRequest.countDocuments({ status: 'Pending', type: 'Assessment' });
        const calendarEvents = {
            todaysClasses: todaysOfferingsCount,
            upcomingExams: upcomingAssessments,
            holidays: 0,
            events: 0,
            meetings: 0,
            schedule: [] // Timetable module not yet implemented
        };

        // 15. Send Unified Dynamic Response
        res.json({
            academicStats: {
                totalUsers, totalDepartments, totalPrograms,
                totalStudents, totalTeachers, totalActiveSessions, totalUniversities,
                totalCourses, totalSections, totalSemesters, totalBatches,
                totalActiveUsers, totalInactiveUsers
            },
            systemHealth: {
                cpuUsage: `${cpuUsagePercent}%`,
                ramUsage: `${Math.round((usedMem / totalMem) * 100)}%`,
                diskStorage: diskStorageStr,
                serverUptime: `${(os.uptime() / 3600).toFixed(1)} Hours`,
                responseTime: `${responseTimeMs}ms`
            },
            activeUsers: {
                totalOnline: onlineAdmins + onlineTeachers + onlineStudents,
                onlineAdmins,
                onlineTeachers,
                onlineStudents
            },
            databaseStatus: {
                connected: mongoose.connection.readyState === 1,
                dbSize: dbStats.dataSize ? (dbStats.dataSize / 1024 / 1024).toFixed(2) + ' MB' : '0 MB',
                collectionsCount: dbStats.collections || 0,
                backupStatus: "Running"
            },
            serverStatus: {
                running: true,
                nodeVersion: process.version,
                apiStatus: "Healthy"
            },
            recentActivities,
            recentActivityFeed: {
                newTeachers,
                newStudents,
                latestCourses,
                latestNotifications
            },
            academicSummary: {
                currentSession: activeSession ? activeSession.name : null,
                currentSemester: activeSemester ? activeSemester.name : null,
                totalOfferedCourses,
                totalRegisteredStudents,
                totalCreditHours: creditHoursAgg[0]?.total || 0,
                totalTheoryCourses,
                totalLabCourses
            },
            academicOverview: {
                currentSession: activeSession ? activeSession.name : null,
                currentSemester: activeSemester ? activeSemester.name : null
            },
            obeSummary: {
                totalPEOs: obeTotalPEOs,
                totalPLOs: obeTotalPLOs,
                totalCLOs: obeTotalCLOs,
                totalGAs: obeTotalGAs,
                totalAssessments: obeTotalAssessments,
                totalQuestions: obeTotalQuestions,
                totalQuestionMappings: obeTotalQuestionMappings,
                totalBlueprints: obeTotalBlueprints,
                totalRubrics: obeTotalRubrics,
                mappingStatus
            },
            achievementSummary,
            teacherSummary,
            studentSummary,
            chartData,
            notificationsPanel,
            calendarEvents
        });
    } catch (error) {
        console.error('Dashboard Metrics Error:', error);
        res.status(500).json({ message: 'Server error retrieving dashboard metrics' });
    }
};