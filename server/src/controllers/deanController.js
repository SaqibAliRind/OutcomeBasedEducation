import { 
    User, Department, Program,
    Section, Semester, Course, CLO, PLO, PEO, GA,
    CourseOffering, WorkflowRequest, ObeAnalytics, StudentAttainment, Mark
} from '../models/index.js';

// @desc  Dean Dashboard — scoped to dean's faculty
// @route GET /api/dean/dashboard
// @access Private (Dean)
export const getDeanDashboard = async (req, res) => {
    try {
        const dean = req.user;
        
        // Scope: Dean's university
        const uniFilter = dean.university ? { university: dean.university } : {};
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalDepartments,
            totalPrograms,
            totalTeachers,
            totalStudents,
            totalSections,
            totalCourses,
            activeStudents,
            visitingTeachers,
            permanentTeachers,
            newStudents30d,
            pendingApprovals,
            totalPEOs,
            totalPLOs,
            totalCLOs,
            totalGAs,
            openOfferings
        ] = await Promise.all([
            Department.countDocuments(uniFilter),
            Program.countDocuments(uniFilter),
            User.countDocuments({ ...uniFilter, role: 'Teacher', isDeleted: false, isActive: true }),
            User.countDocuments({ ...uniFilter, role: 'Student', isDeleted: false }),
            Section.countDocuments(uniFilter),
            Course.countDocuments(uniFilter),
            User.countDocuments({ ...uniFilter, role: 'Student', isDeleted: false, isActive: true }),
            User.countDocuments({ ...uniFilter, role: 'Teacher', employmentType: 'Visiting' }),
            User.countDocuments({ ...uniFilter, role: 'Teacher', employmentType: 'Permanent' }),
            User.countDocuments({ ...uniFilter, role: 'Student', createdAt: { $gte: thirtyDaysAgo } }),
            WorkflowRequest.countDocuments({ status: 'Pending', ...uniFilter }),
            PEO.countDocuments(uniFilter),
            PLO.countDocuments(uniFilter),
            CLO.countDocuments(uniFilter),
            GA.countDocuments(uniFilter),
            CourseOffering.countDocuments({ status: 'Open', ...uniFilter })
        ]);

        // Departments with their student counts — using User model
        const departmentBreakdown = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false, ...(dean.university ? { university: dean.university } : {}) } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
            { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$dept.name', 'Unknown'] }, count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // Program breakdown — using User model
        const programBreakdown = await User.aggregate([
            { $match: { role: 'Student', isDeleted: false, ...(dean.university ? { university: dean.university } : {}) } },
            { $group: { _id: '$program', count: { $sum: 1 } } },
            { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'prog' } },
            { $unwind: { path: '$prog', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$prog.name', 'Unknown'] }, count: 1, _id: 0 } },
            { $sort: { count: -1 } }
        ]);

        // OBE analytics — try ObeAnalytics first, fallback to StudentAttainment live calc
        let obeStats = await ObeAnalytics.findOne(dean.university ? { universityId: dean.university } : {});
        
        let avgCloAchievement = 0, avgPloAchievement = 0, avgGaAchievement = 0;
        let cloAchievementGraph = [];
        let ploAchievementGraph = [];
        let passFailRatio = null;
        
        if (!obeStats) {
            const attainments = await StudentAttainment.find().populate('clos.clo', 'code').populate('plos.plo', 'code').lean();
            const allClo = attainments.flatMap(a => (a.clos || []).map(c => c.percentage));
            const allPlo = attainments.flatMap(a => (a.plos || []).map(p => p.percentage));
            avgCloAchievement = allClo.length ? parseFloat((allClo.reduce((s, v) => s + v, 0) / allClo.length).toFixed(1)) : 0;
            avgPloAchievement = allPlo.length ? parseFloat((allPlo.reduce((s, v) => s + v, 0) / allPlo.length).toFixed(1)) : 0;
            avgGaAchievement = avgPloAchievement;
            
            const cloAggMap = {};
            const ploAggMap = {};
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
            cloAchievementGraph = Object.entries(cloAggMap).map(([clo, d]) => ({ clo, achievement: Math.round(d.sum / d.count) }));
            ploAchievementGraph = Object.entries(ploAggMap).map(([plo, d]) => ({ plo, achievement: Math.round(d.sum / d.count) }));
            
            const markDocs = await Mark.find({ status: { $in: ['Submitted','Verified','Locked'] } }).populate('assessment', 'totalMarks passingMarks').lean();
            let passCount = 0, failCount = 0;
            markDocs.forEach(m => {
                const totalMax = m.assessment?.totalMarks || 100;
                const passingThreshold = m.assessment?.passingMarks || (totalMax * 0.5);
                (m.students || []).forEach(s => { if (s.obtainedMarks >= passingThreshold) passCount++; else failCount++; });
            });
            const totalGraded = passCount + failCount;
            passFailRatio = totalGraded > 0
                ? [{ name: 'Pass', value: Math.round((passCount / totalGraded) * 100), fill: '#50cc7f' }, { name: 'Fail', value: Math.round((failCount / totalGraded) * 100), fill: '#ff1b6b' }]
                : null;
        } else {
            cloAchievementGraph = obeStats.targetVsAchieved?.map(p => ({ clo: p.name, achievement: p.achieved })) || [];
            ploAchievementGraph = obeStats.targetVsAchieved?.map(p => ({ plo: p.name, achievement: p.achieved })) || [];
        }

        // Recent workflow requests
        const recentApprovals = await WorkflowRequest.find(uniFilter)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('requestedBy', 'name role')
            .lean();

        // Recent teachers
        const recentTeachers = await User.find({ ...uniFilter, role: 'Teacher', isDeleted: false })
            .select('name email createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Recent students
        const recentStudents = await User.find({ ...uniFilter, role: 'Student', isDeleted: false })
            .select('name email rollNumber program createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            stats: {
                totalDepartments,
                totalPrograms,
                totalTeachers,
                totalStudents,
                totalSections,
                totalCourses,
                activeStudents,
                visitingTeachers,
                permanentTeachers,
                newStudents30d,
                graduatedStudents: 0, // no graduated field in User — future enhancement
                pendingApprovals,
                openOfferings
            },
            obe: {
                totalPEOs,
                totalPLOs,
                totalCLOs,
                totalGAs,
                avgCloAchievement: obeStats?.avgCloAchievement ?? avgCloAchievement,
                avgPloAchievement: obeStats?.avgPloAchievement ?? avgPloAchievement,
                avgGaAchievement: obeStats?.avgGaAchievement ?? avgGaAchievement,
                universityAchievement: obeStats?.universityAchievement || 0,
                programAchievements: obeStats?.programAchievements || [],
                departmentAchievements: obeStats?.departmentAchievements || [],
                targetVsAchieved: obeStats?.targetVsAchieved || [],
                gapAnalysis: obeStats?.gapAnalysis || [],
                closingTheLoopStatus: obeStats?.closingTheLoopStatus || []
            },
            charts: {
                departmentBreakdown,
                programBreakdown,
                cloAchievementGraph,
                ploAchievementGraph,
                gaAchievementGraph: ploAchievementGraph,
                passFailRatio
            },
            recentApprovals,
            recentTeachers,
            recentStudents
        });
    } catch (err) {
        console.error('Dean Dashboard Error:', err);
        res.status(500).json({ message: 'Server error fetching dean dashboard' });
    }
};
