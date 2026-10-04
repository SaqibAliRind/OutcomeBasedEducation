import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import '../style/Login.css';
import { ShieldAlert, User, Lock, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch, email, password]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(loginUser({ email, password }));
    };

    return (
        <div className="login-container">
            <div className="blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="glass-panel">
                <div className="login-header">
                    <div className="icon-wrapper">
                        <ShieldAlert size={36} className="super-icon" />
                    </div>
                    <h2>Super Admin</h2>
                    <p>Secured Area Authentication</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <User className="input-icon" size={20} />
                        <input 
                            type="email" 
                            placeholder="Email address" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    
                    <div className="input-group" style={{ position: 'relative' }}>
                        <Lock className="input-icon" size={20} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Current password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingRight: '40px' }}
                        />
                        <button 
                            type="button"
                            className="password-toggle-btn"
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
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
                            <>
                                <span>AUTHENTICATE</span>
                                <LogIn size={20} />
                            </>
                        )}
                    </button>
                    
                    <div className="no-registration" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', alignItems: 'center' }}>
                        <Link to="/forgotpassword" style={{ color: '#0ff0fc', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Forgot your password?
                        </Link>
                        <i>Restricted access. Public registration disabled.</i>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
