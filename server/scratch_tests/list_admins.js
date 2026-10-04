import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const roles = ['SuperAdmin', 'UniversityAdmin'];
    const admins = await User.find({ role: { $in: roles } }, 'name email role').lean();
    console.log('Admin users:', JSON.stringify(admins, null, 2));
    
    const allRoles = await User.distinct('role');
    console.log('All roles in DB:', allRoles);
    process.exit(0);
});
