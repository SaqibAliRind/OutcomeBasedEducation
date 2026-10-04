import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPasswordUser, clearError } from '../store/authSlice';
import '../style/ForgotPassword.css';
import { ShieldAlert, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        const res = await dispatch(forgotPasswordUser(email));
        if (res.meta.requestStatus === 'fulfilled') {
            navigate('/resetpassword', { state: { email } });
        }
    };

    return (
        <div className="login-container">
            <div className="blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="glass-panel">
                <div className="login-header">
                    <div className="icon-wrapper">
                        <ShieldAlert size={36} className="super-icon" />
                    </div>
                    <h2>Password Recovery</h2>
                    <p>Enter email to receive a verification code</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <Mail className="input-icon" size={20} />
                        <input 
                            type="email" 
                            placeholder="Registered Account Email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <span className="error-text">{error}</span>
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
                            <span>SEND VERIFICATION CODE</span>
                        )}
                    </button>
                    
                    <div className="no-registration" style={{ display: 'flex', justifyContent: 'center', marginTop: '1.2rem' }}>
                        <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
