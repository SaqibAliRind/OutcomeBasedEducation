import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    code: { type: String },
    shortName: { type: String },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    phone: { type: String },
    email: { type: String },
    officeLocation: { type: String },
    description: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);
export default Department;
