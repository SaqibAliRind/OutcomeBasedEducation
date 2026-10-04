import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createUniversityAdmin } from '../../store/adminSlice';
import { UserPlus, X, Loader2 } from 'lucide-react';

const CreateAdmin = ({ onClose, onSave, universityId }) => {
    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.admin);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '', email: '', username: '', password: '', phone: '',
        university: universityId || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.email || !formData.password) {
            setError('Name, email and password are required.');
            return;
        }
        const result = await dispatch(createUniversityAdmin(formData));
        if (createUniversityAdmin.fulfilled.match(result)) {
            onClose();
        } else {
            setError(result.payload?.message || result.error?.message || 'Failed to create admin.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel-dash" style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={20} color="#0ff0fc" /> Register University Admin
                    </h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                {error && <div style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', padding: '10px 14px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem', borderLeft: '3px solid #ff1b6b' }}>{error}</div>}

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input name="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Dr. Ahmed Khan" />
                    </div>
                    <div className="form-group">
                        <label>Email Address *</label>
                        <input name="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="admin@university.edu" />
                    </div>
                    <div className="form-group">
                        <label>Username (optional)</label>
                        <input name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="e.g., ahmed.khan" />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+923001234567" />
                    </div>
                    <div className="form-group">
                        <label>Initial Password *</label>
                        <input name="password" type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min 8 characters" />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? <Loader2 className="spinner" size={18} /> : <><UserPlus size={16} /> Create Admin</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAdmin;
