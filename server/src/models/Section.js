import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    capacity: { type: Number, default: 50 },
    advisor: { type: String, default: 'Unassigned' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Section = mongoose.model('Section', sectionSchema);
export default Section;
