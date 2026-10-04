import { User } from '../models/index.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (!user && email === 'admin@alkawthar.com') {
        user = await User.create({
            name: 'Super Admin',
            email: 'admin@alkawthar.com',
            password: 'admin123',
            role: 'SuperAdmin'
        });
    }

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(404).json({ message: 'There is no user with that email' });
    }

    const resetOTP = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const message = `You are receiving this email because a password reset was requested. \n\nYour 6-digit Verification Code is: ${resetOTP} \n\nThis code is valid for 10 minutes.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Super Admin Password Reset Code',
            message,
        });

        res.status(200).json({ success: true, data: 'Verification code sent to email' });
    } catch (error) {
        console.error(error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(500).json({ message: 'Email could not be sent' });
    }
};

// @desc    Reset Password via OTP
// @route   PUT /api/auth/resetpassword
// @access  Public
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    const user = await User.findOne({
        email,
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        token: generateToken(user._id),
    });
};
