import mongoose from 'mongoose';

const evidenceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Polymorphic association (can belong to a CourseFile, CQIAction, or General)
    linkedType: { type: String, enum: ['CourseFile', 'CQIAction', 'General'], default: 'General' },
    linkedId: { type: mongoose.Schema.Types.ObjectId },
    // Accreditation criteria tags (e.g. "Criterion 2: Curriculum")
    tags: [{ type: String }]
}, { timestamps: true });

const Evidence = mongoose.model('Evidence', evidenceSchema);
export default Evidence;
