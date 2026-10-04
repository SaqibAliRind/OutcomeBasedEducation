import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    session: { type: String, required: true }, // e.g. "Fall 2024"
    enrolledAt: { type: Date, default: Date.now },
    droppedAt: { type: Date },
    status: { type: String, enum: ['Enrolled', 'Dropped', 'Completed'], default: 'Enrolled' },
    grade: { type: String, default: null } // filled after semester ends
}, { timestamps: true });

// One student can't enroll in same course offering twice
enrollmentSchema.index({ student: 1, courseOffering: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
