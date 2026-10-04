import mongoose from 'mongoose';

const rubricEvaluationSchema = new mongoose.Schema({
    rubric: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // The specific scores given per criterion
    criteriaScores: [
        {
            criterionId: { type: mongoose.Schema.Types.ObjectId, required: true },
            level: { 
                type: String, 
                enum: ['Excellent', 'Good', 'Satisfactory', 'Poor'], 
                required: true 
            },
            marksObtained: { type: Number, required: true }
        }
    ],
    
    // The auto-calculated total
    totalObtained: { type: Number, required: true, default: 0 }
}, { timestamps: true });

// Ensure one evaluation per student per assessment
rubricEvaluationSchema.index({ student: 1, assessment: 1 }, { unique: true });

const RubricEvaluation = mongoose.model('RubricEvaluation', rubricEvaluationSchema);
export default RubricEvaluation;
