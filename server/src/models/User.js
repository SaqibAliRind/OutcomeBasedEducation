import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Maps to "Full Name"
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    username: { type: String, unique: true, sparse: true }, // sparse allows existing users without usernames
    password: { type: String, required: true },
    profilePicture: { type: String },

    // Extended profile for staff (Deans, HODs, Teachers, etc.)
    employeeId: { type: String, unique: true, sparse: true }, // Auto-generated
    cnic: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    address: { type: String },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    joiningDate: { type: Date },
    qualification: { type: String },
    experience: { type: String },
    office: { type: String },
    // Additional personal info
    fatherName: { type: String },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    nationality: { type: String, default: 'Pakistani' },
    religion: { type: String },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', ''] },
    emergencyContact: { type: String },
    // Professional info
    designation: { type: String },
    employmentType: { type: String, enum: ['Permanent', 'Visiting', 'Contract', 'Part-Time', ''] },
    specialization: { type: String },
    // Student-specific fields
    rollNumber: { type: String },
    studentId: { type: String, sparse: true },
    currentSemester: { type: String },
    cgpa: { type: Number },
    gpa: { type: Number },                // Current semester GPA
    academicStatus: { type: String, enum: ['Active', 'Freeze', 'Graduated', 'Suspended', 'Alumni', 'Dropped', 'Transferred', ''] },
    completedCredits: { type: Number, default: 0 },
    remainingCredits: { type: Number, default: 0 },
    // Student contact/guardian
    guardianName: { type: String },
    guardianPhone: { type: String },
    // Student academic assignment
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    // Admission info
    admissionDate: { type: Date },
    admissionType: { type: String, enum: ['Regular', 'Self-Finance', 'Merit', 'Lateral Entry', 'Transfer', ''] },
    scholarship: { type: String },
    
    role: { 
        type: String, 
        default: 'Student', 
        enum: ['SuperAdmin', 'UniversityAdmin', 'Dean', 'HOD', 'ProgramCoordinator', 'Teacher', 'Student', 'QEC'] 
    },
    
    // Links the user to a specific University (SuperAdmins can have this as null)
    university: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'University' 
    },
    
    // Status & Security Flags
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }, // For soft deleting admins/users
    forcePasswordChange: { type: Boolean, default: false }, // Triggers password change screen on next login
    
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Generate OTP for password reset
userSchema.methods.getResetPasswordToken = function () {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    return otp; // Return plaintext OTP to send in email
};

const User = mongoose.model('User', userSchema);
export default User;