import Role from '../models/Role.js';

// @desc    Get all roles (paginated, search, filter)
// @route   GET /api/roles
// @access  Private/SuperAdmin
export const getRoles = async (req, res) => {
    try {
        const page   = parseInt(req.query.page)   || 1;
        const limit  = parseInt(req.query.limit)  || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';

        const filter = { isDeleted: false };
        if (search) {
            filter.$or = [
                { name:        { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) filter.status = status;

        const total = await Role.countDocuments(filter);
        const roles = await Role.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: roles,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new Role
// @route   POST /api/roles
// @access  Private/SuperAdmin
export const createRole = async (req, res) => {
    try {
        const { name, description, status, permissions } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Role name is required' });

        const exists = await Role.findOne({ name, isDeleted: false });
        if (exists) return res.status(400).json({ success: false, message: 'A role with this name already exists' });

        const role = await Role.create({ 
            name, 
            description, 
            status,
            permissions: permissions || [] 
        });
        res.status(201).json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a Role
// @route   PUT /api/roles/:id
// @access  Private/SuperAdmin
export const updateRole = async (req, res) => {
    try {
        const { name, description, status, permissions } = req.body;
        const role = await Role.findById(req.params.id);
        if (!role || role.isDeleted) return res.status(404).json({ success: false, message: 'Role not found' });

        if (name) role.name = name;
        if (description !== undefined) role.description = description;
        if (status) role.status = status;
        if (permissions) role.permissions = permissions;

        await role.save();
        res.json({ success: true, data: role });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft-delete a Role
// @route   DELETE /api/roles/:id
// @access  Private/SuperAdmin
export const deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role || role.isDeleted) return res.status(404).json({ success: false, message: 'Role not found' });

        role.isDeleted = true;
        role.deletedAt = new Date();
        await role.save();

        res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
