import SemesterRegistration from '../models/SemesterRegistration.js';
import Semester from '../models/Semester.js';
import Enrollment from '../models/Enrollment.js';

// GET /api/semester-registration
export const getRegistrations = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        const filter = isAdmin ? {} : { student: req.user._id };

        if (req.query.student) filter.student = req.query.student;
        if (req.query.semester) filter.semester = req.query.semester;
        if (req.query.status) filter.status = req.query.status;

        const registrations = await SemesterRegistration.find(filter)
            .populate('student', 'name email')
            .populate('semester', 'name number status')
            .populate({
                path: 'enrollments',
                populate: { path: 'courseOffering', select: 'course teacher section' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(registrations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/semester-registration — Register a student for a semester
export const registerSemester = async (req, res) => {
    try {
        const { studentId, semesterId, session, remarks } = req.body;
        const targetStudent = studentId || req.user._id;

        // Verify semester exists and is open
        const semester = await Semester.findById(semesterId);
        if (!semester) return res.status(404).json({ message: 'Semester not found.' });
        if (semester.status !== 'Open') {
            return res.status(400).json({ message: `Semester "${semester.name}" is not open for registration.` });
        }

        const registration = await SemesterRegistration.create({
            student: targetStudent,
            semester: semesterId,
            session: session || `${semester.name} ${new Date().getFullYear()}`,
            remarks,
            registeredAt: new Date()
        });

        const populated = await registration.populate([
            { path: 'student', select: 'name email' },
            { path: 'semester', select: 'name number status' }
        ]);

        res.status(201).json({ message: 'Semester registered successfully.', registration: populated });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Student is already registered for this semester and session.' });
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/semester-registration/:id/freeze — Freeze registration
export const freezeRegistration = async (req, res) => {
    try {
        const registration = await SemesterRegistration.findById(req.params.id);
        if (!registration) return res.status(404).json({ message: 'Registration not found.' });
        if (registration.status === 'Frozen') return res.status(400).json({ message: 'Already frozen.' });
        if (registration.status === 'Dropped') return res.status(400).json({ message: 'Cannot freeze a dropped registration.' });

        registration.status = 'Frozen';
        registration.frozenAt = new Date();
        await registration.save();

        res.status(200).json({ message: 'Semester registration frozen.', registration });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PATCH /api/semester-registration/:id/drop — Drop registration
export const dropRegistration = async (req, res) => {
    try {
        const registration = await SemesterRegistration.findById(req.params.id);
        if (!registration) return res.status(404).json({ message: 'Registration not found.' });
        if (registration.status === 'Dropped') return res.status(400).json({ message: 'Already dropped.' });

        // Also drop all linked enrollments
        if (registration.enrollments?.length) {
            await Enrollment.updateMany(
                { _id: { $in: registration.enrollments } },
                { status: 'Dropped', droppedAt: new Date() }
            );
        }

        registration.status = 'Dropped';
        registration.droppedAt = new Date();
        await registration.save();

        res.status(200).json({ message: 'Semester registration and all linked enrollments dropped.', registration });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
