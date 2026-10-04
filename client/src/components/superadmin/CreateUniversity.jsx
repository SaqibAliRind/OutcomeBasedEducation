import React, { useState, useEffect } from 'react';
import { X, Save, Building } from 'lucide-react';
import '../../style/SuperAdminDashboard.css';

const CreateUniversity = ({ onClose, onSave, initialData }) => {
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        code: '',
        logo: '',
        banner: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        province: '',
        country: '',
        postalCode: '',
        hecNo: '',
        nceacStatus: 'Pending',
        timeZone: 'Asia/Karachi',
        currency: 'PKR',
        status: 'Active'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                shortName: initialData.shortName || '',
                code: initialData.code || '',
                logo: initialData.logo || '',
                banner: initialData.banner || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                website: initialData.website || '',
                address: initialData.address || '',
                city: initialData.city || '',
                province: initialData.province || '',
                country: initialData.country || '',
                postalCode: initialData.postalCode || '',
                hecNo: initialData.hecNo || '',
                nceacStatus: initialData.nceacStatus || 'Pending',
                timeZone: initialData.timeZone || 'Asia/Karachi',
                currency: initialData.currency || 'PKR',
                status: initialData.status || 'Active'
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(isEditMode ? { ...formData, _id: initialData._id } : formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel-dash" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={22} color="#0ff0fc" />
                        {isEditMode ? 'Edit University' : 'Create New University'}
                    </h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    {/* Section 1: Basic Information */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h4 style={{ color: '#bc13fe', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Basic Information</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            <div className="form-group">
                                <label>University Name *</label>
                                <input name="name" value={formData.name} required onChange={handleChange} placeholder="e.g., Karachi University" />
                            </div>
                            <div className="form-group">
                                <label>Short Name *</label>
                                <input name="shortName" value={formData.shortName} required onChange={handleChange} placeholder="e.g., UOK" />
                            </div>
                            <div className="form-group">
                                <label>University Code *</label>
                                <input name="code" value={formData.code} required onChange={handleChange} placeholder="e.g., UOK-001" disabled={isEditMode} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '10px' }}>
                            <div className="form-group">
                                <label>Logo URL</label>
                                <input name="logo" value={formData.logo} onChange={handleChange} placeholder="https://example.com/logo.png" />
                            </div>
                            <div className="form-group">
                                <label>Banner URL</label>
                                <input name="banner" value={formData.banner} onChange={handleChange} placeholder="https://example.com/banner.png" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact & Address */}
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h4 style={{ color: '#bc13fe', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Contact & Location Details</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input name="email" type="email" value={formData.email} required onChange={handleChange} placeholder="info@university.edu" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input name="phone" type="tel" value={formData.phone} required onChange={handleChange} placeholder="+9221111222333" />
                            </div>
                            <div className="form-group">
                                <label>Website URL</label>
                                <input name="website" value={formData.website} onChange={handleChange} placeholder="https://www.university.edu" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '10px' }}>
                            <div className="form-group">
                                <label>Physical Address *</label>
                                <input name="address" value={formData.address} required onChange={handleChange} placeholder="Main University Road" />
                            </div>
                            <div className="form-group">
                                <label>City *</label>
                                <input name="city" value={formData.city} required onChange={handleChange} placeholder="Karachi" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '10px' }}>
                            <div className="form-group">
                                <label>Province *</label>
                                <input name="province" value={formData.province} required onChange={handleChange} placeholder="Sindh" />
                            </div>
                            <div className="form-group">
                                <label>Country *</label>
                                <input name="country" value={formData.country} required onChange={handleChange} placeholder="Pakistan" />
                            </div>
                            <div className="form-group">
                                <label>Postal Code</label>
                                <input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="75270" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Accreditations & Regional Settings */}
                    <div>
                        <h4 style={{ color: '#bc13fe', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Accreditations & Regional Settings</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            <div className="form-group">
                                <label>HEC Recognition No.</label>
                                <input name="hecNo" value={formData.hecNo} onChange={handleChange} placeholder="HEC-REC-9921" />
                            </div>
                            <div className="form-group">
                                <label>NCEAC Status</label>
                                <select
                                    name="nceacStatus"
                                    value={formData.nceacStatus}
                                    onChange={handleChange}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="Pending" style={{ background: '#1a1a2e', color: '#fff' }}>Pending</option>
                                    <option value="Accredited" style={{ background: '#1a1a2e', color: '#fff' }}>Accredited</option>
                                    <option value="Not Accredited" style={{ background: '#1a1a2e', color: '#fff' }}>Not Accredited</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Time Zone</label>
                                <input name="timeZone" value={formData.timeZone} onChange={handleChange} placeholder="Asia/Karachi" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '10px' }}>
                            <div className="form-group">
                                <label>Currency</label>
                                <input name="currency" value={formData.currency} onChange={handleChange} placeholder="PKR" />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="Active" style={{ background: '#1a1a2e', color: '#fff' }}>Active</option>
                                    <option value="Inactive" style={{ background: '#1a1a2e', color: '#fff' }}>Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="primary-btn"><Save size={18} /> {isEditMode ? 'Update University' : 'Save University'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUniversity;
