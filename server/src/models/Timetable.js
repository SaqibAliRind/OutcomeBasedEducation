import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    room: { type: String, required: true },
    building: { type: String },
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
    startTime: { type: String, required: true }, // format HH:MM 24h
    endTime: { type: String, required: true },   // format HH:MM 24h
    status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' }
}, { timestamps: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
