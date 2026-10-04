import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();
import { User } from '../src/models/index.js';

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const sa = await User.findOne({ role: 'SuperAdmin' }).lean();
    const token = jwt.sign({ id: sa._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const hdr = { Authorization: 'Bearer ' + token };
    const BASE = 'http://localhost:5000/api/reports';

    const endpoints = [
        'obe/clo-report',
        'obe/plo-report', 
        'obe/ga-report',
        'obe/peo-report',
        'obe/target-report',
        'obe/gap-report',
        'obe/cqi-report',
        'obe/outcome-report',
        'obe/question-bank',
        'obe/blueprint',
        'obe/question-mapping',
        'obe/bt-coverage',
        'obe/clo-coverage',
        'obe/plo-coverage',
        'obe/ga-coverage',
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(`${BASE}/${ep}`, { headers: hdr });
            const data = await res.json();
            const keys = Object.keys(data);
            const hasData = keys.some(k => Array.isArray(data[k]) ? data[k].length > 0 : data[k] > 0);
            console.log(`${res.status === 200 ? '✅' : '❌'} [${res.status}] ${ep} → keys: ${keys.join(', ')} | hasData: ${hasData}`);
        } catch(e) {
            console.log(`❌ ${ep} → ERROR: ${e.message}`);
        }
    }
    process.exit(0);
});
