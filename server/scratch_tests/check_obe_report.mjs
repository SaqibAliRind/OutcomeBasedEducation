import 'dotenv/config';
import mongoose from 'mongoose';
import { StudentAttainment } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);

const attainments = await StudentAttainment.find()
    .populate('clos.clo', 'code name')
    .populate('plos.plo', 'code name');

console.log("Total attainments:", attainments.length);

const cloMap = {};
const ploMap = {};

attainments.forEach(rec => {
    rec.clos.forEach(c => {
        if (!c.clo) return;
        const key = c.clo._id.toString();
        if (!cloMap[key]) cloMap[key] = { code: c.clo.code, name: c.clo.name, percentages: [] };
        cloMap[key].percentages.push(c.percentage);
    });
    rec.plos.forEach(p => {
        if (!p.plo) return;
        const key = p.plo._id.toString();
        if (!ploMap[key]) ploMap[key] = { code: p.plo.code, name: p.plo.name, percentages: [] };
        ploMap[key].percentages.push(p.percentage);
    });
});

console.log("CLO Map Keys:", Object.keys(cloMap).length);
console.log("PLO Map Keys:", Object.keys(ploMap).length);

process.exit(0);
