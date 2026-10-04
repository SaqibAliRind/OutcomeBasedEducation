import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, CourseOffering } from '../src/models/index.js';
import ObeSnapshot from '../src/models/ObeSnapshot.js';
import Mark from '../src/models/Mark.js';
import { calculateObeForCourseOffering } from '../src/controllers/obeEngineController.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log('1. Fetching a CourseOffering...');
        const offering = await CourseOffering.findOne().lean();
        if (!offering) throw new Error('No CourseOffering found.');
        
        console.log('2. Creating Archive Snapshot #1...');
        const snap1 = await ObeSnapshot.create({
            courseOffering: offering._id,
            snapshotData: { note: 'Initial Snapshot' },
            archivedBy: (await User.findOne({role: 'SuperAdmin'}))._id
        });
        console.log('Snapshot #1 created:', snap1._id);

        console.log('3. Changing a mark...');
        const mark = await Mark.findOne({ courseOffering: offering._id });
        const oldObtained = mark.obtainedMarks;
        mark.obtainedMarks = Math.max(0, oldObtained - 5);
        await mark.save();
        console.log(`Changed mark for student ${mark.student} from ${oldObtained} to ${mark.obtainedMarks}`);

        console.log('4. Recalculating OBE...');
        await calculateObeForCourseOffering(offering._id);
        
        console.log('5. Creating Archive Snapshot #2...');
        const snap2 = await ObeSnapshot.create({
            courseOffering: offering._id,
            snapshotData: { note: 'After Mark Change' },
            archivedBy: (await User.findOne({role: 'SuperAdmin'}))._id
        });
        console.log('Snapshot #2 created:', snap2._id);
        
        console.log('Comparison:', snap1._id.toString() !== snap2._id.toString() ? 'Different Snapshots' : 'Same Snapshot (Error)');

        // Restoring mark
        mark.obtainedMarks = oldObtained;
        await mark.save();
        await calculateObeForCourseOffering(offering._id);
        console.log('Mark restored and OBE recalculated.');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
