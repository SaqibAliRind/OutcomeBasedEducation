import { Mark, QuestionMapping, ObeTarget, StudentAttainment, CourseOffering, CLO, CourseFile } from '../models/index.js';

// @desc    Calculate and update OBE attainment for a specific course offering
// @route   POST /api/obe/calculate/:courseOfferingId
// @access  Teacher, HOD, UniversityAdmin
export const calculateObeAttainment = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;

        // Ensure offering exists
        const offering = await CourseOffering.findById(courseOfferingId);
        if (!offering) return res.status(404).json({ message: 'Course offering not found.' });

        // Get targets (fallback to 50 if not found)
        let targets = await ObeTarget.findOne({ universityId: req.user.university || req.user._id });
        const cloTarget = targets ? targets.cloTarget : 50;
        const ploTarget = targets ? targets.ploTarget : 50;

        // 1. Fetch ONLY Verified or Locked marks — never include Draft/Submitted
        const marks = await Mark.find({ courseOffering: courseOfferingId, status: { $in: ['Verified', 'Locked'] } })
            .populate('assessment');

        if (!marks.length) {
            return res.status(400).json({ message: 'No verified/locked marks found. Marks must be Verified or Locked before calculating attainment.' });
        }

        // 2. Fetch all mappings for these assessments
        const assessmentIds = marks.map(m => m.assessment?._id).filter(Boolean);
        if (!assessmentIds.length) {
            return res.status(400).json({ message: 'Could not resolve assessment IDs. Ensure marks have linked assessments.' });
        }
        const mappings = await QuestionMapping.find({ assessment: { $in: assessmentIds } })
            .populate('questions.clo', '_id code name')
            .populate('questions.plo', '_id code name');

        // Group QUESTION ROWS by assessment ID (each mapping has questions[] sub-array)
        const mappingByAssessment = {};
        mappings.forEach(map => {
            const aid = map.assessment.toString();
            if (!mappingByAssessment[aid]) mappingByAssessment[aid] = [];
            (map.questions || []).forEach(q => mappingByAssessment[aid].push(q));
        });

        // 3. Initialize student tracking maps
        // studentMap[studentId] = { clos: { cloId: { total: 0, obtained: 0, ploId: ... } } }
        const studentMap = {};

        // 4. Process marks
        marks.forEach(markRecord => {
            const assessment = markRecord.assessment;
            if (!assessment) return;
            const aid = assessment._id.toString();
            const qRows = mappingByAssessment[aid] || [];

            markRecord.students.forEach(studentRecord => {
                const sid = studentRecord.student.toString();
                if (!studentMap[sid]) studentMap[sid] = { clos: {} };

                const obtained = studentRecord.obtainedMarks || 0;
                const total = assessment.totalMarks || 1;
                const pct = obtained / total;

                qRows.forEach(qRow => {
                    if (!qRow.clo) return;
                    const cloId = qRow.clo._id ? qRow.clo._id.toString() : qRow.clo.toString();
                    
                    if (!studentMap[sid].clos[cloId]) {
                        studentMap[sid].clos[cloId] = { total: 0, obtained: 0 };
                    }

                    const qMarks = qRow.marks || 0;
                    studentMap[sid].clos[cloId].total += qMarks;
                    studentMap[sid].clos[cloId].obtained += (qMarks * pct);
                });
            });
        });

        // 5. Calculate and save Attainment per student using proper CLO → PLO rollup
        const attainments = [];

        // Load all CLOs for this course to get their PLO and GA mappings
        const clos = await CLO.find({ course: offering.course }).lean();
        const cloModelMap = {};
        clos.forEach(c => { cloModelMap[c._id.toString()] = c; });

        for (const [studentId, data] of Object.entries(studentMap)) {
            const cloList = [];
            const ploMap = {}; // ploId -> { weightedObtained, totalWeight }
            const gaMap  = {}; // gaId  -> { weightedObtained, totalWeight }

            // Calculate CLOs and roll up to PLOs + GAs via CLO model's plos/gas arrays
            for (const [cloId, cloData] of Object.entries(data.clos)) {
                const cloPct = cloData.total > 0 ? (cloData.obtained / cloData.total) * 100 : 0;
                const achieved = cloPct >= cloTarget;
                
                cloList.push({
                    clo: cloId,
                    totalMarks: cloData.total,
                    obtainedMarks: cloData.obtained,
                    percentage: parseFloat(cloPct.toFixed(2)),
                    targetThreshold: cloTarget,  // always use current target from ObeTarget
                    achieved
                });

                const cloModel = cloModelMap[cloId];
                if (cloModel) {
                    // Roll up to PLOs using the CLO model's plos[] array
                    if (cloModel.plos) {
                        for (const ploMapping of cloModel.plos) {
                            const ploKey = ploMapping.plo.toString();
                            const weight = Number(ploMapping.weightage) || 100;
                            if (!ploMap[ploKey]) ploMap[ploKey] = { totalWeight: 0, weightedObtained: 0 };
                            ploMap[ploKey].totalWeight += weight;
                            ploMap[ploKey].weightedObtained += weight * (cloPct / 100);
                        }
                    }
                    // Roll up to GAs using the CLO model's gas[] array
                    if (cloModel.gas) {
                        for (const gaMapping of cloModel.gas) {
                            const gaKey = gaMapping.ga.toString();
                            const weight = Number(gaMapping.weightage) || 100;
                            if (!gaMap[gaKey]) gaMap[gaKey] = { totalWeight: 0, weightedObtained: 0 };
                            gaMap[gaKey].totalWeight += weight;
                            gaMap[gaKey].weightedObtained += weight * (cloPct / 100);
                        }
                    }
                }
            }

            // Calculate PLOs
            const ploList = [];
            for (const [ploId, ploData] of Object.entries(ploMap)) {
                const ploPct = ploData.totalWeight > 0 ? (ploData.weightedObtained / ploData.totalWeight) * 100 : 0;
                const achieved = ploPct >= ploTarget;

                ploList.push({
                    plo: ploId,
                    totalMarks: ploData.totalWeight,
                    obtainedMarks: ploData.weightedObtained,
                    percentage: parseFloat(ploPct.toFixed(2)),
                    targetThreshold: ploTarget,  // always use current target from ObeTarget
                    achieved
                });
            }

            // Calculate GAs
            const gaTarget = targets ? targets.gaTarget : 50;
            const gaList = [];
            for (const [gaId, gaData] of Object.entries(gaMap)) {
                const gaPct = gaData.totalWeight > 0 ? (gaData.weightedObtained / gaData.totalWeight) * 100 : 0;
                const achieved = gaPct >= gaTarget;
                gaList.push({
                    ga: gaId,
                    percentage: parseFloat(gaPct.toFixed(2)),
                    targetThreshold: gaTarget,
                    achieved
                });
            }

            // Update or Create — including GAs now
            const attainmentRecord = await StudentAttainment.findOneAndUpdate(
                { student: studentId, courseOffering: courseOfferingId },
                { clos: cloList, plos: ploList, gas: gaList, calculatedAt: new Date() },
                { new: true, upsert: true }
            );
            attainments.push(attainmentRecord);
        }

        // --- AUTOMATIC CQI TRIGGER ---
        // Calculate class average per CLO to identify failing CLOs
        const classCloAgg = {};
        for (const att of attainments) {
            for (const c of att.clos) {
                const key = c.clo.toString();
                if (!classCloAgg[key]) classCloAgg[key] = { totalStudents: 0, achievedStudents: 0, percentages: [] };
                classCloAgg[key].totalStudents++;
                classCloAgg[key].percentages.push(c.percentage);
                if (c.achieved) classCloAgg[key].achievedStudents++;
            }
        }

        let courseFile = await CourseFile.findOne({ courseOffering: courseOfferingId });
        let fileUpdated = false;

        for (const [cloId, data] of Object.entries(classCloAgg)) {
            const avg = data.percentages.reduce((s, v) => s + v, 0) / data.percentages.length;
            const attainmentRate = (data.achievedStudents / data.totalStudents) * 100;
            
            // If below target OR less than 50% of students achieved it
            if (avg < cloTarget || attainmentRate < 50) {
                if (!courseFile) {
                    courseFile = new CourseFile({ 
                        courseOffering: courseOfferingId, 
                        teacher: offering.teacher || req.user._id,
                        closingLoop: [] 
                    });
                }
                
                // Check if this CLO is already in closingLoop
                const existing = courseFile.closingLoop.find(c => c.weakCLO && c.weakCLO.toString() === cloId);
                if (!existing) {
                    courseFile.closingLoop.push({
                        weakCLO: cloId,
                        rootCause: '',
                        correctiveAction: '',
                        followUpStatus: 'Pending'
                    });
                    fileUpdated = true;
                }
            }
        }

        if (fileUpdated && courseFile) {
            await courseFile.save();
        }
        // --- END AUTOMATIC CQI TRIGGER ---

        res.status(200).json({ message: 'OBE calculation successful. CQI drafts generated if targets were missed.', data: attainments });
    } catch (err) {
        console.error('[OBE ENGINE ERROR]', err.message, err.stack);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get OBE attainment for a course offering
// @route   GET /api/obe/attainment/:courseOfferingId
// @access  Teacher, HOD, UniversityAdmin, Student (if own)
export const getObeAttainment = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;
        let filter = { courseOffering: courseOfferingId };
        
        if (req.user.role === 'Student') {
            filter.student = req.user._id;
        }

        const attainments = await StudentAttainment.find(filter)
            .populate('student', 'name email rollNo')
            .populate('clos.clo', 'name code description')
            .populate('plos.plo', 'name code description');

        res.status(200).json(attainments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get class-level CLO/PLO attainment summary
// @route   GET /api/obe/attainment-summary/:courseOfferingId
// @access  Teacher, HOD, Dean, UniversityAdmin
export const getAttainmentSummary = async (req, res) => {
    try {
        const { courseOfferingId } = req.params;
        const attainments = await StudentAttainment.find({ courseOffering: courseOfferingId }).lean();

        if (!attainments.length) return res.status(200).json({ clos: [], plos: [] });

        const cloAgg = {}, ploAgg = {};
        for (const att of attainments) {
            for (const c of att.clos) {
                const key = c.clo.toString();
                if (!cloAgg[key]) cloAgg[key] = { clo: c.clo, totalStudents: 0, achievedStudents: 0, percentages: [], targetThreshold: c.targetThreshold };
                cloAgg[key].totalStudents++;
                cloAgg[key].percentages.push(c.percentage);
                if (c.achieved) cloAgg[key].achievedStudents++;
            }
            for (const p of att.plos) {
                const key = p.plo.toString();
                if (!ploAgg[key]) ploAgg[key] = { plo: p.plo, totalStudents: 0, achievedStudents: 0, percentages: [], targetThreshold: p.targetThreshold };
                ploAgg[key].totalStudents++;
                ploAgg[key].percentages.push(p.percentage);
                if (p.achieved) ploAgg[key].achievedStudents++;
            }
        }

        const mapSummary = (agg) => Object.values(agg).map(x => ({
            ...x,
            avgPercentage: parseFloat((x.percentages.reduce((s, v) => s + v, 0) / x.percentages.length).toFixed(2)),
            attainmentRate: parseFloat(((x.achievedStudents / x.totalStudents) * 100).toFixed(2))
        }));

        res.status(200).json({ clos: mapSummary(cloAgg), plos: mapSummary(ploAgg) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
