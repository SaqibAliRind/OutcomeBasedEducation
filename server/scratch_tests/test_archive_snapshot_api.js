import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();
import { User, CourseOffering } from '../src/models/index.js';
import ObeSnapshot from '../src/models/ObeSnapshot.js';
import Mark from '../src/models/Mark.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('1. Fetching a CourseOffering...');
        const offering = await CourseOffering.findOne().lean();
        if (!offering) throw new Error('No CourseOffering found.');
        
        const sa = await User.findOne({ role: 'SuperAdmin' }).lean();
        const token = jwt.sign({ id: sa._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const hdr = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };

        console.log('2. Creating Archive Snapshot #1...');
        const snapRes1 = await fetch(`http://localhost:5000/api/obe/archive/${offering._id}`, {
            method: 'POST',
            headers: hdr
        });
        const snapData1 = await snapRes1.json();
        console.log('Snapshot #1 res:', snapData1);
        const snap1Id = snapData1._id || snapData1.snapshot?._id;

        console.log('3. Changing a mark...');
        const mark = await Mark.findOne({ courseOffering: offering._id });
        const oldObtained = mark.obtainedMarks;
        mark.obtainedMarks = Math.max(0, oldObtained - 5);
        await mark.save();
        console.log(`Changed mark for student ${mark.student} from ${oldObtained} to ${mark.obtainedMarks}`);

        console.log('4. Recalculating OBE...');
        const calcRes = await fetch(`http://localhost:5000/api/obe/calculate/${offering._id}`, {
            method: 'POST',
            headers: hdr
        });
        const calcData = await calcRes.json();
        console.log('OBE Calculation:', calcData.message);
        
        console.log('5. Creating Archive Snapshot #2...');
        const snapRes2 = await fetch(`http://localhost:5000/api/obe/archive/${offering._id}`, {
            method: 'POST',
            headers: hdr
        });
        const snapData2 = await snapRes2.json();
        console.log('Snapshot #2 res:', snapData2);
        const snap2Id = snapData2._id || snapData2.snapshot?._id;
        
        console.log('Comparison:', snap1Id !== snap2Id ? 'Different Snapshots ✅' : 'Same Snapshot ❌');

        // Restoring mark
        mark.obtainedMarks = oldObtained;
        await mark.save();
        await fetch(`http://localhost:5000/api/obe/calculate/${offering._id}`, {
            method: 'POST',
            headers: hdr
        });
        console.log('Mark restored and OBE recalculated.');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
