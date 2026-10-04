import mongoose from 'mongoose';
import { auditPlugin } from '../middleware/auditPlugin.js';

const markSchema = new mongoose.Schema({
    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true
    },
    courseOffering: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseOffering',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            obtainedMarks: {
                type: Number,
                required: true,
                min: 0
            },
            remarks: {
                type: String,
                trim: true
            }
        }
    ],
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Verified', 'Locked'],
        default: 'Draft'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    }
}, { timestamps: true });

// Ensure only one marks record exists per assessment and offering
markSchema.index({ assessment: 1, courseOffering: 1 }, { unique: true });

markSchema.plugin(auditPlugin);

const Mark = mongoose.model('Mark', markSchema);
export default Mark;
