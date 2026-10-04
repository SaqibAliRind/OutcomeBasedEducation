import { Mark, Assessment, CourseOffering } from '../models/index.js';
import SystemSettings from '../models/SystemSettings.js';

// @desc    Submit or update marks
// @route   POST /api/marks/submit
// @access  Teacher
export const submitMarks = async (req, res) => {
    try {
        const { assessmentId, courseOfferingId, students, status } = req.body;
        
        if (!['Draft', 'Submitted'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const offering = await CourseOffering.findById(courseOfferingId);
        if (!offering) return res.status(404).json({ message: 'Course offering not found' });
        
        if (offering.teacher.toString() !== req.user._id.toString() && req.user.role !== 'UniversityAdmin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Unauthorized to submit marks for this class' });
        }

        const settings = await SystemSettings.findOne();
        if (settings?.marks?.lockAllMarks) {
            return res.status(403).json({ message: 'Marks submission is currently locked globally.' });
        }

        const { QuestionMapping } = await import('../models/index.js');
        const mapping = await QuestionMapping.findOne({
            course: offering.course,
            teacher: offering.teacher,
            section: offering.section,
            semester: offering.semester,
            assessment: assessmentId,
            status: 'Approved'
        });

        if (!mapping) {
            return res.status(403).json({ message: 'Cannot submit marks. The question paper (mapping) for this assessment has not been Approved by a moderator.' });
        }

        let markRecord = await Mark.findOne({ assessment: assessmentId, courseOffering: courseOfferingId });

        if (markRecord) {
            if (markRecord.status === 'Locked' || markRecord.status === 'Verified') {
                return res.status(403).json({ message: `Cannot modify marks. Current status is ${markRecord.status}` });
            }
            markRecord.students = students;
            markRecord.status = status;
            await markRecord.save();
        } else {
            markRecord = new Mark({
                assessment: assessmentId,
                courseOffering: courseOfferingId,
                teacher: req.user._id,
                students,
                status
            });
            await markRecord.save();
        }

        const populated = await Mark.findById(markRecord._id)
            .populate('assessment', 'name type totalMarks')
            .populate('students.student', 'name email');

        res.status(200).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get marks records
// @route   GET /api/marks
// @access  Teacher, UniversityAdmin
export const getMarks = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'Teacher') filter.teacher = req.user._id;
        if (req.query.courseOffering) filter.courseOffering = req.query.courseOffering;
        if (req.query.assessment) filter.assessment = req.query.assessment;
        if (req.query.status) filter.status = req.query.status;

        const records = await Mark.find(filter)
            .populate({ path: 'courseOffering', populate: { path: 'course section' } })
            .populate('assessment', 'name type totalMarks passingMarks')
            .populate('teacher', 'name')
            .populate('students.student', 'name email rollNo')
            .sort({ createdAt: -1 });

        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Marks Stats
// @route   GET /api/marks/stats
// @access  UniversityAdmin
export const getMarksStats = async (req, res) => {
    try {
        const statsAgg = await Mark.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = { Draft: 0, Submitted: 0, Verified: 0, Locked: 0, Total: 0 };
        statsAgg.forEach(s => {
            stats[s._id] = s.count;
            stats.Total += s.count;
        });

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify or Lock marks
// @route   PATCH /api/marks/:id/status
// @access  UniversityAdmin
export const updateMarkStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Verified', 'Locked', 'Draft'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const mark = await Mark.findById(req.params.id);
        if (!mark) return res.status(404).json({ message: 'Marks record not found' });

        mark.status = status;
        if (status === 'Verified') {
            mark.verifiedBy = req.user._id;
            mark.verifiedAt = new Date();
        }

        await mark.save();
        const populated = await Mark.findById(mark._id)
            .populate({ path: 'courseOffering', populate: { path: 'course section' } })
            .populate('assessment', 'name type totalMarks')
            .populate('teacher', 'name');

        res.status(200).json({ message: `Marks status updated to ${status}`, record: populated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Detailed Marks Reports
// @route   GET /api/marks/reports
// @access  UniversityAdmin
export const getMarksReports = async (req, res) => {
    try {
        const { groupBy } = req.query; // 'department', 'course', 'teacher'
        let reports = [];

        if (groupBy === 'teacher') {
            reports = await Mark.aggregate([
                {
                    $group: {
                        _id: "$teacher",
                        totalSubmissions: { $sum: 1 },
                        verifiedSubmissions: { $sum: { $cond: [{ $eq: ["$status", "Verified"] }, 1, 0] } },
                        lockedSubmissions: { $sum: { $cond: [{ $eq: ["$status", "Locked"] }, 1, 0] } }
                    }
                },
                { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "teacher" } },
                { $unwind: "$teacher" },
                {
                    $project: {
                        name: "$teacher.name",
                        email: "$teacher.email",
                        totalSubmissions: 1,
                        verifiedSubmissions: 1,
                        lockedSubmissions: 1
                    }
                },
                { $sort: { totalSubmissions: -1 } }
            ]);
        } else {
            // Need to group by course or department through courseOffering
            const lookupPath = groupBy === 'department' ? 'department' : 'course';
            const lookupCollection = groupBy === 'department' ? 'departments' : 'courses';

            reports = await Mark.aggregate([
                { $lookup: { from: "courseofferings", localField: "courseOffering", foreignField: "_id", as: "offering" } },
                { $unwind: "$offering" },
                {
                    $group: {
                        _id: `$offering.${lookupPath}`,
                        totalSubmissions: { $sum: 1 },
                        avgMarks: { $avg: { $avg: "$students.obtainedMarks" } }
                    }
                },
                { $lookup: { from: lookupCollection, localField: "_id", foreignField: "_id", as: "doc" } },
                { $unwind: "$doc" },
                {
                    $project: {
                        name: groupBy === 'course' ? "$doc.code" : "$doc.name",
                        totalSubmissions: 1,
                        avgMarks: { $round: ["$avgMarks", 1] }
                    }
                },
                { $sort: { totalSubmissions: -1 } }
            ]);
        }

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
