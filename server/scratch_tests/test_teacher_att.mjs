import 'dotenv/config';
import mongoose from 'mongoose';
import { CourseOffering, StudentAttainment, User } from '../src/models/index.js';

await mongoose.connect(process.env.MONGO_URI);
const teacher = await User.findOne({ role: 'Teacher' });
const offerings = await CourseOffering.find({ teacher: teacher._id }).lean();
console.log('Teacher offerings:', offerings.length);
const offeringIds = offerings.map(o => o._id);
const attainments = await StudentAttainment.find({ courseOffering: { $in: offeringIds } })
        .populate('clos.clo', 'code')
        .populate('plos.plo', 'code')
        .lean();
console.log('Teacher attainments:', attainments.length);
if (attainments.length > 0) {
    console.log('CLO 0 code:', attainments[0].clos[0]?.clo?.code);
}
process.exit(0);
