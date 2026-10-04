import { Rubric, RubricEvaluation, Mark } from '../models/index.js';

// Calculate marks based on level weightage
const getMarksForLevel = (level, maxMarks) => {
    switch (level) {
        case 'Excellent': return maxMarks * 1.0;
        case 'Good': return maxMarks * 0.75;
        case 'Satisfactory': return maxMarks * 0.50;
        case 'Poor': return maxMarks * 0.25;
        default: return 0;
    }
};

// @desc    Submit Rubric Evaluation for a Student
// @route   POST /api/rubrics/evaluate
// @access  Private/Teacher
export const evaluateStudentWithRubric = async (req, res) => {
    try {
        const { rubricId, student, assessment, courseOffering, criteriaScores } = req.body;

        const rubric = await Rubric.findById(rubricId);
        if (!rubric) return res.status(404).json({ message: 'Rubric not found' });

        let totalObtained = 0;

        // Auto-calculate total obtained based on the rubric criteria and provided levels
        const processedScores = criteriaScores.map(score => {
            const criterion = rubric.criteria.find(c => c._id.toString() === score.criterionId.toString());
            if (!criterion) throw new Error(`Criterion not found in Rubric`);

            const marksObtained = getMarksForLevel(score.level, criterion.marks);
            totalObtained += marksObtained;

            return {
                criterionId: score.criterionId,
                level: score.level,
                marksObtained
            };
        });

        let evaluation = await RubricEvaluation.findOne({ student, assessment });
        if (evaluation) {
            evaluation.criteriaScores = processedScores;
            evaluation.totalObtained = totalObtained;
            evaluation.rubric = rubricId;
            evaluation.courseOffering = courseOffering;
            evaluation.evaluator = req.user._id;
            await evaluation.save();
        } else {
            evaluation = new RubricEvaluation({
                rubric: rubricId,
                student,
                assessment,
                courseOffering,
                evaluator: req.user._id,
                criteriaScores: processedScores,
                totalObtained
            });
            await evaluation.save();
        }

        // Now, update the central Mark table for this student!
        let markRecord = await Mark.findOne({ assessment, courseOffering });
        if (!markRecord) {
            markRecord = new Mark({
                assessment,
                courseOffering,
                teacher: req.user._id,
                students: [],
                status: 'Draft'
            });
        }

        const studentIndex = markRecord.students.findIndex(s => s.student.toString() === student.toString());
        if (studentIndex > -1) {
            markRecord.students[studentIndex].obtainedMarks = totalObtained;
        } else {
            markRecord.students.push({
                student,
                obtainedMarks: totalObtained,
                remarks: `Evaluated via Rubric: ${rubric.name}`
            });
        }
        await markRecord.save();

        res.status(200).json(evaluation);
    } catch (error) {
        console.error('Error evaluating with rubric:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Rubric Evaluation for a specific student/assessment
// @route   GET /api/rubrics/evaluate/:assessmentId/:studentId
// @access  Private/Teacher
export const getStudentEvaluation = async (req, res) => {
    try {
        const { assessmentId, studentId } = req.params;
        const evaluation = await RubricEvaluation.findOne({ assessment: assessmentId, student: studentId })
            .populate('rubric', 'name criteria');
        
        if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
        res.status(200).json(evaluation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
