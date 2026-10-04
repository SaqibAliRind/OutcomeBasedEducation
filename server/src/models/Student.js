import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String }
});

const studentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: String, unique: true, sparse: true },
    rollNumber: { type: String, unique: true, sparse: true },

    personalInfo: {
        dob: Date,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        address: String,
        phone: String,
        bloodGroup: String,
        emergencyContact: String
    },

    guardianInfo: {
        name: String,
        relation: String,
        phone: String,
        occupation: String,
        email: String
    },

    academicInfo: {
        batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        currentSemester: { type: Number, default: 1 },
        cgpa: { type: Number, default: 0.0 },
        academicStatus: { 
            type: String, 
            enum: ['Active', 'Graduated', 'Suspended', 'Alumni', 'Dropped', 'Transferred'], 
            default: 'Active' 
        }
    },

    documents: [documentSchema]
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
