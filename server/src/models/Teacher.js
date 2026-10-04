import mongoose from 'mongoose';

const qualificationSchema = new mongoose.Schema({
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true },
    grade: { type: String }
});

const experienceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    organization: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    description: { type: String }
});

const documentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String }
});

const teacherSchema = new mongoose.Schema({ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    personalInfo: {
        dob: Date,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        address: String,
        phone: String,
        bloodGroup: String,
        emergencyContact: String
    },
    professionalInfo: {
        designation: String,
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
        joiningDate: Date,
        specialization: String,
        researchInterests: String,
        employmentType: {
            type: String,
            enum: ['Permanent', 'Visiting', 'Contract'],
            default: 'Permanent'
        }
    },
    qualifications: [qualificationSchema],
    experience: [experienceSchema],
    documents: [documentSchema]
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
