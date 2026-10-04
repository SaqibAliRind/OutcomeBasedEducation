import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/index.js';
import { getHodDashboard } from '../src/controllers/hodController.js';
import { getTeacherDashboard } from '../src/controllers/teacherController.js';
import { getDeanDashboard } from '../src/controllers/deanController.js';
import { getDashboardMetrics } from '../src/controllers/dashboardController.js';

await mongoose.connect(process.env.MONGO_URI);

const hod = await User.findOne({ role: 'HOD' });
const teacher = await User.findOne({ role: 'Teacher' });
const dean = await User.findOne({ role: 'Dean' });
const admin = await User.findOne({ role: 'UniversityAdmin' });

const makeReqRes = (user, label) => {
    const req = { user };
    const res = {
        json: (data) => {
            const charts = data.charts || data.chartData || {};
            console.log(`\n=== ${label} ===`);
            console.log('CLO chart:', JSON.stringify(charts.cloAchievementGraph));
            console.log('PLO chart:', JSON.stringify(charts.ploAchievementGraph));
            console.log('Pass/Fail:', JSON.stringify(charts.passFailRatio));
            if (data.obe) {
                console.log('OBE avgCLO:', data.obe.avgCloAchievement, 'avgPLO:', data.obe.avgPloAchievement);
            }
        },
        status: () => ({ json: d => console.log(`ERROR [${label}]:`, d) })
    };
    return { req, res };
};

const hodCtx = makeReqRes(hod, 'HOD');
await getHodDashboard(hodCtx.req, hodCtx.res);

const teacherCtx = makeReqRes(teacher, 'Teacher');
await getTeacherDashboard(teacherCtx.req, teacherCtx.res);

const deanCtx = makeReqRes(dean, 'Dean');
await getDeanDashboard(deanCtx.req, deanCtx.res);

const adminCtx = makeReqRes(admin, 'Admin');
await getDashboardMetrics(adminCtx.req, adminCtx.res);

process.exit(0);
