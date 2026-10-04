import { Attendance, CourseOffering, Enrollment, Notification } from '../models/index.js';
import SystemSettings from '../models/SystemSettings.js';

// @desc    Mark or update attendance for a class
// @route   POST /api/attendance
// @access  Teacher
export const markAttendance = async (req, res) => {
    try {
        const { courseOffering, date, students } = req.body;

        if (!courseOffering || !date || !students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const offering = await CourseOffering.findById(courseOffering).populate('course session semester program section');
        if (!offering) {
            return res.status(404).json({ message: 'Course offering not found' });
        }

        // Only the assigned teacher or an admin can mark attendance
        const isAdmin = req.user.role === 'UniversityAdmin' || req.user.role === 'SuperAdmin' || req.user.role === 'HOD';
        const isAssignedTeacher = offering.teacher && offering.teacher.toString() === req.user._id.toString();
        if (!isAssignedTeacher && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to mark attendance for this course' });
        }

        // Check global settings
        const settings = await SystemSettings.findOne();
        const attendanceSettings = settings?.attendance || {};

        if (attendanceSettings.freezeAttendance) {
            return res.status(403).json({ message: 'Attendance marking is currently frozen by the administration.' });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

        if (attendanceSettings.lockDate && targetDate < new Date(attendanceSettings.lockDate)) {
            return res.status(403).json({ message: 'Cannot mark attendance for dates prior to the lock date.' });
        }

        const approvalStatus = attendanceSettings.requireApproval ? 'Pending' : 'Approved';

        // Check if attendance already exists for this date and offering
        let attendance = await Attendance.findOne({
            courseOffering,
            date: {
                $gte: targetDate,
                $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (attendance) {
            // Update existing
            attendance.students = students;
            attendance.approvalStatus = approvalStatus;
            await attendance.save();
        } else {
            // Create new
            attendance = new Attendance({
                session: offering.session,
                semester: offering.semester,
                department: offering.department,
                program: offering.program,
                course: offering.course,
                section: offering.section,
                courseOffering,
                teacher: req.user._id,
                date: targetDate,
                students,
                approvalStatus
            });
            await attendance.save();
        }

        const populated = await Attendance.findById(attendance._id)
            .populate('course', 'name code')
            .populate('section', 'name')
            .populate('students.student', 'name email');

        res.status(200).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Teacher, UniversityAdmin
export const getAttendance = async (req, res) => {
    try {
        const filter = {};
        
        // Teachers can only see their own attendance records
        if (req.user.role === 'Teacher') {
            filter.teacher = req.user._id;
        }

        if (req.query.courseOffering) filter.courseOffering = req.query.courseOffering;
        if (req.query.course) filter.course = req.query.course;
        if (req.query.section) filter.section = req.query.section;
        if (req.query.date) {
            const date = new Date(req.query.date);
            date.setHours(0, 0, 0, 0);
            filter.date = {
                $gte: date,
                $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
            };
        }

        const records = await Attendance.find(filter)
            .populate('course', 'name code')
            .populate('section', 'name')
            .populate('teacher', 'name')
            .populate('students.student', 'name email')
            .sort({ date: -1 });

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/attendance/stats
// @access  UniversityAdmin
export const getAttendanceStats = async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        const minPercentage = settings?.attendance?.minimumPercentage || 75;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Basic metrics
        const totalRecords = await Attendance.countDocuments();
        const todayRecords = await Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } });

        // Aggregate for Present vs Absent %
        const statusAgg = await Attendance.aggregate([
            { $unwind: "$students" },
            {
                $group: {
                    _id: "$students.status",
                    count: { $sum: 1 }
                }
            }
        ]);

        let totalStudentsMarked = 0;
        let presentCount = 0;
        let absentCount = 0;

        statusAgg.forEach(s => {
            totalStudentsMarked += s.count;
            if (s._id === 'Present' || s._id === 'Late') presentCount += s.count; // Late is usually considered present for % purposes
            else if (s._id === 'Absent') absentCount += s.count;
        });

        const presentPercentage = totalStudentsMarked ? ((presentCount / totalStudentsMarked) * 100).toFixed(1) : 0;
        const absentPercentage = totalStudentsMarked ? ((absentCount / totalStudentsMarked) * 100).toFixed(1) : 0;

        // Department-wise
        const deptAgg = await Attendance.aggregate([
            { $unwind: "$students" },
            {
                $group: {
                    _id: { dept: "$department", status: "$students.status" },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "_id.dept",
                    foreignField: "_id",
                    as: "departmentDoc"
                }
            },
            { $unwind: { path: "$departmentDoc", preserveNullAndEmptyArrays: true } }
        ]);

        const deptStats = {};
        deptAgg.forEach(d => {
            const deptName = d.departmentDoc?.name || 'Unknown';
            if (!deptStats[deptName]) deptStats[deptName] = { present: 0, total: 0 };
            
            deptStats[deptName].total += d.count;
            if (d._id.status === 'Present' || d._id.status === 'Late') {
                deptStats[deptName].present += d.count;
            }
        });

        const departmentWise = Object.keys(deptStats).map(dept => ({
            department: dept,
            percentage: deptStats[dept].total ? ((deptStats[dept].present / deptStats[dept].total) * 100).toFixed(1) : 0
        }));

        // Course-wise
        const courseAgg = await Attendance.aggregate([
            { $unwind: "$students" },
            {
                $group: {
                    _id: { course: "$course", status: "$students.status" },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id.course",
                    foreignField: "_id",
                    as: "courseDoc"
                }
            },
            { $unwind: { path: "$courseDoc", preserveNullAndEmptyArrays: true } }
        ]);

        const courseStats = {};
        courseAgg.forEach(c => {
            const courseCode = c.courseDoc?.code || 'Unknown';
            if (!courseStats[courseCode]) courseStats[courseCode] = { present: 0, total: 0 };
            
            courseStats[courseCode].total += c.count;
            if (c._id.status === 'Present' || c._id.status === 'Late') {
                courseStats[courseCode].present += c.count;
            }
        });

        const courseWise = Object.keys(courseStats).map(course => ({
            course,
            percentage: courseStats[course].total ? ((courseStats[course].present / courseStats[course].total) * 100).toFixed(1) : 0
        }));

        // Short Attendance Students (< 75%)
        const studentAgg = await Attendance.aggregate([
            { $unwind: "$students" },
            {
                $group: {
                    _id: { student: "$students.student", course: "$course" },
                    totalClasses: { $sum: 1 },
                    presentClasses: {
                        $sum: {
                            $cond: [{ $in: ["$students.status", ["Present", "Late", "Excused"]] }, 1, 0]
                        }
                    }
                }
            },
                
            
            { $unwind: { path: "$studentDoc", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "courses",
                    localField: "courseId",
                    foreignField: "_id",
                    as: "courseDoc"
                }
            },
            { $unwind: { path: "$courseDoc", preserveNullAndEmptyArrays: true } },
            { $limit: 20 } // Limit the list for dashboard
        ]);

        const shortAttendanceStudents = studentAgg.map(s => ({
            studentName: s.studentDoc?.name || 'Unknown',
            email: s.studentDoc?.email || '',
            course: s.courseDoc?.code || 'Unknown',
            percentage: (s.attendancePercentage || 0).toFixed(1)
        }));

        res.status(200).json({
            totalRecords,
            todayRecords,
            presentPercentage,
            absentPercentage,
            departmentWise,
            courseWise,
            shortAttendanceStudents,
            minPercentage
        });

    } catch (error) {
        console.error('getAttendanceStats Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Attendance Reports (Daily, Weekly, Monthly)
// @route   GET /api/attendance/reports
// @access  UniversityAdmin
export const getAttendanceReports = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query; // type can be 'Daily', 'Weekly', 'Monthly'
        const match = {};

        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        let groupId = {};
        if (type === 'Daily') {
            groupId = { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } };
        } else if (type === 'Weekly') {
            groupId = { year: { $year: "$date" }, week: { $week: "$date" } };
        } else if (type === 'Monthly') {
            groupId = { year: { $year: "$date" }, month: { $month: "$date" } };
        } else {
            groupId = { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } }; // Default Daily
        }

        const reports = await Attendance.aggregate([
            { $match: match },
            { $unwind: "$students" },
            {
                $group: {
                    _id: groupId,
                    totalMarked: { $sum: 1 },
                    presentCount: { $sum: { $cond: [{ $in: ["$students.status", ["Present", "Late", "Excused"]] }, 1, 0] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } }
        ]);

        const formatted = reports.map(r => {
            let label = '';
            if (r._id.day) label = `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2, '0')}`;
            else if (r._id.week) label = `Year ${r._id.year}, Week ${r._id.week}`;
            else if (r._id.month) label = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;

            return {
                label,
                total: r.totalMarked,
                present: r.presentCount,
                percentage: r.totalMarked ? ((r.presentCount / r.totalMarked) * 100).toFixed(1) : 0
            };
        });

        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or Reject attendance
// @route   PATCH /api/attendance/:id/approve
// @access  UniversityAdmin
export const approveAttendance = async (req, res) => {
    try {
        const { status } = req.body; // 'Approved' or 'Rejected'
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

        attendance.approvalStatus = status;
        attendance.approvedBy = req.user._id;
        attendance.approvedAt = new Date();
        await attendance.save();

        const populated = await Attendance.findById(attendance._id)
            .populate('course', 'name code')
            .populate('section', 'name')
            .populate('teacher', 'name')
            .populate('students.student', 'name email');

        res.status(200).json({ message: `Attendance ${status}`, record: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get comprehensive attendance analytics
// @route   GET /api/attendance/analytics
// @access  UniversityAdmin
export const getAttendanceAnalytics = async (req, res) => {
    try {
        const { groupBy } = req.query; // 'department', 'program', 'semester', 'course', 'teacher'
        let groupField = "$department";
        let lookupConfig = { from: "departments", localField: "_id", foreignField: "_id", as: "doc" };
        let nameField = "$doc.name";

        if (groupBy === 'program') {
            groupField = "$program";
            lookupConfig = { from: "programs", localField: "_id", foreignField: "_id", as: "doc" };
        } else if (groupBy === 'semester') {
            groupField = "$semester";
            lookupConfig = { from: "semesters", localField: "_id", foreignField: "_id", as: "doc" };
        } else if (groupBy === 'course') {
            groupField = "$course";
            lookupConfig = { from: "courses", localField: "_id", foreignField: "_id", as: "doc" };
            nameField = "$doc.code";
        } else if (groupBy === 'teacher') {
            groupField = "$teacher";
            lookupConfig = { from: "users", localField: "_id", foreignField: "_id", as: "doc" };
        }

        const analytics = await Attendance.aggregate([
            { $unwind: "$students" },
            {
                $group: {
                    _id: groupField,
                    totalClasses: { $sum: 1 },
                    presentClasses: { $sum: { $cond: [{ $in: ["$students.status", ["Present", "Late", "Excused"]] }, 1, 0] } }
                }
            },
            { $lookup: lookupConfig },
            { $unwind: { path: "$doc", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    label: nameField,
                    percentage: { $multiply: [{ $divide: ["$presentClasses", "$totalClasses"] }, 100] }
                }
            },
            { $sort: { percentage: -1 } }
        ]);

        res.status(200).json(analytics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Detailed Reports
// @route   GET /api/attendance/detailed-reports
// @access  UniversityAdmin
export const getDetailedReports = async (req, res) => {
    try {
        const { type } = req.query; // 'Student', 'Teacher', 'Course'
        let reports = [];

        if (type === 'Student') {
            reports = await Attendance.aggregate([
                { $unwind: "$students" },
                {
                    $group: {
                        _id: "$students.student",
                        totalClasses: { $sum: 1 },
                        presentClasses: { $sum: { $cond: [{ $in: ["$students.status", ["Present", "Late", "Excused"]] }, 1, 0] } }
                    }
                },
                { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
                { $unwind: "$user" },
                {
                    $project: {
                        name: "$user.name",
                        email: "$user.email",
                        totalClasses: 1,
                        presentClasses: 1,
                        percentage: { $round: [{ $multiply: [{ $divide: ["$presentClasses", "$totalClasses"] }, 100] }, 1] }
                    }
                },
                { $sort: { percentage: 1 } }
            ]);
        } else if (type === 'Teacher') {
            reports = await Attendance.aggregate([
                {
                    $group: {
                        _id: "$teacher",
                        totalSessionsMarked: { $sum: 1 }
                    }
                },
                { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
                { $unwind: "$user" },
                {
                    $project: {
                        name: "$user.name",
                        email: "$user.email",
                        totalSessionsMarked: 1
                    }
                },
                { $sort: { totalSessionsMarked: -1 } }
            ]);
        }

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send Attendance Alerts
// @route   POST /api/attendance/alerts
// @access  UniversityAdmin
export const sendAttendanceAlerts = async (req, res) => {
    try {
        const { studentId, allShort, type } = req.body; // type: 'Warning' or 'Notification'
        const settings = await SystemSettings.findOne();
        const minPercentage = settings?.attendance?.minimumPercentage || 75;

        // Logic to get short attendance students
        const studentAgg = await Attendance.aggregate([
            { $unwind: "$students" },
            {
                $group: {
                    _id: "$students.student",
                    totalClasses: { $sum: 1 },
                    presentClasses: { $sum: { $cond: [{ $in: ["$students.status", ["Present", "Late", "Excused"]] }, 1, 0] } }
                }
            },
            {
                $project: {
                    attendancePercentage: { $multiply: [{ $divide: ["$presentClasses", "$totalClasses"] }, 100] }
                }
            },
            { $match: { attendancePercentage: { $lt: minPercentage } } }
        ]);

        const targets = allShort ? studentAgg.map(s => s._id) : [studentId];
        
        const notificationPromises = targets.map(id => {
            return Notification.create({
                recipient: id,
                title: type === 'Warning' ? 'Short Attendance Warning' : 'Attendance Alert',
                message: `Your current attendance is below the university minimum requirement of ${minPercentage}%. Please contact your department immediately.`,
                type: type === 'Warning' ? 'Alert' : 'Info',
                sender: req.user._id
            });
        });

        await Promise.all(notificationPromises);

        res.status(200).json({ message: `Successfully sent ${notificationPromises.length} alerts.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete attendance record (only if not yet approved/locked)
// @route   DELETE /api/attendance/:id
// @access  Teacher (own), Admin
export const deleteAttendance = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Attendance record not found' });

        // Teacher can only delete their own records that are not yet approved
        if (req.user.role === 'Teacher') {
            if (record.teacher.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this attendance record' });
            }
            if (record.approvalStatus === 'Approved') {
                return res.status(403).json({ message: 'Cannot delete an approved attendance record' });
            }
        }

        await Attendance.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
