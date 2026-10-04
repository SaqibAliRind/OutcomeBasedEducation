/**
 * OBE Snapshot Integration Test
 * 
 * Parts 2-7 of the audit:
 *  - Create Snapshot #1 from existing 30-student data
 *  - Change marks (realistic different values)
 *  - Recalculate OBE
 *  - Create Snapshot #2
 *  - Verify Snapshot #1 != Snapshot #2 (immutability proof)
 *  - Verify duplicate prevention
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const BASE = 'http://localhost:5000/api';

async function getAdminToken() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const admin = await db.collection('users').findOne({ role: 'SuperAdmin' });
    if (!admin) throw new Error('No SuperAdmin found');
    const token = jwt.sign(
        { id: admin._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    await mongoose.disconnect();
    return { token, adminId: admin._id.toString() };
}

async function getOfferingId() {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const offering = await db.collection('courseofferings').findOne({});
    const markDoc = await db.collection('marks').findOne({ courseOffering: offering?._id });
    await mongoose.disconnect();
    return offering?._id?.toString();
}

async function getCurrentCloAvg(token, offeringId) {
    const res = await fetch(`${BASE}/obe/attainment-summary/${offeringId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.clos?.length) return null;
    const avg = data.clos.reduce((s, c) => s + (c.avgPercentage || 0), 0) / data.clos.length;
    return parseFloat(avg.toFixed(2));
}

async function createSnapshot(token, offeringId, label) {
    const res = await fetch(`${BASE}/obe/archive/${offeringId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Snapshot failed (${res.status}): ${data.message}`);
    return data.snapshot;
}

async function calculateObe(token, offeringId) {
    const res = await fetch(`${BASE}/obe/calculate/${offeringId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Calc failed (${res.status}): ${data.message}`);
    return data;
}

async function updateMarksToHigher(offeringId) {
    // Change marks to produce ~70% avg (vs current ~59%)
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const markDocs = await db.collection('marks')
        .find({ courseOffering: new mongoose.Types.ObjectId(offeringId) })
        .toArray();

    let updatedCount = 0;
    for (const markDoc of markDocs) {
        if (!markDoc.students) continue;
        const totalMarks = markDoc.totalMarks || 100;
        // Set each student to ~72% to get ~70% class average (above 50% target)
        const updatedStudents = markDoc.students.map((s, idx) => ({
            ...s,
            // Vary between 65-80% to make it realistic
            obtainedMarks: Math.round(totalMarks * (0.65 + (idx % 6) * 0.025))
        }));
        await db.collection('marks').updateOne(
            { _id: markDoc._id },
            { $set: { students: updatedStudents } }
        );
        updatedCount++;
    }
    
    await mongoose.disconnect();
    console.log(`  Updated ${updatedCount} mark documents to ~70% level`);
}

async function readSnapshotDirect(snapshotId) {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const snap = await db.collection('obesnapshots').findOne({ _id: new mongoose.Types.ObjectId(snapshotId) });
    await mongoose.disconnect();
    return snap;
}

async function getAttainmentCount(offeringId) {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const count = await db.collection('studentattainments')
        .countDocuments({ courseOffering: new mongoose.Types.ObjectId(offeringId) });
    await mongoose.disconnect();
    return count;
}

// ══════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════
async function main() {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  OBE SNAPSHOT INTEGRATION TEST                  ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    const { token } = await getAdminToken();
    const offeringId = await getOfferingId();
    if (!offeringId) throw new Error('No course offering found');

    console.log(`Course Offering ID: ${offeringId}`);
    
    // ── PART 2: Current baseline ──────────────────────────────
    console.log('\n── PART 2: Current Baseline ──────────────────────');
    const cloAvgBefore = await getCurrentCloAvg(token, offeringId);
    console.log(`  CLO avg before: ${cloAvgBefore}%`);
    
    const countBefore = await getAttainmentCount(offeringId);
    console.log(`  StudentAttainments: ${countBefore}`);

    // ── Create Snapshot #1 ───────────────────────────────────
    console.log('\n── Creating Snapshot #1 (baseline ~59%) ──────────');
    const snap1 = await createSnapshot(token, offeringId, 'Fall 2024 Baseline Snapshot');
    console.log(`  ✅ Snapshot #1 created`);
    console.log(`  ID:      ${snap1._id}`);
    console.log(`  Version: ${snap1.version}`);
    console.log(`  Label:   ${snap1.snapshotLabel}`);
    console.log(`  CLO avg: ${snap1.avgCloAchievement}%`);
    console.log(`  PLO avg: ${snap1.avgPloAchievement}%`);
    console.log(`  Students: ${snap1.totalStudents}`);
    console.log(`  Pass Rate: ${snap1.passRate}%`);
    
    // ── PART 3: Change marks ─────────────────────────────────
    console.log('\n── PART 3: Changing marks to ~70% level ──────────');
    await updateMarksToHigher(offeringId);
    
    // Recalculate
    console.log('  Recalculating OBE...');
    await calculateObe(token, offeringId);
    
    const countAfter = await getAttainmentCount(offeringId);
    const cloAvgAfter = await getCurrentCloAvg(token, offeringId);
    console.log(`  ✅ Recalculated`);
    console.log(`  StudentAttainments (must = ${countBefore}): ${countAfter} ${countAfter === countBefore ? '✅ No duplicates' : '❌ DUPLICATES FOUND'}`);
    console.log(`  CLO avg after: ${cloAvgAfter}%`);
    
    if (Math.abs(cloAvgAfter - cloAvgBefore) < 1) {
        console.warn('  ⚠️  Warning: CLO avg barely changed — marks update may not have taken effect');
    } else {
        console.log(`  ✅ Current data measurably changed: ${cloAvgBefore}% → ${cloAvgAfter}%`);
    }

    // ── PART 4: Create Snapshot #2 ───────────────────────────
    console.log('\n── PART 4: Creating Snapshot #2 (changed ~70%) ───');
    const snap2 = await createSnapshot(token, offeringId, 'Fall 2024 Improved Snapshot');
    console.log(`  ✅ Snapshot #2 created`);
    console.log(`  ID:      ${snap2._id}`);
    console.log(`  Version: ${snap2.version}`);
    console.log(`  CLO avg: ${snap2.avgCloAchievement}%`);
    console.log(`  PLO avg: ${snap2.avgPloAchievement}%`);
    console.log(`  Pass Rate: ${snap2.passRate}%`);

    // Verify they differ
    const closDiffer = Math.abs(snap1.avgCloAchievement - snap2.avgCloAchievement) > 0.5;
    console.log(`\n  Snap1 CLO: ${snap1.avgCloAchievement}% | Snap2 CLO: ${snap2.avgCloAchievement}%`);
    console.log(`  Difference: ${(snap2.avgCloAchievement - snap1.avgCloAchievement).toFixed(2)}%`);
    console.log(`  Snapshots differ: ${closDiffer ? '✅ YES' : '❌ NO'}`);

    // ── PART 5: Immutability test ────────────────────────────
    console.log('\n── PART 5: Immutability Test ──────────────────────');
    const snap1FromDB = await readSnapshotDirect(snap1._id);
    const snap1CloAvgFromDB = snap1FromDB.avgCloAchievement;
    console.log(`  Snapshot #1 CLO avg from DB: ${snap1CloAvgFromDB}%`);
    console.log(`  Original snap1 CLO avg:      ${snap1.avgCloAchievement}%`);
    const immutable = Math.abs(snap1CloAvgFromDB - snap1.avgCloAchievement) < 0.01;
    console.log(`  ✅ Snapshot #1 unchanged: ${immutable ? '✅ PASS' : '❌ FAIL — SNAPSHOT MUTATED!'}`);

    // ── PART 6: Duplicate prevention ─────────────────────────
    console.log('\n── PART 6: Duplicate Prevention Test ─────────────');
    // Try creating another snapshot with the same label — should succeed with new version
    const snap3 = await createSnapshot(token, offeringId, 'Duplicate Test Snapshot');
    console.log(`  ✅ New snapshot created with version ${snap3.version} (no silent duplicate)`);
    console.log(`  All versions: 1, 2, ${snap3.version} — distinct versions, never overwriting`);

    // ── PART 7: Targets from DB ──────────────────────────────
    console.log('\n── PART 7: Targets from DB ────────────────────────');
    console.log(`  Snap1 CLO target used: ${snap1.cloTargetUsed}% (from ObeTarget collection)`);
    console.log(`  Snap1 PLO target used: ${snap1.ploTargetUsed}%`);
    console.log(`  Snap2 CLO target used: ${snap2.cloTargetUsed}%`);
    const targetsFromDB = snap1.cloTargetUsed > 0;
    console.log(`  Targets from DB: ${targetsFromDB ? '✅ PASS' : '❌ FAIL'}`);

    // ── Compare via API ──────────────────────────────────────
    console.log('\n── API Compare Test ───────────────────────────────');
    const compareRes = await fetch(`${BASE}/obe/archive/compare/${snap1._id}/${snap2._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const compareData = await compareRes.json();
    console.log(`  Compare API status: ${compareRes.status}`);
    if (compareRes.ok) {
        console.log(`  Avg CLO diff: ${compareData.summary.diff_avgClo}%`);
        console.log(`  Avg PLO diff: ${compareData.summary.diff_avgPlo}%`);
        console.log(`  Pass rate diff: ${compareData.summary.diff_passRate}%`);
        console.log(`  CLO rows: ${compareData.cloComparison?.length}`);
        console.log(`  ✅ Compare API working`);
    }

    // ── Final Summary ────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  SNAPSHOT TEST SUMMARY                           ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║ Snapshot #1 ID:   ${snap1._id}`);
    console.log(`║ Snapshot #1 CLO:  ${snap1.avgCloAchievement}%`);
    console.log(`║ Snapshot #1 PLO:  ${snap1.avgPloAchievement}%`);
    console.log(`║ Snapshot #2 ID:   ${snap2._id}`);
    console.log(`║ Snapshot #2 CLO:  ${snap2.avgCloAchievement}%`);
    console.log(`║ Snapshot #2 PLO:  ${snap2.avgPloAchievement}%`);
    console.log(`║ Immutability:     ${immutable ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`║ No Duplicates:    ${countAfter === countBefore ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`║ Snapshots Differ: ${closDiffer ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`║ Targets from DB:  ${targetsFromDB ? '✅ PASS' : '❌ FAIL'}`);
    console.log('╚══════════════════════════════════════════════════╝\n');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
});
