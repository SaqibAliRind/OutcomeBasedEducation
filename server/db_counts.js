import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { 
    University, Department, Program, Session, Batch, Section,
    Course, CourseOffering, User, Enrollment, GA, PEO, PLO, CLO,
    Assessment, Question, Blueprint, QuestionMapping,
    Mark, Attendance, ObeTarget, StudentAttainment, Survey
} from './src/models/index.js';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alkawthar');
        console.log("Connected to DB.");

        const counts = {
            Universities: await University.countDocuments(),
            Departments: await Department.countDocuments(),
            Programs: await Program.countDocuments(),
            Sessions: await Session.countDocuments(),
            Semesters: "N/A (Derived)",
            Batches: await Batch.countDocuments(),
            Sections: await Section.countDocuments(),
            Courses: await Course.countDocuments(),
            CourseOfferings: await CourseOffering.countDocuments(),
            Teachers: await User.countDocuments({ role: 'Teacher' }),
            Students: await User.countDocuments({ role: 'Student' }),
            Enrollments: await Enrollment.countDocuments(),
            GAs: await GA.countDocuments(),
            PEOs: await PEO.countDocuments(),
            PLOs: await PLO.countDocuments(),
            CLOs: await CLO.countDocuments(),
            Assessments: await Assessment.countDocuments(),
            Questions: await Question.countDocuments(),
            Blueprints: await Blueprint.countDocuments(),
            QuestionMappings: await QuestionMapping.countDocuments(),
            Marks: await Mark.countDocuments(),
            Attendance: await Attendance.countDocuments(),
            Targets: await ObeTarget.countDocuments(),
            StudentAttainment: await StudentAttainment.countDocuments(),
            Survey: await Survey.countDocuments()
        };

        // For CLO-PLO mappings, we need to inspect the CLO collection
        const clos = await CLO.find();
        let cloPloCount = 0;
        clos.forEach(c => {
            if (c.mappedPLOs && c.mappedPLOs.length) cloPloCount += c.mappedPLOs.length;
        });
        counts['CLO-PLO Mappings'] = cloPloCount;

        const plos = await PLO.find();
        let ploGaCount = 0;
        plos.forEach(p => {
            if (p.mappedGAs && p.mappedGAs.length) ploGaCount += p.mappedGAs.length;
        });
        counts['PLO-GA Mappings'] = ploGaCount;

        console.log("=== ACTUAL MONGODB COUNTS ===");
        Object.entries(counts).forEach(([k, v]) => {
            console.log(`${k}: ${v}`);
        });

        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        mongoose.disconnect();
    }
};

run();
