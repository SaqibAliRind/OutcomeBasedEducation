import mongoose from 'mongoose';
import 'dotenv/config';
import { User, Enrollment, Mark, Attendance, StudentAttainment } from './src/models/index.js';
import { execSync } from 'child_process';

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- 5 RUN IDEMPOTENCY TEST ---");
        const getCounts = async () => {
            return {
                users: await User.countDocuments(),
                courses: await mongoose.model('Course').countDocuments()
            };
        }
        
        for(let i=1; i<=5; i++) {
            execSync('node test_e2e_bsit.js', { stdio: 'ignore' });
            const c = await getCounts();
            console.log(`Run ${i} -> Users: ${c.users} | Courses: ${c.courses}`);
        }

        console.log("\n--- STUDENT PARTICIPATION DISCREPANCY ANALYSIS ---");
        const bsitStudents = await User.find({ email: /@bsit_test.com/ });
        console.log(`Total test students found: ${bsitStudents.length}`);
        
        const enrollments = await Enrollment.countDocuments({ student: { $in: bsitStudents.map(s => s._id) } });
        const attainments = await StudentAttainment.countDocuments({ student: { $in: bsitStudents.map(s => s._id) } });
        const markDocs = await Mark.find({});
        
        let studentsInMarks = new Set();
        markDocs.forEach(m => {
            m.students.forEach(s => {
                studentsInMarks.add(s.student.toString());
            });
        });
        
        console.log(`Enrollments count: ${enrollments}`);
        console.log(`StudentAttainments count: ${attainments}`);
        console.log(`Mark documents: ${markDocs.length}`);
        console.log(`Unique students graded across Mark documents: ${studentsInMarks.size}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runAudit();
