import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    students: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['Present', 'Absent', 'Late', 'Leave', 'Excused'], default: 'Present' },
        remarks: { type: String, default: '' }
    }],
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, { timestamps: true });

// Prevent multiple attendance records for same class on same day
attendanceSchema.index({ courseOffering: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
