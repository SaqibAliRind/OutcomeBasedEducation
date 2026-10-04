import Question from '../models/Question.js';

// Get Questions
export const getQuestions = async (req, res) => {
    try {
        const { course, chapter, topic, clo, btLevel, difficultyLevel, status } = req.query;
        let filter = { teacher: req.user._id };
        
        if (course) filter.course = course;
        if (chapter) filter.chapter = chapter;
        if (topic) filter.topic = topic;
        if (clo) filter.clo = clo;
        if (btLevel) filter.btLevel = btLevel;
        if (difficultyLevel) filter.difficultyLevel = difficultyLevel;
        if (status) filter.status = status;

        const questions = await Question.find(filter).sort({ createdAt: -1 });
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
};

// Create Question
export const createQuestion = async (req, res) => {
    try {
        const newQ = new Question({
            ...req.body,
            teacher: req.user._id
        });
        const savedQ = await newQ.save();
        res.status(201).json(savedQ);
    } catch (error) {
        res.status(500).json({ message: 'Error creating question', error: error.message });
    }
};

// Update Question (Versioning logic)
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const oldQ = await Question.findById(id);
        if (!oldQ) return res.status(404).json({ message: 'Question not found' });
        
        if (oldQ.teacher.toString() !== req.user._id.toString() && req.user.role !== 'UniversityAdmin' && req.user.role !== 'HOD') {
            return res.status(403).json({ message: 'Not authorized to update this question' });
        }

        const { default: QuestionMapping } = await import('../models/QuestionMapping.js');
        const isUsed = await QuestionMapping.findOne({ 'questions.questionId': id });

        // Handle versioning logic
        if (isUsed || oldQ.status === 'Approved') {
            // Create a new version if the old one was approved or used in a mapping
            let [major, minor] = oldQ.version.split('.').map(Number);
            const newVersionStr = `${major + 1}.0`; // bump major version
            
            const newQ = new Question({
                ...oldQ.toObject(),
                _id: undefined, // remove old ID
                ...req.body,
                version: newVersionStr,
                previousVersionId: oldQ._id,
                status: 'Draft', // reset status for new version
                changeDate: Date.now(),
                changedBy: req.user._id
            });
            const savedNewQ = await newQ.save();
            
            // Optionally, archive the old one
            oldQ.status = 'Archived';
            await oldQ.save();
            
            return res.status(201).json(savedNewQ);
        } else {
            // Just update in place if still in Draft/Returned state
            let [major, minor] = oldQ.version.split('.').map(Number);
            minor += 1;
            
            const updated = await Question.findByIdAndUpdate(id, {
                ...req.body,
                version: `${major}.${minor}`,
                changeDate: Date.now(),
                changedBy: req.user._id
            }, { new: true });
            return res.status(200).json(updated);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating question', error: error.message });
    }
};

// Delete/Archive Question
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const oldQ = await Question.findById(id);
        if (!oldQ) return res.status(404).json({ message: 'Question not found' });
        
        if (oldQ.teacher.toString() !== req.user._id.toString() && req.user.role !== 'UniversityAdmin' && req.user.role !== 'HOD') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (oldQ.status === 'Approved') {
            oldQ.status = 'Archived';
            await oldQ.save();
            res.status(200).json({ message: 'Question archived instead of deleted because it was approved', question: oldQ });
        } else {
            await Question.findByIdAndDelete(id);
            res.status(200).json({ message: 'Question deleted permanently' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting question', error: error.message });
    }
};

// Stats
export const getStats = async (req, res) => {
    try {
        const { course } = req.query;
        let filter = { teacher: req.user._id };
        if (course) filter.course = course;

        const total = await Question.countDocuments(filter);
        const active = await Question.countDocuments({ ...filter, status: 'Approved' });
        const archived = await Question.countDocuments({ ...filter, status: 'Archived' });
        const draft = await Question.countDocuments({ ...filter, status: 'Draft' });
        
        const mcq = await Question.countDocuments({ ...filter, type: 'MCQ' });
        const subjective = await Question.countDocuments({ ...filter, type: { $in: ['Short Question', 'Long Question', 'Case Study'] } });
        const coding = await Question.countDocuments({ ...filter, type: 'Coding Question' });
        const practical = await Question.countDocuments({ ...filter, type: 'Practical Question' });

        res.status(200).json({
            total, active, archived, draft, mcq, subjective, coding, practical
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating stats', error: error.message });
    }
};
