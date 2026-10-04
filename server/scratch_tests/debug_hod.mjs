import 'dotenv/config';
import mongoose from 'mongoose';
import { User, CourseOffering, StudentAttainment } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);
const hod = await User.findOne({ role: 'HOD' });

console.log('HOD department:', hod.department);
console.log('HOD university:', hod.university);

const deptId = hod.department;
const deptOfferings = await CourseOffering.find(deptId ? { department: deptId } : {}).select('_id department');
console.log('Dept offerings count:', deptOfferings.length);

const allOfferings = await CourseOffering.find({}).select('_id department').lean();
console.log('All offerings:', JSON.stringify(allOfferings));

const offeringIds = deptOfferings.map(o => o._id);
const attainments = await StudentAttainment.find({ courseOffering: { $in: offeringIds } }).lean();
console.log('Attainments found for dept:', attainments.length);

const allAtt = await StudentAttainment.countDocuments();
const sample = await StudentAttainment.findOne().lean();
console.log('Total attainments in DB:', allAtt);
console.log('Sample courseOffering:', sample?.courseOffering);

process.exit(0);
