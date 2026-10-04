import mongoose from 'mongoose';

// Sub-schema for uploaded documents with versioning
const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, default: '' },
    version: { type: String, default: 'v1.0' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Approved', 'Returned'], default: 'Pending' }
}, { _id: true });

// Lesson plan week entry
const lessonPlanRowSchema = new mongoose.Schema({
    week: { type: Number, required: true },
    topic: { type: String, required: true },
    clo: { type: mongoose.Schema.Types.ObjectId, ref: 'CLO' },
    btLevel: { type: String, enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] },
    teachingMethod: { type: String },
    assessmentMethod: { type: String },
    status: { type: String, enum: ['Planned', 'Completed', 'Missed'], default: 'Planned' }
}, { _id: true });

// Closing the Loop entry
const closingLoopSchema = new mongoose.Schema({
    weakCLO: { type: mongoose.Schema.Types.ObjectId, ref: 'CLO' },
    rootCause: { type: String },
    correctiveAction: { type: String },
    improvementPlan: { type: String },
    resourcesRequired: { type: String },
    responsiblePerson: { type: String },
    targetDate: { type: Date },
    followUpStatus: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }
}, { _id: true });

const courseFileSchema = new mongoose.Schema({
    courseOffering: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseOffering',
        required: true,
        unique: true   // one file per offering
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Structured sections
    courseOutline:    [documentSchema],
    lessonPlan:       [lessonPlanRowSchema],
    teachingMaterial: [documentSchema],
    assessmentPapers: [documentSchema],   // quiz, mid, final, lab, viva papers
    sampleStudentWork:[documentSchema],   // high/avg/low performer scripts
    supportingEvidence:[documentSchema],  // photos, meeting minutes etc.
    additionalDocs:   [documentSchema],

    // Closing the loop
    closingLoop: [closingLoopSchema],

    // Workflow
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Returned', 'Archived'],
        default: 'Draft'
    },
    workflowHistory: [{
        fromStatus: String, toStatus: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remarks: String,
        changedAt: { type: Date, default: Date.now }
    }],

    version: { type: Number, default: 1 },
    completeness: { type: Number, default: 0 },  // auto-calculated %
}, { timestamps: true });

const CourseFile = mongoose.model('CourseFile', courseFileSchema);
export default CourseFile;
