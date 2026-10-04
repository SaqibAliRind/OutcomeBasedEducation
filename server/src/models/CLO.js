import mongoose from 'mongoose';
import { auditPlugin } from '../middleware/auditPlugin.js';

const cloSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true,
        trim: true
        // e.g. CLO-1, CLO-2
    },
    description: { 
        type: String, 
        required: true 
    },
    // CLO belongs to a specific Course
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    // CLOs can map to multiple PLOs (many-to-many) with mapping metadata
    plos: [{ 
        plo: { type: mongoose.Schema.Types.ObjectId, ref: 'PLO', required: true },
        weightage: { type: Number, min: 0, max: 100, default: 100 },
        level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
    }],
    // CLOs map to multiple GAs with mapping metadata
    gas: [{ 
        ga: { type: mongoose.Schema.Types.ObjectId, ref: 'GA', required: true },
        weightage: { type: Number, min: 0, max: 100, default: 100 },
        level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
    }],
    // Bloom's Taxonomy - standard OBE requirement
    bloomsLevel: {
        type: String,
        enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
        required: true,
        default: 'Understand'
    },
    bloomsDomain: {
        type: String,
        enum: ['Cognitive', 'Psychomotor', 'Affective'],
        default: 'Cognitive'
    },
    // Weightage - percentage of this CLO's contribution to course assessment
    weightage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive', 'Archived'], 
        default: 'Active' 
    }
}, { timestamps: true });

// Unique code per course
cloSchema.index({ code: 1, course: 1 }, { unique: true });

cloSchema.plugin(auditPlugin);

const CLO = mongoose.model('CLO', cloSchema);
export default CLO;
