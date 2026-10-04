import mongoose from 'mongoose';
import 'dotenv/config';
import { 
    User, University, Department, Program, Course, CourseOffering, 
    Session, Semester, Section, Enrollment, Assessment, Question, 
    Blueprint, QuestionMapping, Rubric, Mark, Attendance, StudentAttainment, 
    Notification, AuditLog, PEO, PLO, GA, CLO
} from './src/models/index.js';
import Faculty from './src/models/Faculty.js';

const runAudit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const counts = {
            Users: await User.countDocuments(),
            SuperAdmins: await User.countDocuments({ role: 'SuperAdmin' }),
            UniversityAdmins: await User.countDocuments({ role: 'UniversityAdmin' }),
            Deans: await User.countDocuments({ role: 'Dean' }),
            HODs: await User.countDocuments({ role: 'HOD' }),
            ProgramCoordinators: await User.countDocuments({ role: 'ProgramCoordinator' }),
            Teachers: await User.countDocuments({ role: 'Teacher' }),
            Students: await User.countDocuments({ role: 'Student' }),
            QECs: await User.countDocuments({ role: 'QEC' }),
            Faculties: await Faculty.countDocuments(),
            Departments: await Department.countDocuments(),
            Programs: await Program.countDocuments(),
            Courses: await Course.countDocuments(),
            CourseOfferings: await CourseOffering.countDocuments(),
            Sections: await Section.countDocuments(),
            Enrollments: await Enrollment.countDocuments(),
            Assessments: await Assessment.countDocuments(),
            Questions: await Question.countDocuments(),
            Blueprints: await Blueprint.countDocuments(),
            QuestionMappings: await QuestionMapping.countDocuments(),
            Rubrics: await Rubric.countDocuments(),
            Marks: await Mark.countDocuments(),
            Attendance: await Attendance.countDocuments(),
            StudentAttainments: await StudentAttainment.countDocuments(),
            Notifications: await Notification.countDocuments(),
            AuditLogs: await AuditLog.countDocuments(),
            PEOs: await PEO.countDocuments(),
            PLOs: await PLO.countDocuments(),
            GAs: await GA.countDocuments(),
            CLOs: await CLO.countDocuments(),
        };

        const preserved = {
            HOD_Ali: await User.exists({ name: 'Dr.ALi', role: 'HOD' }),
            HOD_Haider: await User.exists({ name: 'Dr.Haider', role: 'HOD' }),
            HOD_Khan: await User.exists({ name: 'Dr.Khan', role: 'HOD' }),
            Teacher_Saqib: await User.exists({ name: 'Saqib', role: 'Teacher' }),
            Teacher_Hashir: await User.exists({ name: 'Hashir', role: 'Teacher' }),
            Teacher_Mahrukh: await User.exists({ name: 'Mahrukh', role: 'Teacher' }),
            Student_Kalimullah: await User.exists({ name: 'Kalimullah', role: 'Student' }),
            Faculty_IT: await Faculty.exists({ name: 'Faculty of Information Technology' }),
            Faculty_CS: await Faculty.exists({ name: 'Faculty of Computer Science' }),
            Faculty_SE: await Faculty.exists({ name: 'Faculty of Software Engineering' })
        };

        console.log(JSON.stringify({ counts, preserved }, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runAudit();
