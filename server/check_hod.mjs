import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, Program, Department, Section, Course, Mark, CourseOffering } from './src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Find a HOD user
    const hod = await User.findOne({role: 'HOD'}).lean();
    console.log('HOD:', hod?.name, '| Dept:', hod?.department);
    
    const deptId = hod?.department;
    
    const [programs, students, sections, courses, teachers] = await Promise.all([
        Program.countDocuments(deptId ? {department: deptId} : {}),
        User.countDocuments(deptId ? {department: deptId, role: 'Student'} : {role: 'Student'}),
        Section.countDocuments(deptId ? {department: deptId} : {}),
        Course.countDocuments(deptId ? {department: deptId} : {}),
        User.countDocuments(deptId ? {department: deptId, role: 'Teacher'} : {role: 'Teacher'}),
    ]);
    
    console.log('Programs:', programs, 'Students:', students, 'Sections:', sections, 'Courses:', courses, 'Teachers:', teachers);
    
    // Check if students actually have department set
    const studWithDept = await User.countDocuments({role: 'Student', department: deptId || null});
    const totalStudents = await User.countDocuments({role: 'Student'});
    console.log('Students with HOD dept:', studWithDept);
    console.log('Total students:', totalStudents);
    
    // Check Section model for department field
    const secSample = await Section.findOne().lean();
    console.log('Section sample fields:', Object.keys(secSample || {}));
    
    // Check Program model for department field
    const progSample = await Program.findOne().lean();
    console.log('Program sample fields:', Object.keys(progSample || {}));
    console.log('Program dept value:', progSample?.department);
    
    process.exit(0);
});
