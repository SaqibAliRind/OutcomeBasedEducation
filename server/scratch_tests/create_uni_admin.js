import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();
import { User, University } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const uni = await University.findOne().lean();
    if (!uni) { console.log('No university found'); process.exit(1); }
    
    const passwordHash = await bcrypt.hash('325531167', 10);
    
    // Check if already exists
    const existing = await User.findOne({ email: 'uniadmin@test.com' });
    if (existing) {
        console.log('UniversityAdmin already exists:', existing.email);
        process.exit(0);
    }
    
    const uniAdmin = await User.create({
        name: 'University Admin',
        email: 'uniadmin@test.com',
        password: passwordHash,
        role: 'UniversityAdmin',
        university: uni._id,
        isActive: true,
        isDeleted: false
    });
    
    console.log('✅ UniversityAdmin created:', uniAdmin.email, '| Password: 325531167');
    process.exit(0);
});
