import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { User } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const users = await User.find().select('email role');
        console.log(users.map(u => `${u.email} - ${u.role}`).join('\n'));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
