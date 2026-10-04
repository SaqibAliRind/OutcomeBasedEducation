import mongoose from 'mongoose';

const assessmentSettingSchema = new mongoose.Schema({
    program: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Program', 
        required: true 
    },
    type: { 
        type: String, 
        required: true,
        enum: ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Mid', 'Final', 'Viva']
    },
    weightage: { 
        type: Number, 
        required: true,
        min: 1,
        max: 100
        // e.g., 20 means 20%
    },
    totalMarks: { 
        type: Number, 
        required: true,
        min: 1 
        // e.g., 50 marks
    },
    passingMarks: { 
        type: Number, 
        required: true,
        min: 1 
        // e.g., 25 marks
    },
    status: { 
        type: String, 
        enum: ['Active', 'Inactive'], 
        default: 'Active' 
    }
}, { timestamps: true });

// Ensure an assessment type is uniquely configured per program
assessmentSettingSchema.index({ program: 1, type: 1 }, { unique: true });

const AssessmentSetting = mongoose.model('AssessmentSetting', assessmentSettingSchema);
export default AssessmentSetting;
