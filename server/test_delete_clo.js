import 'dotenv/config';
import mongoose from 'mongoose';
import { CLO } from './src/models/index.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  try {
      const clo = await CLO.findOne({});
      if (clo) {
          console.log('Attempting to delete CLO:', clo._id);
          await CLO.findByIdAndDelete(clo._id);
          console.log('Deleted successfully.');
      } else {
          console.log('No CLO found to delete.');
      }
  } catch (err) {
      console.error('Error during deletion:', err);
  }

  process.exit(0);
}

run().catch(console.error);
