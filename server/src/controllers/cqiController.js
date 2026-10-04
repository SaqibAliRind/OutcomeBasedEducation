import { StudentAttainment, CLO, PLO, ObeTarget, CourseOffering } from '../models/index.js';
import CourseFile from '../models/CourseFile.js';

/**
 * CQI Engine: Continuous Quality Improvement
 *
 * Reads real StudentAttainment data to identify failing CLOs, then cross-references
 * CourseFile closing-the-loop entries to build a full CQI action register.
 */

/**
 * @desc  Find CLOs that failed to meet target threshold across a program/semester
 * @param {string|null} programId - Optional program filter
 * @param {string|null} sessionId - Optional session filter
 */
export const identifyFailingCLOs = async ({ programId, sessionId } = {}) => {
    const offeringFilter = {};
    if (programId) offeringFilter.program = programId;
    if (sessionId) offeringFilter.session = sessionId;

    const offeringIds = offeringFilter && Object.keys(offeringFilter).length
        ? (await CourseOffering.find(offeringFilter).lean()).map(o => o._id)
        : null;

    const attainmentFilter = {};
    if (offeringIds) attainmentFilter.courseOffering = { $in: offeringIds };

    const attainments = await StudentAttainment.find(attainmentFilter)
        .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
        .lean();

    // Aggregate per CLO
    const cloAgg = {}; // cloId -> { clo, totalStudents, achievedStudents, percentages, targetThreshold, courses }

    for (const att of attainments) {
        const courseName = att.courseOffering?.course?.name || 'Unknown';
        for (const c of att.clos || []) {
            const key = c.clo?.toString();
            if (!key) continue;
            if (!cloAgg[key]) cloAgg[key] = {
                clo: c.clo,
                totalStudents: 0,
                achievedStudents: 0,
                percentages: [],
                targetThreshold: c.targetThreshold,
                courses: new Set()
            };
            cloAgg[key].totalStudents++;
            cloAgg[key].percentages.push(c.percentage);
            if (c.achieved) cloAgg[key].achievedStudents++;
            cloAgg[key].courses.add(courseName);
        }
    }

    // Identify failing CLOs (below threshold)
    const failingCLOs = [];
    for (const [cloId, data] of Object.entries(cloAgg)) {
        const avg = data.percentages.reduce((s, v) => s + v, 0) / data.percentages.length;
        const attainmentRate = (data.achievedStudents / data.totalStudents) * 100;
        if (avg < data.targetThreshold || attainmentRate < 50) {
            failingCLOs.push({
                cloId,
                avgPercentage: parseFloat(avg.toFixed(2)),
                attainmentRate: parseFloat(attainmentRate.toFixed(2)),
                targetThreshold: data.targetThreshold,
                gap: parseFloat((avg - data.targetThreshold).toFixed(2)),
                severity: avg < (data.targetThreshold - 15) ? 'Critical' : 'Moderate',
                courses: [...data.courses]
            });
        }
    }

    // Populate CLO codes/descriptions
    const cloIds = failingCLOs.map(f => f.cloId);
    const cloDetails = await CLO.find({ _id: { $in: cloIds } }).select('code description course').lean();
    const cloDetailMap = {};
    cloDetails.forEach(c => { cloDetailMap[c._id.toString()] = c; });

    return failingCLOs.map(f => ({
        ...f,
        code: cloDetailMap[f.cloId]?.code || 'N/A',
        description: cloDetailMap[f.cloId]?.description || 'N/A'
    }));
};

/**
 * @desc  Build full CQI Action Register from CourseFile closing loop entries
 */
export const buildCQIActionRegister = async ({ programId, sessionId } = {}) => {
    const offeringFilter = {};
    if (programId) offeringFilter.program = programId;
    if (sessionId) offeringFilter.session = sessionId;

    const offeringIds = Object.keys(offeringFilter).length
        ? (await CourseOffering.find(offeringFilter).lean()).map(o => o._id)
        : null;

    const courseFileFilter = { 'closingLoop.0': { $exists: true } };
    if (offeringIds) courseFileFilter.courseOffering = { $in: offeringIds };

    const files = await CourseFile.find(courseFileFilter)
        .populate({ path: 'courseOffering', populate: { path: 'course', select: 'name code' } })
        .populate('teacher', 'name')
        .populate('closingLoop.weakCLO', 'code description')
        .lean();

    const actions = [];
    let index = 1;
    for (const f of files) {
        for (const entry of f.closingLoop || []) {
            actions.push({
                id: `CQI-${String(index++).padStart(3, '0')}`,
                courseCode: f.courseOffering?.course?.code || 'N/A',
                courseName: f.courseOffering?.course?.name || 'N/A',
                teacher: f.teacher?.name || 'N/A',
                weakCLO: entry.weakCLO?.code || 'N/A',
                cloDescription: entry.weakCLO?.description || 'N/A',
                rootCause: entry.rootCause || '—',
                correctiveAction: entry.correctiveAction || '—',
                improvementPlan: entry.improvementPlan || '—',
                resourcesRequired: entry.resourcesRequired || '—',
                responsiblePerson: entry.responsiblePerson || '—',
                targetDate: entry.targetDate ? new Date(entry.targetDate).toISOString().split('T')[0] : '—',
                status: entry.followUpStatus || 'Pending'
            });
        }
    }

    return actions;
};

// ──────────────────────────────────────────────
// HTTP Handlers
// ──────────────────────────────────────────────

/**
 * GET /api/cqi/failing-clos
 * Returns all CLOs that are below their target threshold (with gap analysis)
 */
export const getFailingCLOs = async (req, res) => {
    try {
        const { programId, sessionId } = req.query;
        const failingCLOs = await identifyFailingCLOs({ programId, sessionId });
        res.status(200).json({
            total: failingCLOs.length,
            critical: failingCLOs.filter(c => c.severity === 'Critical').length,
            moderate: failingCLOs.filter(c => c.severity === 'Moderate').length,
            failingCLOs
        });
    } catch (error) {
        console.error('CQI failing CLO error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/cqi/action-register
 * Returns the full CQI action register from CourseFile closing loop entries
 */
export const getCQIActionRegister = async (req, res) => {
    try {
        const { programId, sessionId } = req.query;
        const actions = await buildCQIActionRegister({ programId, sessionId });
        res.status(200).json({
            total: actions.length,
            completed: actions.filter(a => a.status === 'Completed').length,
            inProgress: actions.filter(a => a.status === 'In Progress').length,
            pending: actions.filter(a => a.status === 'Pending').length,
            actions
        });
    } catch (error) {
        console.error('CQI action register error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/cqi/dashboard
 * Returns a combined CQI dashboard with failing CLOs, actions, and completion rates
 */
export const getCQIDashboard = async (req, res) => {
    try {
        const { programId, sessionId } = req.query;
        const [failingCLOs, actions] = await Promise.all([
            identifyFailingCLOs({ programId, sessionId }),
            buildCQIActionRegister({ programId, sessionId })
        ]);

        // PLO gap analysis from StudentAttainment
        const attainments = await StudentAttainment.find().lean();
        const ploAgg = {};
        for (const att of attainments) {
            for (const p of att.plos || []) {
                const key = p.plo?.toString();
                if (!key) continue;
                if (!ploAgg[key]) ploAgg[key] = { plo: key, percentages: [], targetThreshold: p.targetThreshold, achievedCount: 0, total: 0 };
                ploAgg[key].percentages.push(p.percentage);
                ploAgg[key].total++;
                if (p.achieved) ploAgg[key].achievedCount++;
            }
        }

        const failingPLOs = Object.values(ploAgg)
            .map(p => ({
                ploId: p.plo,
                avgPercentage: parseFloat((p.percentages.reduce((s, v) => s + v, 0) / p.percentages.length).toFixed(2)),
                attainmentRate: parseFloat(((p.achievedCount / p.total) * 100).toFixed(2)),
                targetThreshold: p.targetThreshold
            }))
            .filter(p => p.avgPercentage < p.targetThreshold);

        // Populate PLO codes
        const ploIds = failingPLOs.map(p => p.ploId);
        const ploDetails = await PLO.find({ _id: { $in: ploIds } }).select('code description').lean();
        const ploDetailMap = {};
        ploDetails.forEach(p => { ploDetailMap[p._id.toString()] = p; });

        res.status(200).json({
            summary: {
                failingCLOCount: failingCLOs.length,
                criticalCLOCount: failingCLOs.filter(c => c.severity === 'Critical').length,
                failingPLOCount: failingPLOs.length,
                totalActions: actions.length,
                actionsCompleted: actions.filter(a => a.status === 'Completed').length,
                actionsInProgress: actions.filter(a => a.status === 'In Progress').length,
                actionsPending: actions.filter(a => a.status === 'Pending').length,
                completionRate: actions.length > 0
                    ? parseFloat(((actions.filter(a => a.status === 'Completed').length / actions.length) * 100).toFixed(1))
                    : 0
            },
            failingCLOs,
            failingPLOs: failingPLOs.map(p => ({
                ...p,
                code: ploDetailMap[p.ploId]?.code || 'N/A',
                description: ploDetailMap[p.ploId]?.description || 'N/A'
            })),
            recentActions: actions.slice(0, 10)
        });
    } catch (error) {
        console.error('CQI dashboard error:', error);
        res.status(500).json({ message: error.message });
    }
};
