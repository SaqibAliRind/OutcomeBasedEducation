import 'dotenv/config';
import mongoose from 'mongoose';
import { StudentAttainment, User, CLO, PLO, ObeTarget } from './src/models/index.js';

const runVerification = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const kalimullah = await User.findOne({ email: 'kalimullah@gmail.com' });
        const student5 = await User.findOne({ email: 's5@bsit_test.com' });
        const target = await ObeTarget.findOne({});

        const attKal = await StudentAttainment.findOne({ student: kalimullah._id }).populate('clos.clo').populate('plos.plo').lean();
        const attS5 = await StudentAttainment.findOne({ student: student5._id }).populate('clos.clo').populate('plos.plo').lean();

        console.log("=== MANUAL OBE CALCULATION VERIFICATION ===");
        console.log(`Target Threshold: CLO ${target.cloTarget}%, PLO ${target.ploTarget}%`);
        
        console.log("\nStudent 1 (Kalimullah):");
        console.log("Expected Marks: 30/30 = 100%. Achieved = true");
        console.log(`DB CLO% : ${attKal.clos[0].percentage}% | Achieved: ${attKal.clos[0].achieved}`);
        console.log(`DB PLO% : ${attKal.plos[0].percentage}% | Achieved: ${attKal.plos[0].achieved}`);

        console.log("\nStudent 5 (s5@bsit_test.com):");
        console.log("Expected Marks: 18/30 = 60%. Achieved = true (Target is 60%)");
        console.log(`DB CLO% : ${attS5.clos[0].percentage}% | Achieved: ${attS5.clos[0].achieved}`);
        console.log(`DB PLO% : ${attS5.plos[0].percentage}% | Achieved: ${attS5.plos[0].achieved}`);
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
};

runVerification();
