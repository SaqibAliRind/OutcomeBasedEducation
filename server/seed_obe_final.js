import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { 
    User, University, Department, Program, Session, Semester, 
    Batch, Section, Course, CourseOffering, CLO, PLO, GA, PEO, Student, 
    Enrollment, Assessment, Question, QuestionMapping, Blueprint, 
    StudentAttainment, Mark 
} from './src/models/index.js';
import Faculty from './src/models/Faculty.js';
import ObeTarget from './src/models/ObeTarget.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const clearDB = async () => {
    console.log('Clearing old OBE testing data (Preserving SuperAdmin)...');
    
    // Preserve SuperAdmins
    const superAdmins = await User.find({ role: 'SuperAdmin' });
    const superAdminIds = superAdmins.map(admin => admin._id);
    
    await User.deleteMany({ _id: { $nin: superAdminIds } });
    await Faculty.deleteMany({});
    await Department.deleteMany({});
    await Program.deleteMany({});
    await Session.deleteMany({});
    await Semester.deleteMany({});
    await Batch.deleteMany({});
    await Section.deleteMany({});
    await Course.deleteMany({});
    await CourseOffering.deleteMany({});
    await CLO.deleteMany({});
    await PLO.deleteMany({});
    await GA.deleteMany({});
    await PEO.deleteMany({});
    await Student.deleteMany({});
    await Enrollment.deleteMany({});
    await ObeTarget.deleteMany({});
    
    if (Assessment) await Assessment.deleteMany({});
    if (Question) await Question.deleteMany({});
    if (QuestionMapping) await QuestionMapping.deleteMany({});
    if (Blueprint) await Blueprint.deleteMany({});
    if (StudentAttainment) await StudentAttainment.deleteMany({});
    if (Mark) await Mark.deleteMany({});

    await University.deleteMany({});
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
};

const runSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected.');

        await clearDB();
        const passwordHash = await bcrypt.hash('325531167', 10);

        // ==========================================
        // 1. UNIVERSITY & SUPERADMIN
        // ==========================================
        const university = await University.create({
            name: 'Al-Kawthar University',
            shortName: 'AKU',
            code: 'AKU-001',
            country: 'Pakistan',
            province: 'Sindh',
            city: 'Karachi',
            address: 'OBE City',
            email: 'admin@alkawthar.edu',
            phone: '123456789',
            settings: { gradingSystem: 'Absolute' }
        });
        
        // Update SuperAdmin to point to this university (if any exists), or create one if none exist
        let superAdmin = await User.findOne({ role: 'SuperAdmin' });
        if (!superAdmin) {
            superAdmin = await User.create({ name: 'Super Admin', email: 'admin@alkawthar.com', password: passwordHash, role: 'SuperAdmin', university: university._id });
        } else {
            await User.updateOne({ _id: superAdmin._id }, { $set: { university: university._id } });
        }

        // ==========================================
        // 2. FACULTIES & DEPARTMENTS
        // ==========================================
        const facCS = await Faculty.create({ name: 'Faculty of Computer Science', university: university._id, code: 'FCS' });
        const facEng = await Faculty.create({ name: 'Faculty of Engineering', university: university._id, code: 'FE' });
        const facBus = await Faculty.create({ name: 'Faculty of Business', university: university._id, code: 'FB' });

        const deptCS = await Department.create({ name: 'Department of Computer Science', code: 'CS', faculty: facCS._id, university: university._id });
        const deptIT = await Department.create({ name: 'Department of Information Technology', code: 'IT', faculty: facCS._id, university: university._id });
        const deptSE = await Department.create({ name: 'Department of Software Engineering', code: 'SE', faculty: facCS._id, university: university._id });

        // ==========================================
        // 3. PROGRAM & BATCH
        // ==========================================
        const programBSIT = await Program.create({ name: 'BS Information Technology', code: 'BSIT', department: deptIT._id, duration: "4 Years", type: 'BS', totalSemesters: 8, university: university._id });
        const session = await Session.create({ name: '2026-2027', year: 2026, startDate: new Date('2026-09-01'), endDate: new Date('2027-08-31'), isActive: true, university: university._id });
        const semester3 = await Semester.create({ name: '3rd Semester', number: 3, type: 'Fall', session: session._id, startDate: new Date('2026-09-01'), endDate: new Date('2027-01-31'), university: university._id });
        const batch2025 = await Batch.create({ name: 'BSIT-2025', admissionYear: 2025, graduationYear: 2029, program: programBSIT._id, startingSession: session._id, university: university._id });
        const sectionA = await Section.create({ name: 'A', batch: batch2025._id, program: programBSIT._id, university: university._id });

        // ==========================================
        // 4. USERS (Roles)
        // ==========================================
        const qec = await User.create({ name: 'QEC Officer', email: 'qec@test.com', password: passwordHash, role: 'QEC', university: university._id });
        const dean = await User.create({ name: 'Dean CS', email: 'dean@test.com', password: passwordHash, role: 'Dean', faculty: facCS._id, university: university._id });
        const hod1 = await User.create({ name: 'HOD CS', email: 'hod_cs@test.com', password: passwordHash, role: 'HOD', department: deptCS._id, university: university._id });
        const hod2 = await User.create({ name: 'HOD IT', email: 'hod_it@test.com', password: passwordHash, role: 'HOD', department: deptIT._id, university: university._id });
        const hod3 = await User.create({ name: 'HOD SE', email: 'hod_se@test.com', password: passwordHash, role: 'HOD', department: deptSE._id, university: university._id });
        const pc = await User.create({ name: 'Coordinator BSIT', email: 'pc@test.com', password: passwordHash, role: 'ProgramCoordinator', program: programBSIT._id, university: university._id });
        const teacher1 = await User.create({ name: 'Teacher One', email: 't1@test.com', password: passwordHash, role: 'Teacher', department: deptIT._id, university: university._id });
        const teacher2 = await User.create({ name: 'Teacher Two', email: 't2@test.com', password: passwordHash, role: 'Teacher', department: deptIT._id, university: university._id });
        const teacher3 = await User.create({ name: 'Teacher Three', email: 't3@test.com', password: passwordHash, role: 'Teacher', department: deptIT._id, university: university._id });
        
        // ==========================================
        // 5. GAs, PEOs, PLOs
        // ==========================================
        // Creating 12 GAs
        const gas = [];
        for (let i = 1; i <= 12; i++) {
            gas.push(await GA.create({ code: `GA-${i}`, name: `Graduate Attribute ${i}`, description: `Description for GA ${i}`, program: programBSIT._id, university: university._id }));
        }

        // Creating 4 PEOs
        const peos = [];
        for (let i = 1; i <= 4; i++) {
            peos.push(await PEO.create({ code: `PEO-${i}`, title: `Program Objective ${i}`, description: `Description for PEO ${i}`, program: programBSIT._id, university: university._id }));
        }

        // Creating 12 PLOs (Mapped 1:1 with GAs, and distributed among PEOs)
        const plos = [];
        for (let i = 1; i <= 12; i++) {
            const peoIndex = Math.floor((i - 1) / 3); // 3 PLOs per PEO
            plos.push(await PLO.create({ 
                code: `PLO-${i}`, 
                name: `Program Outcome ${i}`,
                statement: `Statement for PLO ${i}`, 
                program: programBSIT._id, 
                gas: [gas[i-1]._id], 
                peos: [peos[peoIndex]._id],
                university: university._id 
            }));
        }

        // ==========================================
        // 6. TARGETS (Realistic Thresholds)
        // ==========================================
        await ObeTarget.create({
            universityId: university._id,
            cloTarget: 60,
            ploTarget: 65,
            gaTarget: 70,
            programTarget: 70,
            directWeight: 0.8,
            indirectWeight: 0.2
        });

        // ==========================================
        // 7. COURSES & OFFERINGS
        // ==========================================
        const c1 = await Course.create({ code: 'IT-101', name: 'Programming Fundamentals', credits: 3, program: programBSIT._id, university: university._id });
        const c2 = await Course.create({ code: 'IT-102', name: 'Object Oriented Programming', credits: 3, program: programBSIT._id, university: university._id });
        const c3 = await Course.create({ code: 'IT-201', name: 'Database Systems', credits: 3, program: programBSIT._id, university: university._id });
        const c4 = await Course.create({ code: 'IT-202', name: 'Data Structures', credits: 3, program: programBSIT._id, university: university._id });
        const c5 = await Course.create({ code: 'SE-301', name: 'Software Engineering', credits: 3, program: programBSIT._id, university: university._id });
        
        const co1 = await CourseOffering.create({ course: c1._id, session: session._id, semester: semester3._id, section: sectionA._id, teacher: teacher1._id, university: university._id, isObeEnabled: true, academicYear: '2026-2027', program: programBSIT._id });
        
        // ==========================================
        // 8. CLOS FOR COURSE
        // ==========================================
        const clo1 = await CLO.create({ code: 'CLO-1', description: 'Understand fundamental programming concepts.', course: c1._id, plos: [{ plo: plos[0]._id }], gas: [{ ga: gas[0]._id }], university: university._id, isObeEnabled: true });
        const clo2 = await CLO.create({ code: 'CLO-2', description: 'Apply concepts to write code.', course: c1._id, plos: [{ plo: plos[1]._id }], gas: [{ ga: gas[1]._id }], university: university._id, isObeEnabled: true });
        const clo3 = await CLO.create({ code: 'CLO-3', description: 'Analyze problems and design logic.', course: c1._id, plos: [{ plo: plos[2]._id }], gas: [{ ga: gas[2]._id }], university: university._id, isObeEnabled: true });

        // ==========================================
        // 9. ASSESSMENTS
        // ==========================================
        const midExam = await Assessment.create({
            name: 'Midterm Exam', type: 'Mid Exam', totalMarks: 30, passingMarks: 15, weightage: 30,
            semester: semester3._id, session: session._id, course: c1._id, createdBy: teacher1._id
        });
        const finalExam = await Assessment.create({
            name: 'Final Exam', type: 'Final Exam', totalMarks: 40, passingMarks: 20, weightage: 40,
            semester: semester3._id, session: session._id, course: c1._id, createdBy: teacher1._id
        });
        const quiz1 = await Assessment.create({
            name: 'Quiz 1', type: 'Quiz', totalMarks: 10, passingMarks: 5, weightage: 10,
            semester: semester3._id, session: session._id, course: c1._id, createdBy: teacher1._id
        });
        const assign1 = await Assessment.create({
            name: 'Assignment 1', type: 'Assignment', totalMarks: 20, passingMarks: 10, weightage: 20,
            semester: semester3._id, session: session._id, course: c1._id, createdBy: teacher1._id
        });

        // ==========================================
        // 10. QUESTION MAPPINGS (The Blueprint equivalent)
        // ==========================================
        const qm1 = await QuestionMapping.create({
            course: c1._id, semester: semester3._id, session: session._id, teacher: teacher1._id, assessment: midExam._id,
            questions: [
                { questionNumber: 'Q1', marks: 10, clo: clo1._id, plo: plos[0]._id, ga: gas[0]._id, btLevel: 'Understand', actionVerb: 'Explain' },
                { questionNumber: 'Q2', marks: 10, clo: clo2._id, plo: plos[1]._id, ga: gas[1]._id, btLevel: 'Apply', actionVerb: 'Write' },
                { questionNumber: 'Q3', marks: 10, clo: clo3._id, plo: plos[2]._id, ga: gas[2]._id, btLevel: 'Analyze', actionVerb: 'Compare' },
            ]
        });
        const qm2 = await QuestionMapping.create({
            course: c1._id, semester: semester3._id, session: session._id, teacher: teacher1._id, assessment: finalExam._id,
            questions: [
                { questionNumber: 'Q1', marks: 15, clo: clo1._id, plo: plos[0]._id, ga: gas[0]._id, btLevel: 'Understand', actionVerb: 'Describe' },
                { questionNumber: 'Q2', marks: 15, clo: clo2._id, plo: plos[1]._id, ga: gas[1]._id, btLevel: 'Apply', actionVerb: 'Solve' },
                { questionNumber: 'Q3', marks: 10, clo: clo3._id, plo: plos[2]._id, ga: gas[2]._id, btLevel: 'Analyze', actionVerb: 'Design' },
            ]
        });
        const qm3 = await QuestionMapping.create({
            course: c1._id, semester: semester3._id, session: session._id, teacher: teacher1._id, assessment: quiz1._id,
            questions: [{ questionNumber: 'Q1', marks: 10, clo: clo1._id, plo: plos[0]._id, ga: gas[0]._id, btLevel: 'Remember', actionVerb: 'List' }]
        });
        const qm4 = await QuestionMapping.create({
            course: c1._id, semester: semester3._id, session: session._id, teacher: teacher1._id, assessment: assign1._id,
            questions: [{ questionNumber: 'Q1', marks: 20, clo: clo3._id, plo: plos[2]._id, ga: gas[2]._id, btLevel: 'Create', actionVerb: 'Develop' }]
        });

        // ==========================================
        // 11. 30 STUDENTS & ENROLLMENT
        // ==========================================
        const studentDocs = [];
        const enrollDocs = [];
        for (let i = 1; i <= 30; i++) {
            const stuUser = await User.create({
                name: `Test Student ${i}`, email: `student${i}@test.com`, password: passwordHash, role: 'Student', university: university._id
            });
            const stu = await Student.create({
                user: stuUser._id,
                studentId: `BSIT-25-${i.toString().padStart(3, '0')}`,
                program: programBSIT._id, batch: batch2025._id, section: sectionA._id, university: university._id, status: 'Active'
            });
            studentDocs.push(stu);
            enrollDocs.push({ student: stuUser._id, courseOffering: co1._id, semester: semester3._id, session: session.name, university: university._id, status: 'Enrolled' });
        }
        await Enrollment.insertMany(enrollDocs);
        
        // ==========================================
        // 12. REALISTIC MARKS (High/Average/Weak)
        // ==========================================
        const generateMarksForAssessment = (students, qm, perfType) => {
            return students.map(s => {
                const obtArray = (qm.questions || []).map(m => {
                    let pct = 0;
                    if (perfType === 'High') pct = Math.random() * (1 - 0.8) + 0.8; // 80%-100%
                    else if (perfType === 'Average') pct = Math.random() * (0.79 - 0.5) + 0.5; // 50%-79%
                    else pct = Math.random() * (0.49 - 0.2) + 0.2; // 20%-49%
                    return {
                        questionId: m._id, // use the subdocument _id
                        marks: parseFloat((m.marks * pct).toFixed(1))
                    };
                });
                return { student: s.user, obtainedMarks: obtArray.reduce((acc, v) => acc + v.marks, 0), questionMarks: obtArray };
            });
        };

        const highStudents = studentDocs.slice(0, 10);
        const avgStudents = studentDocs.slice(10, 20);
        const weakStudents = studentDocs.slice(20, 30);

        const buildMarkDoc = (assessment, qm) => ({
            assessment: assessment._id, courseOffering: co1._id, university: university._id, status: 'Locked', teacher: teacher1._id,
            students: [
                ...generateMarksForAssessment(highStudents, qm, 'High'),
                ...generateMarksForAssessment(avgStudents, qm, 'Average'),
                ...generateMarksForAssessment(weakStudents, qm, 'Weak')
            ]
        });

        await Mark.create(buildMarkDoc(midExam, qm1));
        await Mark.create(buildMarkDoc(finalExam, qm2));
        await Mark.create(buildMarkDoc(quiz1, qm3));
        await Mark.create(buildMarkDoc(assign1, qm4));
        console.log('Assessments & Realistic Marks Created for all 30 students.');

        // ==========================================
        // 13. TRIGGER REAL OBE ENGINE CALCULATION
        // ==========================================
        const token = generateToken(superAdmin._id);
        console.log('Triggering actual OBE Engine API call...');
        try {
            const apiRes = await fetch(`http://localhost:5000/api/obe/calculate/${co1._id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await apiRes.json();
            console.log('OBE Engine Result:', data.message);
        } catch (apiErr) {
            console.error('API Error triggering OBE calculation:', apiErr);
        }

        console.log('========================================================');
        console.log('✅ FRESH OBE SEED COMPLETE');
        console.log('Super Admin Preserved.');
        console.log('Default Password for all seeded users: 325531167');
        console.log('========================================================');
        process.exit(0);

    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

runSeed();
