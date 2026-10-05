import {
    User, Attendance, Mark, CourseOffering, StudentAttainment,
    Department, Program, Course, Assessment, QuestionMapping, GA, PEO, ObeTarget
} from '../models/index.js';

// @desc  Get all management analytics data
// @route GET /api/analytics/management
// @access Private (Admin/Manager roles)
export const getManagementAnalytics = async (req, res) => {
    try {
        // uniFilter removed because models like User, PEO, GA do not have a 'university' field
        const uniFilter = {};

        // ─── 1. ENROLLMENT TREND ───────────────────────────────────────
        const enrollmentAgg = await User.aggregate([
            { $match: { role: 'Student', ...uniFilter } },
            { $group: { _id: { $year: '$createdAt' }, students: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);
        const ENROLLMENT_TREND = enrollmentAgg.map(item => ({ year: String(item._id), students: item.students }));

        // ─── 2. GRADUATION TREND ──────────────────────────────────────
        const gradAgg = await User.aggregate([
            { $match: { role: 'Student', status: { $in: ['Graduated', 'Alumni'] }, ...uniFilter } },
            { $group: { _id: { $year: '$updatedAt' }, graduated: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);
        const GRADUATION_TREND = gradAgg.map(item => ({ year: String(item._id), graduated: item.graduated }));

        // ─── 3. DROPOUT TREND ────────────────────────────────────────
        const dropAgg = await User.aggregate([
            { $match: { role: 'Student', status: 'Dropped', ...uniFilter } },
            { $group: { _id: { $year: '$updatedAt' }, dropped: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
        ]);
        const DROPOUT_TREND = dropAgg.map(item => ({ year: String(item._id), dropped: item.dropped }));

        // ─── 4. STUDENT GENDER DIST ──────────────────────────────────
        const STUDENT_GENDER = [
            { name: 'Male', value: await User.countDocuments({ role: 'Student', gender: 'Male', ...uniFilter }) || 0, color: '#0ff0fc' },
            { name: 'Female', value: await User.countDocuments({ role: 'Student', gender: 'Female', ...uniFilter }) || 0, color: '#bc13fe' }
        ];

        // ─── 5. DEPT STUDENT DIST ────────────────────────────────────
        const deptStudentsAgg = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false, ...uniFilter } },
            { $group: { _id: '$department', students: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { dept: { $ifNull: ['$dept.name', 'Unknown'] }, students: 1, _id: 0 } }
        ]);
        const DEPT_STUDENT_DIST = deptStudentsAgg;

        // ─── 6. PASS / FAIL ──────────────────────────────────────────
        const markDocs = await Mark.find({}).lean();
        let passCount = 0, failCount = 0;
        const gradeMap = {};
        markDocs.forEach(m => {
            (m.students || []).forEach(s => {
                const totalMax = m.assessment?.totalMarks || m.totalMarks || 100;
                const pct = totalMax > 0 ? (s.obtainedMarks / totalMax) * 100 : 0;
                if (pct >= 50) passCount++; else failCount++;
                // Grade dist
                let grade = 'F';
                if (pct >= 90) grade = 'A+';
                else if (pct >= 85) grade = 'A';
                else if (pct >= 80) grade = 'A-';
                else if (pct >= 75) grade = 'B+';
                else if (pct >= 70) grade = 'B';
                else if (pct >= 65) grade = 'B-';
                else if (pct >= 60) grade = 'C+';
                else if (pct >= 55) grade = 'C';
                else if (pct >= 50) grade = 'D';
                gradeMap[grade] = (gradeMap[grade] || 0) + 1;
            });
        });
        const PASS_FAIL = [
            { name: 'Passed', value: passCount, color: '#50cc7f' },
            { name: 'Failed', value: failCount, color: '#ff1b6b' }
        ];
        const GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];
        const GRADE_COLORS = ['#50cc7f', '#0ff0fc', '#45d4f0', '#bc13fe', '#9b59b6', '#6c3483', '#ffcc00', '#ff9800', '#ff5722', '#ff1b6b'];
        const GRADE_DISTRIBUTION = GRADE_ORDER.map((g, i) => ({ name: g, value: gradeMap[g] || 0, color: GRADE_COLORS[i] })).filter(g => g.value > 0);

        // ─── 7. ASSESSMENT TYPE BREAKDOWN ────────────────────────────
        const assessmentTypeStats = {};
        for (const m of markDocs) {
            const type = m.assessment?.type || 'Other';
            if (!assessmentTypeStats[type]) assessmentTypeStats[type] = { type, totalObtained: 0, totalMax: 0, highest: 0, lowest: Infinity, count: 0 };
            (m.students || []).forEach(s => {
                const max = m.assessment?.totalMarks || m.totalMarks || 100;
                assessmentTypeStats[type].totalObtained += s.obtainedMarks || 0;
                assessmentTypeStats[type].totalMax += max;
                assessmentTypeStats[type].highest = Math.max(assessmentTypeStats[type].highest, s.obtainedMarks || 0);
                assessmentTypeStats[type].lowest = Math.min(assessmentTypeStats[type].lowest, s.obtainedMarks || 0);
                assessmentTypeStats[type].count++;
            });
        }
        const ASSESSMENT_COMPARISON = Object.values(assessmentTypeStats).map(s => ({
            type: s.type,
            avg: s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 100) : 0,
            highest: s.totalMax > 0 ? Math.round((s.highest / (s.totalMax / s.count)) * 100) : 0,
            lowest: s.totalMax > 0 ? Math.round((s.lowest / (s.totalMax / s.count)) * 100) : 0
        }));

        // ─── 8. MARKS OVERVIEW (per course) ─────────────────────────
        const marksAgg = await Mark.aggregate([
            { $lookup: { from: 'assessments', localField: 'assessment', foreignField: '_id', as: 'ass' } },
            { $unwind: { path: '$ass', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'courseofferings', localField: 'ass.courseOffering', foreignField: '_id', as: 'co' } },
            { $unwind: { path: '$co', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'courses', localField: 'co.course', foreignField: '_id', as: 'course' } },
            { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
            { $project: { courseCode: { $ifNull: ['$course.code', 'N/A'] }, students: 1, totalMarks: { $ifNull: ['$ass.totalMarks', 100] } } }
        ]);
        const courseMarkStats = {};
        marksAgg.forEach(m => {
            const code = m.courseCode;
            if (!courseMarkStats[code]) courseMarkStats[code] = { course: code, sum: 0, max: -Infinity, min: Infinity, count: 0, possible: 0 };
            (m.students || []).forEach(s => {
                const pct = m.totalMarks > 0 ? Math.round((s.obtainedMarks / m.totalMarks) * 100) : 0;
                courseMarkStats[code].sum += pct;
                courseMarkStats[code].max = Math.max(courseMarkStats[code].max, pct);
                courseMarkStats[code].min = Math.min(courseMarkStats[code].min, pct);
                courseMarkStats[code].count++;
            });
        });
        const MARKS_OVERVIEW = Object.values(courseMarkStats).slice(0, 8).map(s => ({
            course: s.course,
            avg: s.count > 0 ? Math.round(s.sum / s.count) : 0,
            highest: s.max === -Infinity ? 0 : s.max,
            lowest: s.min === Infinity ? 0 : s.min
        }));

        // ─── 9. ATTENDANCE TREND ────────────────────────────────────
        const attendanceDocs = await Attendance.find({}).lean();
        const weekMap = {};
        attendanceDocs.forEach(a => {
            const d = new Date(a.date || a.createdAt);
            const week = `W${Math.ceil(d.getDate() / 7)} ${d.getMonth() + 1}/${d.getFullYear()}`;
            if (!weekMap[week]) weekMap[week] = { week, present: 0, absent: 0, _date: d };
            (a.students || []).forEach(r => {
                if (r.status === 'Present') weekMap[week].present++;
                else weekMap[week].absent++;
            });
        });
        const ATTENDANCE_TREND = Object.values(weekMap)
            .sort((a, b) => a._date - b._date)
            .slice(-8)
            .map(w => ({ week: w.week, present: w.present, absent: w.absent }));

        // ─── 10. TEACHER WORKLOAD ────────────────────────────────────
        const TEACHER_WORKLOAD = await CourseOffering.aggregate([
            { $match: { status: { $in: ['Open', 'Active'] } } },
            { $group: { _id: '$teacher', courses: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacherInfo' } },
            { $unwind: { path: '$teacherInfo', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$teacherInfo.name', 'Unknown'] }, courses: 1, creditHours: { $multiply: ['$courses', 3] }, _id: 0 } },
            { $sort: { courses: -1 } },
            { $limit: 10 }
        ]);

        // ─── 11. TEACHER DEPT DIST ───────────────────────────────────
        const TEACHER_DEPT_DIST = await User.aggregate([
            { $match: { role: 'Teacher', isDeleted: false, ...uniFilter } },
            { $group: { _id: '$department', teachers: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { dept: { $ifNull: ['$dept.name', 'Unknown'] }, teachers: 1, _id: 0 } },
            { $sort: { teachers: -1 } }
        ]);

        // ─── 12. COURSE SUCCESS RATE ────────────────────────────────
        const coursePassAgg = {};
        markDocs.forEach(m => {
            // use assessment.name or _id as key placeholder
            const key = String(m.assessment);
            if (!coursePassAgg[key]) coursePassAgg[key] = { pass: 0, total: 0 };
            (m.students || []).forEach(s => {
                const max = m.totalMarks || 100;
                const pct = max > 0 ? (s.obtainedMarks / max) * 100 : 0;
                if (pct >= 50) coursePassAgg[key].pass++;
                coursePassAgg[key].total++;
            });
        });

        // ─── 13. DEPT PERFORMANCE ────────────────────────────────────
        const deptPerfAgg = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false, ...uniFilter } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { dept: { $ifNull: ['$dept.name', 'Unknown'] }, count: 1, _id: 0 } }
        ]);
        const DEPT_PERFORMANCE = deptPerfAgg.map(d => ({ dept: d.dept, students: d.count }));

        // ─── 14. PROGRAM PERFORMANCE ─────────────────────────────────
        const progPerfAgg = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false, ...uniFilter } },
            { $group: { _id: '$program', students: { $sum: 1 } } },
            { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'prog' } },
            { $unwind: { path: '$prog', preserveNullAndEmptyArrays: true } },
            { $project: { program: { $ifNull: ['$prog.name', 'Unknown'] }, students: 1, _id: 0 } },
            { $sort: { students: -1 } },
            { $limit: 8 }
        ]);
        const PROG_PERFORMANCE = progPerfAgg;

        // ─── 15. OBE ANALYTICS ──────────────────────────────────────
        const attainments = await StudentAttainment.find()
            .populate('clos.clo', 'code')
            .populate('plos.plo', 'code')
            .populate('gas.ga', 'code')
            .lean();
        const cloStats = {};
        const ploStats = {};
        attainments.forEach(a => {
            (a.clos || []).forEach(c => {
                const code = c.clo?.code || 'Unknown';
                if (!cloStats[code]) cloStats[code] = { clo: code, total: 0, count: 0 };
                cloStats[code].total += c.percentage || 0;
                cloStats[code].count++;
            });
            (a.plos || []).forEach(p => {
                const code = p.plo?.code || 'Unknown';
                if (!ploStats[code]) ploStats[code] = { plo: code, total: 0, count: 0 };
                ploStats[code].total += p.percentage || 0;
                ploStats[code].count++;
            });
        });
        const CLO_ACHIEVEMENT = Object.values(cloStats).map(s => ({
            clo: s.clo, target: 70,
            achieved: Math.round(s.total / s.count),
            status: (s.total / s.count) >= 70 ? 'Met' : 'Not Met'
        }));
        const PLO_ACHIEVEMENT = Object.values(ploStats).map(s => ({
            plo: s.plo, target: 65,
            achieved: Math.round(s.total / s.count)
        }));

        // GA real data — aggregate from StudentAttainment.gas
        const gaStats = {};
        attainments.forEach(a => {
            (a.gas || []).forEach(g => {
                const code = g.ga?.code || String(g.ga);
                if (!gaStats[code]) gaStats[code] = { total: 0, count: 0, target: g.targetThreshold || 70 };
                gaStats[code].total += g.percentage || 0;
                gaStats[code].count++;
            });
        });
        // If no gas in StudentAttainment, fall back to GA docs
        const gaDocs = await GA.find({ ...uniFilter }).lean();
        let GA_REAL;
        if (Object.keys(gaStats).length > 0) {
            GA_REAL = Object.entries(gaStats).map(([code, s]) => ({
                ga: code, target: s.target,
                achieved: Math.round(s.total / s.count)
            }));
        } else if (gaDocs.length > 0) {
            // Fall back: derive GA achievement by averaging PLO achievements for mapped PLOs
            GA_REAL = gaDocs.map(g => {
                const matchedPLOs = PLO_ACHIEVEMENT; // best effort: all PLOs
                const avg = matchedPLOs.length > 0
                    ? Math.round(matchedPLOs.reduce((s, p) => s + p.achieved, 0) / matchedPLOs.length)
                    : 0;
                return { ga: g.code || g.name?.substring(0, 6), target: 70, achieved: avg };
            });
        } else {
            GA_REAL = PLO_ACHIEVEMENT.map(p => ({
                ga: p.plo.replace('PLO', 'GA'), target: 70, achieved: p.achieved
            }));
        }

        // PEO Achievement — PEO has no direct PLO mapping field; derive from avg PLO achievement
        const peoDocs = await PEO.find({ ...uniFilter }).lean();
        const avgPloAchievement = PLO_ACHIEVEMENT.length > 0
            ? Math.round(PLO_ACHIEVEMENT.reduce((s, p) => s + p.achieved, 0) / PLO_ACHIEVEMENT.length)
            : 0;
        const PEO_ACHIEVEMENT = peoDocs.map(p => ({
            peo: p.code || p.title?.substring(0, 8),
            target: 75,
            achieved: avgPloAchievement
        }));

        // BT Coverage from QuestionMappings
        const btMap = {};
        const mappings = await QuestionMapping.find({}).lean();
        mappings.forEach(m => {
            (m.questions || []).forEach(q => {
                if (!q.btLevel) return;
                btMap[q.btLevel] = (btMap[q.btLevel] || 0) + 1;
            });
        });
        const BT_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
        const BT_COLORS = ['#0ff0fc', '#50cc7f', '#bc13fe', '#ffcc00', '#ff9800', '#ff1b6b'];
        const totalBT = Object.values(btMap).reduce((s, v) => s + v, 0) || 1;
        const BT_DISTRIBUTION = BT_ORDER.filter(l => btMap[l]).map((level, i) => ({
            level, value: Math.round((btMap[level] / totalBT) * 100), color: BT_COLORS[i]
        }));

        // BT Achievement (based on attainments if possible - currently empty to avoid mock data)
        const BT_ACHIEVEMENT = [];

        // Coverage Analysis — how many CLOs/PLOs/GAs met their own individual target
        const targetSettings = await ObeTarget.findOne({ universityId: req.user.university }) || {
            cloTarget: 70, ploTarget: 65, gaTarget: 65
        };
        // Use each item's own stored target. Fallback to ObeTarget settings if target is 0/missing.
        const cloThreshold = (targetSettings.cloTarget > 0) ? targetSettings.cloTarget : 70;
        const ploThreshold = (targetSettings.ploTarget > 0) ? targetSettings.ploTarget : 65;
        const gaThreshold  = (targetSettings.gaTarget  > 0) ? targetSettings.gaTarget  : 65;
        const coveredCLOs = CLO_ACHIEVEMENT.filter(c => c.achieved >= (c.target > 0 ? c.target : cloThreshold)).length;
        const coveredPLOs = PLO_ACHIEVEMENT.filter(p => p.achieved >= (p.target > 0 ? p.target : ploThreshold)).length;
        const coveredGAs  = GA_REAL.filter(g => g.achieved >= (g.target > 0 ? g.target : gaThreshold)).length;
        const COVERAGE_DATA = [
            { name: 'CLO Coverage', covered: Math.round((coveredCLOs / Math.max(1, CLO_ACHIEVEMENT.length)) * 100), uncovered: Math.round(((CLO_ACHIEVEMENT.length - coveredCLOs) / Math.max(1, CLO_ACHIEVEMENT.length)) * 100) },
            { name: 'PLO Coverage', covered: Math.round((coveredPLOs / Math.max(1, PLO_ACHIEVEMENT.length)) * 100), uncovered: Math.round(((PLO_ACHIEVEMENT.length - coveredPLOs) / Math.max(1, PLO_ACHIEVEMENT.length)) * 100) },
            { name: 'GA Coverage',  covered: Math.round((coveredGAs  / Math.max(1, GA_REAL.length))          * 100), uncovered: Math.round(((GA_REAL.length - coveredGAs)          / Math.max(1, GA_REAL.length))          * 100) },
        ].filter(c => c.covered + c.uncovered > 0);

        // Target vs Achieved summary
        const avgClo = CLO_ACHIEVEMENT.length > 0 ? CLO_ACHIEVEMENT.reduce((s, c) => s + c.achieved, 0) / CLO_ACHIEVEMENT.length : 0;
        const avgPlo = PLO_ACHIEVEMENT.length > 0 ? PLO_ACHIEVEMENT.reduce((s, p) => s + p.achieved, 0) / PLO_ACHIEVEMENT.length : 0;
        const avgGa = GA_REAL.length > 0 ? GA_REAL.reduce((s, g) => s + g.achieved, 0) / GA_REAL.length : 0;

        // Attendance pct overall
        let totalPresent = 0, totalAttRec = 0;
        attendanceDocs.forEach(a => {
            (a.students || []).forEach(r => {
                totalAttRec++;
                if (r.status === 'Present') totalPresent++;
            });
        });
        const avgAttendance = totalAttRec > 0 ? Math.round((totalPresent / totalAttRec) * 100) : 0;
        const passRate = (passCount + failCount) > 0 ? Math.round((passCount / (passCount + failCount)) * 100) : 0;

        const TARGET_VS_ACHIEVED = [
            { metric: 'CLO Achievement', target: targetSettings.cloTarget, achieved: parseFloat(avgClo.toFixed(1)) },
            { metric: 'PLO Achievement', target: targetSettings.ploTarget, achieved: parseFloat(avgPlo.toFixed(1)) },
            { metric: 'GA Achievement', target: targetSettings.gaTarget, achieved: parseFloat(avgGa.toFixed(1)) },
            { metric: 'Attendance %', target: 80, achieved: avgAttendance },
            { metric: 'Pass Rate', target: 85, achieved: passRate },
        ].filter(t => t.achieved > 0);

        const GAP_ANALYSIS = TARGET_VS_ACHIEVED
            .filter(t => t.achieved < t.target)
            .map(t => ({ metric: t.metric, gap: parseFloat((t.achieved - t.target).toFixed(1)) }));

        res.json({
            // Student
            ENROLLMENT_TREND, GRADUATION_TREND, DROPOUT_TREND,
            STUDENT_GENDER, DEPT_STUDENT_DIST,
            // Marks & Grades
            PASS_FAIL, GRADE_DISTRIBUTION, MARKS_OVERVIEW, ASSESSMENT_COMPARISON,
            // Attendance
            ATTENDANCE_TREND,
            // Teacher
            TEACHER_WORKLOAD, TEACHER_DEPT_DIST,
            // Performance
            DEPT_PERFORMANCE, PROG_PERFORMANCE,
            // OBE
            CLO_ACHIEVEMENT, PLO_ACHIEVEMENT, GA_ACHIEVEMENT: GA_REAL,
            PEO_ACHIEVEMENT, BT_DISTRIBUTION, COVERAGE_DATA,
            // Targets
            TARGET_VS_ACHIEVED, GAP_ANALYSIS
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: error.message });
    }
};
