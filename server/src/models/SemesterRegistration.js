import mongoose from 'mongoose';

const semesterRegistrationSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    session: { type: String, required: true }, // e.g. "Fall 2024"
    status: { 
        type: String, 
        enum: ['Registered', 'Frozen', 'Dropped'], 
        default: 'Registered' 
    },
    enrollments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }],
    registeredAt: { type: Date, default: Date.now },
    frozenAt: { type: Date, default: null },
    droppedAt: { type: Date, default: null },
    remarks: { type: String, default: '' }
}, { timestamps: true });

// One registration per student per semester per session
semesterRegistrationSchema.index({ student: 1, semester: 1, session: 1 }, { unique: true });

const SemesterRegistration = mongoose.model('SemesterRegistration', semesterRegistrationSchema);
export default SemesterRegistration;
