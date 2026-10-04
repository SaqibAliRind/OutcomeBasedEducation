import Survey from '../models/Survey.js';

// @desc    Get all surveys for university
// @route   GET /api/surveys
// @access  Private
export const getSurveys = async (req, res) => {
    try {
        const surveys = await Survey.find({ university: req.user.university }).sort('-createdAt');
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new survey
// @route   POST /api/surveys
// @access  Private
export const createSurvey = async (req, res) => {
    try {
        const survey = new Survey({
            ...req.body,
            university: req.user.university,
            createdBy: req.user._id
        });
        const createdSurvey = await survey.save();
        res.status(201).json(createdSurvey);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a survey
// @route   PUT /api/surveys/:id
// @access  Private
export const updateSurvey = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        
        Object.assign(survey, req.body);
        const updatedSurvey = await survey.save();
        res.json(updatedSurvey);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a survey
// @route   DELETE /api/surveys/:id
// @access  Private
export const deleteSurvey = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        await survey.deleteOne();
        res.json({ message: 'Survey removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change survey status (Activate/Deactivate)
// @route   PATCH /api/surveys/:id/status
// @access  Private
export const updateSurveyStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        survey.status = status;
        const updatedSurvey = await survey.save();
        res.json(updatedSurvey);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Submit a survey response
// @route   POST /api/surveys/:id/responses
// @access  Private
export const submitSurveyResponse = async (req, res) => {
    try {
        const { answers } = req.body; // Array of { questionId, answer }
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found' });

        const isStudent = req.user.role === 'Student';
        const isTeacher = req.user.role === 'Teacher';

        survey.responses.push({
            studentId: isStudent ? req.user._id : undefined,
            teacherId: isTeacher ? req.user._id : undefined,
            answers
        });

        await survey.save();
        res.status(201).json({ message: 'Survey response submitted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Calculate Indirect Assessment for a Survey
// @route   POST /api/surveys/:id/calculate-indirect
// @access  Private/Admin
export const calculateIndirectAssessment = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) return res.status(404).json({ message: 'Survey not found' });

        // Get weights
        const ObeTarget = (await import('../models/ObeTarget.js')).default;
        const targets = await ObeTarget.findOne({ universityId: req.user.university }) || { directWeight: 0.8, indirectWeight: 0.2 };
        const { directWeight, indirectWeight } = targets;

        const StudentAttainment = (await import('../models/StudentAttainment.js')).default;

        // Process each response
        let processedCount = 0;
        for (const response of survey.responses) {
            if (!response.studentId) continue; // Only process student responses for OBE attainment

            const ploScores = {}; // ploId -> { totalScore: 0, maxScore: 0 }
            const gaScores = {};  // gaId -> { totalScore: 0, maxScore: 0 }

            for (const answerObj of response.answers) {
                const question = survey.questions.id(answerObj.questionId);
                if (!question) continue;

                let score = 0;
                let maxScore = 5;

                // Normalize scale to percentage. Assumes Rating Scale 1-5 or Likert (1-5) by default.
                if (question.type === 'Rating Scale (1–5)' || question.type === 'Likert Scale') {
                    score = Number(answerObj.answer) || 0;
                    maxScore = 5;
                } else if (question.type === 'Yes / No') {
                    score = (answerObj.answer === 'Yes' || answerObj.answer === true) ? 1 : 0;
                    maxScore = 1;
                } else {
                    continue; // Skip non-quantifiable questions for now
                }

                const percentage = (score / maxScore) * 100;
                const weight = question.weight || 1;

                if (question.plo) {
                    const ploId = question.plo.toString();
                    if (!ploScores[ploId]) ploScores[ploId] = { total: 0, weight: 0 };
                    ploScores[ploId].total += percentage * weight;
                    ploScores[ploId].weight += weight;
                }

                if (question.ga) {
                    const gaId = question.ga.toString();
                    if (!gaScores[gaId]) gaScores[gaId] = { total: 0, weight: 0 };
                    gaScores[gaId].total += percentage * weight;
                    gaScores[gaId].weight += weight;
                }
            }

            // Update StudentAttainment records for this student
            const attainments = await StudentAttainment.find({ student: response.studentId });
            for (const att of attainments) {
                let updated = false;

                // Update PLOs
                att.plos.forEach(p => {
                    const ploId = p.plo.toString();
                    if (ploScores[ploId]) {
                        p.indirectPercentage = ploScores[ploId].total / ploScores[ploId].weight;
                        p.overallPercentage = (p.percentage * directWeight) + (p.indirectPercentage * indirectWeight);
                        p.achieved = p.overallPercentage >= p.targetThreshold;
                        updated = true;
                    }
                });

                if (updated) {
                    await att.save();
                }
            }
            processedCount++;
        }

        res.json({ message: `Calculated indirect assessment for ${processedCount} student responses.`, directWeight, indirectWeight });
    } catch (error) {
        console.error('Indirect Calc Error:', error);
        res.status(500).json({ message: error.message });
    }
};
