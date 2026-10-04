import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    number: { type: Number, required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    startDate: { type: Date },
    endDate: { type: Date },
    registrationStart: { type: Date },
    registrationEnd: { type: Date },
    description: { type: String },
    status: { type: String, enum: ['Open', 'Closed', 'Upcoming', 'Locked'], default: 'Upcoming' }
}, { timestamps: true });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;

