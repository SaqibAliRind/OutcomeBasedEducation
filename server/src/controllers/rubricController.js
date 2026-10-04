import { Rubric } from '../models/index.js';

const populate = (r) => r
    .populate('session', 'name')
    .populate('semester', 'name year')
    .populate('department', 'name')
    .populate('program', 'name')
    .populate('course', 'name code')
    .populate('section', 'name')
    .populate('teacher', 'name email');

// @desc    Get all rubrics
// @route   GET /api/rubrics
// @access  Private
export const getRubrics = async (req, res) => {
    try {
        const filter = {};
        if (req.query.session) filter.session = req.query.session;
        if (req.query.semester) filter.semester = req.query.semester;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.program) filter.program = req.query.program;
        if (req.query.course) filter.course = req.query.course;
        if (req.query.section) filter.section = req.query.section;
        if (req.query.teacher) filter.teacher = req.query.teacher;
        if (req.query.rubricType) filter.rubricType = req.query.rubricType;
        if (req.query.assessmentType) filter.assessmentType = req.query.assessmentType;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }

        const rubrics = await populate(Rubric.find(filter)).sort({ createdAt: -1 });
        res.status(200).json(rubrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a rubric
// @route   POST /api/rubrics
// @access  Private
export const createRubric = async (req, res) => {
    try {
        const { name, rubricType, assessmentType, session, semester, department, program, course, section, teacher, criteria, version, status } = req.body;
        
        const existing = await Rubric.findOne({ name, rubricType });
        if (existing) {
            return res.status(400).json({ message: 'A rubric with this name and type already exists.' });
        }

        // Calculate total marks
        const totalMarks = criteria.reduce((sum, c) => sum + Number(c.marks || 0), 0);

        const rubric = new Rubric({ name, rubricType, assessmentType, session, semester, department, program, course, section, teacher, criteria, totalMarks, version, status });
        const saved = await rubric.save();
        const populated = await populate(Rubric.findById(saved._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a rubric
// @route   PUT /api/rubrics/:id
// @access  Private
export const updateRubric = async (req, res) => {
    try {
        let totalMarks = undefined;
        if (req.body.criteria) {
            totalMarks = req.body.criteria.reduce((sum, c) => sum + Number(c.marks || 0), 0);
            req.body.totalMarks = totalMarks;
        }

        const updated = await populate(
            Rubric.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        );
        if (!updated) return res.status(404).json({ message: 'Rubric not found' });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a rubric
// @route   DELETE /api/rubrics/:id
// @access  Private
export const deleteRubric = async (req, res) => {
    try {
        const deleted = await Rubric.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Rubric not found' });
        res.status(200).json({ message: 'Rubric deleted', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Copy rubric
// @route   POST /api/rubrics/copy
// @access  Private
export const copyRubric = async (req, res) => {
    try {
        const { sourceRubricId, newName, newSession, newSemester, newDepartment, newProgram, newCourse, newSection, newTeacher } = req.body;
        
        const sourceRubric = await Rubric.findById(sourceRubricId);
        if (!sourceRubric) return res.status(404).json({ message: 'Source rubric not found.' });

        const existing = await Rubric.findOne({ name: newName, rubricType: sourceRubric.rubricType });
        if (existing) {
            return res.status(400).json({ message: 'A rubric with this name and type already exists.' });
        }

        const newRubric = new Rubric({
            name: newName,
            rubricType: sourceRubric.rubricType,
            assessmentType: sourceRubric.assessmentType,
            session: newSession,
            semester: newSemester,
            department: newDepartment,
            program: newProgram,
            course: newCourse,
            section: newSection,
            teacher: newTeacher,
            version: sourceRubric.version,
            totalMarks: sourceRubric.totalMarks,
            status: 'Draft',
            criteria: sourceRubric.criteria.map(c => ({
                name: c.name,
                marks: c.marks,
                descriptions: c.descriptions
            }))
        });

        const saved = await newRubric.save();
        const populated = await populate(Rubric.findById(saved._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
