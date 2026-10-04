import { ObeTarget } from '../models/index.js';

// @desc    Get current OBE Targets
// @route   GET /api/targets
// @access  Private/UniversityAdmin
export const getTargets = async (req, res) => {
    try {
        const universityId = req.user.university;
        let target = await ObeTarget.findOne({ universityId });
        if (!target) {
            // Create default targets if none exist
            target = await ObeTarget.create({ universityId });
        }
        res.json(target);
    } catch (error) {
        console.error('Error fetching targets:', error);
        res.status(500).json({ message: 'Server Error retrieving targets' });
    }
};

// @desc    Update OBE Targets
// @route   PUT /api/targets
// @access  Private/UniversityAdmin
export const updateTargets = async (req, res) => {
    try {
        const universityId = req.user.university;
        const { cloTarget, ploTarget, gaTarget, programTarget, departmentTarget } = req.body;
        
        let target = await ObeTarget.findOne({ universityId });
        if (target) {
            target.cloTarget = cloTarget ?? target.cloTarget;
            target.ploTarget = ploTarget ?? target.ploTarget;
            target.gaTarget = gaTarget ?? target.gaTarget;
            target.programTarget = programTarget ?? target.programTarget;
            target.departmentTarget = departmentTarget ?? target.departmentTarget;
            await target.save();
        } else {
            target = await ObeTarget.create({ 
                universityId, cloTarget, ploTarget, gaTarget, programTarget, departmentTarget 
            });
        }
        res.json(target);
    } catch (error) {
        console.error('Error updating targets:', error);
        res.status(500).json({ message: 'Server Error updating targets' });
    }
};
