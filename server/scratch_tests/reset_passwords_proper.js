import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const users = await User.find();
        for (const user of users) {
            if (user.role === 'SuperAdmin') {
                user.password = 'admin123';
            } else {
                user.password = '325531167';
            }
            await user.save();
        }
        console.log('All passwords forcefully reset and re-hashed via Mongoose hook.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
