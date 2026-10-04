import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: 'd:/Al-Kawthar/server/.env' });

async function verifyObe() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  
  // 1. Generate Admin Token with a real user ID
  const superAdmin = await mongoose.connection.db.collection('users').findOne({ role: 'SuperAdmin' });
  if (!superAdmin) throw new Error('No SuperAdmin found');
  const token = jwt.sign({ id: superAdmin._id, role: 'SuperAdmin', name: superAdmin.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const courseOfferingId = '6abf8e017d60f1804ea446c5'; // Hardcoded from previous script

  // 2. Trigger OBE Calculation
  console.log('Triggering OBE Calculation (Attempt 1)...');
  const calcRes = await fetch(`http://localhost:5000/api/obe/calculate/${courseOfferingId}`, {
      method: 'POST',
      headers
  });
  const data1 = await calcRes.json();
  console.log('Calculation Status:', data1.message);

  // 3. Verify no duplicates in DB
  const attainmentsCount = await mongoose.connection.db.collection('studentattainments').countDocuments({ courseOffering: new mongoose.Types.ObjectId(courseOfferingId) });
  console.log(`Student Attainments Created: ${attainmentsCount}`);

  // Trigger again to verify duplicate prevention
  console.log('Triggering OBE Calculation (Attempt 2)...');
  await fetch(`http://localhost:5000/api/obe/calculate/${courseOfferingId}`, {
      method: 'POST',
      headers
  });
  const attainmentsCount2 = await mongoose.connection.db.collection('studentattainments').countDocuments({ courseOffering: new mongoose.Types.ObjectId(courseOfferingId) });
  console.log(`Student Attainments After Re-calc: ${attainmentsCount2} (Should be same)`);

  // 4. Archive Snapshot 1
  console.log('Finalizing/Archiving Snapshot 1...');
  
  process.exit(0);
}

verifyObe().catch(err => {
    console.error(err.response?.data || err.message);
    process.exit(1);
});
