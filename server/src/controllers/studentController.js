import { Student, User } from '../models/index.js';

// @desc    Get student profile by user ID
// @route   GET /api/students/:userId
// @access  Private
export const getStudentProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        let profile = await Student.findOne({ user: userId })
            .populate('academicInfo.batch', 'name code')
            .populate('academicInfo.program', 'name code')
            .populate('academicInfo.department', 'name code');
        
        if (!profile) {
            // Create an empty profile if none exists
            profile = await Student.create({ user: userId });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Server error retrieving student profile' });
    }
};

// @desc    Update Personal Info
// @route   PUT /api/students/:userId/personal
// @access  Private
export const updatePersonalInfo = async (req, res) => {
    try {
        const profile = await Student.findOneAndUpdate(
            { user: req.params.userId },
            { $set: { personalInfo: req.body } },
            { new: true, upsert: true }
        )
        .populate('academicInfo.batch', 'name code')
        .populate('academicInfo.program', 'name code')
        .populate('academicInfo.department', 'name code');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update personal info' });
    }
};

// @desc    Update Guardian Info
// @route   PUT /api/students/:userId/guardian
// @access  Private
export const updateGuardianInfo = async (req, res) => {
    try {
        const profile = await Student.findOneAndUpdate(
            { user: req.params.userId },
            { $set: { guardianInfo: req.body } },
            { new: true, upsert: true }
        )
        .populate('academicInfo.batch', 'name code')
        .populate('academicInfo.program', 'name code')
        .populate('academicInfo.department', 'name code');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update guardian info' });
    }
};

// @desc    Update Academic Info
// @route   PUT /api/students/:userId/academic
// @access  Private
export const updateAcademicInfo = async (req, res) => {
    try {
        const profile = await Student.findOneAndUpdate(
            { user: req.params.userId },
            { $set: { academicInfo: req.body } },
            { new: true, upsert: true }
        )
        .populate('academicInfo.batch', 'name code')
        .populate('academicInfo.program', 'name code')
        .populate('academicInfo.department', 'name code');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update academic info' });
    }
};

// @desc    Upload Document
// @route   POST /api/students/:userId/documents
// @access  Private
export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newDoc = {
            name: req.body.name || req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            type: req.file.mimetype
        };

        const profile = await Student.findOneAndUpdate(
            { user: req.params.userId },
            { $push: { documents: newDoc } },
            { new: true }
        )
        .populate('academicInfo.batch', 'name code')
        .populate('academicInfo.program', 'name code')
        .populate('academicInfo.department', 'name code');

        res.json(profile);
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'Failed to upload document' });
    }
};

// @desc    Delete Document
// @route   DELETE /api/students/:userId/documents/:docId
// @access  Private
export const deleteDocument = async (req, res) => {
    try {
        const profile = await Student.findOneAndUpdate(
            { user: req.params.userId },
            { $pull: { documents: { _id: req.params.docId } } },
            { new: true }
        )
        .populate('academicInfo.batch', 'name code')
        .populate('academicInfo.program', 'name code')
        .populate('academicInfo.department', 'name code');
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete document' });
    }
};
