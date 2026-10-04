/**
 * verify_passwords.cjs  
 * Verifies which password works for each user role
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const TEST_PASSWORDS = ['325531167', 'Password@123', 'admin@123'];

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Test one user per role
    const sampleUsers = [
        { email: 'admin@alkawthar.com', label: 'SuperAdmin' },
        { email: 'rindanwar390@gmail.com', label: 'UniversityAdmin' },
        { email: 'dean.fcit@alkawthar.edu', label: 'Dean' },
        { email: 'hod.dcs@alkawthar.edu', label: 'HOD' },
        { email: 'teacher1@alkawthar.edu', label: 'Teacher' },
        { email: 'student1@alkawthar.edu', label: 'Student' },
        { email: 'qec@alkawthar.edu', label: 'QEC' },
        { email: 'coord.bscs@alkawthar.edu', label: 'ProgramCoordinator' },
    ];

    console.log('\n=== PASSWORD VERIFICATION ===\n');
    for (const { email, label } of sampleUsers) {
        const user = await db.collection('users').findOne({ email });
        if (!user) { console.log(`[${label}] ${email} — NOT FOUND`); continue; }
        
        let matchedPwd = 'UNKNOWN';
        for (const pwd of TEST_PASSWORDS) {
            const match = await bcrypt.compare(pwd, user.password);
            if (match) { matchedPwd = pwd; break; }
        }
        console.log(`[${label.padEnd(20)}] ${email.padEnd(40)} → Password: ${matchedPwd}`);
    }
    
    await mongoose.disconnect();
}

main().catch(console.error);
