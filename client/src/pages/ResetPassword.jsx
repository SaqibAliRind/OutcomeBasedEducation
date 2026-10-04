import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordUser, clearError } from '../store/authSlice';
import { Lock, Loader2, KeyRound, Mail, Hash } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        setLocalError('');

        if (newPassword !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        const res = await dispatch(resetPasswordUser({ email, otp, newPassword }));
        if (res.meta.requestStatus === 'fulfilled') {
            navigate('/login');
        }
    };

    return (
        <div className="login-container">
            <div className="blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2" style={{ background: '#ff1b6b' }}></div>
            </div>

            <div className="glass-panel">
                <div className="login-header">
                    <div className="icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(255, 27, 107, 0.2), rgba(69, 202, 255, 0.2))' }}>
                        <KeyRound size={36} className="super-icon" />
                    </div>
                    <h2>Verify & Reset</h2>
                    <p>Enter the 6-digit code sent to your email</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group">
                        <Hash className="input-icon" size={20} />
                        <input 
                            type="text" 
                            placeholder="6-Digit OTP Code" 
                            required 
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input 
                            type="password" 
                            placeholder="New Password" 
                            required 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group">
                        <Lock className="input-icon" size={20} />
                        <input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {(error || localError) && (
                        <div className="error-message">
                            <span className="error-text">{localError || error}</span>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="login-btn" 
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="spinner" size={22} />
                        ) : (
                            <span>UPDATE PASSWORD</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
