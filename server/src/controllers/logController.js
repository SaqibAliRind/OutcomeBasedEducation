import Log from '../models/Log.js';

// ─── Helper: Create a log entry (used internally by other controllers) ───────
export const createLog = async ({ logType, user, role, module, action, ipAddress, device, browser, status = 'Success', university, field, oldValue, newValue, changedBy, remarks, errorCode, errorMessage, stackTrace }) => {
  try {
    await Log.create({ logType, user, role, module, action, ipAddress, device, browser, status, university, field, oldValue, newValue, changedBy, remarks, errorCode, errorMessage, stackTrace });
  } catch (err) {
    console.error('Log creation failed:', err.message);
  }
};

// ─── Helper: Extract browser/device from User-Agent ──────────────────────────
const parseUA = (ua = '') => {
  let browser = 'Unknown';
  let device = 'Desktop';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
  else if (ua.includes('Tablet')) device = 'Tablet';
  return { browser, device };
};

// @desc    Get all logs (activity or audit), university-scoped for UniversityAdmin
// @route   GET /api/logs?type=activity|audit&page=1&limit=20&search=&date=
// @access  Private (Admin)
export const getLogs = async (req, res) => {
  try {
    const { type, page = 1, limit = 20, search = '', date, role: roleFilter, module: moduleFilter } = req.query;

    const query = {};

    // Type filter
    if (type) query.logType = type;

    // University Admin sees only their university's logs
    if (req.user?.role === 'UniversityAdmin' && req.user?.university) {
      query.university = req.user.university;
    }

    // Date filter
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.timestamp = { $gte: start, $lt: end };
    }

    // Role filter
    if (roleFilter) query.role = roleFilter;

    // Module filter
    if (moduleFilter) query.module = moduleFilter;

    // Text search
    if (search) {
      query.$or = [
        { user: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { changedBy: { $regex: search, $options: 'i' } },
        { field: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Log.countDocuments(query);
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI usage stats for a university
// @route   GET /api/logs/ai-stats
// @access  Private (Admin)
export const getAiStats = async (req, res) => {
  try {
    const { AiUsageLog } = await import('../models/index.js');

    const universityId = req.user?.university;
    const matchStage = universityId ? { universityId } : {};

    const [totals] = await AiUsageLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'Success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $ne: ['$status', 'Success'] }, 1, 0] } },
        }
      }
    ]);

    const byModule = await AiUsageLog.aggregate([
      { $match: matchStage },
      { $group: { _id: '$queryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      total: totals?.total || 0,
      success: totals?.success || 0,
      errors: totals?.failed || 0,
      byModule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete old logs (30+ days)
// @route   DELETE /api/logs
// @access  Private (SuperAdmin)
export const deleteLogs = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const result = await Log.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
    res.status(200).json({ success: true, message: `${result.deletedCount} logs deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};