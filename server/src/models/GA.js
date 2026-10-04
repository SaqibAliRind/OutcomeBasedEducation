import mongoose from 'mongoose';

const gaSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true,
        trim: true
        // e.g. GA1, GA2
    },
    name: {
        type: String,
        required: true,
        trim: true
        // e.g. Engineering Knowledge
    },
    description: { 
        type: String, 
        required: true 
    },
    // GAs can be program-specific or universal. We will link them to a program for flexibility.
    program: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Program', 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'], 
        default: 'Active' 
    }
}, { timestamps: true });

// Ensure GA code is unique per program
gaSchema.index({ code: 1, program: 1 }, { unique: true });

const GA = mongoose.model('GA', gaSchema);
export default GA;
