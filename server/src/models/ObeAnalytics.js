import mongoose from 'mongoose';

const chartDataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    target: { type: Number },
    achieved: { type: Number },
    expected: { type: Number },
    actual: { type: Number },
    gap: { type: Number }
});

const achievementEntrySchema = new mongoose.Schema({
    name: { type: String, required: true },   // Program/Department name
    achievement: { type: Number, default: 0 }, // % achieved
    target: { type: Number, default: 80 }      // % target
});

const closingLoopEntrySchema = new mongoose.Schema({
    ploCode: { type: String },
    status: {
        type: String,
        enum: ['Met', 'Partially Met', 'Not Met'],
        default: 'Not Met'
    },
    actionTaken: { type: String, default: '' }
});

const obeAnalyticsSchema = new mongoose.Schema({
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    // Averages
    totalPEOs: { type: Number, default: 0 },
    totalPLOs: { type: Number, default: 0 },
    totalCLOs: { type: Number, default: 0 },
    totalGAs: { type: Number, default: 0 },
    avgCloAchievement: { type: Number, default: 0 },
    avgPloAchievement: { type: Number, default: 0 },
    avgGaAchievement: { type: Number, default: 0 },
    // University-level achievement
    universityAchievement: { type: Number, default: 0 },
    // Per-program & per-department achievements
    programAchievements: [achievementEntrySchema],
    departmentAchievements: [achievementEntrySchema],
    // Chart data
    targetVsAchieved: [chartDataSchema],
    gapAnalysis: [chartDataSchema],
    // Closing the Loop
    closingTheLoopStatus: [closingLoopEntrySchema]
}, { timestamps: true });

const ObeAnalytics = mongoose.model('ObeAnalytics', obeAnalyticsSchema);

export default ObeAnalytics;

