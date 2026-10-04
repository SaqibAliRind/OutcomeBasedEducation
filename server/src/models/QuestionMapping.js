import mongoose from 'mongoose';

const questionMappingRowSchema = new mongoose.Schema({
    questionNumber: { type: String, required: true }, // e.g., 'Q1', 'Q2a'
    marks: { type: Number, required: true, default: 0 },
    clo: { type: mongoose.Schema.Types.ObjectId, ref: 'CLO' },
    plo: { type: mongoose.Schema.Types.ObjectId, ref: 'PLO' },
    ga: { type: mongoose.Schema.Types.ObjectId, ref: 'GA' },
    btLevel: { 
        type: String, 
        enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
        required: true 
    },
    actionVerb: { type: String, trim: true },
    difficulty: { 
        type: String, 
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium' 
    },
    // Optional link back to the Question Bank
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }
});

const questionMappingSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
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
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Archived'],
        default: 'Draft'
    },
    version: {
        type: Number,
        default: 1
    },
    questions: [questionMappingRowSchema]
}, { timestamps: true });

// One unique mapping per course per teacher per semester per assessment
questionMappingSchema.index({ course: 1, teacher: 1, semester: 1, assessment: 1 }, { unique: true });

const QuestionMapping = mongoose.model('QuestionMapping', questionMappingSchema);
export default QuestionMapping;
