import { Teacher, User, CourseOffering, Student, Assessment, Attendance, WorkflowRequest, Enrollment, CLO, ObeAnalytics, StudentAttainment, Mark } from '../models/index.js';
import CourseFile from '../models/CourseFile.js';

// @desc    Get teacher profile by user ID
// @route   GET /api/teachers/:userId
// @access  Private
export const getTeacherProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        let profile = await Teacher.findOne({ user: userId }).populate('professionalInfo.department', 'name');
        
        if (!profile) {
            // Create an empty profile if none exists
            profile = await Teacher.create({ user: userId });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ message: 'Server error retrieving teacher profile' });
    }
};

// @desc    Update Personal Info
// @route   PUT /api/teachers/:userId/personal
// @access  Private
export const updatePersonalInfo = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $set: { personalInfo: req.body } },
            { new: true, upsert: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update personal info' });
    }
};

// @desc    Update Professional Info
// @route   PUT /api/teachers/:userId/professional
// @access  Private
export const updateProfessionalInfo = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $set: { professionalInfo: req.body } },
            { new: true, upsert: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update professional info' });
    }
};

// @desc    Add Qualification
// @route   POST /api/teachers/:userId/qualifications
// @access  Private
export const addQualification = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $push: { qualifications: req.body } },
            { new: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add qualification' });
    }
};

// @desc    Delete Qualification
// @route   DELETE /api/teachers/:userId/qualifications/:qualId
// @access  Private
export const deleteQualification = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $pull: { qualifications: { _id: req.params.qualId } } },
            { new: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete qualification' });
    }
};

// @desc    Add Experience
// @route   POST /api/teachers/:userId/experience
// @access  Private
export const addExperience = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $push: { experience: req.body } },
            { new: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add experience' });
    }
};

// @desc    Delete Experience
// @route   DELETE /api/teachers/:userId/experience/:expId
// @access  Private
export const deleteExperience = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $pull: { experience: { _id: req.params.expId } } },
            { new: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete experience' });
    }
};

// @desc    Upload Document
// @route   POST /api/teachers/:userId/documents
// @access  Private
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newDoc = {
            name: req.body.name || req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            type: req.file.mimetype
        };

        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $push: { documents: newDoc } },
            { new: true }
        ).populate('professionalInfo.department', 'name');

        res.json(profile);
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Failed to upload document' });
    }
};

// @desc    Delete Document
// @route   DELETE /api/teachers/:userId/documents/:docId
// @access  Private
export const deleteDocument = async (req, res) => {
    try {
        const profile = await Teacher.findOneAndUpdate(
            { user: req.params.userId },
            { $pull: { documents: { _id: req.params.docId } } },
            { new: true }
        ).populate('professionalInfo.department', 'name');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete document' });
    }
};

// @desc    Get Teacher Dashboard Stats (dynamic — no mock data)
// @route   GET /api/teachers/dashboard
// @access  Private (Teacher)
export const getTeacherDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find Teacher profile record by user ref (optional, do not block if missing)
        const teacherProfile = await Teacher.findOne({ user: userId }).lean();

        // CourseOffering uses teacher: User._id
        const offerings = await CourseOffering.find({ teacher: userId })
            .populate('course', 'code title creditHours type')
            .populate('section', 'name')
            .populate('semester', 'name status')
            .populate('program', 'name')
            .populate('session', 'name year')
            .lean();

        const activeOfferings = offerings.filter(o => o.semester?.status === 'Active' || o.semester?.status === 'Open');
        const sectionIds = [...new Set(activeOfferings.map(o => o.section?._id?.toString()).filter(Boolean))];
        const courseIds = [...new Set(offerings.map(o => o.course?._id?.toString()).filter(Boolean))];

        const offeringIds = offerings.map(o => o._id);
        
        // Count unique students enrolled in teacher's active course offerings
        const uniqueStudents = await Enrollment.distinct('student', { courseOffering: { $in: offeringIds } });
        const totalStudents = uniqueStudents.length;

        // Pending attendance — offerings today with no attendance record
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const todaysAttendance = await Attendance.countDocuments({
            teacher: userId,
            date: { $gte: today, $lte: todayEnd }
        });
        const pendingAttendance = Math.max(0, activeOfferings.length - todaysAttendance);

        // Pending assessments — assessments for teacher's courses not yet done
        const pendingAssessments = await Assessment.countDocuments({
            course: { $in: courseIds },
            status: 'Active',
            ...(today ? { $or: [{ deadline: { $gte: today } }, { scheduledDate: { $gte: today } }] } : {})
        });

        // Pending workflow approvals
        const pendingWorkflows = await WorkflowRequest.countDocuments({
            requestedBy: userId,
            status: 'Pending'
        });

        // CLOs for teacher's courses
        const cloDocs = await CLO.find({ course: { $in: courseIds } }).lean();
        const totalCLOs = cloDocs.length;

        // Attendance trend — last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const attendanceRecords = await Attendance.find({
            teacher: userId,
            date: { $gte: fourWeeksAgo }
        }).lean();

        // Group by week
        const weekMap = {};
        for (const rec of attendanceRecords) {
            const d = new Date(rec.date);
            const weekNum = Math.floor((today - d) / (7 * 24 * 60 * 60 * 1000));
            const key = `Week ${4 - weekNum}`;
            if (!weekMap[key]) weekMap[key] = { present: 0, total: 0 };
            rec.students?.forEach(s => {
                weekMap[key].total++;
                if (s.status === 'Present') weekMap[key].present++;
            });
        }
        const attendanceTrend = Object.entries(weekMap).map(([week, v]) => ({
            week,
            rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0
        }));

        // Grade distribution from enrollments
        const enrollments = await Enrollment.find({
            courseOffering: { $in: offeringIds }
        }).select('grade finalGrade').lean();

        const gradeRanges = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        enrollments.forEach(e => {
            const g = (e.finalGrade || e.grade || '').toUpperCase();
            if (g.startsWith('A')) gradeRanges['A']++;
            else if (g.startsWith('B')) gradeRanges['B']++;
            else if (g.startsWith('C')) gradeRanges['C']++;
            else if (g.startsWith('D')) gradeRanges['D']++;
            else if (g === 'F') gradeRanges['F']++;
        });
        const gradeDistribution = Object.entries(gradeRanges).map(([grade, count]) => ({ grade, count }));

        // Construct Today's Tasks
        const todaysTasks = [];
        if (activeOfferings.length > 0) todaysTasks.push({ label: 'Today\'s Classes', count: activeOfferings.length, icon: 'CalendarCheck' });
        if (pendingAttendance > 0) todaysTasks.push({ label: 'Attendance Pending', count: pendingAttendance, icon: 'Clock' });
        if (pendingAssessments > 0) todaysTasks.push({ label: 'Assessments Due/Today', count: pendingAssessments, icon: 'FileText' });

        // Compute real marks pending: assessments for which no mark record exists yet
        const submittedMarkAssessmentIds = await Mark.distinct('assessment', {
            courseOffering: { $in: offeringIds }, status: { $in: ['Submitted', 'Locked', 'Verified'] }
        });
        const totalActiveAssessments = await Assessment.countDocuments({ course: { $in: courseIds } });
        const marksPending = Math.max(0, totalActiveAssessments - submittedMarkAssessmentIds.length);

        // Compute real course file pending: active offerings without a Submitted/Approved course file
        const submittedCourseFileOfferingIds = await CourseFile.distinct('courseOffering', {
            courseOffering: { $in: offeringIds },
            status: { $in: ['Submitted', 'Under Review', 'Approved'] }
        });
        const courseFilePending = Math.max(0, offeringIds.length - submittedCourseFileOfferingIds.length);

        // Construct Pending Tasks — only include items with count > 0
        const pendingTasks = [];
        if (pendingAttendance > 0) pendingTasks.push({ label: 'Attendance Not Submitted', count: pendingAttendance, icon: 'Clock' });
        if (marksPending > 0) pendingTasks.push({ label: 'Marks Pending', count: marksPending, icon: 'ClipboardList' });
        if (pendingWorkflows > 0) pendingTasks.push({ label: 'Workflow Approvals Pending', count: pendingWorkflows, icon: 'CheckSquare' });
        if (courseFilePending > 0) pendingTasks.push({ label: 'Course File Pending', count: courseFilePending, icon: 'FolderOpen' });

        // Fetch real StudentAttainments for Teacher's offerings
        const attainments = await StudentAttainment.find({ courseOffering: { $in: offeringIds } })
            .populate('clos.clo', 'code')
            .populate('plos.plo', 'code')
            .lean();

        let cloTotalCount = 0, cloAchievedCount = 0;
        let ploTotalCount = 0, ploAchievedCount = 0;
        const cloAggMap = {};
        const ploAggMap = {};
        
        attainments.forEach(att => {
            (att.clos || []).forEach(c => {
                cloTotalCount++;
                if (c.achieved) cloAchievedCount++;
                const code = c.clo?.code || 'CLO';
                if (!cloAggMap[code]) cloAggMap[code] = { sum: 0, count: 0 };
                cloAggMap[code].sum += c.percentage;
                cloAggMap[code].count++;
            });
            (att.plos || []).forEach(p => {
                ploTotalCount++;
                if (p.achieved) ploAchievedCount++;
                const code = p.plo?.code || 'PLO';
                if (!ploAggMap[code]) ploAggMap[code] = { sum: 0, count: 0 };
                ploAggMap[code].sum += p.percentage;
                ploAggMap[code].count++;
            });
        });

        const cloAchievement = cloTotalCount > 0 ? Math.round((cloAchievedCount / cloTotalCount) * 100) : 0;
        const ploContribution = ploTotalCount > 0 ? Math.round((ploAchievedCount / ploTotalCount) * 100) : 0;
        const cloAchievementGraph = Object.entries(cloAggMap).map(([clo, d]) => ({ clo, achievement: Math.round(d.sum / d.count) }));
        const ploAchievementGraph = Object.entries(ploAggMap).map(([plo, d]) => ({ plo, achievement: Math.round(d.sum / d.count) }));
        
        // Pass/Fail from marks
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
                assignedCourses: offerings.length,
                totalStudents,
                activeSections: sectionIds.length,
                todaysClasses: activeOfferings.length,
                pendingAttendance,
                pendingAssessments,
                pendingWorkflows,
                totalCLOs
            },
            obe: {
                totalCLOs,
                cloAchievement,
                ploContribution,
                gaContribution: ploContribution
            },
            charts: {
                attendanceTrend: attendanceTrend.length > 0 ? attendanceTrend : [
                    { week: 'Week 1', rate: 0 }, { week: 'Week 2', rate: 0 },
                    { week: 'Week 3', rate: 0 }, { week: 'Week 4', rate: 0 }
                ],
                gradeDistribution,
                cloAchievementGraph,
                ploAchievementGraph,
                gaAchievementGraph: ploAchievementGraph,
                passFailRatio
            },
            coursesList: offerings,
            todaysTasks,
            pendingTasks
        });
    } catch (error) {
        console.error('Teacher Dashboard Error:', error);
        res.status(500).json({ message: 'Server error fetching teacher dashboard' });
    }
};

// @desc    Get Assigned Courses for Teacher
// @route   GET /api/teachers/courses
// @access  Private (Teacher)
export const getAssignedCourses = async (req, res) => {
    try {
        const userId = req.user._id;
        const teacherProfile = await Teacher.findOne({ user: userId }).lean();

        const offerings = await CourseOffering.find({ teacher: userId })
            .populate('course', 'code name creditHours type')
            .populate('section', 'name')
            .populate('semester', 'name status')
            .populate('program', 'name')
            .populate('session', 'name year')
            .lean();

        // Add student count per course offering via enrollments
        for (const o of offerings) {
            const uniqueStudents = await Enrollment.distinct('student', { courseOffering: o._id });
            o.totalStudents = uniqueStudents.length;
        }

        res.json(offerings);
    } catch (error) {
        console.error('Assigned Courses Error:', error);
        res.status(500).json({ message: 'Failed to fetch assigned courses' });
    }
};

