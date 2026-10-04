import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, Program, Department, Section, Course } from './src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const depts = await Department.find().lean();
    const progs = await Program.find().lean();
    const progMap = {};
    progs.forEach(p => {
        if (p.department) progMap[p._id.toString()] = p.department;
    });

    const students = await User.find({ role: 'Student' });
    let updatedCount = 0;
    for (const student of students) {
        // Find which section they are enrolled in or assigned to
        const sections = await Section.find().lean();
        // Since we seeded students without explicit program/dept, but we might have assigned them a section?
        // Wait, let's check seedDB.js to see how students were seeded!
    }
});
