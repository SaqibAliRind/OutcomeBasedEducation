import User from '../models/User.js';
import Student from '../models/Student.js';
import crypto from 'crypto';

export const admitStudent = async (req, res) => {
    try {
        const { 
            name, email, password, generatePassword,
            batch, program, department, currentSemester,
            studentId, rollNumber, generateIds
        } = req.body;

        // 1. Validation
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }
        if (!batch || !program || !department) {
            return res.status(400).json({ message: 'Batch, program, and department are required.' });
        }

        // 2. Generate Credentials if requested
        let finalPassword = password;
        if (generatePassword) {
            finalPassword = crypto.randomBytes(4).toString('hex'); // 8 char random password
        } else if (!password) {
            return res.status(400).json({ message: 'Password is required if not auto-generating.' });
        }

        // 3. Generate IDs if requested
        let finalStudentId = studentId;
        let finalRollNumber = rollNumber;

        if (generateIds) {
            // Very simple auto-generate logic: YY-PROG-XXXX
            // In a real app, we'd fetch the batch and program codes.
            // For now, generate a random 4-digit number.
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            finalStudentId = `STU-${new Date().getFullYear().toString().slice(-2)}-${randomNum}`;
            finalRollNumber = `RN-${randomNum}`;
        } else if (!studentId || !rollNumber) {
            return res.status(400).json({ message: 'Student ID and Roll Number are required if not auto-generating.' });
        }

        // 4. Create User
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const user = await User.create({
            name,
            email,
            password: finalPassword,
            role: 'Student',
            isActive: true
        });

        // 5. Create Student Profile
        const student = await Student.create({
            user: user._id,
            studentId: finalStudentId,
            rollNumber: finalRollNumber,
            academicInfo: {
                batch,
                program,
                department,
                currentSemester: currentSemester || 1,
                cgpa: 0
            },
            personalInfo: {},
            guardianInfo: {},
            documents: []
        });

        res.status(201).json({
            message: 'Student admitted successfully',
            user: { _id: user._id, name: user.name, email: user.email },
            studentId: student.studentId,
            rollNumber: student.rollNumber,
            generatedPassword: generatePassword ? finalPassword : null
        });

    } catch (error) {
        console.error('Admit Student Error:', error);
        res.status(500).json({ message: 'Server error admitting student.' });
    }
};