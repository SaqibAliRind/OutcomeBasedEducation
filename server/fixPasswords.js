/**
 * Fix password hashing for all seeded users
 * The original seed double-hashed passwords (passed pre-hashed to create() which hashed again)
 * This script resets ALL seeded user passwords to plaintext 'Password@123'
 * so the User.pre('save') hook hashes it correctly ONCE.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './src/models/index.js';

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected.');

    const seededEmails = [
        'dean.fcit@alkawthar.edu', 'dean.fe@alkawthar.edu', 'dean.fba@alkawthar.edu',
        'hod.dit@alkawthar.edu', 'hod.dcs@alkawthar.edu', 'hod.dee@alkawthar.edu',
        'coord.bsit@alkawthar.edu', 'coord.bscs@alkawthar.edu',
        'qec@alkawthar.edu',
        ...Array.from({ length: 8 }, (_, i) => `teacher${i+1}@alkawthar.edu`),
        ...Array.from({ length: 25 }, (_, i) => `student${i+1}@alkawthar.edu`)
    ];

    let fixed = 0;
    for (const email of seededEmails) {
        const user = await User.findOne({ email });
        if (user) {
            // Setting password and saving will trigger pre('save') which hashes it once
            user.password = '325531167';
            await user.save();
            fixed++;
        } else {
            console.log(`  Not found: ${email}`);
        }
    }

    // Also fix the UniversityAdmin users
    const admins = await User.find({ role: { $in: ['UniversityAdmin', 'SuperAdmin'] } });
    for (const a of admins) {
        if (a.email === 'admin@alkawthar.com') {
            a.password = '325531167';
            await a.save();
            fixed++;
            console.log(`  Fixed admin: ${a.email}`);
            continue;
        }
        a.password = '325531167';
        await a.save();
        fixed++;
        console.log(`  Fixed admin: ${a.email}`);
    }

    console.log(`\n✅ Password fix complete. Fixed ${fixed} users.`);
    console.log('All seeded users can now login with: 325531167');
    await mongoose.disconnect();
    process.exit(0);
};

run().catch(e => {
    console.error('Fix failed:', e.message);
    process.exit(1);
});
