import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;

const enrollments = await db.collection('enrollments').find({ status: { $in: ['Enrolled', 'Completed'] } }).toArray();
console.log('Total enrollments:', enrollments.length);

const sids = new Set();
enrollments.forEach(e => {
    if(e.student) sids.add(e.student.toString());
});
console.log('Unique students enrolled:', sids.size);

process.exit(0);
