import { execSync } from 'child_process';
import mongoose from 'mongoose';
import 'dotenv/config';
import { User, Course } from './src/models/index.js';

const checkCounts = async (runNum) => {
    const u = await User.countDocuments();
    const c = await Course.countDocuments();
    console.log(`Run ${runNum} | Users: ${u} | Courses: ${c}`);
};

const runMulti = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Initial State:");
    await checkCounts(0);

    for(let i=1; i<=3; i++) {
        console.log(`\n--- Executing Seed Run ${i} ---`);
        execSync('node test_e2e_bsit.js', { stdio: 'ignore' });
        await checkCounts(i);
    }
    
    process.exit(0);
};

runMulti();
