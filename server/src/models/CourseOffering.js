import mongoose from 'mongoose';

const courseOfferingSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    academicYear: { type: String, required: true },
    enrollmentLimit: { type: Number, required: true, default: 50 },
    status: { type: String, enum: ['Open', 'Closed', 'Locked'], default: 'Open' }
}, { timestamps: true });

const CourseOffering = mongoose.model('CourseOffering', courseOfferingSchema);
export default CourseOffering;
