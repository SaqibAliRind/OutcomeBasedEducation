import 'dotenv/config';
import mongoose from 'mongoose';
import { User, CourseOffering, Department, Program } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);

// Find all course offerings with their data
const offerings = await CourseOffering.find({})
    .populate('course', 'name code')
    .populate('program', 'name department')
    .lean();

console.log('Total offerings:', offerings.length);
offerings.forEach(o => {
    console.log('Offering:', o._id, '| department:', o.department, '| program:', o.program?.name, '| program.department:', o.program?.department);
});

// Find departments
const depts = await Department.find({}).lean();
console.log('\nDepartments:', depts.map(d => ({ id: d._id, name: d.name })));

// Fix: Set department on each CourseOffering based on program.department
for (const off of offerings) {
    if (!off.department && off.program?.department) {
        await CourseOffering.findByIdAndUpdate(off._id, { department: off.program.department });
        console.log('Fixed offering', off._id, '-> dept', off.program.department);
    }
}

const fixed = await CourseOffering.find({}).lean();
console.log('\nAfter fix, offerings departments:', fixed.map(o => o.department));
process.exit(0);
