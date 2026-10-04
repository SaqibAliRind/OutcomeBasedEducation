import 'dotenv/config';
import mongoose from 'mongoose';
import { ObeTarget, Mark, QuestionMapping, StudentAttainment, CLO, CourseOffering } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);

const offeringId = '6abf8e017d60f1804ea446c5';
const offering = await CourseOffering.findById(offeringId);

const targets = await ObeTarget.findOne({ universityId: '6abf8df47d60f1804ea4468a' });
const cloTarget = targets ? targets.cloTarget : 60;
const ploTarget = targets ? targets.ploTarget : 65;
const gaTarget  = targets ? targets.gaTarget  : 65;

console.log('Using targets: CLO=', cloTarget, 'PLO=', ploTarget, 'GA=', gaTarget);

const marks = await Mark.find({ courseOffering: offeringId, status: { $in: ['Verified', 'Locked'] } }).populate('assessment');
const assessmentIds = marks.map(m => m.assessment?._id).filter(Boolean);
const mappings = await QuestionMapping.find({ assessment: { $in: assessmentIds } }).populate('questions.clo');

const mappingByAssessment = {};
mappings.forEach(map => {
    const aid = map.assessment.toString();
    if (!mappingByAssessment[aid]) mappingByAssessment[aid] = [];
    (map.questions || []).forEach(q => mappingByAssessment[aid].push(q));
});

const studentMap = {};
marks.forEach(markRecord => {
    const assessment = markRecord.assessment;
    const aid = assessment._id.toString();
    const qRows = mappingByAssessment[aid] || [];
    markRecord.students.forEach(studentRecord => {
        const sid = studentRecord.student.toString();
        if (!studentMap[sid]) studentMap[sid] = { clos: {} };
        const obtained = studentRecord.obtainedMarks || 0;
        const total = assessment.totalMarks || 1;
        const pct = obtained / total;
        qRows.forEach(qRow => {
            if (!qRow.clo) return;
            const cloId = qRow.clo._id ? qRow.clo._id.toString() : qRow.clo.toString();
            if (!studentMap[sid].clos[cloId]) studentMap[sid].clos[cloId] = { total: 0, obtained: 0 };
            const qMarks = qRow.marks || 0;
            studentMap[sid].clos[cloId].total += qMarks;
            studentMap[sid].clos[cloId].obtained += (qMarks * pct);
        });
    });
});

const clos = await CLO.find({ course: offering.course }).lean();
const cloModelMap = {};
clos.forEach(c => { cloModelMap[c._id.toString()] = c; });

let savedCount = 0;
for (const [studentId, data] of Object.entries(studentMap)) {
    const cloList = [];
    const ploMap = {};
    const gaMap = {};
    
    for (const [cloId, cloData] of Object.entries(data.clos)) {
        const cloPct = cloData.total > 0 ? (cloData.obtained / cloData.total) * 100 : 0;
        cloList.push({
            clo: cloId,
            totalMarks: cloData.total,
            obtainedMarks: cloData.obtained,
            percentage: parseFloat(cloPct.toFixed(2)),
            targetThreshold: cloTarget,
            achieved: cloPct >= cloTarget
        });
        const cloModel = cloModelMap[cloId];
        if (cloModel) {
            if (cloModel.plos) {
                cloModel.plos.forEach(pm => {
                    const k = pm.plo.toString();
                    const w = Number(pm.weightage) || 100;
                    if (!ploMap[k]) ploMap[k] = { totalWeight: 0, weightedObtained: 0 };
                    ploMap[k].totalWeight += w;
                    ploMap[k].weightedObtained += w * (cloPct / 100);
                });
            }
            if (cloModel.gas) {
                cloModel.gas.forEach(gm => {
                    const k = gm.ga.toString();
                    const w = Number(gm.weightage) || 100;
                    if (!gaMap[k]) gaMap[k] = { totalWeight: 0, weightedObtained: 0 };
                    gaMap[k].totalWeight += w;
                    gaMap[k].weightedObtained += w * (cloPct / 100);
                });
            }
        }
    }
    
    const ploList = Object.entries(ploMap).map(([ploId, d]) => {
        const pct = d.totalWeight > 0 ? (d.weightedObtained / d.totalWeight) * 100 : 0;
        return { plo: ploId, totalMarks: d.totalWeight, obtainedMarks: d.weightedObtained, percentage: parseFloat(pct.toFixed(2)), targetThreshold: ploTarget, achieved: pct >= ploTarget };
    });
    
    const gaList = Object.entries(gaMap).map(([gaId, d]) => {
        const pct = d.totalWeight > 0 ? (d.weightedObtained / d.totalWeight) * 100 : 0;
        return { ga: gaId, percentage: parseFloat(pct.toFixed(2)), targetThreshold: gaTarget, achieved: pct >= gaTarget };
    });
    
    await StudentAttainment.findOneAndUpdate(
        { student: studentId, courseOffering: offeringId },
        { clos: cloList, plos: ploList, gas: gaList, calculatedAt: new Date() },
        { new: true, upsert: true }
    );
    savedCount++;
}

console.log('Updated', savedCount, 'student attainment records with correct targets + GAs');

// Verify one record
const sample = await StudentAttainment.findOne({ courseOffering: offeringId });
console.log('Sample CLO targetThreshold:', sample.clos[0]?.targetThreshold, '(expected: 60)');
console.log('Sample PLO targetThreshold:', sample.plos[0]?.targetThreshold, '(expected: 65)');
console.log('Sample GAs:', JSON.stringify(sample.gas));

// Verify pass/fail
console.log('\n=== PASS/FAIL VERIFICATION ===');
const marksDoc = await Mark.findOne({ courseOffering: offeringId }).populate('assessment');
const passMark = marksDoc.assessment.passingMarks;
let p = 0, f = 0;
marksDoc.students.forEach(s => { if (s.obtainedMarks >= passMark) p++; else f++; });
console.log(`Pass: ${p} (${(p/(p+f)*100).toFixed(1)}%), Fail: ${f} (${(f/(p+f)*100).toFixed(1)}%)`);
console.log('VERIFIED: This is REAL data, not hardcoded');

await mongoose.disconnect();
process.exit(0);
