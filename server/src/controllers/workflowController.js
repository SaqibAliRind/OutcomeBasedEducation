import { WorkflowRequest } from '../models/index.js';

// Default approval chain
const DEFAULT_CHAIN = ['Teacher', 'Program Coordinator', 'HOD', 'QEC', 'University Admin', 'Completed'];

// Get next stage in chain
const getNextStage = (chain, currentStage) => {
    const idx = chain.indexOf(currentStage);
    return chain[idx + 1] || 'Completed';
};

// ─────────────────────────────────────────────────────────────
// @desc    Get workflow requests (role-filtered)
// @route   GET /api/workflow
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getWorkflowRequests = async (req, res) => {
    try {
        const { role } = req.user;
        const university = req.user.university;
        const { module, status, page = 1, limit = 20 } = req.query;

        let query = { university };

        // Filter by module if provided
        if (module) query.module = module;
        if (status) query.status = status;
        
        // Scope to Program or Department
        if (req.query.program) query['metadata.program'] = req.query.program;
        else if (req.user.role === 'ProgramCoordinator' && req.user.program) query['metadata.program'] = req.user.program;

        if (req.query.department) query['metadata.department'] = req.query.department;
        else if (req.user.role === 'HOD' && req.user.department) query['metadata.department'] = req.user.department;

        // Role-based filtering
        if (role === 'Teacher') {
            // Teachers only see what they submitted
            query.submitter = req.user._id;
        } else if (role !== 'SuperAdmin' && role !== 'UniversityAdmin') {
            // HOD, Dean, QEC, Program Coordinator see pending items at their stage + their own
            const stageLabel = roleToStage(role);
            query.$or = [
                { currentStage: stageLabel },
                { submitter: req.user._id }
            ];
        }
        // SuperAdmin / UniversityAdmin see everything in their university

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await WorkflowRequest.countDocuments(query);
        const requests = await WorkflowRequest.find(query)
            .populate('submitter', 'name email role')
            .populate('history.actor', 'name role')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get single workflow request by ID
// @route   GET /api/workflow/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getWorkflowById = async (req, res) => {
    try {
        const request = await WorkflowRequest.findById(req.params.id)
            .populate('submitter', 'name email role')
            .populate('history.actor', 'name role')
            .lean();
        if (!request) return res.status(404).json({ message: 'Workflow request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @desc    Submit new workflow request (generic for any module)
// @route   POST /api/workflow
// @access  Private
// ─────────────────────────────────────────────────────────────
export const createWorkflowRequest = async (req, res) => {
    try {
        const { 
            title, module, referenceId, referenceModel,
            metadata, remarks, priority, dueDate, approvalChain 
        } = req.body;

        if (!title || !module) {
            return res.status(400).json({ message: 'Title and Module are required' });
        }

        // Use provided chain or default
        const chain = (approvalChain && approvalChain.length > 0) ? approvalChain : DEFAULT_CHAIN;
        
        // Determine submitter's stage in chain
        const submitterStage = roleToStage(req.user.role);
        const submitterIndex = chain.indexOf(submitterStage);
        
        // First stage after submitter
        const nextStage = submitterIndex >= 0 
            ? (chain[submitterIndex + 1] || 'Completed')
            : chain[1] || 'Completed';

        const newRequest = await WorkflowRequest.create({
            university: req.user.university,
            title,
            module,
            referenceId,
            referenceModel,
            metadata,
            submitter: req.user._id,
            currentStage: nextStage,
            approvalChain: chain,
            status: 'Pending',
            priority: priority || 'Normal',
            dueDate,
            history: [{
                actor: req.user._id,
                stage: submitterStage || 'Teacher',
                action: 'Submit',
                remarks: remarks || 'Initial submission'
            }]
        });

        const populated = await WorkflowRequest.findById(newRequest._id)
            .populate('submitter', 'name email role')
            .populate('history.actor', 'name role')
            .lean();

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @desc    Take action on a workflow request
// @route   PUT /api/workflow/:id/action
// @access  Private
// ─────────────────────────────────────────────────────────────
export const actionWorkflowRequest = async (req, res) => {
    try {
        const { action, remarks } = req.body;
        const request = await WorkflowRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Workflow request not found' });

        const chain = request.approvalChain || DEFAULT_CHAIN;
        const currentIndex = chain.indexOf(request.currentStage);

        let newStatus = request.status;
        let newStage = request.currentStage;

        switch(action) {
            case 'Approve':
            case 'Forward':
                newStage = chain[currentIndex + 1] || 'Completed';
                newStatus = newStage === 'Completed' ? 'Approved' : 'Pending';
                break;
            case 'Final Approval':
                newStage = 'Completed';
                newStatus = 'Approved';
                break;
            case 'Reject':
                newStage = 'Completed';
                newStatus = 'Rejected';
                break;
            case 'Return for Revision':
                // Return to submitter's stage (first in chain)
                newStage = chain[0];
                newStatus = 'Returned for Revision';
                break;
            case 'Review':
                newStatus = 'Under Review';
                break;
            case 'Add Comments':
                // No stage change, just record
                break;
            case 'Withdraw':
                // Only submitter can withdraw
                if (String(request.submitter) !== String(req.user._id)) {
                    return res.status(403).json({ message: 'Only the submitter can withdraw.' });
                }
                newStatus = 'Draft';
                newStage = chain[0];
                break;
            default:
                break;
        }

        request.status = newStatus;
        request.currentStage = newStage;
        request.history.push({
            actor: req.user._id,
            stage: chain[currentIndex] || request.currentStage,
            action,
            remarks
        });

        await request.save();

        const populated = await WorkflowRequest.findById(request._id)
            .populate('submitter', 'name email role')
            .populate('history.actor', 'name role')
            .lean();

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @desc    Delete a workflow request
// @route   DELETE /api/workflow/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
export const deleteWorkflowRequest = async (req, res) => {
    try {
        const request = await WorkflowRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Workflow request not found' });
        await request.deleteOne();
        res.json({ message: 'Workflow removed', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get workflow stats (dashboard KPIs) — optional filter by module
// @route   GET /api/workflow/stats
// @access  Private
// ─────────────────────────────────────────────────────────────
export const getWorkflowStats = async (req, res) => {
    try {
        const { module } = req.query;
        const match = { university: req.user.university };
        if (module) match.module = module;
        
        if (req.query.program) match['metadata.program'] = req.query.program;
        else if (req.user.role === 'ProgramCoordinator' && req.user.program) match['metadata.program'] = req.user.program;

        if (req.query.department) match['metadata.department'] = req.query.department;
        else if (req.user.role === 'HOD' && req.user.department) match['metadata.department'] = req.user.department;

        const stats = await WorkflowRequest.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const result = { Pending: 0, 'Under Review': 0, Approved: 0, Rejected: 0, 'Returned for Revision': 0, Completed: 0, Draft: 0 };
        stats.forEach(s => { result[s._id] = s.count; });
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// Helper: Map user role to workflow stage label
// ─────────────────────────────────────────────────────────────
const roleToStage = (role) => {
    const map = {
        'Teacher': 'Teacher',
        'ProgramCoordinator': 'Program Coordinator',
        'Program Coordinator': 'Program Coordinator',
        'HOD': 'HOD',
        'Dean': 'Dean',
        'QEC': 'QEC',
        'UniversityAdmin': 'University Admin',
        'University Admin': 'University Admin',
        'SuperAdmin': 'University Admin'
    };
    return map[role] || role;
};
