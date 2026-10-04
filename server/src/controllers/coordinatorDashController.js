import { User, Section, Batch, Course, Program, Enrollment } from '../models/index.js';

// @desc  Program Coordinator Dashboard — scoped to coordinator's program
// @route GET /api/coordinator/dashboard
// @access Private (ProgramCoordinator)
export const getCoordinatorDashboard = async (req, res) => {
    try {
        const coord = req.user;
        const programId = coord.program || null;
        const programFilter = programId ? { program: programId } : {};

        const [
            totalSections,
            totalBatches,
            totalCourses,
            totalStudents
        ] = await Promise.all([
            Section.countDocuments(programFilter),
            Batch.countDocuments(programFilter),
            Course.countDocuments(programFilter),
            User.countDocuments({ ...programFilter, role: 'Student', isDeleted: false })
        ]);

        // Recent enrollments in this program
        const recentEnrollments = await Enrollment.find(programId ? { program: programId } : {})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'name email rollNumber')
            .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
            .lean();

        res.json({
            stats: {
                totalSections,
                totalBatches,
                totalCourses,
                totalStudents
            },
            recentEnrollments
        });
    } catch (err) {
        console.error('Coordinator Dashboard Error:', err);
        res.status(500).json({ message: 'Server error fetching coordinator dashboard' });
    }
};
