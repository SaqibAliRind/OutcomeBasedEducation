import { Blueprint } from '../models/index.js';

const populate = (q) => q
    .populate('course', 'name code')
    .populate('session', 'name')
    .populate('semester', 'name year')
    .populate('department', 'name')
    .populate('program', 'name')
    .populate('section', 'name')
    .populate('teacher', 'name email')
    .populate('assessment', 'name type weightage')
    .populate('rows.clo', 'code description');

// @desc    Get blueprints
// @route   GET /api/blueprints
// @access  Private
export const getBlueprints = async (req, res) => {
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

        const blueprints = await populate(Blueprint.find(filter)).sort({ createdAt: -1 });
        res.status(200).json(blueprints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a blueprint
// @route   POST /api/blueprints
// @access  Private
export const createBlueprint = async (req, res) => {
    try {
        const { course, session, semester, department, program, section, teacher, assessment, totalQuestions, totalMarks, rows, version, status } = req.body;
        
        const existing = await Blueprint.findOne({ course, teacher, assessment, semester, section });
        if (existing) {
            return res.status(400).json({ message: 'A blueprint already exists for this exact assessment, teacher, course, and section.' });
        }

        const bp = new Blueprint({ course, session, semester, department, program, section, teacher, assessment, totalQuestions, totalMarks, rows, version, status });
        const saved = await bp.save();
        const populated = await populate(Blueprint.findById(saved._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a blueprint
// @route   PUT /api/blueprints/:id
// @access  Private
export const updateBlueprint = async (req, res) => {
    try {
        const updated = await populate(
            Blueprint.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        );
        if (!updated) return res.status(404).json({ message: 'Blueprint not found' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a blueprint
// @route   DELETE /api/blueprints/:id
// @access  Private
export const deleteBlueprint = async (req, res) => {
    try {
        const deleted = await Blueprint.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Blueprint not found' });
        res.status(200).json({ message: 'Blueprint deleted', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Copy blueprint
// @route   POST /api/blueprints/copy
// @access  Private
export const copyBlueprint = async (req, res) => {
    try {
        const { sourceBlueprintId, newCourse, newSession, newSemester, newDepartment, newProgram, newSection, newTeacher, newAssessment } = req.body;
        
        const sourceBp = await Blueprint.findById(sourceBlueprintId);
        if (!sourceBp) return res.status(404).json({ message: 'Source blueprint not found.' });

        const existing = await Blueprint.findOne({ course: newCourse, teacher: newTeacher, assessment: newAssessment, semester: newSemester, section: newSection });
        if (existing) {
            return res.status(400).json({ message: 'A blueprint already exists for the target assessment.' });
        }

        const newBp = new Blueprint({
            course: newCourse,
            session: newSession,
            semester: newSemester,
            department: newDepartment,
            program: newProgram,
            section: newSection,
            teacher: newTeacher,
            assessment: newAssessment,
            version: sourceBp.version,
            status: 'Draft',
            totalQuestions: sourceBp.totalQuestions,
            totalMarks: sourceBp.totalMarks,
            rows: sourceBp.rows.map(r => ({
                topic: r.topic,
                clo: r.clo,
                bloomsLevel: r.bloomsLevel,
                questionCount: r.questionCount,
                marks: r.marks
            }))
        });

        const saved = await newBp.save();
        const populated = await populate(Blueprint.findById(saved._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
