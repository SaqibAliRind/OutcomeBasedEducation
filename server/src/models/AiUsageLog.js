import mongoose from 'mongoose';

const aiUsageLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    queryType: { type: String, required: true },
    prompt: { type: String },
    responseLength: { type: Number },
    status: { type: String, default: 'Success' }
}, { timestamps: true });

const AiUsageLog = mongoose.model('AiUsageLog', aiUsageLogSchema);
export default AiUsageLog;
