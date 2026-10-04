import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

// @desc    Get own profile
// @route   GET /api/profile/me
// @access  Private
export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .populate('university', 'name')
            .populate('department', 'name')
            .populate('program', 'name')
            .populate('faculty', 'name')
            .populate('section', 'name')
            .populate('session', 'name')
            .populate('batch', 'name')
            .lean();

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update own profile
// @route   PUT /api/profile/me
// @access  Private
export const updateMyProfile = async (req, res) => {
    try {
        const allowedFields = [
            'name', 'phone', 'cnic', 'address', 'gender', 'dateOfBirth',
            'fatherName', 'bloodGroup', 'nationality', 'religion', 'maritalStatus',
            'emergencyContact', 'qualification', 'experience', 'office',
            'designation', 'specialization', 'profilePicture'
        ];

        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpire').lean();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All password fields are required' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'New passwords do not match' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        user.forcePasswordChange = false;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.files || !req.files.profilePicture) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.files.profilePicture;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ message: 'Only JPG, PNG, and WebP images allowed' });
        }
        if (file.size > 2 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size must not exceed 2MB' });
        }

        // Move file to uploads
        const filename = `profile_${req.user._id}_${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
        const uploadPath = `uploads/profiles/${filename}`;
        await file.mv(uploadPath);

        const profilePictureUrl = `/uploads/profiles/${filename}`;
        await User.findByIdAndUpdate(req.user._id, { profilePicture: profilePictureUrl });

        res.json({ message: 'Profile picture updated', url: profilePictureUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active login sessions (token-based stub)
// @route   GET /api/profile/sessions
// @access  Private
export const getLoginSessions = async (req, res) => {
    try {
        // In a JWT-based system, this would need a session store (Redis etc.)
        // For now, return a representation of current session
        const user = await User.findById(req.user._id).select('name email updatedAt').lean();
        res.json([
            {
                id: 'current',
                device: req.headers['user-agent'] || 'Unknown',
                ip: req.ip,
                lastActive: new Date(),
                isCurrent: true
            }
        ]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
