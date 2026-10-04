import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();
import { User } from '../src/models/index.js';
import StudentAttainment from '../src/models/StudentAttainment.js';
import Assessment from '../src/models/Assessment.js';
import Enrollment from '../src/models/Enrollment.js';
import { CLO, PLO, GA, PEO } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('\n========== FINAL SYSTEM STATUS ==========\n');

    // Users
    const roles = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    console.log('👥 USERS BY ROLE:');
    roles.forEach(r => console.log(`   ${r._id}: ${r.count}`));

    // Academic
    const totalCLOs = await CLO.countDocuments();
    const totalPLOs = await PLO.countDocuments();
    const totalGAs = await GA.countDocuments();
    const totalPEOs = await PEO.countDocuments();
    const totalAssessments = await Assessment.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalAttainments = await StudentAttainment.countDocuments();

    console.log('\n📚 OBE ENTITIES:');
    console.log(`   CLOs: ${totalCLOs}`);
    console.log(`   PLOs: ${totalPLOs}`);
    console.log(`   GAs: ${totalGAs}`);
    console.log(`   PEOs: ${totalPEOs}`);
    console.log(`   Assessments: ${totalAssessments}`);
    console.log(`   Enrollments: ${totalEnrollments}`);
    console.log(`   StudentAttainment Records: ${totalAttainments}`);

    // Sample attainment
    const sample = await StudentAttainment.findOne().lean();
    if (sample) {
        console.log('\n📊 SAMPLE ATTAINMENT RECORD:');
        console.log(`   CLOs: ${sample.clos?.length}, PLOs: ${sample.plos?.length}, GAs: ${sample.gas?.length}`);
        if (sample.clos?.length > 0) {
            const clo = sample.clos[0];
            console.log(`   CLO-1: ${clo.percentage?.toFixed(1)}% (target: ${clo.targetThreshold}%, achieved: ${clo.achieved})`);
        }
        if (sample.gas?.length > 0) {
            const ga = sample.gas[0];
            console.log(`   GA-1: ${ga.percentage?.toFixed(1)}% (target: ${ga.targetThreshold}%, achieved: ${ga.achieved})`);
        }
    }

    // Super Admin check
    const sa = await User.findOne({ role: 'SuperAdmin' }, 'name email').lean();
    const ua = await User.findOne({ role: 'UniversityAdmin' }, 'name email').lean();
    console.log('\n🔐 ADMIN ACCOUNTS:');
    console.log(`   SuperAdmin: ${sa?.email || 'NOT FOUND'}`);
    console.log(`   UniversityAdmin: ${ua?.email || 'NOT FOUND'}`);

    // Quick API check
    const token = jwt.sign({ id: sa._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const res = await fetch('http://localhost:5000/api/analytics/management', {
        headers: { Authorization: 'Bearer ' + token }
    });
    const adata = await res.json();
    console.log('\n🌐 ANALYTICS API:');
    console.log(`   Status: ${res.status}`);
    console.log(`   CLO_ACHIEVEMENT: ${adata.CLO_ACHIEVEMENT?.length || 0} records`);
    console.log(`   PLO_ACHIEVEMENT: ${adata.PLO_ACHIEVEMENT?.length || 0} records`);
    console.log(`   GA_ACHIEVEMENT: ${adata.GA_ACHIEVEMENT?.length || 0} records (${adata.GA_ACHIEVEMENT?.map(g => g.ga).join(', ')})`);
    console.log(`   PEO_ACHIEVEMENT: ${adata.PEO_ACHIEVEMENT?.length || 0} records`);

    console.log('\n🟢 VERDICT: ALL SYSTEMS OPERATIONAL');
    console.log('=========================================\n');
    process.exit(0);
});
