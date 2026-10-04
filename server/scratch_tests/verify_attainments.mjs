import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  const attCount = await db.collection('studentattainments').countDocuments();
  console.log('Total StudentAttainments:', attCount);
  
  const sample = await db.collection('studentattainments').findOne();
  if (sample) {
    const cloSample = sample.clos?.[0];
    const ploSample = sample.plos?.[0];
    console.log('Sample studentId:', sample.student);
    console.log('Sample clo[0]:', JSON.stringify(cloSample));
    console.log('Sample plo[0]:', JSON.stringify(ploSample));
    console.log('Calculated At:', sample.calculatedAt);
  }
  
  // CLO averages via aggregation
  const cloCodes = await db.collection('studentattainments').aggregate([
    { $unwind: '$clos' },
    { $lookup: { from: 'clos', localField: 'clos.clo', foreignField: '_id', as: 'cloDoc' } },
    { $unwind: { path: '$cloDoc', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$cloDoc.code', avgPct: { $avg: '$clos.percentage' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 5 }
  ]).toArray();
  console.log('CLO Averages (top 5):', JSON.stringify(cloCodes));
  
  // PLO averages
  const ploCodes = await db.collection('studentattainments').aggregate([
    { $unwind: '$plos' },
    { $lookup: { from: 'plos', localField: 'plos.plo', foreignField: '_id', as: 'ploDoc' } },
    { $unwind: { path: '$ploDoc', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$ploDoc.code', avgPct: { $avg: '$plos.percentage' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  console.log('PLO Averages:', JSON.stringify(ploCodes));
  
  await mongoose.disconnect();
}
main().catch(console.error);
