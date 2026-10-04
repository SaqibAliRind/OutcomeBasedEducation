import mongoose from 'mongoose';

const gradeScaleSchema = new mongoose.Schema({
    grade: { type: String, required: true },
    minPercentage: { type: Number, required: true },
    maxPercentage: { type: Number, required: true },
    gpa: { type: Number, required: true }
}, { _id: true });

const systemSettingsSchema = new mongoose.Schema({
    smtp: {
        host: { type: String, default: '' },
        port: { type: String, default: '' },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
        encryption: { type: String, enum: ['None', 'TLS', 'SSL'], default: 'None' },
        senderName: { type: String, default: '' }
    },
    jwt: {
        secretKey: { type: String, default: '' },
        tokenExpiry: { type: String, default: '1d' },
        refreshTokenExpiry: { type: String, default: '7d' }
    },
    cloudinary: {
        cloudName: { type: String, default: '' },
        apiKey: { type: String, default: '' },
        apiSecret: { type: String, default: '' }
    },
    backup: {
        autoBackup: { type: Boolean, default: false },
        schedule: { type: String, enum: ['Daily', 'Weekly', 'Monthly'], default: 'Weekly' }
    },
    ai: {
        openAiKey: { type: String, default: '' },
        geminiKey: { type: String, default: '' },
        defaultModel: { type: String, enum: ['OpenAI', 'Gemini'], default: 'Gemini' },
        aiStatus: { type: Boolean, default: true }
    },
    attendance: {
        policyDescription: { type: String, default: 'Standard University Attendance Policy' },
        minimumPercentage: { type: Number, default: 75 },
        lockDate: { type: Date },
        freezeAttendance: { type: Boolean, default: false },
        requireApproval: { type: Boolean, default: false }
    },
    marks: {
        lockAllMarks: { type: Boolean, default: false },
        gradeScales: [
            { grade: { type: String, default: 'A' }, min: { type: Number, default: 85 }, max: { type: Number, default: 100 } },
            { grade: { type: String, default: 'B' }, min: { type: Number, default: 70 }, max: { type: Number, default: 84 } },
            { grade: { type: String, default: 'C' }, min: { type: Number, default: 50 }, max: { type: Number, default: 69 } },
            { grade: { type: String, default: 'F' }, min: { type: Number, default: 0 },  max: { type: Number, default: 49 } }
        ]
    },
    grades: {
        scales: {
            type: [gradeScaleSchema],
            default: [
                { grade: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4.00 },
                { grade: 'A',  minPercentage: 85, maxPercentage: 89,  gpa: 4.00 },
                { grade: 'A-', minPercentage: 80, maxPercentage: 84,  gpa: 3.70 },
                { grade: 'B+', minPercentage: 75, maxPercentage: 79,  gpa: 3.30 },
                { grade: 'B',  minPercentage: 70, maxPercentage: 74,  gpa: 3.00 },
                { grade: 'B-', minPercentage: 65, maxPercentage: 69,  gpa: 2.70 },
                { grade: 'C+', minPercentage: 60, maxPercentage: 64,  gpa: 2.30 },
                { grade: 'C',  minPercentage: 55, maxPercentage: 59,  gpa: 2.00 },
                { grade: 'D',  minPercentage: 50, maxPercentage: 54,  gpa: 1.00 },
                { grade: 'F',  minPercentage: 0,  maxPercentage: 49,  gpa: 0.00 },
            ]
        },
        policies: {
            passingPercentage: { type: Number, default: 50 },
            improvementPolicy: { type: String, default: '' },
            repeatCoursePolicy: { type: String, default: '' },
            incompleteGradePolicy: { type: String, default: '' }
        }
    }
}, { timestamps: true });

// We ensure there is only one document in this collection
export default mongoose.model('SystemSettings', systemSettingsSchema);
