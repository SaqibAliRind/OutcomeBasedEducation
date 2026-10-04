import 'dotenv/config';
import mongoose from 'mongoose';
import { ObeTarget } from './src/models/index.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const targets = await ObeTarget.find({});
  console.log('ObeTargets in DB:', JSON.stringify(targets, null, 2));

  // Perform tests
  const targetVal = targets.length > 0 ? targets[0].cloTarget : 50;
  console.log('Using targetVal:', targetVal);
  
  const tests = [50, 60, 70];
  for (const attainment of tests) {
      const achieved = attainment >= targetVal;
      console.log(`Test: Target=${targetVal}%, Attainment=${attainment}% -> Achieved=${achieved}`);
  }

  process.exit(0);
}

run().catch(console.error);
