import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User, Program, Department } from './src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const ditProg = await Program.findOne({ code: 'BSIT' }).lean();
    
    if (ditProg) {
        const result = await User.updateMany(
            { role: 'Student' }, 
            { $set: { department: ditProg.department, program: ditProg._id } }
        );
        console.log(`Updated ${result.modifiedCount} students with DIT program and department!`);
    } else {
        console.log('BSIT program not found!');
    }
    
    process.exit(0);
});
