import mongoose from 'mongoose';

const EmailTemplateSchema = new mongoose.Schema({
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  name: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  lastUpdatedBy: { type: String }
}, { timestamps: true });

// Unique per university + template name
EmailTemplateSchema.index({ university: 1, name: 1 }, { unique: true });

export default mongoose.model('EmailTemplate', EmailTemplateSchema);
