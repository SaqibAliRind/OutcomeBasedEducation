import mongoose from 'mongoose';

// Generic Workflow Engine - Works with ANY module
const workflowRequestSchema = new mongoose.Schema({
    university: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'University' 
    },
    title: { 
        type: String, 
        required: true 
    },
    // The module this workflow belongs to (open string, not enum, for max extensibility)
    module: {
        type: String,
        required: true
        // Example values: 'Course Outline', 'Blueprint', 'Rubrics', 'Marks Submission',
        //                 'Result Approval', 'Course File', 'Closing the Loop',
        //                 'Survey Approval', 'Question Paper', 'Question Mapping',
        //                 'Lesson Plan' — or any future module
    },
    // Optional: Link to the actual document in its own collection
    referenceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    referenceModel: {
        type: String // e.g. 'CourseFile', 'BlueprintSchema', 'Survey' — for dynamic population
    },
    // Metadata fields — can carry extra context about the document
    metadata: {
        department: { type: String },
        program: { type: String },
        course: { type: String },
        session: { type: String },
        semester: { type: String },
        section: { type: String }
    },
    submitter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    // The approval chain — open string to support custom routing per university
    currentStage: { 
        type: String,
        default: 'Teacher'
    },
    // Configurable approval chain for this request (can vary per module or university)
    approvalChain: {
        type: [String],
        default: ['Teacher', 'Program Coordinator', 'HOD', 'QEC', 'University Admin', 'Completed']
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Returned for Revision', 'Completed'],
        default: 'Pending'
    },
    priority: {
        type: String,
        enum: ['Normal', 'High', 'Urgent'],
        default: 'Normal'
    },
    dueDate: { type: Date },
    attachments: [{ 
        filename: String, 
        url: String, 
        uploadedAt: { type: Date, default: Date.now } 
    }],
    history: [{
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        stage: { type: String },
        action: { 
            type: String, 
            enum: ['Submit', 'Review', 'Approve', 'Reject', 'Return for Revision', 'Add Comments', 'Forward', 'Final Approval', 'Withdraw'] 
        },
        remarks: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Indexes for fast querying
workflowRequestSchema.index({ university: 1, module: 1, status: 1 });
workflowRequestSchema.index({ submitter: 1 });
workflowRequestSchema.index({ currentStage: 1, status: 1 });

const WorkflowRequest = mongoose.model('WorkflowRequest', workflowRequestSchema);
export default WorkflowRequest;
