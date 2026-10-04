import mongoose from 'mongoose';

const systemBackupLogSchema = new mongoose.Schema({
    status: { type: String, required: true, enum: ['Running', 'Success', 'Failed'] },
    sizeMB: { type: Number },
    filePath: { type: String },
    notes: { type: String }
}, { timestamps: true });

const SystemBackupLog = mongoose.model('SystemBackupLog', systemBackupLogSchema);
export default SystemBackupLog;
