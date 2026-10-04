// Fix HOD dashboard data issues:
// 1. HOD CS dept ID doesn't match the program's dept
// 2. Students don't have department field set
// 3. Sections don't have department field set

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, Program, Department, Section, Course } from './src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    // Get all departments
    const depts = await Department.find().lean();
    console.log('Departments:');
    depts.forEach(d => console.log(' -', d.name, ':', d._id.toString()));
    
    // Get programs and their departments
    const progs = await Program.find().lean();
    console.log('\nPrograms and their departments:');
    progs.forEach(p => console.log(' -', p.name, '| dept:', p.department?.toString()));
    
    // Get all sections
    const sections = await Section.find().lean();
    console.log('\nSections count:', sections.length);
    const progId = progs[0]?._id;
    const progDeptId = progs[0]?.department;
    
    // Update sections that have a program but no department
    let updatedSections = 0;
    for (const sec of sections) {
        if (!sec.department && sec.program) {
            const prog = progs.find(p => p._id.toString() === sec.program.toString());
            if (prog?.department) {
                await Section.findByIdAndUpdate(sec._id, { department: prog.department });
                updatedSections++;
            }
        }
    }
    console.log('Updated sections with department:', updatedSections);
    
    // Update students - set department based on their program in academicInfo
    const students = await User.find({ role: 'Student' }).lean();
    console.log('\nStudents count:', students.length);
    let updatedStudents = 0;
    
    for (const stu of students) {
        const stuProgId = stu.academicInfo?.program;
        if (stuProgId) {
            const prog = progs.find(p => p._id.toString() === stuProgId.toString());
            if (prog?.department) {
                await User.findByIdAndUpdate(stu._id, { department: prog.department });
                updatedStudents++;
            }
        }
    }
    console.log('Updated students with department:', updatedStudents);
    
    // Update teachers - they already have department in seed, verify
    const teachers = await User.find({ role: 'Teacher' }).lean();
    const teachersWithDept = teachers.filter(t => t.department).length;
    console.log(`\nTeachers with dept: ${teachersWithDept}/${teachers.length}`);
    
    // Update courses - set department from program
    const courses = await Course.find().lean();
    console.log('\nCourses count:', courses.length);
    let updatedCourses = 0;
    for (const course of courses) {
        if (!course.department && course.program) {
            const prog = progs.find(p => p._id.toString() === course.program.toString());
            if (prog?.department) {
                await Course.findByIdAndUpdate(course._id, { department: prog.department });
                updatedCourses++;
            }
        }
    }
    console.log('Updated courses with department:', updatedCourses);

    console.log('\nDone! HOD dashboard stats should now be correct.');
    process.exit(0);
});
