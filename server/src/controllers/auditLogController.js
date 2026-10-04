import AuditLog from '../models/AuditLog.js';

// @desc    Get all granular audit logs (entity-level changes)
// @route   GET /api/audit-logs
// @access  Private (Admin, QEC, SystemAdmin)
export const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', date, entityType } = req.query;

        const query = {};

        if (entityType) query.entityType = entityType;

        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            query.timestamp = { $gte: start, $lt: end };
        }

        if (search) {
            query.$or = [
                { entityType: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('performedBy', 'name email role')
            .sort({ timestamp: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        res.json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            data: logs
        });
    } catch (error) {
        console.error('Audit Log Fetch Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
