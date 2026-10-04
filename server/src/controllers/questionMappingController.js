import { QuestionMapping } from '../models/index.js';

const populate = (q) => q
    .populate('course', 'name code')
    .populate('session', 'name')
    .populate('semester', 'name year')
    .populate('department', 'name')
    .populate('program', 'name')
    .populate('section', 'name')
    .populate('teacher', 'name email')
    .populate('assessment', 'name type weightage')
    .populate('questions.clo', 'code description')
    .populate('questions.plo', 'code description')
    .populate('questions.ga', 'code description');

// @desc    Get question mappings
// @route   GET /api/question-mappings
// @access  Private
export const getMappings = async (req, res) => {
    try {
        const filter = {};
        if (req.query.course) filter.course = req.query.course;
        if (req.query.session) filter.session = req.query.session;
        if (req.query.semester) filter.semester = req.query.semester;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.program) filter.program = req.query.program;
        if (req.query.section) filter.section = req.query.section;
        if (req.query.teacher) filter.teacher = req.query.teacher;
        if (req.query.assessment) filter.assessment = req.query.assessment;
        if (req.query.status) filter.status = req.query.status;

        const mappings = await populate(QuestionMapping.find(filter)).sort({ createdAt: -1 });
        res.status(200).json(mappings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a question mapping
// @route   POST /api/question-mappings
// @access  Private
export const createMapping = async (req, res) => {
    try {
        const { course, session, semester, department, program, section, teacher, assessment, questions, version, status } = req.body;
        
        // Prevent duplicate mapping
        const existing = await QuestionMapping.findOne({ course, teacher, semester, assessment, section });
        if (existing) {
            return res.status(400).json({ message: 'A mapping already exists for this exact assessment, teacher, section, and course.' });
        }

        // ENFORCE BLUEPRINT APPROVED STATUS
        const { Blueprint } = await import('../models/index.js');
        const blueprint = await Blueprint.findOne({ course, teacher, assessment, semester, section });
        if (!blueprint || blueprint.status !== 'Approved') {
            return res.status(400).json({ message: 'Question Mapping cannot be created because the parent Blueprint is not Approved.' });
        }

        if (status === 'Submitted' || status === 'Approved') {
            const { validateMappingAgainstBlueprint } = await import('../services/blueprintValidationService.js');
            await validateMappingAgainstBlueprint({ course, teacher, assessment, questions });
        }

        const mapping = new QuestionMapping({ course, session, semester, department, program, section, teacher, assessment, questions, version, status });
        const saved = await mapping.save();
        const populated = await populate(QuestionMapping.findById(saved._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a question mapping
// @route   PUT /api/question-mappings/:id
// @access  Private
export const updateMapping = async (req, res) => {
    try {
        const existing = await QuestionMapping.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Mapping not found' });
        
        // Authorization & Locking Check
        if (existing.teacher.toString() !== req.user._id.toString() && req.user.role !== 'UniversityAdmin' && req.user.role !== 'SuperAdmin' && req.user.role !== 'HOD') {
            return res.status(403).json({ message: 'Unauthorized to update this mapping.' });
        }
        if (existing.status === 'Approved' || existing.status === 'Locked') {
            // Only Admins or HODs can update an approved mapping
            if (req.user.role !== 'UniversityAdmin' && req.user.role !== 'SuperAdmin' && req.user.role !== 'HOD') {
                return res.status(403).json({ message: `Cannot update mapping because its status is ${existing.status}.` });
            }
        }
        
        const newStatus = req.body.status || existing.status;
        if (newStatus === 'Submitted' || newStatus === 'Approved') {
            const { validateMappingAgainstBlueprint } = await import('../services/blueprintValidationService.js');
            await validateMappingAgainstBlueprint({ 
                course: existing.course, 
                teacher: existing.teacher, 
                assessment: existing.assessment, 
                questions: req.body.questions || existing.questions 
            });
        }

        const updated = await populate(
            QuestionMapping.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        );
        if (!updated) return res.status(404).json({ message: 'Mapping not found' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a question mapping
// @route   DELETE /api/question-mappings/:id
// @access  Private
export const deleteMapping = async (req, res) => {
    try {
        const existing = await QuestionMapping.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Mapping not found' });

        if (existing.teacher.toString() !== req.user._id.toString() && req.user.role !== 'UniversityAdmin' && req.user.role !== 'SuperAdmin' && req.user.role !== 'HOD') {
            return res.status(403).json({ message: 'Unauthorized to delete this mapping.' });
        }
        if (existing.status === 'Approved' || existing.status === 'Locked') {
            if (req.user.role !== 'UniversityAdmin' && req.user.role !== 'SuperAdmin' && req.user.role !== 'HOD') {
                return res.status(403).json({ message: `Cannot delete mapping because its status is ${existing.status}.` });
            }
        }

        const deleted = await QuestionMapping.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Mapping not found' });
        res.status(200).json({ message: 'Mapping deleted', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Copy previous mapping
// @route   POST /api/question-mappings/copy
// @access  Private
export const copyMapping = async (req, res) => {
    try {
        const { sourceMappingId, newCourse, newSession, newSemester, newDepartment, newProgram, newSection, newTeacher, newAssessment } = req.body;
        
        const sourceMapping = await QuestionMapping.findById(sourceMappingId);
        if (!sourceMapping) return res.status(404).json({ message: 'Source mapping not found.' });

        const existing = await QuestionMapping.findOne({ course: newCourse, teacher: newTeacher, semester: newSemester, assessment: newAssessment, section: newSection });
        if (existing) {
            return res.status(400).json({ message: 'A mapping already exists for the target assessment.' });
        }

        const newMapping = new QuestionMapping({
            course: newCourse,
            session: newSession,
            semester: newSemester,
            department: newDepartment,
            program: newProgram,
            section: newSection,
            teacher: newTeacher,
            assessment: newAssessment,
            version: sourceMapping.version,
            status: 'Draft',
            questions: sourceMapping.questions.map(q => ({
                questionNumber: q.questionNumber,
                marks: q.marks,
                clo: q.clo,
                plo: q.plo,
                ga: q.ga,
                btLevel: q.btLevel,
                actionVerb: q.actionVerb,
                difficulty: q.difficulty
            }))
        });

        const saved = await newMapping.save();
        const populated = await populate(QuestionMapping.findById(saved._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
