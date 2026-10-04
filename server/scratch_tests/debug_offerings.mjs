import 'dotenv/config';
import mongoose from 'mongoose';
import { User, CourseOffering, StudentAttainment, Program } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);

const teacher = await User.findOne({ role: 'Teacher' });
const hod = await User.findOne({ role: 'HOD' });

console.log('Teacher ID:', teacher._id);
console.log('HOD department:', hod.department);

// Check CourseOffering teacher field
const offerings = await CourseOffering.find({}).lean();
console.log('\nAll CourseOfferings:');
offerings.forEach(o => {
    console.log('  _id:', o._id, '| teacher:', o.teacher, '| program:', o.program);
});

// Teacher offerings
const teacherOfferings = await CourseOffering.find({ teacher: teacher._id });
console.log('\nTeacher offerings:', teacherOfferings.length);

// Fix teacher field on offerings if empty
if (teacherOfferings.length === 0) {
    await CourseOffering.updateMany({}, { teacher: teacher._id });
    console.log('Fixed: assigned teacher to all offerings');
}

// Fix HOD: find programs in HOD's dept
const deptPrograms = await Program.find({ department: hod.department }).select('_id');
const progIds = deptPrograms.map(p => p._id);
console.log('\nPrograms in HOD dept:', progIds.length);

// Find offerings in those programs
const deptOfferings = await CourseOffering.find({ program: { $in: progIds } });
console.log('Dept offerings (by program):', deptOfferings.length);

// Check attainments
const allAtt = await StudentAttainment.countDocuments();
const attForOfferings = await StudentAttainment.countDocuments({ 
    courseOffering: { $in: deptOfferings.map(o => o._id) }
});
console.log('\nTotal attainments:', allAtt);
console.log('Attainments for dept offerings:', attForOfferings);

process.exit(0);
