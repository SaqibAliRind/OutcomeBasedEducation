/**
 * cleanup_snapshots.cjs
 * Removes invalid test snapshots and creates one clean baseline snapshot via API
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const jwt = require('jsonwebtoken');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Delete all test snapshots (they have bad data with 715%)
    const del = await db.collection('obesnapshots').deleteMany({});
    console.log('Deleted', del.deletedCount, 'bad snapshots');

    // Get SuperAdmin token for API call
    const admin = await db.collection('users').findOne({ role: 'SuperAdmin' });
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await mongoose.disconnect();

    // Create clean Snapshot #1 via API
    const r = await fetch('http://localhost:5000/api/obe/archive/6abf8e017d60f1804ea446c5', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Fall 2024 Baseline — CLO avg 62%' })
    });
    const d = await r.json();
    console.log('Snapshot #1 created:');
    console.log('  ID:', d.snapshot?._id);
    console.log('  Version:', d.snapshot?.version);
    console.log('  CLO avg:', d.snapshot?.avgCloAchievement + '%');
    console.log('  PLO avg:', d.snapshot?.avgPloAchievement + '%');
    console.log('  Students:', d.snapshot?.totalStudents);
    console.log('  Pass rate:', d.snapshot?.passRate + '%');
    console.log('  Target (CLO):', d.snapshot?.cloTargetUsed + '%');
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
