import mongoose from 'mongoose';

const academicCalendarSchema = new mongoose.Schema({
    title: { type: String, required: true },
    eventType: { type: String, enum: ['Semester Start', 'Semester End', 'Holiday', 'Holidays', 'Mid Exam', 'Mid Exams', 'Final Exam', 'Final Exams', 'Result', 'Result Declaration', 'Admission Schedule', 'Registration', 'Course Registration', 'Add/Drop Week', 'Quiz Schedule', 'Viva', 'Workshops', 'Seminars', 'Convocation', 'Event'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    description: { type: String },
    status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' }
}, { timestamps: true });

const AcademicCalendar = mongoose.model('AcademicCalendar', academicCalendarSchema);
export default AcademicCalendar;
