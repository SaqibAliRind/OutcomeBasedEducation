import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { 
    User, University, Department, Program, Course, CLO, PLO, GA, PEO, 
    CourseOffering, Mark, QuestionMapping, Blueprint, Assessment, 
    Question, Session, Section, Semester, StudentAttainment, ObeTarget, 
    Enrollment
} from './src/models/index.js';
import Faculty from './src/models/Faculty.js';
import { calculateAttainment } from './src/services/attainmentEngine.js';

const runE2ETest = async () => {
    try {
        console.log("==========================================");
        console.log("   BSIT PROGRAM - SAFE IDEMPOTENT SEED    ");
        console.log("==========================================");
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("[+] DB Connected successfully.");

        const pwd = await bcrypt.hash('password123', 10);

        // 1. UNIVERSITY & ACADEMIC STRUCTURE
        console.log("[+] Reusing/Creating University...");
        const uni = await University.findOneAndUpdate(
            { code: 'BSIT-UNI' },
            { name: 'BSIT Test University', domain: 'bsit.edu', contactEmail: 'admin@bsit.edu', country: 'TestCountry', province: 'TestProvince', city: 'TestCity', address: '123 Main St', phone: '1234567890', email: 'uni@bsit.edu', shortName: 'BSIT', status: 'Active' },
            { upsert: true, new: true }
        );

        console.log("[+] Reusing/Creating Faculty...");
        const fac = await Faculty.findOneAndUpdate(
            { code: 'FCIT' },
            { name: 'Faculty of Information Technology', status: 'Active' },
            { upsert: true, new: true }
        );

        console.log("[+] Reusing/Creating Department...");
        const dept = await Department.findOneAndUpdate(
            { code: 'BSIT-DEPT' },
            { name: 'Information Technology', university: uni._id, faculty: fac._id, status: 'Active' },
            { upsert: true, new: true }
        );

        console.log("[+] Reusing/Creating Program...");
        const prog = await Program.findOneAndUpdate(
            { code: 'BSIT-PROG' },
            { name: 'Bachelor of Science in Information Technology', type: 'BS', department: dept._id },
            { upsert: true, new: true }
        );

        // 2. USERS (Reuse exact names as requested)
        console.log("[+] Reusing existing HODs, Teachers, and Students...");
        const drAli = await User.findOneAndUpdate(
            { email: 'ali123@gmail.com' },
            { name: 'Dr.ALi', password: pwd, role: 'HOD', department: dept._id, university: uni._id, isActive: true },
            { upsert: true, new: true }
        );

        const teacherSaqib = await User.findOneAndUpdate(
            { email: 'saqib123@gmail.com' },
            { name: 'Saqib', password: pwd, role: 'Teacher', faculty: fac._id, university: uni._id, isActive: true },
            { upsert: true, new: true }
        );

        const kalimullah = await User.findOneAndUpdate(
            { email: 'kalimullah@gmail.com' },
            { name: 'Kalimullah', password: pwd, role: 'Student', faculty: fac._id, university: uni._id, isActive: true },
            { upsert: true, new: true }
        );

        // Create 29 additional students for 30 total
        const students = [kalimullah];
        for(let i=1; i<=29; i++) {
            const stu = await User.findOneAndUpdate(
                { email: `s${i}@bsit_test.com` },
                { name: `BSIT Student ${i}`, password: pwd, role: 'Student', university: uni._id, isActive: true },
                { upsert: true, new: true }
            );
            students.push(stu);
        }

        // 3. COURSES & SESSION
        console.log("[+] Setting up Courses and Session...");
        const c101 = await Course.findOneAndUpdate(
            { code: 'BSIT-C101' },
            { name: 'Intro to IT', creditHours: 3, program: prog._id, department: dept._id },
            { upsert: true, new: true }
        );

        const sess = await Session.findOneAndUpdate(
            { name: 'Fall 2026' },
            { term: 'Fall', year: 2026, status: 'Active' },
            { upsert: true, new: true }
        );

        const sem = await Semester.findOneAndUpdate(
            { name: 'BSIT Sem 1', session: sess._id },
            { number: 1, type: 'Fall', year: 2026, status: 'Open' },
            { upsert: true, new: true }
        );

        const sec = await Section.findOneAndUpdate(
            { name: 'Section A', semester: sem._id, program: prog._id },
            { capacity: 50 },
            { upsert: true, returnDocument: 'after' }
        );

        // 4. COURSE OFFERING
        const offering = await CourseOffering.findOneAndUpdate(
            { course: c101._id, teacher: teacherSaqib._id, section: sec._id, semester: sem._id, session: sess._id },
            { program: prog._id, academicYear: 'BSIT-2026' },
            { upsert: true, new: true }
        );

        // Enroll students
        for(const s of students) {
            await Enrollment.findOneAndUpdate(
                { student: s._id, courseOffering: offering._id },
                { semester: sem._id, session: sess._id, section: sec._id, status: 'Enrolled' },
                { upsert: true }
            );
        }

        // 5. OBE FRAMEWORK
        console.log("[+] Setting up OBE...");
        await ObeTarget.findOneAndUpdate(
            {},
            { cloTarget: 60, ploTarget: 60, gaTarget: 60 },
            { upsert: true, new: true }
        );

        const peo = await PEO.findOneAndUpdate({ code: 'PEO-1', program: prog._id }, { title: 'BSIT PEO 1' }, { upsert: true, new: true });
        const ga = await GA.findOneAndUpdate({ code: 'GA-1', program: prog._id }, { name: 'IT Knowledge' }, { upsert: true, new: true });
        const plo = await PLO.findOneAndUpdate({ code: 'PLO-1', program: prog._id }, { statement: 'Apply IT knowledge', peos: [peo._id], gas: [ga._id] }, { upsert: true, new: true });
        const clo = await CLO.findOneAndUpdate({ code: 'CLO-1', course: c101._id }, { description: 'Understand IT basic concepts', plos: [{ plo: plo._id, weightage: 100 }], bloomsLevel: 'Understand' }, { upsert: true, new: true });

        // 6. QUESTION & BLUEPRINT (Crucial for OBE trace)
        const q1 = await Question.findOneAndUpdate(
            { text: 'Explain IT basics', course: c101._id, teacher: teacherSaqib._id },
            { type: 'Short Question', status: 'Approved' },
            { upsert: true, new: true }
        );

        const midExam = await Assessment.findOneAndUpdate(
            { name: 'Midterm Exam', course: c101._id, session: sess._id, semester: sem._id },
            { type: 'Mid Exam', courseOffering: offering._id, weightage: 30, totalMarks: 30, status: 'Published' },
            { upsert: true, new: true }
        );

        const blueprint = await Blueprint.findOneAndUpdate(
            { assessment: midExam._id, course: c101._id, teacher: teacherSaqib._id },
            { status: 'Approved' },
            { upsert: true, new: true }
        );

        await QuestionMapping.findOneAndUpdate(
            { assessment: midExam._id, course: c101._id, teacher: teacherSaqib._id, semester: sem._id },
            { 
                courseOffering: offering._id, 
                status: 'Approved',
                questions: [{ question: q1._id, questionNumber: 'Q1', marks: 30, clo: clo._id, plo: plo._id, btLevel: 'Understand' }]
            },
            { upsert: true, new: true }
        );

        // 7. MARKS (Varied scores for realistic data)
        console.log("[+] Seeding Varied Marks...");
        const markRecords = [];
        students.forEach((s, idx) => {
            let obtained = 20; // Default ~66% (Above 60% target)
            if (idx % 5 === 0) obtained = 30; // 100% (High)
            if (idx % 7 === 0) obtained = 15; // 50% (Below Target)
            if (idx === 3) obtained = 0;      // 0% (Fail)
            if (idx === 4) obtained = 17;     // 56% (Near Target)
            if (idx === 5) obtained = 18;     // 60% (Exact Target)
            markRecords.push({ student: s._id, obtainedMarks: obtained });
        });

        await Mark.findOneAndUpdate(
            { assessment: midExam._id, courseOffering: offering._id },
            { teacher: teacherSaqib._id, status: 'Verified', students: markRecords },
            { upsert: true, new: true }
        );

        // 8. TRIGGER ENGINE
        console.log("[+] Running Attainment Engine...");
        const result = await calculateAttainment(offering._id);
        console.log(`[+] Attainment Calculated for ${result.count} students.`);

        console.log("\n[+] E2E SEED COMPLETED SUCCESSFULLY (IDEMPOTENT).");
        process.exit(0);

    } catch (e) {
        console.error("[-] ERROR IN SEED SCRIPT:", e);
        process.exit(1);
    }
};

runE2ETest();
