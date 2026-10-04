import mongoose from 'mongoose';

const ploSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true,
        trim: true
    },
    statement: {
        type: String,
        required: true,
        trim: true
    },
    description: { 
        type: String 
    },
    program: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Program', 
        required: true 
    },
    // Many-to-many mapping: A PLO can be mapped to multiple PEOs
    peos: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PEO' 
    }],
    // PLOs map to multiple GAs
    gas: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'GA' 
    }],
    domain: {
        type: String,
        enum: ['Cognitive', 'Psychomotor', 'Affective', 'Cognitive/Affective', 'Cognitive/Psychomotor'],
        default: 'Cognitive'
    },
    bloomsLevel: {
        type: String,
        enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
        default: 'Understand'
    },
    version: {
        type: String,
        default: 'v1.0'
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive', 'Archived'], 
        default: 'Active' 
    }
}, { timestamps: true });

// Ensure unique code per program
ploSchema.index({ code: 1, program: 1 }, { unique: true });

const PLO = mongoose.model('PLO', ploSchema);
export default PLO;
