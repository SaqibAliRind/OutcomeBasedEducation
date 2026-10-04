import mongoose from 'mongoose';

const obeTargetSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    cloTarget: { type: Number, default: 70 },
    ploTarget: { type: Number, default: 70 },
    gaTarget: { type: Number, default: 70 },
    programTarget: { type: Number, default: 70 },
    departmentTarget: { type: Number, default: 70 },
    directWeight: { type: Number, default: 0.8 }, // E.g., 80% weight for direct assessment
    indirectWeight: { type: Number, default: 0.2 }, // E.g., 20% weight for indirect assessment (surveys)
}, { timestamps: true });

const ObeTarget = mongoose.model('ObeTarget', obeTargetSchema);

export default ObeTarget;
