import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/index.js';

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('325531167', salt);

        const result = await User.updateMany({}, { password: hashedPassword });
        console.log(`Password reset for ${result.modifiedCount} users to '325531167'.`);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
};

resetPasswords();
