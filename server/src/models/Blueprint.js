import mongoose from 'mongoose';

// Table of Specification (ToS) / Blueprint
// Maps assessment weightage across topics, CLOs and Bloom's levels
const blueprintRowSchema = new mongoose.Schema({
    topic: { type: String, trim: true, required: true },
    clo: { type: mongoose.Schema.Types.ObjectId, ref: 'CLO', required: true },
    bloomsLevel: {
        type: String,
        enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
        required: true
    },
    questionCount: { type: Number, default: 1 },
    marks: { type: Number, default: 0 }
});

const blueprintSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
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
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Section'
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    totalQuestions: { type: Number, required: true, default: 0 },
    totalMarks: { type: Number, required: true, default: 100 },
    rows: [blueprintRowSchema],
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

// One blueprint per course per teacher per assessment
blueprintSchema.index({ course: 1, teacher: 1, assessment: 1 }, { unique: true });

const Blueprint = mongoose.model('Blueprint', blueprintSchema);
export default Blueprint;
