import mongoose from 'mongoose';

const peoSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true,
        trim: true
    },
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true 
    },
    program: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Program', 
        required: true 
    },
    version: {
        type: String,
        default: 'v1.0'
    },
    effectiveDate: {
        type: Date
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive', 'Archived'], 
        default: 'Active' 
    }
}, { timestamps: true });

// Ensure unique code per program
peoSchema.index({ code: 1, program: 1 }, { unique: true });

const PEO = mongoose.model('PEO', peoSchema);
export default PEO;
