import {
    Mark,
    QuestionMapping,
    CLO,
    ObeTarget,
    StudentAttainment,
    CourseOffering
} from '../models/index.js';

/**
 * Core OBE Engine: Calculates CLO and PLO attainment for all students in a course offering.
 * 
 * Algorithm:
 * 1. Collect all Approved Marks for the CourseOffering.
 * 2. Collect the corresponding QuestionMappings to get CLO-question weighting.
 * 3. For each student, compute per-CLO marks based on the marks they obtained and the CLO
 *    weights from the question mapping.
 * 4. Roll CLO attainment up to PLO attainment.
 * 5. Save/update StudentAttainment records.
 */
export const calculateAttainment = async (courseOfferingId) => {
    const offering = await CourseOffering.findById(courseOfferingId)
        .populate('course')
        .lean();
    if (!offering) throw new Error('CourseOffering not found');

    // Get target threshold
    const obeTarget = await ObeTarget.findOne().lean();
    const cloTarget = obeTarget?.cloTarget || 70;
    const ploTarget = obeTarget?.ploTarget || 70;

    // Get all CLOs for this course
    const clos = await CLO.find({ course: offering.course._id }).lean();
    if (!clos.length) throw new Error('No CLOs defined for this course.');

    // Get all verified/locked mark records for this offering
    const markRecords = await Mark.find({
        courseOffering: courseOfferingId,
        status: { $in: ['Verified', 'Locked'] }
    }).lean();

    if (!markRecords.length) return { message: 'No verified marks found.', attainments: [] };

    // Get all approved question mappings for this offering (course + section + teacher)
    const mappings = await QuestionMapping.find({
        course: offering.course._id,
        teacher: offering.teacher,
        status: 'Approved'
    }).lean();

    // Build CLO -> total allocated marks map from all mappings
    // Structure: { cloId: totalAllocatedMarks }
    const cloAllocatedMarks = {};
    for (const mapping of mappings) {
        for (const q of mapping.questions) {
            if (!q.clo) continue;
            const cloKey = q.clo.toString();
            if (!cloAllocatedMarks[cloKey]) cloAllocatedMarks[cloKey] = 0;
            cloAllocatedMarks[cloKey] += Number(q.marks) || 0;
        }
    }

    // Collect all students across all mark records
    const studentMarkMap = {}; // studentId -> { markRecord, assessment }
    for (const record of markRecords) {
        for (const s of record.students) {
            const studentId = s.student.toString();
            if (!studentMarkMap[studentId]) studentMarkMap[studentId] = [];
            studentMarkMap[studentId].push({ assessment: record.assessment, obtained: s.obtainedMarks });
        }
    }

    const attainments = [];

    for (const [studentId, studentMarks] of Object.entries(studentMarkMap)) {
        // For each CLO, calculate obtained marks
        // We need the question mapping per assessment to know how marks map to CLOs
        const cloObtained = {}; // cloId -> obtained marks

        for (const { assessment, obtained } of studentMarks) {
            const assessmentMapping = mappings.find(m => m.assessment.toString() === assessment.toString());
            if (!assessmentMapping) continue;

            // Get total marks for this assessment
            const assessmentTotalMarks = assessmentMapping.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
            if (assessmentTotalMarks === 0) continue;

            // For each question in the mapping, compute proportion of marks the student obtained for that CLO
            for (const q of assessmentMapping.questions) {
                if (!q.clo) continue;
                const cloKey = q.clo.toString();
                const proportion = (Number(q.marks) || 0) / assessmentTotalMarks;
                const studentCloMarks = proportion * obtained;
                if (!cloObtained[cloKey]) cloObtained[cloKey] = 0;
                cloObtained[cloKey] += studentCloMarks;
            }
        }

        // Build CLO attainment records
        const cloAttainments = clos.map(clo => {
            const cloKey = clo._id.toString();
            const totalMarks = cloAllocatedMarks[cloKey] || 0;
            const obtainedMarks = Math.min(cloObtained[cloKey] || 0, totalMarks);
            const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
            return {
                clo: clo._id,
                totalMarks,
                obtainedMarks,
                percentage: Math.round(percentage * 100) / 100,
                targetThreshold: cloTarget,
                achieved: percentage >= cloTarget
            };
        });

        // Build PLO attainment from CLO->PLO mappings
        const ploMap = {}; // ploId -> { totalWeight, weightedObtained }
        for (const clo of clos) {
            const cloKey = clo._id.toString();
            const cloData = cloAttainments.find(c => c.clo.toString() === cloKey);
            if (!cloData || !clo.plos) continue;

            for (const ploMapping of clo.plos) {
                const ploKey = ploMapping.plo.toString();
                const weight = Number(ploMapping.weightage) || 0;
                if (!ploMap[ploKey]) ploMap[ploKey] = { totalWeight: 0, weightedObtained: 0, plo: ploMapping.plo };
                ploMap[ploKey].totalWeight += weight;
                ploMap[ploKey].weightedObtained += weight * (cloData.percentage / 100);
            }
        }

        const ploAttainments = Object.values(ploMap).map(p => {
            const percentage = p.totalWeight > 0 ? (p.weightedObtained / p.totalWeight) * 100 : 0;
            return {
                plo: p.plo,
                totalMarks: p.totalWeight,
                obtainedMarks: p.weightedObtained,
                percentage: Math.round(percentage * 100) / 100,
                targetThreshold: ploTarget,
                achieved: percentage >= ploTarget
            };
        });

        // Upsert StudentAttainment record
        const attainment = await StudentAttainment.findOneAndUpdate(
            { student: studentId, courseOffering: courseOfferingId },
            {
                student: studentId,
                courseOffering: courseOfferingId,
                clos: cloAttainments,
                plos: ploAttainments,
                calculatedAt: new Date()
            },
            { new: true, upsert: true }
        );
        attainments.push(attainment);
    }

    return { message: 'Attainment calculated successfully.', count: attainments.length, attainments };
};

/**
 * HTTP Handler: Trigger attainment calculation for a course offering.
 * POST /api/obe/calculate-attainment/:courseOfferingId
 */
export const triggerAttainmentCalculation = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;
        const result = await calculateAttainment(courseOfferingId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Attainment calculation error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * HTTP Handler: Get attainment data for a course offering (all students).
 * GET /api/obe/attainment/:courseOfferingId
 */
export const getAttainment = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;
        const attainments = await StudentAttainment.find({ courseOffering: courseOfferingId })
            .populate('student', 'name email rollNo')
            .populate('clos.clo', 'code description bloomsLevel')
            .populate('plos.plo', 'code description')
            .lean();
        res.status(200).json(attainments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * HTTP Handler: Get aggregate CLO attainment summary across the class.
 * GET /api/obe/attainment-summary/:courseOfferingId
 */
export const getAttainmentSummary = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;
        const attainments = await StudentAttainment.find({ courseOffering: courseOfferingId }).lean();

        if (!attainments.length) {
            return res.status(200).json({ clos: [], plos: [] });
        }

        // Aggregate per CLO across all students
        const cloSummary = {};
        const ploSummary = {};

        for (const att of attainments) {
            for (const c of att.clos) {
                const key = c.clo.toString();
                if (!cloSummary[key]) cloSummary[key] = { clo: c.clo, totalStudents: 0, achievedStudents: 0, avgPercentage: 0, percentages: [], targetThreshold: c.targetThreshold };
                cloSummary[key].totalStudents++;
                cloSummary[key].percentages.push(c.percentage);
                if (c.achieved) cloSummary[key].achievedStudents++;
            }
            for (const p of att.plos) {
                const key = p.plo.toString();
                if (!ploSummary[key]) ploSummary[key] = { plo: p.plo, totalStudents: 0, achievedStudents: 0, avgPercentage: 0, percentages: [], targetThreshold: p.targetThreshold };
                ploSummary[key].totalStudents++;
                ploSummary[key].percentages.push(p.percentage);
                if (p.achieved) ploSummary[key].achievedStudents++;
            }
        }

        // Compute averages
        const cloPrepared = Object.values(cloSummary).map(c => ({
            ...c,
            avgPercentage: Math.round((c.percentages.reduce((s, v) => s + v, 0) / c.percentages.length) * 100) / 100,
            attainmentRate: Math.round((c.achievedStudents / c.totalStudents) * 100 * 100) / 100
        }));
        const ploPrepared = Object.values(ploSummary).map(p => ({
            ...p,
            avgPercentage: Math.round((p.percentages.reduce((s, v) => s + v, 0) / p.percentages.length) * 100) / 100,
            attainmentRate: Math.round((p.achievedStudents / p.totalStudents) * 100 * 100) / 100
        }));

        res.status(200).json({ clos: cloPrepared, plos: ploPrepared });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
