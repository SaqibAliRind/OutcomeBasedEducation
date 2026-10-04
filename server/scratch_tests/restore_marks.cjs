const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Get assessment totalMarks for each mark doc
    const marks = await db.collection('marks').find({}).toArray();
    const assessmentIds = marks.map(m => m.assessment).filter(Boolean);
    const assessments = await db.collection('assessments').find({ _id: { $in: assessmentIds } }).toArray();
    const assessmentMap = {};
    for (const a of assessments) assessmentMap[a._id.toString()] = a;

    // Restore marks to realistic values matching assessment totalMarks
    let restored = 0;
    for (const m of marks) {
        const a = assessmentMap[m.assessment?.toString()];
        if (!a || !m.students) continue;
        const maxMarks = a.totalMarks;
        // Restore to ~59% (baseline), varied 55%-65% range
        const updatedStudents = m.students.map((s, idx) => ({
            ...s,
            obtainedMarks: Math.round(maxMarks * (0.55 + (idx % 5) * 0.025))
        }));
        await db.collection('marks').updateOne({ _id: m._id }, { $set: { students: updatedStudents } });
        restored++;
        console.log(`Restored: ${a.name}  maxMarks: ${maxMarks}  sample: ${updatedStudents[0].obtainedMarks}-${updatedStudents[updatedStudents.length-1].obtainedMarks}`);
    }
    console.log('Total restored:', restored);
    await mongoose.disconnect();
}

main().catch(console.error);
