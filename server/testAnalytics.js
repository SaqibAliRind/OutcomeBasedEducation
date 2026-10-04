import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const { User, StudentAttainment, CLO, PLO, GA, PEO, ObeTarget, Attendance, Mark, CourseOffering } = await import('./src/models/index.js');

    const students = await User.countDocuments({ role: 'Student' });
    const teachers = await User.countDocuments({ role: 'Teacher' });
    const attainments = await StudentAttainment.countDocuments();
    const clos = await CLO.countDocuments();
    const plos = await PLO.countDocuments();
    const gas = await GA.countDocuments();
    const peos = await PEO.countDocuments();
    const targets = await ObeTarget.countDocuments();
    const attendances = await Attendance.countDocuments();
    const marks = await Mark.countDocuments();
    const courseOfferings = await CourseOffering.countDocuments();

    console.log('=== DATABASE STATE ===');
    console.log('Students:         ', students);
    console.log('Teachers:         ', teachers);
    console.log('StudentAttainment:', attainments);
    console.log('CLOs:             ', clos);
    console.log('PLOs:             ', plos);
    console.log('GAs:              ', gas);
    console.log('PEOs:             ', peos);
    console.log('ObeTargets:       ', targets);
    console.log('Attendances:      ', attendances);
    console.log('Marks:            ', marks);
    console.log('CourseOfferings:  ', courseOfferings);
    console.log('======================');

    process.exit(0);
});
