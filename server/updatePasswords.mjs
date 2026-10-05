import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
const newHash = await bcrypt.hash('325531167', 10);
const result = await mongoose.connection.db.collection('users').updateMany({}, { $set: { password: newHash } });
console.log('Updated', result.modifiedCount, 'user passwords to 325531167');
await mongoose.disconnect();
