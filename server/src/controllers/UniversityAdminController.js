import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Get all University Admins (paginated, searchable)
// @route   GET /api/admins/university-admin
// @access  Private/SuperAdmin
export const getUniversityAdmins = async (req, res) => {
    try {
        const page   = parseInt(req.query.page)  || 1;
        const limit  = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const filter = { role: 'UniversityAdmin', isDeleted: false };
        if (search) {
            filter.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(filter);
        const admins = await User.find(filter)
            .select('-password')
            .populate('university', 'name code')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            data: admins,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft-delete a University Admin
// @route   DELETE /api/admins/university-admin/:id
// @access  Private/SuperAdmin
export const deleteUniversityAdmin = async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        if (!admin || admin.isDeleted) return res.status(404).json({ success: false, message: 'Admin not found' });

        admin.isDeleted = true;
        admin.isActive  = false;
        await admin.save();

        res.json({ success: true, message: 'Admin account removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create University Admin
// @route   POST /api/admins/university-admin
// @access  Private/SuperAdmin
export const createUniversityAdmin = async (req, res) => {
    try {
        const { name, email, phone, username, password, profilePicture, university } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }

        // Build OR conditions — only include username if provided
        const orConditions = [{ email }];
        if (username) orConditions.push({ username });

        // 1. Check if user already exists
        const userExists = await User.findOne({ $or: orConditions });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
        }

        // 2. Create the admin user
        const newAdminData = {
            name,
            email,
            phone,
            password, // Will be hashed automatically by the pre('save') hook in your User model
            profilePicture,
            role: 'UniversityAdmin',
            isActive: true,
            forcePasswordChange: true // Forces them to change password on first login
        };
        
        if (username && username.trim() !== '') {
            newAdminData.username = username.trim();
        }

        if (university) {
            newAdminData.university = university;
        }

        const admin = await User.create(newAdminData);

        // Remove password from response
        const adminData = admin.toObject();
        delete adminData.password;

        res.status(201).json({ success: true, data: adminData });
    } catch (error) {
        console.error('Create Admin Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update University Admin Profile
// @route   PUT /api/admins/university-admin/:id
// @access  Private/SuperAdmin
export const updateUniversityAdmin = async (req, res) => {
    try {
        const { name, email, phone, profilePicture, university, status } = req.body;

        const admin = await User.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        if (name) admin.name = name;
        if (email) admin.email = email;
        if (phone) admin.phone = phone;
        if (profilePicture) admin.profilePicture = profilePicture;
        if (status) admin.isActive = status === 'Active';
        
        if (university !== undefined) {
             admin.university = university === '' ? null : university;
        }

        await admin.save();

        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate Temporary Password & Reset
// @route   PUT /api/admins/university-admin/:id/reset-password
// @access  Private/SuperAdmin
export const resetAdminPassword = async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // Generate an 8-character random alphanumeric password
        const tempPassword = crypto.randomBytes(4).toString('hex');

        admin.password = tempPassword;
        admin.forcePasswordChange = true;
        await admin.save(); // Password will be hashed by the pre-save hook

        // TODO: Trigger an email to send the `tempPassword` to admin.email here

        res.json({
            success: true,
            message: 'Temporary password generated successfully',
            tempPassword // Return this to SuperAdmin UI so they can copy it if email fails
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Activate or Deactivate User
// @route   PATCH /api/admins/university-admin/:id/status
// @access  Private/SuperAdmin
export const toggleAdminStatus = async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        admin.isActive = !admin.isActive;
        await admin.save();

        res.json({
            success: true,
            message: `Admin account ${admin.isActive ? 'activated' : 'deactivated'}`,
            isActive: admin.isActive
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};