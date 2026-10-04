import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    code: { type: String, required: true },
    name: { type: String, required: true },
    shortName: { type: String },
    creditHours: { type: Number, required: true, default: 3 },
    theoryCreditHours: { type: Number, default: 3 },
    labCreditHours: { type: Number, default: 0 },
    contactHours: { type: Number, default: 3 },
    type: { type: String, enum: ['Theory', 'Lab', 'Theory + Lab'], default: 'Theory' },
    prerequisite: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    description: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;
