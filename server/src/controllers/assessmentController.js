import AssessmentSetting from '../models/AssessmentSetting.js';

// @desc    Get all Assessment Settings (optionally filter by program)
// @route   GET /api/assessments?program=programId
// @access  Private
export const getAssessmentSettings = async (req, res) => {
    try {
        const filter = req.query.program ? { program: req.query.program } : {};
        const settings = await AssessmentSetting.find(filter)
            .populate('program', 'name code')
            .sort({ program: 1, type: 1 });
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an Assessment Setting
// @route   POST /api/assessments
// @access  Private/Admin
export const createAssessmentSetting = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const { program, type, weightage, passingMarks, totalMarks } = req.body;

        // Validation for weightage <= 100
        const existingSettings = await AssessmentSetting.find({ program, status: 'Active' });
        const totalWeightage = existingSettings.reduce((sum, s) => sum + s.weightage, 0);

        if (totalWeightage + Number(weightage) > 100) {
            return res.status(400).json({ 
                message: `Total weightage for this program exceeds 100%. Current active total: ${totalWeightage}%. You can add at most ${100 - totalWeightage}%.` 
            });
        }

        if (Number(passingMarks) > Number(totalMarks)) {
            return res.status(400).json({ message: 'Passing marks cannot be greater than total marks.' });
        }

        const setting = new AssessmentSetting(req.body);
        const savedSetting = await setting.save();

        const populatedSetting = await AssessmentSetting.findById(savedSetting._id).populate('program', 'name code');
        res.status(201).json(populatedSetting);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Assessment Setting for this type already exists for this program.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an Assessment Setting
// @route   PUT /api/assessments/:id
// @access  Private/Admin
export const updateAssessmentSetting = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const { program, weightage, passingMarks, totalMarks, status } = req.body;
        
        const settingToUpdate = await AssessmentSetting.findById(req.params.id);
        if (!settingToUpdate) return res.status(404).json({ message: 'Assessment Setting not found' });

        // Validate weightage if it or status is being changed
        const activeProgramId = program || settingToUpdate.program;
        
        // Find all other settings for this program
        const existingSettings = await AssessmentSetting.find({ 
            program: activeProgramId, 
            _id: { $ne: req.params.id },
            status: 'Active' 
        });

        let newStatus = status || settingToUpdate.status;
        let newWeightage = weightage !== undefined ? Number(weightage) : settingToUpdate.weightage;

        if (newStatus === 'Active') {
            const otherTotalWeightage = existingSettings.reduce((sum, s) => sum + s.weightage, 0);
            if (otherTotalWeightage + newWeightage > 100) {
                return res.status(400).json({ 
                    message: `Total weightage exceeds 100%. Other active settings total: ${otherTotalWeightage}%. You can set at most ${100 - otherTotalWeightage}%.` 
                });
            }
        }

        const newPassing = passingMarks !== undefined ? Number(passingMarks) : settingToUpdate.passingMarks;
        const newTotal = totalMarks !== undefined ? Number(totalMarks) : settingToUpdate.totalMarks;

        if (newPassing > newTotal) {
            return res.status(400).json({ message: 'Passing marks cannot be greater than total marks.' });
        }

        const updatedSetting = await AssessmentSetting.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        ).populate('program', 'name code');

        res.status(200).json(updatedSetting);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Assessment Setting for this type already exists for this program.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an Assessment Setting
// @route   DELETE /api/assessments/:id
// @access  Private/Admin
export const deleteAssessmentSetting = async (req, res) => {
    try {
        const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(req.user.role);
        if (!isAdmin) return res.status(403).json({ message: 'Not authorized' });

        const deletedSetting = await AssessmentSetting.findByIdAndDelete(req.params.id);
        if (!deletedSetting) return res.status(404).json({ message: 'Assessment Setting not found' });
        
        res.status(200).json({ message: 'Assessment Setting deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
