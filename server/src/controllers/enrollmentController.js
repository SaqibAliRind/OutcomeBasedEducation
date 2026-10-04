import Enrollment from '../models/Enrollment.js';
import CourseOffering from '../models/CourseOffering.js';
import Semester from '../models/Semester.js';
import User from '../models/User.js';

// GET /api/enrollments — Admin sees all; Student sees own
export const getEnrollments = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin', 'HOD', 'QEC'].includes(req.user.role);
        const filter = isAdmin ? {} : (req.user.role === 'Teacher' ? {} : { student: req.user._id });

        // Optional filters from query params
        if (req.query.student) filter.student = req.query.student;
        if (req.query.semester) filter.semester = req.query.semester;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.courseOffering) filter.courseOffering = req.query.courseOffering;

        const enrollments = await Enrollment.find(filter)
            .populate('student', 'name email')
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
            .populate('semester', 'name number')
            .sort({ createdAt: -1 });

        res.status(200).json(enrollments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/enrollments/offerings — list of available course offerings for enrollment
export const getAvailableOfferings = async (req, res) => {
    try {
        const { semesterId } = req.query;
        const filter = { status: 'Open' };
        if (semesterId) filter.semester = semesterId;

        const offerings = await CourseOffering.find(filter)
            .populate('course', 'name code title')
            .populate('teacher', 'name email')
            .populate('section', 'name');
        res.status(200).json(offerings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/enrollments/course — Enroll student in a course offering
export const enrollInCourse = async (req, res) => {
    try {
        const { studentId, courseOfferingId, semesterId, session } = req.body;

        // Admin enrolls on behalf OR student enrolls themselves
        const targetStudent = studentId || req.user._id;

        // Check if already enrolled
        const exists = await Enrollment.findOne({ student: targetStudent, courseOffering: courseOfferingId });
        if (exists && exists.status === 'Enrolled') {
            return res.status(400).json({ message: 'Student is already enrolled in this course.' });
        }

        // Check enrollment limit
        const offering = await CourseOffering.findById(courseOfferingId);
        if (!offering) return res.status(404).json({ message: 'Course offering not found.' });

        const currentCount = await Enrollment.countDocuments({ courseOffering: courseOfferingId, status: 'Enrolled' });
        if (currentCount >= offering.enrollmentLimit) {
            return res.status(400).json({ message: `Enrollment limit (${offering.enrollmentLimit}) reached for this course.` });
        }

        let enrollment;
        if (exists && exists.status === 'Dropped') {
            // Re-enroll
            exists.status = 'Enrolled';
            exists.enrolledAt = new Date();
            exists.droppedAt = null;
            enrollment = await exists.save();
        } else {
            enrollment = await Enrollment.create({
                student: targetStudent,
                courseOffering: courseOfferingId,
                semester: semesterId,
                session
            });
        }

        const populated = await enrollment.populate([
            { path: 'student', select: 'name email' },
            { path: 'courseOffering' },
            { path: 'semester', select: 'name number' }
        ]);

        res.status(201).json({ message: 'Enrolled successfully.', enrollment: populated });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Student already enrolled in this course.' });
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/enrollments/:id/drop — Drop a course
export const dropCourse = async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found.' });

        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin && enrollment.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to drop this enrollment.' });
        }
        if (enrollment.status === 'Dropped') {
            return res.status(400).json({ message: 'Course is already dropped.' });
        }

        enrollment.status = 'Dropped';
        enrollment.droppedAt = new Date();
        await enrollment.save();

        res.status(200).json({ message: 'Course dropped successfully.', enrollment });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/enrollments/semester — Semester Enrollment (mark student as enrolled in a semester)
export const enrollInSemester = async (req, res) => {
    try {
        const { studentId, semesterId, session } = req.body;
        const targetStudent = studentId || req.user._id;

        // This just ensures the semester record exists and student is tracked
        const semester = await Semester.findById(semesterId);
        if (!semester) return res.status(404).json({ message: 'Semester not found.' });

        // Check if already has any enrollment for this semester
        const existing = await Enrollment.findOne({ student: targetStudent, semester: semesterId });
        if (existing) {
            return res.status(400).json({ message: 'Student already has enrollments in this semester.' });
        }

        res.status(200).json({ message: `Student enrolled in ${semester.name} semester successfully.`, semester });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
