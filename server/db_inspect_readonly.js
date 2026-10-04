// READ-ONLY database inspection script - does NOT modify anything
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== COLLECTIONS ===');
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  ${col.name}: ${count} documents`);
    }

    // Check Users by role
    console.log('\n=== USERS BY ROLE ===');
    const users = await db.collection('users').find({}).project({ name: 1, email: 1, role: 1, isActive: 1, isDeleted: 1, university: 1, department: 1, faculty: 1, program: 1 }).toArray();
    const roleGroups = {};
    users.forEach(u => {
        if (!roleGroups[u.role]) roleGroups[u.role] = [];
        roleGroups[u.role].push(u);
    });
    for (const [role, uList] of Object.entries(roleGroups)) {
        console.log(`\n  [${role}] (${uList.length}):`);
        uList.forEach(u => {
            console.log(`    - ${u.name} | ${u.email} | active=${u.isActive} | deleted=${u.isDeleted} | _id=${u._id} | uni=${u.university || 'null'} | dept=${u.department || 'null'} | faculty=${u.faculty || 'null'}`);
        });
    }

    // Check Faculties
    console.log('\n=== FACULTIES ===');
    const faculties = await db.collection('faculties').find({}).toArray();
    faculties.forEach(f => console.log(`  - ${f.name} | code=${f.code} | dean=${f.dean} | status=${f.status} | _id=${f._id}`));

    // Check Departments
    console.log('\n=== DEPARTMENTS ===');
    const depts = await db.collection('departments').find({}).toArray();
    depts.forEach(d => console.log(`  - ${d.name} | code=${d.code} | hod=${d.hod} | faculty=${d.faculty} | status=${d.status} | _id=${d._id}`));

    // Check Programs
    console.log('\n=== PROGRAMS ===');
    const programs = await db.collection('programs').find({}).toArray();
    programs.forEach(p => console.log(`  - ${p.name} | code=${p.code} | type=${p.type} | dept=${p.department} | _id=${p._id}`));

    // Check Sessions
    console.log('\n=== SESSIONS ===');
    const sessions = await db.collection('sessions').find({}).toArray();
    sessions.forEach(s => console.log(`  - ${s.name} | term=${s.term} | year=${s.year} | status=${s.status} | _id=${s._id}`));

    // Check Semesters
    console.log('\n=== SEMESTERS ===');
    const semesters = await db.collection('semesters').find({}).toArray();
    semesters.forEach(s => console.log(`  - ${s.name} | number=${s.number} | session=${s.session} | status=${s.status} | _id=${s._id}`));

    // Check Courses
    console.log('\n=== COURSES ===');
    const courses = await db.collection('courses').find({}).toArray();
    courses.forEach(c => console.log(`  - ${c.name} | code=${c.code} | dept=${c.department} | prog=${c.program} | _id=${c._id}`));

    // Check Sections
    console.log('\n=== SECTIONS ===');
    const sections = await db.collection('sections').find({}).toArray();
    sections.forEach(s => console.log(`  - ${s.name} | program=${s.program} | semester=${s.semester} | _id=${s._id}`));

    // Check CourseOfferings
    console.log('\n=== COURSE OFFERINGS ===');
    const offerings = await db.collection('courseofferings').find({}).toArray();
    offerings.forEach(o => console.log(`  - course=${o.course} | teacher=${o.teacher} | section=${o.section} | semester=${o.semester} | session=${o.session} | _id=${o._id}`));

    // Check Enrollments
    console.log('\n=== ENROLLMENTS ===');
    const enrollments = await db.collection('enrollments').find({}).toArray();
    console.log(`  Total: ${enrollments.length}`);

    // Check CLOs
    console.log('\n=== CLOs ===');
    const clos = await db.collection('clos').find({}).toArray();
    console.log(`  Total: ${clos.length}`);
    clos.slice(0, 5).forEach(c => console.log(`  - ${c.code} | course=${c.course} | blooms=${c.bloomsLevel}`));

    // Check PLOs, GAs, PEOs
    console.log('\n=== PLOs ===');
    const plos = await db.collection('plos').find({}).toArray();
    console.log(`  Total: ${plos.length}`);
    console.log('\n=== GAs ===');
    const gas = await db.collection('gas').find({}).toArray();
    console.log(`  Total: ${gas.length}`);
    console.log('\n=== PEOs ===');
    const peos = await db.collection('peos').find({}).toArray();
    console.log(`  Total: ${peos.length}`);

    // Check Assessments, Marks, Blueprints, QMappings, Questions
    console.log('\n=== ASSESSMENTS ===');
    const assessments = await db.collection('assessments').find({}).toArray();
    console.log(`  Total: ${assessments.length}`);
    console.log('\n=== MARKS ===');
    const marks = await db.collection('marks').find({}).toArray();
    console.log(`  Total: ${marks.length}`);
    console.log('\n=== BLUEPRINTS ===');
    const blueprints = await db.collection('blueprints').find({}).toArray();
    console.log(`  Total: ${blueprints.length}`);
    console.log('\n=== QUESTION MAPPINGS ===');
    const qms = await db.collection('questionmappings').find({}).toArray();
    console.log(`  Total: ${qms.length}`);
    console.log('\n=== QUESTIONS ===');
    const questions = await db.collection('questions').find({}).toArray();
    console.log(`  Total: ${questions.length}`);

    // Check remaining
    console.log('\n=== ATTENDANCE ===');
    const att = await db.collection('attendances').find({}).toArray();
    console.log(`  Total: ${att.length}`);
    console.log('\n=== NOTIFICATIONS ===');
    const notifs = await db.collection('notifications').find({}).toArray();
    console.log(`  Total: ${notifs.length}`);
    console.log('\n=== UNIVERSITIES ===');
    const unis = await db.collection('universities').find({}).toArray();
    unis.forEach(u => console.log(`  - ${u.name} | code=${u.code} | _id=${u._id}`));
    console.log('\n=== STUDENT ATTAINMENTS ===');
    const sa = await db.collection('studentattainments').find({}).toArray();
    console.log(`  Total: ${sa.length}`);
    console.log('\n=== RUBRICS ===');
    const rubrics = await db.collection('rubrics').find({}).toArray();
    console.log(`  Total: ${rubrics.length}`);
    console.log('\n=== WORKFLOW REQUESTS ===');
    const wf = await db.collection('workflowrequests').find({}).toArray();
    console.log(`  Total: ${wf.length}`);
    console.log('\n=== AUDIT LOGS ===');
    const al = await db.collection('auditlogs').find({}).toArray();
    console.log(`  Total: ${al.length}`);
    console.log('\n=== TIMETABLES ===');
    const tt = await db.collection('timetables').find({}).toArray();
    console.log(`  Total: ${tt.length}`);
    console.log('\n=== TEACHER PROFILES ===');
    const tp = await db.collection('teachers').find({}).toArray();
    console.log(`  Total: ${tp.length}`);
    tp.forEach(t => console.log(`  - user=${t.user} | dept=${t.professionalInfo?.department}`));
    console.log('\n=== STUDENT PROFILES ===');
    const sp = await db.collection('students').find({}).toArray();
    console.log(`  Total: ${sp.length}`);
    sp.forEach(s => console.log(`  - user=${s.user} | roll=${s.rollNumber} | prog=${s.academicInfo?.program}`));
    console.log('\n=== ROLES ===');
    const roles = await db.collection('roles').find({}).toArray();
    console.log(`  Total: ${roles.length}`);
    roles.forEach(r => console.log(`  - ${r.name} | status=${r.status} | permissions=${r.permissions?.length || 0}`));
    console.log('\n=== BATCHES ===');
    const batches = await db.collection('batches').find({}).toArray();
    console.log(`  Total: ${batches.length}`);
    console.log('\n=== OBE TARGETS ===');
    const obt = await db.collection('obetargets').find({}).toArray();
    console.log(`  Total: ${obt.length}`);
    obt.forEach(t => console.log(`  - cloTarget=${t.cloTarget} | ploTarget=${t.ploTarget}`));
    console.log('\n=== COURSE FILES ===');
    const cf = await db.collection('coursefiles').find({}).toArray();
    console.log(`  Total: ${cf.length}`);
    console.log('\n=== SURVEYS ===');
    const sv = await db.collection('surveys').find({}).toArray();
    console.log(`  Total: ${sv.length}`);

    await mongoose.disconnect();
    console.log('\nDone. Disconnected.');
}

inspect().catch(err => { console.error(err); process.exit(1); });
