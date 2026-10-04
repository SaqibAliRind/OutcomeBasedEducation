import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  logType: { 
    type: String, 
    required: true, 
    enum: ['activity', 'audit', 'error'] 
  },
  timestamp: { type: Date, default: Date.now },
  
  // 1. Activity Logs Fields
  user: { type: String },
  role: { type: String },
  module: { type: String },
  action: { type: String },
  ipAddress: { type: String },
  device: { type: String },
  browser: { type: String },
  status: { type: String, enum: ['Success', 'Failed', 'Warning'], default: 'Success' },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },

  // 2. Audit Logs Fields
  field: { type: String },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  changedBy: { type: String },
  remarks: { type: String },

  // 3. Error Logs Fields
  errorCode: { type: String },
  errorMessage: { type: String },
  stackTrace: { type: String }
}, { timestamps: true });

export default mongoose.model('Log', LogSchema);