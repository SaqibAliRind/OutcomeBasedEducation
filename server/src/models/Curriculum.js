import mongoose from 'mongoose';

const curriculumSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Curriculum name is required'] 
  },
  version: { 
    type: String, 
    required: [true, 'Curriculum version is required'] 
  },
  program: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Program', 
    required: [true, 'Program is required'] 
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    required: [true, 'Department is required'] 
  },
  degreeLevel: {
    type: String,
    enum: ['BS', 'MS', 'MPhil', 'PhD'],
  },
  totalCreditHours: {
    type: Number,
  },
  totalSemesters: {
    type: Number,
  },
  effectiveFrom: {
    type: Date,
  },
  effectiveTo: {
    type: Date,
  },
  description: { 
    type: String 
  },
  semesters: [
    {
      semesterNumber: { type: Number, required: true },
      courses: [
        {
          course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
          courseType: { type: String, enum: ['Core', 'Elective'], default: 'Core' },
          prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
        }
      ]
    }
  ],
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'Archived', 'Deprecated'], 
    default: 'Draft' 
  }
}, { timestamps: true });

// Prevent duplicate versions of the exact same curriculum name
curriculumSchema.index({ name: 1, version: 1 }, { unique: true });

const Curriculum = mongoose.model('Curriculum', curriculumSchema);
export default Curriculum;