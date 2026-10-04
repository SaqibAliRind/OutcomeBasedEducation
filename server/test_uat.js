import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, University, Department, Program, Course, CLO, PLO, GA, PEO, CourseOffering, Student, Teacher, Mark, QuestionMapping, Blueprint, Assessment, Question, Session, Section, Semester, StudentAttainment, ObeTarget, CourseFile, Survey } from './src/models/index.js';
import { calculateObeAttainment } from './src/controllers/obeEngineController.js';
import { calculateIndirectAssessment } from './src/controllers/surveyController.js';
dotenv.config();

const runUAT = async () => {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected.");

        // Clean previous UAT data
        console.log("Cleaning old UAT data...");
        await User.deleteMany({ email: /uat_test/ });
        await University.deleteMany({ name: /UAT / });
        await CourseOffering.deleteMany({ name: /UAT / });

        // 1. Create Environment
        const uni = await University.create({ name: 'UAT University', code: 'UAT-U', domain: 'uat.edu', contactEmail: 'admin@uat.edu', country: 'TestCountry', province: 'TestProv', city: 'TestCity', address: '123 Test St', phone: '1234567890', email: 'uni@uat.edu', shortName: 'UAT' });
        const dept = await Department.create({ name: 'UAT Department', code: 'UAT-D', university: uni._id });
        const prog = await Program.create({ name: 'UAT Program', code: 'UAT-P', department: dept._id });
        const course = await Course.create({ name: 'UAT Software Engineering', code: 'UAT-SE', creditHours: 3, program: prog._id });

        // 2. Users
        const pwd = await bcrypt.hash('password123', 10);
        const dean = await User.create({ name: 'UAT Dean', email: 'dean@uat_test.com', password: pwd, role: 'Dean' });
        const hod = await User.create({ name: 'UAT HOD', email: 'hod@uat_test.com', password: pwd, role: 'HOD', department: dept._id });
        const teacher = await User.create({ name: 'UAT Teacher', email: 'teacher@uat_test.com', password: pwd, role: 'Teacher', university: uni._id });
        const qec = await User.create({ name: 'UAT QEC', email: 'qec@uat_test.com', password: pwd, role: 'QEC', university: uni._id });
        const coordinator = await User.create({ name: 'UAT Coordinator', email: 'coord@uat_test.com', password: pwd, role: 'ProgramCoordinator', program: prog._id });

        const students = await User.insertMany([
            { name: 'UAT Student 1', email: 's1@uat_test.com', password: pwd, role: 'Student' },
            { name: 'UAT Student 2', email: 's2@uat_test.com', password: pwd, role: 'Student' },
            { name: 'UAT Student 3', email: 's3@uat_test.com', password: pwd, role: 'Student' }
        ]);

        // 3. OBE Setup
        const peo = await PEO.create({ code: 'PEO-1', title: 'UAT PEO Title', description: 'UAT PEO', program: prog._id });
        
        const ga1 = await GA.create({ code: 'GA-1', name: 'UAT GA1', description: 'UAT GA1', program: prog._id });
        const ga2 = await GA.create({ code: 'GA-2', name: 'UAT GA2', description: 'UAT GA2', program: prog._id });
        
        const plo1 = await PLO.create({ code: 'PLO-1', statement: 'UAT PLO1 Statement', description: 'UAT PLO1', program: prog._id, peos: [peo._id], gas: [ga1._id] });
        const plo2 = await PLO.create({ code: 'PLO-2', statement: 'UAT PLO2 Statement', description: 'UAT PLO2', program: prog._id, peos: [peo._id], gas: [ga2._id] });

        const clo1 = await CLO.create({ code: 'CLO-1', description: 'UAT CLO1', course: course._id, plos: [{ plo: plo1._id, weightage: 100 }] });
        const clo2 = await CLO.create({ code: 'CLO-2', description: 'UAT CLO2', course: course._id, plos: [{ plo: plo2._id, weightage: 100 }] });

        // Offering
        const semester = await Semester.create({ name: 'Fall 2026', type: 'Fall', year: 2026, number: 1 });
        const sess = await Session.create({ name: 'UAT Session', program: prog._id, year: 2026 });
        const sec = await Section.create({ name: 'UAT Section', session: sess._id });
        const offering = await CourseOffering.create({ course: course._id, teacher: teacher._id, program: prog._id, semester: semester._id, academicYear: '2026-2027', session: sess._id, section: sec._id });

        // OBE Target
        const target = await ObeTarget.create({ universityId: uni._id, cloTarget: 60, ploTarget: 60, directWeight: 70, indirectWeight: 30 });

        // Assessment
        const assessment = await Assessment.create({ title: 'UAT Midterm', name: 'UAT Midterm', type: 'Mid Exam', courseOffering: offering._id, course: course._id, session: sess._id, semester: semester._id, weightage: 20, passingMarks: 10, totalMarks: 20 });
        
        // Questions and mapping
        const q1 = await Question.create({ text: 'Q1', type: 'Short Question', teacher: teacher._id, course: course._id });
        const mapping = await QuestionMapping.create({
            courseOffering: offering._id,
            assessment: assessment._id,
            teacher: teacher._id,
            course: course._id,
            semester: semester._id,
            questions: [
                { question: q1._id, questionNumber: 'Q1(a)', marks: 10, clo: clo1._id, plo: plo1._id, btLevel: 'Understand', part: '1a' },
                { question: q1._id, questionNumber: 'Q1(b)', marks: 10, clo: clo2._id, plo: plo2._id, btLevel: 'Apply', part: '1b' }
            ]
        });

        // Marks
        const mark = await Mark.create({
            courseOffering: offering._id,
            assessment: assessment._id,
            teacher: teacher._id,
            status: 'Verified',
            students: [
                { student: students[0]._id, obtainedMarks: 18 }, // 90% (CLO1:9, CLO2:9 -> 90% for both)
                { student: students[1]._id, obtainedMarks: 10 }, // 50%
                { student: students[2]._id, obtainedMarks: 8 }   // 40%
            ]
        });

        console.log("UAT Data Created. Running Attainment Engine...");

        // Mock req/res for attainment
        let attainmentRes = null;
        await calculateObeAttainment({ params: { courseOfferingId: offering._id }, user: teacher }, { status: () => ({ json: (data) => attainmentRes = data }) });
        
        console.log("Attainment Engine Result:", attainmentRes?.message);
        
        const attainments = await StudentAttainment.find({ courseOffering: offering._id }).populate('clos.clo').populate('plos.plo').lean();
        
        console.log("\n--- DIRECT ATTAINMENT RESULTS ---");
        attainments.forEach(a => {
            console.log(`Student ${a.student} Total %: ${a.overallPercentage || 0}`);
            a.clos.forEach(c => console.log(`  CLO: ${c.clo?.code} | Obtained: ${c.obtainedMarks}/${c.totalMarks} | Pct: ${c.percentage}% | Achieved: ${c.achieved}`));
            a.plos.forEach(p => console.log(`  PLO: ${p.plo?.code} | Obtained: ${p.obtainedMarks}/${p.totalMarks} | Pct: ${p.percentage}% | Achieved: ${p.achieved}`));
        });

        // Test CQI
        const cqiFiles = await CourseFile.find({ courseOffering: offering._id }).lean();
        console.log("\n--- CQI VERIFICATION ---");
        console.log(`CQI Files Generated: ${cqiFiles.length}`);
        if(cqiFiles.length > 0) {
            console.log(`Weak CLOs identified: ${cqiFiles[0].closingLoop.map(c => c.weakCLO)}`);
        }

        // Test Indirect
        console.log("\n--- INDIRECT ASSESSMENT VERIFICATION ---");
        const survey = await Survey.create({ title: 'UAT Course Survey', type: 'Course Evaluation', university: uni._id, targetEntity: offering._id, targetModel: 'CourseOffering', questions: [{ text: 'Rate CLO1', type: 'Rating Scale (1–5)', mappedCLO: clo1._id }] });
        survey.responses = [
            { respondentType: 'Student', respondentId: students[0]._id, answers: [{ questionId: survey.questions[0]._id, value: '5' }] }, // 100%
            { respondentType: 'Student', respondentId: students[1]._id, answers: [{ questionId: survey.questions[0]._id, value: '3' }] }, // 60%
        ];
        await survey.save();
        
        // Mock survey engine
        let surveyRes = null;
        await calculateIndirectAssessment({ params: { id: survey._id }, user: qec }, { status: () => ({ json: (d) => surveyRes = d }) });
        console.log("Survey Engine:", surveyRes?.message);

        const updatedAttainments = await StudentAttainment.find({ courseOffering: offering._id }).populate('clos.clo').lean();
        console.log("\n--- COMBINED ATTAINMENT RESULTS ---");
        updatedAttainments.forEach(a => {
            console.log(`Student ${a.student}`);
            a.clos.forEach(c => console.log(`  CLO: ${c.clo?.code} | Direct: ${c.percentage}% | Indirect: ${c.indirectPercentage || 0}% | Overall: ${c.overallPercentage || c.percentage}%`));
        });

        console.log("\nUAT COMPLETE.");
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

runUAT();
