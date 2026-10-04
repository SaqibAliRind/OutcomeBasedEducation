import mongoose from 'mongoose';

const universitySettingsSchema = new mongoose.Schema({
    // Academic Settings
    academic: {
        currentSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
        currentSemester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
        academicYear: { type: String },
        semesterDurationWeeks: { type: Number, default: 18 },
        maxCreditHoursPerSemester: { type: Number, default: 21 },
        minCreditHoursPerSemester: { type: Number, default: 9 },
        passingPercentage: { type: Number, default: 50 },
        attendanceThreshold: { type: Number, default: 75 }, // min % to sit exam
        courseRepeatLimit: { type: Number, default: 2 },
        courseWithdrawalWeeks: { type: Number, default: 6 }, // weeks from start allowed
        gpaScale: { type: String, enum: ['4.0', '5.0', 'Custom'], default: '4.0' },
        registrationOpen: { type: Boolean, default: true },
        lateRegistrationDays: { type: Number, default: 7 },
    },

    // OBE Settings
    obe: {
        cloTarget: { type: Number, default: 60 },
        ploTarget: { type: Number, default: 60 },
        gaTarget: { type: Number, default: 60 },
        peoTarget: { type: Number, default: 60 },
        passingThreshold: { type: Number, default: 50 },
        achievementFormula: { type: String, enum: ['Average', 'Weighted Average', 'Maximum'], default: 'Average' },
        autoCalculation: { type: Boolean, default: true },
        autoReportGeneration: { type: Boolean, default: false },
        mappingRules: { type: String, enum: ['Direct', 'Indirect', 'Both'], default: 'Both' },
    },

    // Notification Settings
    notifications: {
        emailEnabled: { type: Boolean, default: true },
        inAppEnabled: { type: Boolean, default: true },
        defaultReminderDays: { type: Number, default: 3 },
        announcementsEnabled: { type: Boolean, default: true },
        smtpHost: { type: String },
        smtpPort: { type: Number, default: 587 },
        smtpUser: { type: String },
        smtpFrom: { type: String },
    },

    // File Settings
    files: {
        maxUploadSizeMB: { type: Number, default: 10 },
        allowedTypes: { type: [String], default: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg'] },
        storageLimitGB: { type: Number, default: 50 },
        documentCategories: { type: [String], default: ['Course File', 'Question Paper', 'Rubric', 'Blueprint', 'Assignment', 'Thesis'] },
    },

    // Localization
    localization: {
        language: { type: String, default: 'en' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' },
        timeZone: { type: String, default: 'Asia/Karachi' },
    },

    // Branding
    branding: {
        themeColor: { type: String, default: '#002147' },
        favicon: { type: String },
    }
}, { _id: false });

const universitySchema = new mongoose.Schema({
    // Basic Info
    name: { type: String, required: true, unique: true },
    shortName: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    logo: { type: String },
    banner: { type: String },
    favicon: { type: String },

    // Contact & Location
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String },

    // Accreditations & Region
    hecNo: { type: String },
    nceacStatus: { type: String, enum: ['Accredited', 'Pending', 'Not Accredited'], default: 'Pending' },
    timeZone: { type: String, default: 'Asia/Karachi' },
    currency: { type: String, default: 'PKR' },

    // Status & Deletion
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // Nested Settings
    settings: { type: universitySettingsSchema, default: () => ({}) }
}, { timestamps: true });

export default mongoose.model('University', universitySchema);