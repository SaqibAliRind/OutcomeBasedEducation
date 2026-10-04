import University from '../models/University.js';

// @desc    Create a new University
// @route   POST /api/universities
// @access  Private/SuperAdmin
export const createUniversity = async (req, res) => {

    try {
        const {
            name, shortName, code, logo, banner,
            email, phone, website, address, city, province, country, postalCode,
            hecNo, nceacStatus, timeZone, currency, status
        } = req.body;

        // Validation for required fields as defined in schema
        if (!name || !shortName || !code || !email || !phone || !address || !city || !province || !country) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all required fields: name, shortName, code, email, phone, address, city, province, and country.'
            });
        }

        // Check for duplicates
        const existingUni = await University.findOne({ $or: [{ name }, { code }, { email }] });
        if (existingUni) {
            return res.status(400).json({ success: false, message: 'University with this name, code, or email already exists' });
        }

        // Create university with all fields
        const university = await University.create({
            name, shortName, code, logo, banner,
            email, phone, website, address, city, province, country, postalCode,
            hecNo, nceacStatus, timeZone, currency, status
        });

        res.status(201).json({ success: true, data: university });
    } catch (error) {
        console.error('Create University Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all Universities
// @route   GET /api/universities
// @access  Private/SuperAdmin
export const getUniversities = async (req, res) => {
    try {
        // Exclude soft-deleted universities by default
        const universities = await University.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.json({ success: true, count: universities.length, data: universities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update University (Basic info & Settings)
// @route   PUT /api/universities/:id
// @access  Private/SuperAdmin

export const updateUniversity = async (req, res) => {
    try {
        // Fix: Agar currentSession ya currentSemester khali string aayi hai, toh usko null set kar dein
        // Frontend sends nested settings.academic, so we check req.body.settings.academic
        if (req.body.settings?.academic) {
            if (req.body.settings.academic.currentSession === '') {
                req.body.settings.academic.currentSession = null;
            }
            if (req.body.settings.academic.currentSemester === '') {
                req.body.settings.academic.currentSemester = null;
            }
        }

        const university = await University.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { returnDocument: 'after', runValidators: true }
        );

        if (!university || university.isDeleted) {
            return res.status(404).json({ success: false, message: 'University not found' });
        }

        res.json({ success: true, data: university });
    } catch (error) {
        console.error('\n🔴 UPDATE ERROR DETAILS:', error.message, '\n');
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete University
// @route   DELETE /api/universities/:id
// @access  Private/SuperAdmin
export const deleteUniversity = async (req, res) => {
    try {
        const { permanent } = req.query;

        if (permanent === 'true') {
            // Hard Delete
            await University.findByIdAndDelete(req.params.id);
            return res.json({ success: true, message: 'University permanently deleted' });
        } else {
            // Soft Delete
            const university = await University.findByIdAndUpdate(
                req.params.id,
                { isDeleted: true, deletedAt: new Date(), status: 'Inactive' },
                { returnDocument: 'after' }
            );
            return res.json({ success: true, message: 'University softly deleted', data: university });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};