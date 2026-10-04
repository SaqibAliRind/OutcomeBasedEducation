import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.section) filter.section = req.query.section;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.program) filter.program = req.query.program;

        // Security enforcement
        if (req.user && req.user.role === 'HOD') {
            filter.department = req.user.department;
        } else if (req.user && req.user.role === 'ProgramCoordinator') {
            filter.program = req.user.program;
        }

        const users = await User.find(filter)
            .select('-password')
            .populate('faculty', 'name')
            .populate('department', 'name')
            .populate('program', 'name')
            .populate('batch', 'name')
            .populate('section', 'name')
            .populate('session', 'name')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// @desc    Create new user manually via Admin
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        if (role === 'SuperAdmin') {
            return res.status(403).json({ message: 'Creation of SuperAdmin accounts is prohibited.' });
        }
        if (req.user.role === 'UniversityAdmin' && role === 'UniversityAdmin') {
            return res.status(403).json({ message: 'You are not authorized to create UniversityAdmin accounts.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Extract all extended profile fields from request body
        const {
            phone, employeeId, cnic, gender, dateOfBirth, address,
            faculty, department, program, joiningDate,
            qualification, experience, office, profilePicture,
            // Additional personal
            fatherName, bloodGroup, nationality, religion, maritalStatus, emergencyContact,
            // Professional
            designation, employmentType, specialization,
            // Student-specific
            rollNumber, studentId, currentSemester, cgpa, gpa, academicStatus,
            completedCredits, remainingCredits,
            guardianName, guardianPhone,
            section, session, batch,
            admissionDate, admissionType, scholarship
        } = req.body;

        const userData = {
            name, email, password,
            role: role || 'Student',
            isActive: true,
            phone, employeeId, cnic, gender,
            dateOfBirth: dateOfBirth || undefined,
            address, faculty: faculty || undefined,
            department: department || undefined,
            program: program || undefined,
            joiningDate: joiningDate || undefined,
            qualification, experience, office, profilePicture,
            fatherName, bloodGroup, nationality, religion, maritalStatus, emergencyContact,
            designation, employmentType, specialization,
            rollNumber, studentId, currentSemester, cgpa, gpa, academicStatus,
            completedCredits, remainingCredits,
            guardianName, guardianPhone,
            section: section || undefined, session: session || undefined, batch: batch || undefined,
            admissionDate: admissionDate || undefined, admissionType, scholarship
        };

        // Remove empty strings to avoid enum validation errors
        Object.keys(userData).forEach(key => {
            if (userData[key] === '') {
                userData[key] = undefined;
            }
        });

        const user = await User.create(userData);

        const savedUser = await User.findById(user._id)
            .select('-password')
            .populate('faculty', 'name')
            .populate('department', 'name')
            .populate('program', 'name')
            .populate('batch', 'name')
            .populate('section', 'name')
            .populate('session', 'name');
            
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: error.message || 'Failed to create user' });
    }
};


// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent ANYONE from assigning the SuperAdmin role
        if (req.body.role === 'SuperAdmin' && user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Assigning the SuperAdmin role is prohibited.' });
        }
        if (req.user.role === 'UniversityAdmin' && req.body.role === 'UniversityAdmin') {
            return res.status(403).json({ message: 'You are not authorized to assign the UniversityAdmin role.' });
        }
        if (req.user.role === 'UniversityAdmin' && user.role === 'SuperAdmin') {
            return res.status(403).json({ message: 'You are not authorized to modify a SuperAdmin account.' });
        }

        // Updatable fields — basic
        const basicFields = ['name', 'email', 'role', 'phone', 'profilePicture'];
        // Extended staff/student profile fields
        const extendedFields = [
            'employeeId', 'cnic', 'gender', 'dateOfBirth', 'address',
            'faculty', 'department', 'program', 'joiningDate',
            'qualification', 'experience', 'office',
            // Additional personal
            'fatherName', 'bloodGroup', 'nationality', 'religion', 'maritalStatus', 'emergencyContact',
            // Professional
            'designation', 'employmentType', 'specialization',
            // Student
            'rollNumber', 'studentId', 'currentSemester', 'cgpa', 'gpa', 'academicStatus',
            'completedCredits', 'remainingCredits',
            'guardianName', 'guardianPhone',
            'section', 'session', 'batch',
            'admissionDate', 'admissionType', 'scholarship'
        ];

        [...basicFields, ...extendedFields].forEach(field => {
            if (req.body[field] !== undefined) {
                // Coerce empty strings to null/undefined to avoid cast/enum validation errors
                const objectIdFields = ['faculty', 'department', 'program', 'section', 'session', 'batch'];
                if (req.body[field] === '') {
                    if (objectIdFields.includes(field)) {
                        user[field] = null;
                    } else {
                        user[field] = undefined; // helps with empty strings for enum fields like gender
                    }
                } else {
                    user[field] = req.body[field];
                }
            }
        });

        await user.save();
        const savedUser = await User.findById(user._id)
            .select('-password')
            .populate('faculty', 'name')
            .populate('department', 'name')
            .populate('program', 'name')
            .populate('batch', 'name')
            .populate('section', 'name')
            .populate('session', 'name');
            
        res.json(savedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: error.message || 'Failed to update user' });
    }
};


// @desc    Toggle User Active Status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if(user.email === 'admin@alkawthar.com') { // Prevent deactivating system core
                return res.status(403).json({ message: 'Cannot deactivate root Super Admin' });
            }
            user.isActive = !user.isActive;
            await user.save();
            res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, isActive: user.isActive });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle user status' });
    }
};

// @desc    Admin Reset User Password
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
export const adminResetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (user) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password has been forcefully reset by admin' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to reset password' });
    }
};

// @desc    Delete User
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if(user.email === 'admin@alkawthar.com') {
                return res.status(403).json({ message: 'Cannot delete root Super Admin' });
            }
            await user.deleteOne();
            res.json({ message: 'User removed from the system successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

// @desc    Bulk create users from CSV import
// @route   POST /api/users/bulk
// @access  Private/Admin
export const bulkCreateUsers = async (req, res) => {
    try {
        const usersToCreate = req.body.users;
        
        if (!usersToCreate || !Array.isArray(usersToCreate) || usersToCreate.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of users.' });
        }

        // Default password generation for users missing passwords
        const mappedUsers = usersToCreate.map(user => ({
            name: user.name,
            email: user.email,
            password: user.password || Math.random().toString(36).slice(-8), // default random password
            role: user.role || 'Student',
            isActive: true
        }));

        // Insert many
        const createdUsers = await User.insertMany(mappedUsers);

        res.status(201).json({
            message: `${createdUsers.length} users successfully imported.`,
            count: createdUsers.length
        });
    } catch (error) {
        console.error('Bulk create user error:', error);
        res.status(500).json({ message: error.message || 'Failed to bulk create users' });
    }
};
