import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String },
    dean: { type: String, default: 'Unassigned' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    description: { type: String }
}, { timestamps: true });

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
