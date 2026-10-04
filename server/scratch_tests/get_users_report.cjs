/**
 * get_users_report.cjs
 * Lists all users with roles, emails, and checks DB collections counts
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const users = await db.collection('users').find({}).sort({ role: 1, name: 1 }).toArray();
    const universities = await db.collection('universities').find({}).toArray();
    const departments = await db.collection('departments').find({}).toArray();
    const programs = await db.collection('programs').find({}).toArray();
    const courses = await db.collection('courses').find({}).toArray();
    const students = users.filter(u => u.role === 'Student');

    console.log('\n=== UNIVERSITY ===');
    for (const u of universities) console.log(' ', u.name, '| Domain:', u.domain || 'N/A');

    console.log('\n=== USERS BY ROLE ===');
    const roleGroups = {};
    for (const u of users) {
        if (!roleGroups[u.role]) roleGroups[u.role] = [];
        roleGroups[u.role].push(u);
    }
    for (const [role, members] of Object.entries(roleGroups)) {
        console.log(`\n[${role}] (${members.length})`);
        for (const u of members.slice(0, 5)) {
            console.log(`  Name: ${u.name} | Email: ${u.email} | ID: ${u._id.toString().slice(-6)}`);
        }
        if (members.length > 5) console.log(`  ... and ${members.length - 5} more`);
    }

    console.log('\n=== COLLECTION COUNTS ===');
    const collections = ['users','universities','departments','programs','courses',
        'courseofferings','enrollments','assessments','marks','studentattainments',
        'clos','plos','gas','peos','questionmappings','blueprints','obesnapshots',
        'obetargets','coursefiles'];
    for (const col of collections) {
        const count = await db.collection(col).countDocuments();
        console.log(`  ${col}: ${count}`);
    }

    await mongoose.disconnect();
}
main().catch(console.error);
