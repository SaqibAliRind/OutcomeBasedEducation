import mongoose from 'mongoose';

const rubricCriterionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    marks: { type: Number, required: true },
    descriptions: {
        excellent: { type: String, default: '' },
        good: { type: String, default: '' },
        satisfactory: { type: String, default: '' },
        poor: { type: String, default: '' }
    }
});

const rubricSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    rubricType: {
        type: String,
        enum: ['Lab Rubric', 'Programming Rubric', 'Presentation Rubric', 'Project Rubric', 'Viva Rubric'],
        required: true
    },
    assessmentType: {
        type: String,
        enum: ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Mid Exam', 'Final Exam', 'Viva', 'General']
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program'
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    criteria: [rubricCriterionSchema],
    version: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Archived'],
        default: 'Draft'
    }
}, { timestamps: true });

const Rubric = mongoose.model('Rubric', rubricSchema);
export default Rubric;
