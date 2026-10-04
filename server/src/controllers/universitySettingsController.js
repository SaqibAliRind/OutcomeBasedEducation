import University from '../models/University.js';
import Session from '../models/Session.js';
import Semester from '../models/Semester.js';

// @desc    Get my university's full settings
// @route   GET /api/university-settings
// @access  Private (UniversityAdmin)
export const getUniversitySettings = async (req, res) => {
    try {
        const university = await University.findById(req.user.university)
            .populate('settings.academic.currentSession', 'name year')
            .populate('settings.academic.currentSemester', 'name number')
            .lean();

        if (!university) return res.status(404).json({ message: 'University not found' });
        res.json(university);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update general university info
// @route   PUT /api/university-settings/general
// @access  Private (UniversityAdmin)
export const updateGeneralSettings = async (req, res) => {
    try {
        const { name, shortName, email, phone, website, address, city, province, country, postalCode, hecNo, timeZone, currency } = req.body;

        const updated = await University.findByIdAndUpdate(
            req.user.university,
            { $set: { name, shortName, email, phone, website, address, city, province, country, postalCode, hecNo, timeZone, currency } },
            { new: true, runValidators: true }
        ).lean();

        res.json({ message: 'General settings updated', university: updated });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a specific settings section
// @route   PUT /api/university-settings/section/:section
// @access  Private (UniversityAdmin)
export const updateSettingsSection = async (req, res) => {
    try {
        const { section } = req.params;
        const allowedSections = ['academic', 'obe', 'notifications', 'files', 'localization', 'branding'];

        if (!allowedSections.includes(section)) {
            return res.status(400).json({ message: `Invalid section. Allowed: ${allowedSections.join(', ')}` });
        }

        // Build the update object with dot-notation to preserve other nested fields
        const updateObj = {};
        Object.keys(req.body).forEach(key => {
            updateObj[`settings.${section}.${key}`] = req.body[key];
        });

        const updated = await University.findByIdAndUpdate(
            req.user.university,
            { $set: updateObj },
            { new: true, runValidators: true }
        ).lean();

        res.json({ message: `${section} settings updated successfully`, settings: updated.settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload university logo / banner / favicon
// @route   POST /api/university-settings/upload/:type
// @access  Private (UniversityAdmin)
export const uploadUniversityAsset = async (req, res) => {
    try {
        const { type } = req.params;
        const allowedTypes = ['logo', 'banner', 'favicon'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ message: 'Invalid upload type. Use: logo, banner, favicon' });
        }

        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.files.file;
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
        if (!allowedMimes.includes(file.mimetype)) {
            return res.status(400).json({ message: 'Only image files are allowed' });
        }
        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'File must not exceed 5MB' });
        }

        const ext = file.name.substring(file.name.lastIndexOf('.'));
        const filename = `university_${type}_${req.user.university}_${Date.now()}${ext}`;
        const uploadPath = `uploads/university/${filename}`;
        await file.mv(uploadPath);

        const url = `/uploads/university/${filename}`;
        await University.findByIdAndUpdate(req.user.university, { [type]: url });

        res.json({ message: `${type} uploaded successfully`, url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get available sessions & semesters (for dropdowns)
// @route   GET /api/university-settings/academic-options
// @access  Private (UniversityAdmin)
export const getAcademicOptions = async (req, res) => {
    try {
        const [sessions, semesters] = await Promise.all([
            Session.find({ university: req.user.university }).select('name year').sort({ createdAt: -1 }).lean(),
            Semester.find({ university: req.user.university }).select('name number').sort({ number: 1 }).lean()
        ]);
        res.json({ sessions, semesters });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
