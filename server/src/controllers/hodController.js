import { 
    User, Program, Section, Semester, Course,
    CourseOffering, WorkflowRequest, StudentAttainment, CLO, PLO
} from '../models/index.js';

// @desc  HOD Dashboard — scoped to HOD's department
// @route GET /api/hod/dashboard
// @access Private (HOD)
export const getHodDashboard = async (req, res) => {
    try {
        const hod = req.user;
        
        // Scope: HOD's department
        const deptId = hod.department || null;
        const deptMatch = deptId ? { department: deptId } : {};
        const programFilter = deptId ? { department: deptId } : {};

        const [
            totalPrograms,
            totalTeachers,
            totalStudents,
            totalSections,
            totalCourses,
            activeSemesters,
            pendingApprovals,
            pendingCourseFiles
        ] = await Promise.all([
            Program.countDocuments(programFilter),
            User.countDocuments({ ...deptMatch, role: 'Teacher', isDeleted: false, isActive: true }),
            User.countDocuments({ ...deptMatch, role: 'Student', isDeleted: false }),
            Section.countDocuments(deptId ? { department: deptId } : {}),
            Course.countDocuments(programFilter),
            Semester.countDocuments({ status: 'Active' }),
            WorkflowRequest.countDocuments({ status: 'Pending', department: deptId }),
            WorkflowRequest.countDocuments({ status: 'Pending', type: 'CourseFile' })
        ]);

        // Program breakdown — using User model
        const programBreakdown = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false, ...(deptId ? { department: deptId } : {}) } },
            { $group: { _id: '$program', count: { $sum: 1 } } },
            { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'prog' } },
            { $unwind: { path: '$prog', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$prog.name', 'Unknown'] }, count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // Real Teacher Workload: count CourseOfferings assigned per teacher in dept
        const teacherWorkload = await CourseOffering.aggregate([
            { $match: deptId ? { department: deptId } : {} },
            { $group: { _id: '$teacher', courses: { $sum: 1 } } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacherInfo' } },
            { $unwind: { path: '$teacherInfo', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$teacherInfo.name', 'Unknown'] }, courses: 1, _id: 0 } },
            { $sort: { courses: -1 } },
            { $limit: 10 }
        ]);

        // Real OBE Stats from StudentAttainment (Scoped to department via program)
        // CourseOffering has no direct 'department' field — must go via program
        const deptPrograms = deptId ? await Program.find({ department: deptId }).select('_id') : [];
        const deptProgIds = deptPrograms.map(p => p._id);
        const offeringFilter = deptId && deptProgIds.length > 0 ? { program: { $in: deptProgIds } } : {};
        const deptOfferings = await CourseOffering.find(offeringFilter).select('_id');
        const offeringIds = deptOfferings.map(o => o._id);
        const attainments = await StudentAttainment.find(
            offeringIds.length > 0 ? { courseOffering: { $in: offeringIds } } : {}
        ).populate('clos.clo', 'code').populate('plos.plo', 'code').lean();
        
        let avgCloAchievement = 0, avgPloAchievement = 0;
        const cloAggMap = {}; // code -> { sum, count }
        const ploAggMap = {};
        if (attainments.length > 0) {
            const allClo = attainments.flatMap(a => (a.clos || []).map(c => c.percentage));
            const allPlo = attainments.flatMap(a => (a.plos || []).map(p => p.percentage));
            avgCloAchievement = allClo.length ? parseFloat((allClo.reduce((s, v) => s + v, 0) / allClo.length).toFixed(1)) : 0;
            avgPloAchievement = allPlo.length ? parseFloat((allPlo.reduce((s, v) => s + v, 0) / allPlo.length).toFixed(1)) : 0;
            attainments.forEach(att => {
                (att.clos || []).forEach(c => {
                    const code = c.clo?.code || 'CLO';
                    if (!cloAggMap[code]) cloAggMap[code] = { sum: 0, count: 0 };
                    cloAggMap[code].sum += c.percentage;
                    cloAggMap[code].count++;
                });
                (att.plos || []).forEach(p => {
                    const code = p.plo?.code || 'PLO';
                    if (!ploAggMap[code]) ploAggMap[code] = { sum: 0, count: 0 };
                    ploAggMap[code].sum += p.percentage;
                    ploAggMap[code].count++;
                });
            });
        }
        const cloAchievementGraph = Object.entries(cloAggMap).map(([clo, d]) => ({ clo, achievement: Math.round(d.sum / d.count) }));
        const ploAchievementGraph = Object.entries(ploAggMap).map(([plo, d]) => ({ plo, achievement: Math.round(d.sum / d.count) }));
        
        // Pass/Fail ratio from marks
        const { Mark } = await import('../models/index.js');
        const markDocs = await Mark.find(
            offeringIds.length > 0 ? { courseOffering: { $in: offeringIds }, status: { $in: ['Submitted','Verified','Locked'] } } : { status: { $in: ['Submitted','Verified','Locked'] } }
        ).populate('assessment', 'totalMarks passingMarks').lean();
        let passCount = 0, failCount = 0;
        markDocs.forEach(m => {
            const totalMax = m.assessment?.totalMarks || 100;
            const passingThreshold = m.assessment?.passingMarks || (totalMax * 0.5);
            (m.students || []).forEach(s => { if (s.obtainedMarks >= passingThreshold) passCount++; else failCount++; });
        });
        const totalGraded = passCount + failCount;
        const passFailRatio = totalGraded > 0
            ? [{ name: 'Pass', value: Math.round((passCount / totalGraded) * 100), fill: '#50cc7f' }, { name: 'Fail', value: Math.round((failCount / totalGraded) * 100), fill: '#ff1b6b' }]
            : null;

        res.json({
            stats: {
                totalPrograms,
                totalTeachers,
                totalStudents,
                totalSections,
                totalCourses,
                activeSemesters,
                pendingApprovals,
                pendingCourseFiles
            },
            obe: {
                avgCloAchievement,
                avgPloAchievement,
                avgGaAchievement: avgPloAchievement,
                targetVsAchieved: cloAchievementGraph
            },
            charts: {
                programBreakdown,
                teacherWorkload,
                cloAchievementGraph,
                ploAchievementGraph,
                gaAchievementGraph: ploAchievementGraph,
                passFailRatio
            }
        });
    } catch (err) {
        console.error('HOD Dashboard Error:', err);
        res.status(500).json({ message: 'Server error fetching HOD dashboard' });
    }
};
