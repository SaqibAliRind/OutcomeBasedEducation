import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const enrollments = await db.collection('enrollments').find({ status: { $in: ['Enrolled', 'Completed'] } }).toArray();
const enrolledSids = new Set(enrollments.map(e => e.student.toString()));

const students = await db.collection('users').find({ role: 'Student' }).toArray();
const allStudentIds = students.map(s => s._id.toString());

const missing = allStudentIds.filter(id => !enrolledSids.has(id));

console.log(`Total Student Users: ${students.length}`);
console.log(`Students Enrolled: ${enrolledSids.size}`);
console.log(`Missing Students: ${missing.length}`);

// check marks
const marks = await db.collection('marks').findOne({});
const gradedSids = marks.students.map(s => s.student.toString());
const missingGraded = missing.filter(id => gradedSids.includes(id));
console.log(`How many of the ${missing.length} unenrolled students received marks anyway? ${missingGraded.length}`);

process.exit(0);
