import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    permissions: [{
        moduleName: { type: String, required: true },
        actions: [{ type: String }]
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt:  { type: Date,    default: null  }
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
