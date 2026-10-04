import {
    StudentAttainment, ObeSnapshot, ObeTarget,
    CourseOffering, CLO, PLO, GA, Mark, Assessment
} from '../models/index.js';

// ─────────────────────────────────────────────────────────────────
// Helper: build fully-embedded snapshot data from live attainments
// ─────────────────────────────────────────────────────────────────
async function buildSnapshotData(courseOfferingId, actor) {
    const offering = await CourseOffering.findById(courseOfferingId)
        .populate('course', 'name code')
        .populate('teacher', 'name')
        .populate('section', 'name')
        .populate('semester', 'name year')
        .populate('session', 'name')
        .populate('program', 'name department')
        .lean();

    if (!offering) throw new Error('Course offering not found');

    // Populate program.department if needed
    let deptName = '', deptId = '';
    if (offering.program?.department) {
        const { default: Department } = await import('../models/Department.js');
        const dept = await Department.findById(offering.program.department).select('name').lean();
        deptName = dept?.name || '';
        deptId = offering.program.department?.toString() || '';
    }

    // Populate university
    let uniName = '', uniId = '';
    if (actor.university) {
        const { default: University } = await import('../models/University.js');
        const uni = await University.findById(actor.university).select('name').lean();
        uniName = uni?.name || '';
        uniId = actor.university.toString();
    }

    // Get OBE targets
    const targets = await ObeTarget.findOne({ universityId: actor.university || actor._id });
    const cloTarget = targets?.cloTarget ?? 50;
    const ploTarget = targets?.ploTarget ?? 50;
    const gaTarget  = targets?.gaTarget  ?? 50;

    // Get all live attainments for this offering
    const attainments = await StudentAttainment.find({ courseOffering: courseOfferingId })
        .populate('clos.clo', 'code name description')
        .populate('plos.plo', 'code name description')
        .populate('gas.ga', 'code name')
        .lean();

    if (!attainments.length) throw new Error('No StudentAttainment records found. Run Calculate OBE first.');

    // ── Aggregate CLOs ─────────────────────────────────────────
    const cloAgg = {};
    for (const att of attainments) {
        for (const c of att.clos) {
            const key = c.clo?._id?.toString() || c.clo?.toString();
            if (!key) continue;
            if (!cloAgg[key]) {
                cloAgg[key] = {
                    cloId: key,
                    code: c.clo?.code || 'CLO',
                    name: c.clo?.name || '',
                    description: c.clo?.description || '',
                    target: c.targetThreshold,
                    percentages: [],
                    achievedCount: 0,
                    total: 0
                };
            }
            cloAgg[key].percentages.push(c.percentage);
            if (c.achieved) cloAgg[key].achievedCount++;
            cloAgg[key].total++;
        }
    }

    const clos = Object.values(cloAgg).map(c => {
        const avg = c.percentages.reduce((s, v) => s + v, 0) / c.percentages.length;
        const avgRounded = parseFloat(avg.toFixed(2));
        const gap = parseFloat((c.target - avgRounded).toFixed(2));
        return {
            cloId: c.cloId,
            code: c.code,
            name: c.name,
            description: c.description,
            target: c.target,
            achieved: avgRounded,
            gap,
            status: avgRounded >= c.target ? 'Met' : 'Not Met',
            attainmentRate: parseFloat(((c.achievedCount / c.total) * 100).toFixed(2)),
            studentsAssessed: c.total
        };
    });

    // ── Aggregate PLOs ─────────────────────────────────────────
    const ploAgg = {};
    for (const att of attainments) {
        for (const p of att.plos) {
            const key = p.plo?._id?.toString() || p.plo?.toString();
            if (!key) continue;
            if (!ploAgg[key]) {
                ploAgg[key] = {
                    ploId: key,
                    code: p.plo?.code || 'PLO',
                    name: p.plo?.name || '',
                    description: p.plo?.description || '',
                    target: p.targetThreshold,
                    percentages: [],
                    achievedCount: 0,
                    total: 0
                };
            }
            ploAgg[key].percentages.push(p.percentage);
            if (p.achieved) ploAgg[key].achievedCount++;
            ploAgg[key].total++;
        }
    }

    const plos = Object.values(ploAgg).map(p => {
        const avg = p.percentages.reduce((s, v) => s + v, 0) / p.percentages.length;
        const avgRounded = parseFloat(avg.toFixed(2));
        const gap = parseFloat((p.target - avgRounded).toFixed(2));
        return {
            ploId: p.ploId,
            code: p.code,
            name: p.name,
            description: p.description,
            target: p.target,
            achieved: avgRounded,
            gap,
            status: avgRounded >= p.target ? 'Met' : 'Not Met',
            attainmentRate: parseFloat(((p.achievedCount / p.total) * 100).toFixed(2))
        };
    });

    // ── Aggregate GAs ──────────────────────────────────────────
    const gaAgg = {};
    for (const att of attainments) {
        for (const g of (att.gas || [])) {
            const key = g.ga?._id?.toString() || g.ga?.toString();
            if (!key) continue;
            if (!gaAgg[key]) {
                gaAgg[key] = {
                    gaId: key,
                    code: g.ga?.code || 'GA',
                    name: g.ga?.name || '',
                    target: g.targetThreshold,
                    percentages: [],
                    achievedCount: 0,
                    total: 0
                };
            }
            gaAgg[key].percentages.push(g.percentage);
            if (g.achieved) gaAgg[key].achievedCount++;
            gaAgg[key].total++;
        }
    }

    const gas = Object.values(gaAgg).map(g => {
        const avg = g.percentages.reduce((s, v) => s + v, 0) / g.percentages.length;
        const avgRounded = parseFloat(avg.toFixed(2));
        const gap = parseFloat((g.target - avgRounded).toFixed(2));
        return {
            gaId: g.gaId,
            code: g.code,
            name: g.name,
            target: g.target,
            achieved: avgRounded,
            gap,
            status: avgRounded >= g.target ? 'Met' : 'Not Met'
        };
    });

    // ── Overall stats ──────────────────────────────────────────
    const avgClo = clos.length ? parseFloat((clos.reduce((s, c) => s + c.achieved, 0) / clos.length).toFixed(2)) : 0;
    const avgPlo = plos.length ? parseFloat((plos.reduce((s, p) => s + p.achieved, 0) / plos.length).toFixed(2)) : 0;
    const avgGa  = gas.length  ? parseFloat((gas.reduce((s, g) => s + g.achieved, 0) / gas.length).toFixed(2)) : 0;

    // Pass/fail from marks
    const marks = await Mark.find({ courseOffering: courseOfferingId, status: { $in: ['Verified', 'Locked'] } })
        .populate('assessment', 'totalMarks passingMarks').lean();
    let passCount = 0, failCount = 0;
    for (const m of marks) {
        const threshold = m.assessment?.passingMarks || (m.assessment?.totalMarks * 0.5) || 50;
        for (const s of (m.students || [])) {
            if (s.obtainedMarks >= threshold) passCount++; else failCount++;
        }
    }
    const totalGraded = passCount + failCount;
    const passRate = totalGraded > 0 ? parseFloat(((passCount / totalGraded) * 100).toFixed(2)) : 0;
    const failRate = totalGraded > 0 ? parseFloat(((failCount / totalGraded) * 100).toFixed(2)) : 0;

    // Assessment list
    const assessments = marks.map(m => ({
        assessmentId: m.assessment?._id?.toString(),
        name: m.assessment?.name || m.assessment?.type || 'Assessment',
        type: m.assessment?.type || '',
        totalMarks: m.assessment?.totalMarks,
        passingMarks: m.assessment?.passingMarks
    }));

    return {
        courseOfferingId: courseOfferingId.toString(),
        courseId:    offering.course?._id?.toString() || '',
        courseCode:  offering.course?.code || '',
        courseName:  offering.course?.name || '',
        teacherId:   offering.teacher?._id?.toString() || null,
        teacherName: offering.teacher?.name || '',
        sectionId:   offering.section?._id?.toString() || null,
        sectionName: offering.section?.name || '',
        semesterId:  offering.semester?._id?.toString() || null,
        semesterName: `${offering.semester?.name || ''} ${offering.semester?.year || ''}`.trim(),
        sessionId:   offering.session?._id?.toString() || null,
        sessionName: offering.session?.name || '',
        programId:   offering.program?._id?.toString() || null,
        programName: offering.program?.name || '',
        departmentId: deptId,
        departmentName: deptName,
        universityId: uniId,
        universityName: uniName,
        academicYear: offering.academicYear || '',
        cloTargetUsed: cloTarget,
        ploTargetUsed: ploTarget,
        gaTargetUsed:  gaTarget,
        clos,
        plos,
        gas,
        assessments,
        totalStudents: attainments.length,
        avgCloAchievement: avgClo,
        avgPloAchievement: avgPlo,
        avgGaAchievement:  avgGa,
        passRate,
        failRate,
        archivedById:   actor._id.toString(),
        archivedByName: actor.name,
        archivedByRole: actor.role,
        sourceAttainmentIds: attainments.map(a => a._id.toString())
    };
}


// ─────────────────────────────────────────────────────────────────
// POST /api/obe/archive/:courseOfferingId
// Create immutable OBE snapshot (only on explicit user action)
// ─────────────────────────────────────────────────────────────────
export const createObeSnapshot = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;
        const { label } = req.body;

        const snapshotData = await buildSnapshotData(courseOfferingId, req.user);

        // Determine next version number for this offering
        const lastSnapshot = await ObeSnapshot.findOne({ courseOfferingId })
            .sort({ version: -1 })
            .select('version')
            .lean();
        const nextVersion = (lastSnapshot?.version || 0) + 1;

        // Duplicate check: same courseOfferingId + same version is blocked by unique index
        // Also check by content: if nothing changed, warn but allow with bump
        const newSnapshot = new ObeSnapshot({
            ...snapshotData,
            version: nextVersion,
            snapshotLabel: label || `Snapshot v${nextVersion}`,
            archivedAt: new Date()
        });

        const saved = await newSnapshot.save();
        res.status(201).json({
            message: `OBE Snapshot v${nextVersion} created successfully.`,
            snapshot: saved
        });
    } catch (err) {
        // Duplicate version (unique index violation)
        if (err.code === 11000) {
            return res.status(409).json({ message: 'A snapshot with this version already exists for this course offering.' });
        }
        console.error('[OBE SNAPSHOT ERROR]', err.message);
        res.status(500).json({ message: err.message });
    }
};


// ─────────────────────────────────────────────────────────────────
// GET /api/obe/archive
// List all snapshots (scoped by role)
// ─────────────────────────────────────────────────────────────────
export const listObeSnapshots = async (req, res) => {
    try {
        const { courseOfferingId, programId, semesterId } = req.query;
        const filter = {};
        if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
        if (programId)        filter.programId = programId;
        if (semesterId)       filter.semesterId = semesterId;

        // Role scoping
        if (req.user.university) {
            filter.universityId = req.user.university.toString();
        }

        const snapshots = await ObeSnapshot.find(filter)
            .sort({ archivedAt: -1 })
            .select('-clos -plos -gas -assessments -sourceAttainmentIds') // lightweight list
            .lean();

        res.json(snapshots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ─────────────────────────────────────────────────────────────────
// GET /api/obe/archive/:id
// Get single snapshot with full data
// ─────────────────────────────────────────────────────────────────
export const getObeSnapshot = async (req, res) => {
    try {
        const snapshot = await ObeSnapshot.findById(req.params.id).lean();
        if (!snapshot) return res.status(404).json({ message: 'Snapshot not found.' });

        // Security: university scoping
        if (req.user.university && snapshot.universityId !== req.user.university.toString()) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.json(snapshot);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ─────────────────────────────────────────────────────────────────
// GET /api/obe/archive/compare/:id1/:id2
// Side-by-side comparison of two snapshots
// ─────────────────────────────────────────────────────────────────
export const compareObeSnapshots = async (req, res) => {
    try {
        const { id1, id2 } = req.params;

        if (id1 === id2) {
            return res.status(400).json({ message: 'Cannot compare a snapshot with itself.' });
        }

        const [s1, s2] = await Promise.all([
            ObeSnapshot.findById(id1).lean(),
            ObeSnapshot.findById(id2).lean()
        ]);

        if (!s1) return res.status(404).json({ message: `Snapshot ${id1} not found.` });
        if (!s2) return res.status(404).json({ message: `Snapshot ${id2} not found.` });

        // Security check
        const uniId = req.user.university?.toString();
        if (uniId && (s1.universityId !== uniId || s2.universityId !== uniId)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        // Build comparison rows
        const allCloIds = [...new Set([...s1.clos.map(c => c.cloId), ...s2.clos.map(c => c.cloId)])];
        const cloComparison = allCloIds.map(cloId => {
            const c1 = s1.clos.find(c => c.cloId === cloId);
            const c2 = s2.clos.find(c => c.cloId === cloId);
            return {
                code: c1?.code || c2?.code,
                name: c1?.name || c2?.name,
                s1_achieved: c1?.achieved ?? null,
                s2_achieved: c2?.achieved ?? null,
                s1_target:   c1?.target   ?? null,
                s2_target:   c2?.target   ?? null,
                s1_gap:      c1?.gap      ?? null,
                s2_gap:      c2?.gap      ?? null,
                s1_status:   c1?.status   ?? 'N/A',
                s2_status:   c2?.status   ?? 'N/A',
                diff_achieved: (c2?.achieved ?? 0) - (c1?.achieved ?? 0)
            };
        });

        const allPloIds = [...new Set([...s1.plos.map(p => p.ploId), ...s2.plos.map(p => p.ploId)])];
        const ploComparison = allPloIds.map(ploId => {
            const p1 = s1.plos.find(p => p.ploId === ploId);
            const p2 = s2.plos.find(p => p.ploId === ploId);
            return {
                code: p1?.code || p2?.code,
                name: p1?.name || p2?.name,
                s1_achieved: p1?.achieved ?? null,
                s2_achieved: p2?.achieved ?? null,
                s1_target:   p1?.target   ?? null,
                s2_target:   p2?.target   ?? null,
                s1_gap:      p1?.gap      ?? null,
                s2_gap:      p2?.gap      ?? null,
                s1_status:   p1?.status   ?? 'N/A',
                s2_status:   p2?.status   ?? 'N/A',
                diff_achieved: (p2?.achieved ?? 0) - (p1?.achieved ?? 0)
            };
        });

        res.json({
            snapshot1: { id: s1._id, label: s1.snapshotLabel, version: s1.version, archivedAt: s1.archivedAt, course: s1.courseName, program: s1.programName },
            snapshot2: { id: s2._id, label: s2.snapshotLabel, version: s2.version, archivedAt: s2.archivedAt, course: s2.courseName, program: s2.programName },
            summary: {
                s1_avgClo: s1.avgCloAchievement, s2_avgClo: s2.avgCloAchievement, diff_avgClo: parseFloat((s2.avgCloAchievement - s1.avgCloAchievement).toFixed(2)),
                s1_avgPlo: s1.avgPloAchievement, s2_avgPlo: s2.avgPloAchievement, diff_avgPlo: parseFloat((s2.avgPloAchievement - s1.avgPloAchievement).toFixed(2)),
                s1_avgGa:  s1.avgGaAchievement,  s2_avgGa:  s2.avgGaAchievement,  diff_avgGa:  parseFloat((s2.avgGaAchievement - s1.avgGaAchievement).toFixed(2)),
                s1_passRate: s1.passRate, s2_passRate: s2.passRate, diff_passRate: parseFloat((s2.passRate - s1.passRate).toFixed(2)),
                s1_students: s1.totalStudents, s2_students: s2.totalStudents
            },
            cloComparison,
            ploComparison
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
