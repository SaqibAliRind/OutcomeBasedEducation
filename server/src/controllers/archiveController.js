import { User, Course, Assessment, Attendance, Mark, Survey, WorkflowRequest, Notification } from '../models/index.js';

// Helper to get model based on type
const getModelByType = (type) => {
    switch (type) {
        case 'Students': return { model: User, query: { role: 'Student' } };
        case 'Teachers': return { model: User, query: { role: 'Teacher' } };
        case 'Courses': return { model: Course, query: {} };
        case 'Assessments': return { model: Assessment, query: {} };
        case 'Surveys': return { model: Survey, query: {} };
        case 'Notifications': return { model: Notification, query: {} };
        // For others, fallback to a placeholder or generic model if available
        default: return null;
    }
};

// @desc    Get Archives based on type
// @route   GET /api/archive
// @access  Private/Admin
export const getArchives = async (req, res) => {
    try {
        const { type, session, semester, search } = req.query;
        const university = req.user.university;
        
        const config = getModelByType(type);
        if (!config) {
            // If the model isn't mapped yet, return empty to prevent crash
            return res.json([]);
        }
        
        let query = { ...config.query, isDeleted: true };
        
        // Admins can see university wide archives. If not super admin, restrict by university.
        if (req.user.role !== 'SuperAdmin') {
            query.university = university;
        }

        // Apply search if provided
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const data = await config.model.find(query).sort({ updatedAt: -1 }).lean();
        res.json(data);
    } catch (error) {
        console.error('Error fetching archives:', error);
        res.status(500).json({ message: 'Server error retrieving archives' });
    }
};

// @desc    Restore Archived Item
// @route   PUT /api/archive/:id/restore
// @access  Private/Admin
export const restoreArchive = async (req, res) => {
    try {
        const { type } = req.body;
        const config = getModelByType(type);
        if (!config) return res.status(400).json({ message: 'Invalid type' });

        const item = await config.model.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        item.isDeleted = false;
        await item.save();

        res.json({ message: 'Item restored successfully', id: item._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Permanently Delete Item
// @route   DELETE /api/archive/:id/permanent
// @access  Private/SuperAdmin
export const permanentDeleteArchive = async (req, res) => {
    try {
        // Only SuperAdmin can permanently delete
        if (req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Permanent deletion requires Super Admin permission.' });
        }

        const { type } = req.query;
        const config = getModelByType(type);
        if (!config) return res.status(400).json({ message: 'Invalid type' });

        const item = await config.model.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        await item.deleteOne();

        res.json({ message: 'Item permanently deleted', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
