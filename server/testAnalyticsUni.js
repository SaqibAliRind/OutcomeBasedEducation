import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/index.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const students = await User.find({ role: 'Student' }).limit(5);
    console.log(students.map(s => ({ id: s._id, name: s.name, uni: s.university })));
    process.exit(0);
});
