import mongoose from 'mongoose';
import { auditPlugin } from '../middleware/auditPlugin.js';

const assessmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
        // e.g. "Quiz 1", "Midterm Exam"
    },
    type: {
        type: String,
        required: true,
        enum: ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Viva', 'Mid Exam', 'Final Exam']
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    passingMarks: {
        type: Number,
        required: true,
        min: 1
    },
    weightage: {
        type: Number,
        required: true,
        min: 1,
        max: 100
        // Percentage weightage in the final grade
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Archived'],
        default: 'Active'
    },
    // For exams, quizzes, viva — the date the assessment is conducted
    scheduledDate: {
        type: Date
    },
    // For assignments, projects — the submission deadline
    deadline: {
        type: Date
    },
    // Optional venue / location (e.g. "Room 101", "Online")
    venue: {
        type: String,
        trim: true
    },
    // Optional instructions or notes for this assessment
    instructions: {
        type: String
    },
    // For IDOR protection
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Prevent duplicate assessments with the exact same name for a specific course+session+semester
assessmentSchema.index({ name: 1, course: 1, session: 1, semester: 1 }, { unique: true });

assessmentSchema.plugin(auditPlugin);

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
