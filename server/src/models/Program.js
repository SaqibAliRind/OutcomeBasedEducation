import mongoose from 'mongoose';

const programSchema = new mongoose.Schema({ 
    name:         { type: String, required: true },
    code:         { type: String },
    type:         { type: String, enum: ['BS', 'MS', 'MPhil', 'PhD', 'Associate', 'Diploma', 'Certificate'], default: 'BS' },
    creditHours:  { type: Number, default: 0 },
    duration:     { type: String },
    totalSemesters: { type: Number, default: 8 },
    department:   { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    coordinator:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accreditationStatus: { type: String, enum: ['Accredited', 'Pending', 'Not Accredited'], default: 'Not Accredited' },
    status:       { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Program = mongoose.model('Program', programSchema);
export default Program;

