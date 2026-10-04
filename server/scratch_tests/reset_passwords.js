import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();
import { User } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const hash = await bcrypt.hash('325531167', 10);
    await User.updateMany({ role: { $ne: 'SuperAdmin' } }, { password: hash });
    console.log('All other users password reset to 325531167');
    process.exit(0);
});
