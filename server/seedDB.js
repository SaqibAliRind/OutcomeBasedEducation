import 'dotenv/config';
import mongoose from 'mongoose';
import { 
    University, Department, Program, Session, Semester, Batch, Section, 
    Course, User, Enrollment, CourseOffering
} from './src/models/index.js';
import Faculty from './src/models/Faculty.js';

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for seeding.');

        // 1. UNIVERSITY
        const uni = await University.create({
            name: 'Al-Kawthar University',
            shortName: 'AKU',
            code: 'AKU',
            location: 'Islamabad, Pakistan',
            establishedYear: 1995,
            country: 'Pakistan',
            province: 'Islamabad Capital Territory',
            city: 'Islamabad',
            address: 'Sector H-8/4, Islamabad',
            phone: '+92-51-111-111-111',
            email: 'info@alkawthar.edu.pk',
            status: 'Active'
        });
        console.log('Created University:', uni.name);

        // 2. FACULTIES
        const faculties = await Faculty.insertMany([
            { name: 'Faculty of Computing & Information Technology', code: 'FCIT', dean: null, university: uni._id, description: 'Computing Faculty', status: 'Active' },
            { name: 'Faculty of Engineering', code: 'FE', dean: null, university: uni._id, description: 'Engineering Faculty', status: 'Active' },
            { name: 'Faculty of Business Administration', code: 'FBA', dean: null, university: uni._id, description: 'Business Faculty', status: 'Active' }
        ]);
        console.log(`Created ${faculties.length} Faculties.`);

        // 3. DEPARTMENTS
        const depts = await Department.insertMany([
            { name: 'Department of Information Technology', code: 'DIT', faculty: faculties[0]._id, status: 'Active' },
            { name: 'Department of Computer Science', code: 'DCS', faculty: faculties[0]._id, status: 'Active' },
            { name: 'Department of Electrical Engineering', code: 'DEE', faculty: faculties[1]._id, status: 'Active' }
        ]);
        console.log(`Created ${depts.length} Departments.`);

        // 4. PROGRAMS
        const programs = await Department.findById(depts[0]._id).then(async (dit) => {
            return await Program.insertMany([
                { name: 'Bachelor of Science in Information Technology', code: 'BSIT', type: 'BS', department: depts[0]._id, duration: '4 Years', creditHours: 130, totalSemesters: 8, status: 'Active' },
                { name: 'Bachelor of Science in Computer Science', code: 'BSCS', type: 'BS', department: depts[1]._id, duration: '4 Years', creditHours: 130, totalSemesters: 8, status: 'Active' },
                { name: 'Master of Science in Information Technology', code: 'MSIT', type: 'MS', department: depts[0]._id, duration: '2 Years', creditHours: 30, totalSemesters: 4, status: 'Active' }
            ]);
        });
        console.log(`Created ${programs.length} Programs.`);

        // Users — pass PLAINTEXT password, User.pre('save') hook will hash it once
        const PLAIN_PASSWORD = 'Password@123';
        
        const createUser = async (name, email, role, extra = {}) => {
            return await User.create({ name, email, password: PLAIN_PASSWORD, role, status: 'Active', ...extra });
        };

        // 5. DEANS
        const deans = await Promise.all([
            createUser('Dr. FCIT Dean', 'dean.fcit@alkawthar.edu', 'Dean', { faculty: faculties[0]._id }),
            createUser('Dr. FE Dean', 'dean.fe@alkawthar.edu', 'Dean', { faculty: faculties[1]._id }),
            createUser('Dr. FBA Dean', 'dean.fba@alkawthar.edu', 'Dean', { faculty: faculties[2]._id })
        ]);
        // Update faculties
        await Faculty.findByIdAndUpdate(faculties[0]._id, { dean: deans[0]._id });
        await Faculty.findByIdAndUpdate(faculties[1]._id, { dean: deans[1]._id });
        await Faculty.findByIdAndUpdate(faculties[2]._id, { dean: deans[2]._id });

        // 6. HODS
        const hods = await Promise.all([
            createUser('Dr. DIT HOD', 'hod.dit@alkawthar.edu', 'HOD', { department: depts[0]._id }),
            createUser('Dr. DCS HOD', 'hod.dcs@alkawthar.edu', 'HOD', { department: depts[1]._id }),
            createUser('Dr. DEE HOD', 'hod.dee@alkawthar.edu', 'HOD', { department: depts[2]._id })
        ]);

        // 7. PROGRAM COORDINATORS
        const coords = await Promise.all([
            createUser('Mr. BSIT Coord', 'coord.bsit@alkawthar.edu', 'ProgramCoordinator', { program: programs[0]._id }),
            createUser('Mr. BSCS Coord', 'coord.bscs@alkawthar.edu', 'ProgramCoordinator', { program: programs[1]._id })
        ]);
        await Program.findByIdAndUpdate(programs[0]._id, { coordinator: coords[0]._id });

        // 8. QEC
        await createUser('QEC Officer', 'qec@alkawthar.edu', 'QEC');

        // 9. TEACHERS
        const teachers = [];
        for (let i = 1; i <= 8; i++) {
            teachers.push(await createUser(`Teacher ${i}`, `teacher${i}@alkawthar.edu`, 'Teacher', { department: depts[0]._id }));
        }

        // 10. STUDENTS (25)
        const students = [];
        for (let i = 1; i <= 25; i++) {
            students.push(await createUser(`Student ${i}`, `student${i}@alkawthar.edu`, 'Student', {
                program: programs[0]._id,
                rollNumber: `F23-BSIT-${100 + i}`,
                department: depts[0]._id
            }));
        }

        // ACADEMIC SETUP
        const session = await Session.create({ name: 'Fall 2023', year: 2023, startDate: new Date('2023-09-01'), endDate: new Date('2024-01-30'), status: 'Active' });
        const semester = await Semester.create({ name: 'Semester 1', number: 1, session: session._id, status: 'Open' });
        const batch = await Batch.create({ name: 'Batch 2023', year: 2023, admissionYear: 2023, graduationYear: 2027, program: programs[0]._id, status: 'Active' });
        const sectionA = await Section.create({ name: 'Section A', capacity: 30, program: programs[0]._id, semester: semester._id, status: 'Active' });

        const courses = await Course.insertMany([
            { code: 'IT101', name: 'Introduction to ICT', creditHours: 3, program: programs[0]._id, type: 'Theory', status: 'Active' },
            { code: 'IT102', name: 'Programming Fundamentals', creditHours: 4, program: programs[0]._id, type: 'Theory + Lab', status: 'Active' },
            { code: 'IT103', name: 'Discrete Structures', creditHours: 3, program: programs[0]._id, type: 'Theory', status: 'Active' }
        ]);

        // COURSE OFFERINGS
        const offerings = await CourseOffering.insertMany([
            { course: courses[0]._id, teacher: teachers[0]._id, section: sectionA._id, semester: semester._id, session: session._id, program: programs[0]._id, academicYear: '2023-2024', enrollmentLimit: 30, status: 'Open' },
            { course: courses[1]._id, teacher: teachers[1]._id, section: sectionA._id, semester: semester._id, session: session._id, program: programs[0]._id, academicYear: '2023-2024', enrollmentLimit: 30, status: 'Open' },
            { course: courses[2]._id, teacher: teachers[2]._id, section: sectionA._id, semester: semester._id, session: session._id, program: programs[0]._id, academicYear: '2023-2024', enrollmentLimit: 30, status: 'Open' }
        ]);

        // ENROLLMENTS
        const enrollments = [];
        for (const student of students) {
            for (const offering of offerings) {
                enrollments.push({
                    student: student._id,
                    courseOffering: offering._id,
                    semester: semester._id,
                    session: 'Fall 2023',
                    status: 'Enrolled'
                });
            }
        }
        await Enrollment.insertMany(enrollments);

        console.log(`Seeded fully. (Teachers: ${teachers.length}, Students: ${students.length}, Enrollments: ${enrollments.length})`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
