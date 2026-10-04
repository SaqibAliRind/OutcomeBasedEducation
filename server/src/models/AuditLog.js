import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    entityType: { type: String, required: true }, // e.g. 'Mark', 'Assessment', 'CLO'
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    changes: { type: Object, default: {} }, // Stores { field: { old, new } }
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
