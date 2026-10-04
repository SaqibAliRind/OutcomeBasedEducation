import Assessment from '../models/Assessment.js';

// @desc    Get all Assessments (optionally filter by course, session, semester)
// @route   GET /api/assessments-def
// @access  Private
export const getAssessments = async (req, res) => {
    try {
        const filter = {};
        if (req.query.course) filter.course = req.query.course;
        if (req.query.session) filter.session = req.query.session;
        if (req.query.semester) filter.semester = req.query.semester;

        const assessments = await Assessment.find(filter)
            .populate('course', 'name code')
            .populate('session', 'title')
            .populate('semester', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an Assessment
// @route   POST /api/assessments-def
// @access  Private/Admin
export const createAssessment = async (req, res) => {
    try {
        const allowedRoles = ['SuperAdmin', 'UniversityAdmin', 'Teacher', 'HOD'];
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });

        const { name, course, session, semester, weightage, passingMarks, totalMarks } = req.body;

        // Validation for weightage <= 100
        const existingSettings = await Assessment.find({ course, session, semester, status: 'Active' });
        const totalWeightage = existingSettings.reduce((sum, s) => sum + s.weightage, 0);

        if (totalWeightage + Number(weightage) > 100) {
            return res.status(400).json({ 
                message: `Total weightage for this course exceeds 100%. Current active total: ${totalWeightage}%. You can add at most ${100 - totalWeightage}%.` 
            });
        }

        if (Number(passingMarks) > Number(totalMarks)) {
            return res.status(400).json({ message: 'Passing marks cannot be greater than total marks.' });
        }

        const payload = { ...req.body, createdBy: req.user._id };
        const assessment = new Assessment(payload);
        const savedAssessment = await assessment.save();

        const populatedAssessment = await Assessment.findById(savedAssessment._id)
            .populate('course', 'name code')
            .populate('session', 'title')
            .populate('semester', 'name');

        res.status(201).json(populatedAssessment);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Assessment with this name already exists for this course, session, and semester.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an Assessment
// @route   PUT /api/assessments-def/:id
// @access  Private/Admin
export const updateAssessment = async (req, res) => {
    try {
        const allowedRoles = ['SuperAdmin', 'UniversityAdmin', 'Teacher', 'HOD'];
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });

        const { course, session, semester, weightage, passingMarks, totalMarks, status } = req.body;
        
        const settingToUpdate = await Assessment.findById(req.params.id);
        if (!settingToUpdate) return res.status(404).json({ message: 'Assessment not found' });

        if (req.user.role === 'Teacher' && settingToUpdate.createdBy && settingToUpdate.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized. You can only update assessments you created.' });
        }

        const activeCourse = course || settingToUpdate.course;
        const activeSession = session || settingToUpdate.session;
        const activeSemester = semester || settingToUpdate.semester;

        const existingSettings = await Assessment.find({ 
            course: activeCourse,
            session: activeSession,
            semester: activeSemester,
            _id: { $ne: req.params.id },
            status: 'Active' 
        });

        let newStatus = status || settingToUpdate.status;
        let newWeightage = weightage !== undefined ? Number(weightage) : settingToUpdate.weightage;

        if (newStatus === 'Active') {
            const otherTotalWeightage = existingSettings.reduce((sum, s) => sum + s.weightage, 0);
            if (otherTotalWeightage + newWeightage > 100) {
                return res.status(400).json({ 
                    message: `Total weightage exceeds 100%. Other active assessments total: ${otherTotalWeightage}%. You can set at most ${100 - otherTotalWeightage}%.` 
                });
            }
        }

        const newPassing = passingMarks !== undefined ? Number(passingMarks) : settingToUpdate.passingMarks;
        const newTotal = totalMarks !== undefined ? Number(totalMarks) : settingToUpdate.totalMarks;

        if (newPassing > newTotal) {
            return res.status(400).json({ message: 'Passing marks cannot be greater than total marks.' });
        }

        const updatedAssessment = await Assessment.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        )
        .populate('course', 'name code')
        .populate('session', 'title')
        .populate('semester', 'name');

        res.status(200).json(updatedAssessment);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Assessment with this name already exists for this course, session, and semester.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an Assessment
// @route   DELETE /api/assessments-def/:id
// @access  Private/Admin
export const deleteAssessment = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

        const isAdmin = ['SuperAdmin', 'UniversityAdmin', 'HOD'].includes(req.user.role);
        const isOwner = req.user.role === 'Teacher' && assessment.createdBy && assessment.createdBy.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Not authorized to delete this assessment.' });
        }

        const deletedAssessment = await Assessment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Assessment deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
