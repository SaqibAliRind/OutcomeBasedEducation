import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Enrollment from '../src/models/Enrollment.js';
import Mark from '../src/models/Mark.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const e = await Enrollment.findOne().select('status grade student');
    console.log('Sample enrollment:', JSON.stringify(e));
    const withGrade = await Enrollment.countDocuments({ grade: { $ne: null } });
    const total = await Enrollment.countDocuments();
    console.log('Total enrollments:', total, '| With grade:', withGrade);
    
    // Check marks data
    const totalMarks = await Mark.countDocuments();
    const sampleMark = await Mark.findOne().select('students courseOffering');
    console.log('Total mark docs:', totalMarks);
    if (sampleMark && sampleMark.students.length > 0) {
        console.log('Sample mark student:', JSON.stringify(sampleMark.students[0]));
    }
    process.exit(0);
});
