import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    type: { type: String, required: true, enum: ['Multiple Choice', 'Rating Scale (1–5)', 'Likert Scale', 'Yes / No', 'Short Answer', 'Long Answer'] },
    options: [{ type: String }], // For multiple choice
    // Outcome mapping for indirect assessment
    plo: { type: mongoose.Schema.Types.ObjectId, ref: 'PLO' },
    ga: { type: mongoose.Schema.Types.ObjectId, ref: 'GA' },
    weight: { type: Number, default: 1 } // E.g., for scaling importance
}, { _id: true });

const responseSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId },
        answer: { type: mongoose.Schema.Types.Mixed } // can be string, number
    }],
    submittedAt: { type: Date, default: Date.now }
});

const surveySchema = new mongoose.Schema({
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
    title: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: [
            // OBE Surveys
            'CLO Survey', 'PLO Survey', 'Graduate Attribute Survey',
            // Accreditation Surveys
            'Exit Survey', 'Alumni Survey', 'Employer Survey', 'Industry Survey',
            // General Surveys
            'Event Feedback', 'Workshop Feedback', 'Seminar Feedback', 'Training Feedback',
            // Existing ones from before just in case
            'Course Evaluation', 'Teacher Evaluation', 'Student Satisfaction Survey', 'Semester Feedback', 'Faculty Satisfaction', 'Accreditation Feedback'
        ]
    },
    category: {
        type: String,
        enum: ['OBE', 'Accreditation', 'General', 'Academic', 'Institutional']
    },
    department: { type: String },
    program: { type: String },
    course: { type: String },
    session: { type: String },
    semester: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    anonymous: { type: Boolean, default: true },
    status: { type: String, enum: ['Draft', 'Active', 'Closed'], default: 'Draft' },
    questions: [questionSchema],
    responses: [responseSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalExpected: { type: Number, default: 0 }
}, {
    timestamps: true
});

const Survey = mongoose.model('Survey', surveySchema);
export default Survey;
