import 'dotenv/config';
import mongoose from 'mongoose';
import { User, CourseOffering, StudentAttainment } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);

const teacher = await User.findOne({ role: 'Teacher' });
const offerings = await CourseOffering.find({ teacher: teacher._id }).lean();
console.log('Teacher offerings:', offerings.length, offerings.map(o => o._id));

const offeringIds = offerings.map(o => o._id);
const attainments = await StudentAttainment.find({ courseOffering: { $in: offeringIds } })
    .populate('clos.clo', 'code')
    .populate('plos.plo', 'code')
    .lean();
console.log('Attainments:', attainments.length);

const cloAggMap = {};
const ploAggMap = {};
attainments.forEach(att => {
    (att.clos || []).forEach(c => {
        const code = c.clo?.code || 'CLO';
        if (!cloAggMap[code]) cloAggMap[code] = { sum: 0, count: 0 };
        cloAggMap[code].sum += c.percentage;
        cloAggMap[code].count++;
    });
    (att.plos || []).forEach(p => {
        const code = p.plo?.code || 'PLO';
        if (!ploAggMap[code]) ploAggMap[code] = { sum: 0, count: 0 };
        ploAggMap[code].sum += p.percentage;
        ploAggMap[code].count++;
    });
});

console.log('cloAggMap:', cloAggMap);
console.log('ploAggMap:', ploAggMap);

const cloAchievementGraph = Object.entries(cloAggMap).map(([clo, d]) => ({ clo, achievement: Math.round(d.sum / d.count) }));
const ploAchievementGraph = Object.entries(ploAggMap).map(([plo, d]) => ({ plo, achievement: Math.round(d.sum / d.count) }));

console.log('CLO graph:', cloAchievementGraph);
console.log('PLO graph:', ploAchievementGraph);

process.exit(0);
