import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
    name: { type: String, required: true },
    admissionYear: { type: Number, required: true },
    graduationYear: { type: Number, required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    status: { type: String, enum: ['Active', 'Graduated'], default: 'Active' }
}, { timestamps: true });

const Batch = mongoose.model('Batch', batchSchema);
export default Batch;
