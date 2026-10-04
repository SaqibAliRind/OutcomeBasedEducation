import { User, Enrollment, Mark, Attendance, StudentAttainment, CourseOffering, WorkflowRequest } from '../models/index.js';

// @desc  Student Dashboard — scoped to the logged-in student
// @route GET /api/student/dashboard
// @access Private (Student)
export const getStudentDashboard = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Enrollments
        const enrollments = await Enrollment.find({ student: studentId })
            .populate({
                path: 'courseOffering',
                populate: [
                    { path: 'course', select: 'name code creditHours type' },
                    { path: 'section', select: 'name' },
                    { path: 'semester', select: 'name status' },
                    { path: 'program', select: 'name' }
                ]
            })
            .lean();

        const enrolledCourses = enrollments.length;

        // Marks — find all Mark documents that have this student
        const markDocs = await Mark.find({
            'students.student': studentId
        }).populate('assessment', 'name type totalMarks').lean();

        const recentMarks = [];
        let totalObtained = 0, totalPossible = 0;
        let passCount = 0, failCount = 0;

        markDocs.forEach(m => {
            const studentMark = (m.students || []).find(s => s.student?.toString() === studentId.toString());
            if (studentMark) {
                const max = m.assessment?.totalMarks || m.totalMarks || 100;
                const pct = max > 0 ? parseFloat(((studentMark.obtainedMarks / max) * 100).toFixed(1)) : 0;
                totalObtained += studentMark.obtainedMarks;
                totalPossible += max;
                if (pct >= 50) passCount++; else failCount++;
                recentMarks.push({
                    assessmentName: m.assessment?.name || 'Assessment',
                    type: m.assessment?.type || 'Quiz',
                    obtained: studentMark.obtainedMarks,
                    total: max,
                    percentage: pct
                });
            }
        });

        const avgPercentage = totalPossible > 0
            ? parseFloat(((totalObtained / totalPossible) * 100).toFixed(1))
            : 0;

        // Proxy GPA: scale avgPercentage to 0-4.0
        const cgpa = avgPercentage > 0
            ? parseFloat((avgPercentage * 0.04).toFixed(2))
            : 0;

        // Attendance
        const attendanceDocs = await Attendance.find({
            'students.student': studentId
        }).lean();

        let presentCount = 0, totalAttendance = 0;
        attendanceDocs.forEach(doc => {
            const rec = (doc.students || []).find(r => r.student?.toString() === studentId.toString());
            if (rec) {
                totalAttendance++;
                if (rec.status === 'Present') presentCount++;
            }
        });
        const attendancePercent = totalAttendance > 0
            ? parseFloat(((presentCount / totalAttendance) * 100).toFixed(1))
            : 0;

        // OBE Attainments
        const attainments = await StudentAttainment.find({ student: studentId })
            .populate({
                path: 'courseOffering',
                populate: { path: 'course', select: 'name code' }
            })
            .populate('clos.clo', 'code description')
            .populate('plos.plo', 'code description')
            .lean();

        // Pending assignments from workflow
        const pendingAssignments = await WorkflowRequest.countDocuments({
            requestedBy: studentId,
            status: 'Pending'
        });

        res.json({
            stats: {
                enrolledCourses,
                attendancePercent,
                cgpa,
                pendingAssignments,
                passCount,
                failCount,
                avgPercentage
            },
            enrollments: enrollments.slice(0, 10),
            recentMarks: recentMarks.slice(0, 10),
            attainments: attainments.slice(0, 5)
        });
    } catch (err) {
        console.error('Student Dashboard Error:', err);
        res.status(500).json({ message: 'Server error fetching student dashboard' });
    }
};
