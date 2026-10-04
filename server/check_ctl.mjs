import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import CourseFile from './src/models/CourseFile.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const totalFiles = await CourseFile.countDocuments();
    const allFiles = await CourseFile.find().lean();
    const filesWithCTL = allFiles.filter(f => f.closingLoop && f.closingLoop.length > 0);
    
    const sample = filesWithCTL[0];
    if (sample) {
        console.log('Sample closingLoop entry:', JSON.stringify(sample.closingLoop[0], null, 2));
    } else {
        console.log('No Course Files with closingLoop data yet');
    }
    
    console.log('Total Course Files:', totalFiles);
    console.log('Files with Closing Loop entries:', filesWithCTL.length);
    process.exit(0);
});
