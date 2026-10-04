const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const marks = await db.collection('marks').find({}).toArray();
    const assIds = marks.map(m => m.assessment);
    const assessments = await db.collection('assessments').find({ _id: { $in: assIds } }).toArray();
    for (const a of assessments) {
        const hasStudents = marks.find(m => m.assessment?.toString() === a._id.toString())?.students?.length || 0;
        console.log(`Assessment: ${a.name} | type: ${a.type} | totalMarks: ${a.totalMarks} | weightage: ${a.weightage} | students in mark: ${hasStudents}`);
    }
    // Check enrollments
    const enrollCount = await db.collection('enrollments').countDocuments({});
    console.log('Total enrollments:', enrollCount);
    const enr = await db.collection('enrollments').findOne({});
    console.log('Sample enrollment:', JSON.stringify(enr, null, 2));
    await mongoose.disconnect();
}
main().catch(console.error);
