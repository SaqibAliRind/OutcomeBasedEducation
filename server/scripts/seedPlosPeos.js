/**
 * Seed Script: PLOs and PEOs for BS Information Technology program
 * Run: node scripts/seedPlosPeos.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import PLO from '../src/models/PLO.js';
import PEO from '../src/models/PEO.js';
import Program from '../src/models/Program.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const PLO_DATA = [
    { code: 'PLO-1',  statement: 'Computing Knowledge',              domain: 'Cognitive',   bloomsLevel: 'Understand', description: 'Apply knowledge of computing fundamentals, mathematics, and basic IT concepts.' },
    { code: 'PLO-2',  statement: 'Problem Analysis',                 domain: 'Cognitive',   bloomsLevel: 'Analyze',    description: 'Identify, analyze, and define computing problems using appropriate principles and techniques.' },
    { code: 'PLO-3',  statement: 'Design/Development of Solutions',  domain: 'Cognitive',   bloomsLevel: 'Create',     description: 'Design and develop computing-based solutions that satisfy specified requirements.' },
    { code: 'PLO-4',  statement: 'Modern Tool Usage',                domain: 'Psychomotor', bloomsLevel: 'Apply',      description: 'Select and use appropriate tools, technologies, and techniques for IT-related tasks.' },
    { code: 'PLO-5',  statement: 'Individual and Team Work',         domain: 'Affective',   bloomsLevel: 'Apply',      description: 'Work effectively as an individual and as a member or leader of a team.' },
    { code: 'PLO-6',  statement: 'Communication',                    domain: 'Affective',   bloomsLevel: 'Apply',      description: 'Communicate effectively with technical and non-technical audiences through appropriate methods.' },
    { code: 'PLO-7',  statement: 'Professionalism and Ethics',       domain: 'Affective',   bloomsLevel: 'Evaluate',   description: 'Apply professional, ethical, legal, and social responsibilities in computing practice.' },
    { code: 'PLO-8',  statement: 'Life-long Learning',               domain: 'Affective',   bloomsLevel: 'Evaluate',   description: 'Recognize the need for continuous learning and adapt to emerging technologies.' },
    { code: 'PLO-9',  statement: 'Project Management',               domain: 'Cognitive',   bloomsLevel: 'Evaluate',   description: 'Apply project management principles to plan, organize, and manage IT projects.' },
    { code: 'PLO-10', statement: 'Information and Data Management',  domain: 'Cognitive',   bloomsLevel: 'Apply',      description: 'Apply appropriate techniques to collect, manage, store, secure, and analyze information and data.' },
    { code: 'PLO-11', statement: 'Computing Practice',               domain: 'Cognitive',   bloomsLevel: 'Analyze',    description: 'Analyze and apply computing principles to develop and maintain reliable IT systems.' },
    { code: 'PLO-12', statement: 'Innovation and Entrepreneurship',  domain: 'Cognitive',   bloomsLevel: 'Create',     description: 'Develop innovative technology-based ideas and solutions considering organizational and societal needs.' },
];

const PEO_DATA = [
    { code: 'PEO-1', title: 'Technical Excellence', description: 'Graduates will apply computing and information technology knowledge to solve real-world problems and develop effective IT solutions.' },
    { code: 'PEO-2', title: 'Professional Conduct',  description: 'Graduates will demonstrate professional communication, teamwork, leadership, ethical conduct, and social responsibility.' },
    { code: 'PEO-3', title: 'Continuous Growth',     description: 'Graduates will pursue continuous professional development and adapt to emerging technologies throughout their careers.' },
    { code: 'PEO-4', title: 'Innovation and Impact', description: 'Graduates will contribute to innovation, entrepreneurship, and technology-driven solutions for industry and society.' },
];

const PLO_TO_PEO = {
    'PEO-1': ['PLO-1','PLO-2','PLO-3','PLO-4','PLO-10','PLO-11'],
    'PEO-2': ['PLO-5','PLO-6','PLO-7','PLO-9'],
    'PEO-3': ['PLO-8','PLO-11'],
    'PEO-4': ['PLO-3','PLO-4','PLO-9','PLO-12'],
};

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const programs = await Program.find({}).limit(10).lean();
    if (!programs.length) { console.error('No programs found.'); process.exit(1); }

    console.log('\nAvailable Programs:');
    programs.forEach((p, i) => console.log(`  [${i}] ${p.name} (${p._id})`));

    const prog = programs.find(p => /information technology|bs it/i.test(p.name)) || programs[0];
    console.log(`\nSeeding into: "${prog.name}" (${prog._id})\n`);

    const ploMap = {};
    for (const plo of PLO_DATA) {
        let doc = await PLO.findOne({ code: plo.code, program: prog._id });
        if (!doc) { doc = await PLO.create({ ...plo, program: prog._id, status: 'Active' }); console.log(`Created ${plo.code}`); }
        else console.log(`Skipped ${plo.code} (exists)`);
        ploMap[plo.code] = doc._id;
    }

    const peoMap = {};
    for (const peo of PEO_DATA) {
        let doc = await PEO.findOne({ code: peo.code, program: prog._id });
        if (!doc) { doc = await PEO.create({ ...peo, program: prog._id, status: 'Active' }); console.log(`Created ${peo.code}`); }
        else console.log(`Skipped ${peo.code} (exists)`);
        peoMap[peo.code] = doc._id;
    }

    for (const [peoCode, ploList] of Object.entries(PLO_TO_PEO)) {
        if (!peoMap[peoCode]) continue;
        for (const ploCode of ploList) {
            if (ploMap[ploCode]) await PLO.findByIdAndUpdate(ploMap[ploCode], { $addToSet: { peos: peoMap[peoCode] } });
        }
    }
    console.log('\nPLO-PEO mappings updated. Done!');
    process.exit(0);
}

seed().catch(err => { console.error('Error:', err.message); process.exit(1); });
