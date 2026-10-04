import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/index.js';
import Teacher from '../src/models/Teacher.js';

await mongoose.connect(process.env.MONGO_URI);

const teacherUser = await User.findOne({ role: 'Teacher' });
console.log('Teacher user ID:', teacherUser._id);

const teacherProfile = await Teacher.findOne({ user: teacherUser._id });
console.log('Teacher profile exists:', !!teacherProfile);

if (!teacherProfile) {
    // Create one
    const created = await Teacher.create({ user: teacherUser._id });
    console.log('Created teacher profile:', created._id);
}

process.exit(0);
