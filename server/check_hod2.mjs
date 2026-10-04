import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, Program, Department, Section, Course } from './src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const hod = await User.findOne({role: 'HOD'}).lean();
    const deptId = hod?.department?.toString();
    
    // Get all departments
    const depts = await Department.find().lean();
    console.log('All departments:');
    depts.forEach(d => console.log(' -', d.name, ':', d._id.toString()));
    
    // Get all programs
    const progs = await Program.find().lean();
    console.log('\nAll programs:');
    progs.forEach(p => console.log(' -', p.name, '| dept:', p.department?.toString()));
    
    console.log('\nHOD dept ID:', deptId);
    console.log('Matching programs:', progs.filter(p => p.department?.toString() === deptId).length);
    
    // Check Students' department vs program
    const students = await User.find({role: 'Student'}).lean();
    const sampleStudent = students[0];
    console.log('\nSample student dept:', sampleStudent?.department?.toString());
    console.log('Sample student program:', sampleStudent?.academicInfo?.program?.toString());
    
    process.exit(0);
});
