import mongoose from 'mongoose';

const cloAttainmentSchema = new mongoose.Schema({
    clo: { type: mongoose.Schema.Types.ObjectId, ref: 'CLO', required: true },
    totalMarks: { type: Number, required: true, default: 0 },
    obtainedMarks: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, default: 0 }, // Direct Percentage
    indirectPercentage: { type: Number, default: 0 },         // E.g., Survey results
    overallPercentage: { type: Number, default: 0 },          // Weighted sum
    targetThreshold: { type: Number, required: true }, 
    achieved: { type: Boolean, required: true, default: false }
});

const ploAttainmentSchema = new mongoose.Schema({
    plo: { type: mongoose.Schema.Types.ObjectId, ref: 'PLO', required: true },
    totalMarks: { type: Number, required: true, default: 0 },
    obtainedMarks: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, default: 0 }, // Direct Percentage
    indirectPercentage: { type: Number, default: 0 },         // E.g., Exit Survey
    overallPercentage: { type: Number, default: 0 },          // Weighted sum
    targetThreshold: { type: Number, required: true },
    achieved: { type: Boolean, required: true, default: false }
});

const gaAttainmentSchema = new mongoose.Schema({
    ga: { type: mongoose.Schema.Types.ObjectId, ref: 'GA', required: true },
    percentage: { type: Number, required: true, default: 0 },
    targetThreshold: { type: Number, required: true },
    achieved: { type: Boolean, required: true, default: false }
});

const studentAttainmentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseOffering: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseOffering', required: true },
    clos: [cloAttainmentSchema],
    plos: [ploAttainmentSchema],
    gas: [gaAttainmentSchema],
    calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure one record per student per course offering
studentAttainmentSchema.index({ student: 1, courseOffering: 1 }, { unique: true });

const StudentAttainment = mongoose.model('StudentAttainment', studentAttainmentSchema);
export default StudentAttainment;
