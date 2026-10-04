import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    courseCode: { type: String },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessmentType: { type: String }, 
    
    // Core details
    text: { type: String, required: true },
    type: { type: String, required: true, enum: ['MCQ', 'True/False', 'Fill in the Blank', 'Short Question', 'Long Question', 'Coding Question', 'Numerical Question', 'Case Study', 'Practical Question', 'Viva Question'] },
    chapter: { type: String },
    topic: { type: String },
    difficultyLevel: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    marks: { type: Number, default: 0 },
    status: { type: String, enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Archived'], default: 'Draft' },

    // OBE Fields - proper ObjectId references
    clo: { type: mongoose.Schema.Types.ObjectId, ref: 'CLO' },
    plo: { type: mongoose.Schema.Types.ObjectId, ref: 'PLO' },
    ga: { type: mongoose.Schema.Types.ObjectId, ref: 'GA' },
    btLevel: { type: String, enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
    actionVerb: { type: String },
    targetOutcome: { type: String },
    
    // Attachments
    attachments: [{ type: String }],
    
    // Versioning
    version: { type: String, default: '1.0' },
    changeReason: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeDate: { type: Date, default: Date.now },
    previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }

}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;
