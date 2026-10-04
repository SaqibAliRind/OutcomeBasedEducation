import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'd:/Al-Kawthar/server/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  const db = mongoose.connection.db;
  
  // 1. Identify the 30 students
  const students = await db.collection('users').find({ role: 'Student' }).toArray();
  console.log(`Found ${students.length} students`);
  if (students.length !== 30) {
      console.log('Warning: Not exactly 30 students, found ' + students.length);
  }

  // 2. Identify the target course offering. Let's find one with high enrollment or create/pick one.
  const offerings = await db.collection('courseofferings').find({}).toArray();
  const offering = offerings[0];
  if (!offering) { throw new Error('No course offering found'); }
  console.log(`Using Course Offering: ${offering._id} (Course: ${offering.course})`);

  // Ensure all 30 students are enrolled in this offering
  for (const student of students) {
      await db.collection('enrollments').updateOne(
          { student: student._id, courseOffering: offering._id },
          { $set: { student: student._id, courseOffering: offering._id, status: 'Active' } },
          { upsert: true }
      );
  }
  const enrollmentsCount = await db.collection('enrollments').countDocuments({ courseOffering: offering._id });
  console.log(`Verified ${enrollmentsCount} enrollments for the offering.`);

  // 3. Ensure 3 CLOs exist for this course
  let clos = await db.collection('clos').find({ course: offering.course }).toArray();
  if (clos.length < 3) {
      console.log(`Creating missing CLOs. Currently has ${clos.length}`);
      for (let i = clos.length + 1; i <= 3; i++) {
          await db.collection('clos').insertOne({
              course: offering.course,
              code: `CLO-${i}`,
              description: `Description for CLO-${i}`,
              target: 60 + (i * 5), // Varying targets: 65, 70, 75
              createdAt: new Date(),
              updatedAt: new Date()
          });
      }
      clos = await db.collection('clos').find({ course: offering.course }).toArray();
  } else {
      // Ensure varying targets
      await db.collection('clos').updateOne({ _id: clos[0]._id }, { $set: { target: 60 } });
      await db.collection('clos').updateOne({ _id: clos[1]._id }, { $set: { target: 65 } });
      await db.collection('clos').updateOne({ _id: clos[2]._id }, { $set: { target: 70 } });
      clos = await db.collection('clos').find({ course: offering.course }).toArray();
  }
  console.log(`Course CLOs:`, clos.map(c => `${c.code} (target: ${c.target})`));

  // 4. Ensure PLOs exist for the Program
  const course = await db.collection('courses').findOne({ _id: offering.course });
  let plos = await db.collection('plos').find({ program: course.program }).toArray();
  console.log(`Found ${plos.length} PLOs for program`);
  if (plos.length === 0) {
      console.log('Creating PLOs');
      for (let i = 1; i <= 3; i++) {
          await db.collection('plos').insertOne({
              program: course.program,
              code: `PLO-${i}`,
              description: `Description PLO-${i}`,
              target: 60,
              createdAt: new Date()
          });
      }
      plos = await db.collection('plos').find({ program: course.program }).toArray();
  }

  // 5. Ensure CLO->PLO mappings
  await db.collection('cloplomappings').deleteMany({ course: course._id });
  await db.collection('cloplomappings').insertMany([
      { course: course._id, clo: clos[0]._id, plo: plos[0]._id, contributionLevel: 'High' },
      { course: course._id, clo: clos[1]._id, plo: plos[0]._id, contributionLevel: 'Medium' },
      { course: course._id, clo: clos[2]._id, plo: plos[1]._id, contributionLevel: 'High' }
  ]);
  console.log('Created CLO->PLO mappings');

  // 6. Ensure GAs exist and are mapped to PLOs
  let gas = await db.collection('gas').find({}).toArray();
  if (gas.length === 0) {
      console.log('Creating GAs');
      await db.collection('gas').insertMany([
          { code: 'GA-1', name: 'Engineering Knowledge', target: 60 },
          { code: 'GA-2', name: 'Problem Analysis', target: 60 }
      ]);
      gas = await db.collection('gas').find({}).toArray();
  }
  await db.collection('plogamappings').deleteMany({});
  await db.collection('plogamappings').insertMany([
      { plo: plos[0]._id, ga: gas[0]._id, mappingLevel: 'High' },
      { plo: plos[1]._id, ga: gas[1]._id, mappingLevel: 'High' }
  ]);
  console.log('Created PLO->GA mappings');

  // 7. Ensure PEOs exist (to fix PEO bug testing later)
  let peos = await db.collection('peos').find({ program: course.program }).toArray();
  if (peos.length === 0) {
      await db.collection('peos').insertMany([
          { program: course.program, code: 'PEO-1', description: 'PEO 1' },
          { program: course.program, code: 'PEO-2', description: 'PEO 2' }
      ]);
      console.log('Created 2 PEOs');
  } else {
      console.log(`Found ${peos.length} PEOs`);
  }

  // 8. Create an Assessment with questions mapped to all 3 CLOs
  await db.collection('assessments').deleteMany({ courseOffering: offering._id });
  await db.collection('questions').deleteMany({ assessment: { $in: (await db.collection('assessments').find({courseOffering: offering._id}).toArray()).map(a=>a._id) } });
  
  const assessment = {
      _id: new mongoose.Types.ObjectId(),
      courseOffering: offering._id,
      title: 'Midterm Exam',
      type: 'Mid Term',
      totalMarks: 30,
      weightage: 30,
      status: 'Published',
      createdAt: new Date(),
      updatedAt: new Date()
  };
  await db.collection('assessments').insertOne(assessment);
  
  const questions = [
      { _id: new mongoose.Types.ObjectId(), assessment: assessment._id, title: 'Q1', maxMarks: 10, mappedCLO: clos[0]._id },
      { _id: new mongoose.Types.ObjectId(), assessment: assessment._id, title: 'Q2', maxMarks: 10, mappedCLO: clos[1]._id },
      { _id: new mongoose.Types.ObjectId(), assessment: assessment._id, title: 'Q3', maxMarks: 10, mappedCLO: clos[2]._id }
  ];
  await db.collection('questions').insertMany(questions);
  console.log('Created Assessment and 3 Questions mapped to CLO-1, CLO-2, CLO-3');

  // 9. Wipe existing marks and attainments for this test
  await db.collection('marks').deleteMany({ assessment: assessment._id });
  await db.collection('studentattainments').deleteMany({ courseOffering: offering._id });
  console.log('Wiped previous marks and attainments for this offering');

  const markRecord = {
      assessment: assessment._id,
      courseOffering: offering._id,
      teacher: (await db.collection('courseofferings').findOne({_id: offering._id})).teacher || students[0]._id, // Fallback if no teacher
      students: [],
      status: 'Verified',
      createdAt: new Date(),
      updatedAt: new Date()
  };

  students.forEach((student, index) => {
      let q1Score, q2Score, q3Score;
      
      if (index < 10) {
          // High performers (80-100%)
          q1Score = 8 + Math.floor(Math.random() * 3); // 8-10
          q2Score = 8 + Math.floor(Math.random() * 3);
          q3Score = 8 + Math.floor(Math.random() * 3);
      } else if (index < 22) {
          // Average performers (50-70%)
          q1Score = 5 + Math.floor(Math.random() * 3); // 5-7
          q2Score = 5 + Math.floor(Math.random() * 3);
          q3Score = 5 + Math.floor(Math.random() * 3);
      } else {
          // Weak performers (0-40%)
          q1Score = Math.floor(Math.random() * 5); // 0-4
          q2Score = Math.floor(Math.random() * 5);
          q3Score = Math.floor(Math.random() * 5);
      }

      markRecord.students.push({
          student: student._id,
          obtainedMarks: q1Score + q2Score + q3Score
      });
  });
  
  await db.collection('marks').insertOne(markRecord);
  console.log('Inserted fresh varied marks for all 30 students in one Mark document');

  process.exit(0);
}

run().catch(console.error);
