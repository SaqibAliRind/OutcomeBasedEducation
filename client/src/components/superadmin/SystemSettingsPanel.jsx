import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettingsCategory, testSmtp, testCloudinary, triggerBackup, restoreDatabaseFromBackup, clearSettingsMessages } from '../../store/settingsSlice';
import { Mail, Key, Cloud, Database, Cpu, Loader2 } from 'lucide-react';
import axios from '../../utils/axiosInterceptor';

const SystemSettingsPanel = () => {
    const dispatch = useDispatch();
    const { config, loading, error, successMessage } = useSelector(s => s.settings);

    const [activeTab, setActiveTab] = useState('smtp');
    const [formData, setFormData] = useState({});
    
    const fileInputRef = useRef(null);
    const auth = useSelector(s => s.auth);

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        if (config && config[activeTab]) {
            setFormData(config[activeTab]);
        }
    }, [config, activeTab]);

    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => dispatch(clearSettingsMessages()), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error, dispatch]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        dispatch(updateSettingsCategory({ category: activeTab, data: formData }));
    };

    const handleTestSmtp = () => {
        if (!formData.host || !formData.email || !formData.password) {
            alert('Please fill Host, Email, and Password to test connection');
            return;
        }
        dispatch(testSmtp(formData));
    };

    const handleTestCloudinary = () => {
        if (!formData.cloudName || !formData.apiKey || !formData.apiSecret) {
            alert('Please fill Cloud Name, API Key, and API Secret to test connection');
            return;
        }
        dispatch(testCloudinary(formData));
    };

    const handleBackup = () => {
        if (window.confirm("Generate a fresh database backup? This will be saved on the server.")) {
            dispatch(triggerBackup());
        }
    };

    const handleDownloadBackup = async () => {
        try {
            const res = await axios.get('/api/settings/download-backup', {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `AlKawthar-DB-Backup.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Failed to download backup: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleRestoreChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (window.confirm(`Are you absolutely sure you want to restore the database from ${file.name}? THIS WILL OVERWRITE EXISTING DATA.`)) {
                dispatch(restoreDatabaseFromBackup(file));
            }
        }
    };

    const tabs = [
        { id: 'smtp', label: 'SMTP Config', icon: Mail },
        { id: 'jwt', label: 'JWT Security', icon: Key },
        { id: 'cloudinary', label: 'Cloudinary', icon: Cloud },
        { id: 'backup', label: 'Backup & Restore', icon: Database },
        { id: 'ai', label: 'AI Integration', icon: Cpu }
    ];

    if (!config) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="spinner-large" /></div>;
    }

    return (
        <div className="system-settings user-management">
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#0ff0fc', fontSize: '1.4rem' }}>System Settings</h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Configure global variables and API integrations</p>
            </div>

            {error && <div className="um-alert error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {successMessage && <div className="um-alert success" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Vertical Tabs Nav */}
                <div style={{ flex: '0 0 240px', background: 'rgba(0,5,15,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); dispatch(clearSettingsMessages()); }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem 1.2rem',
                                    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left',
                                    background: isActive ? 'linear-gradient(90deg, rgba(15,240,252,0.1), transparent)' : 'transparent',
                                    color: isActive ? '#0ff0fc' : 'rgba(255,255,255,0.5)',
                                    borderLeft: `3px solid ${isActive ? '#0ff0fc' : 'transparent'}`,
                                    transition: 'all 0.2s', fontSize: '0.95rem'
                                }}
                            >
                                <Icon size={18} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Panel */}
                <div className="glass-panel-dash" style={{ flex: 1, padding: '2rem' }}>
                    
                    {/* SMTP TAB */}
                    {activeTab === 'smtp' && (
                        <form className="modal-form" onSubmit={handleSave}>
                            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>SMTP Mail Server</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                <div className="form-group"><label>SMTP Host</label><input name="host" value={formData.host || ''} onChange={handleChange} placeholder="smtp.gmail.com" /></div>
                                <div className="form-group"><label>SMTP Port</label><input name="port" value={formData.port || ''} onChange={handleChange} placeholder="465 or 587" /></div>
                                <div className="form-group"><label>Email Address</label><input name="email" value={formData.email || ''} onChange={handleChange} placeholder="noreply@university.com" /></div>
                                <div className="form-group"><label>App Password</label><input name="password" type="password" value={formData.password || ''} onChange={handleChange} /></div>
                                <div className="form-group"><label>Encryption</label><select name="encryption" value={formData.encryption || 'None'} onChange={handleChange}>
                                    <option value="None" style={{ background: '#0d1b2e' }}>None</option>
                                    <option value="TLS" style={{ background: '#0d1b2e' }}>TLS</option>
                                    <option value="SSL" style={{ background: '#0d1b2e' }}>SSL</option>
                                </select></div>
                                <div className="form-group"><label>Sender Name</label><input name="senderName" value={formData.senderName || ''} onChange={handleChange} placeholder="Al-Kawthar System" /></div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="primary-btn" disabled={loading}>{loading ? <Loader2 size={16} className="spinner" /> : 'Save Settings'}</button>
                                <button type="button" className="cancel-btn" onClick={handleTestSmtp} disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Test Connection</button>
                            </div>
                        </form>
                    )}

                    {/* JWT TAB */}
                    {activeTab === 'jwt' && (
                        <form className="modal-form" onSubmit={handleSave}>
                            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>JWT Auth Security</h3>
                             <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Warning: Changing the secret key will invalidate all active user sessions immediately.</p>
                            <div className="form-group" style={{ maxWidth: '600px' }}><label>JWT Secret Key</label><input name="secretKey" type="password" value={formData.secretKey || ''} onChange={handleChange} placeholder="Super secret random string" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', maxWidth: '600px', marginTop: '1.2rem' }}>
                                <div className="form-group"><label>Token Expiry (e.g. 1d, 2h)</label><input name="tokenExpiry" value={formData.tokenExpiry || ''} onChange={handleChange} /></div>
                                <div className="form-group"><label>Refresh Token Expiry</label><input name="refreshTokenExpiry" value={formData.refreshTokenExpiry || ''} onChange={handleChange} /></div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <button type="submit" className="primary-btn" disabled={loading}>{loading ? <Loader2 size={16} className="spinner" /> : 'Save JWT Settings'}</button>
                            </div>
                        </form>
                    )}

                    {/* CLOUDINARY TAB */}
                    {activeTab === 'cloudinary' && (
                        <form className="modal-form" onSubmit={handleSave}>
                            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>Cloudinary Storage</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', maxWidth: '500px' }}>
                                <div className="form-group"><label>Cloud Name</label><input name="cloudName" value={formData.cloudName || ''} onChange={handleChange} /></div>
                                <div className="form-group"><label>API Key</label><input name="apiKey" value={formData.apiKey || ''} onChange={handleChange} /></div>
                                <div className="form-group"><label>API Secret</label><input name="apiSecret" type="password" value={formData.apiSecret || ''} onChange={handleChange} /></div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="primary-btn" disabled={loading}>{loading ? <Loader2 size={16} className="spinner" /> : 'Save Cloudinary'}</button>
                                <button type="button" className="cancel-btn" onClick={handleTestCloudinary} disabled={loading} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Test Connection</button>
                            </div>
                        </form>
                    )}

                    {/* BACKUP TAB */}
                    {activeTab === 'backup' && (
                        <form className="modal-form" onSubmit={handleSave}>
                            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>Database Backup & Restore</h3>
                            <div style={{ maxWidth: '400px' }}>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input type="checkbox" name="autoBackup" checked={formData.autoBackup || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#0ff0fc' }} />
                                    <label style={{ margin: 0 }}>Enable Automated Backups</label>
                                </div>
                                {formData.autoBackup && (
                                    <div className="form-group" style={{ marginTop: '1rem' }}>
                                        <label>Backup Schedule Frequency</label>
                                        <select name="schedule" value={formData.schedule || 'Weekly'} onChange={handleChange}>
                                            <option value="Daily" style={{ background: '#0d1b2e' }}>Daily</option>
                                            <option value="Weekly" style={{ background: '#0d1b2e' }}>Weekly</option>
                                            <option value="Monthly" style={{ background: '#0d1b2e' }}>Monthly</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button type="submit" className="primary-btn" disabled={loading}>{loading ? <Loader2 size={16} className="spinner" /> : 'Save Auto-Config'}</button>
                                <button type="button" className="cancel-btn" style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)' }} onClick={handleBackup} disabled={loading}>Manual Backup</button>
                                <button type="button" className="cancel-btn" style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)' }} onClick={handleDownloadBackup}>Download Backup</button>
                                <button type="button" className="cancel-btn" style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.3)' }} onClick={() => fileInputRef.current.click()} disabled={loading}>Upload & Restore DB</button>
                                <input type="file" ref={fileInputRef} onChange={handleRestoreChange} style={{ display: 'none' }} accept=".json" />
                            </div>
                        </form>
                    )}

                    {/* AI TAB */}
                    {activeTab === 'ai' && (
                        <form className="modal-form" onSubmit={handleSave}>
                            <h3 style={{ marginTop: 0, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>AI Integrations</h3>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <input type="checkbox" name="aiStatus" checked={formData.aiStatus || false} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#0ff0fc' }} />
                                <label style={{ margin: 0 }}>Enable AI Features Globally</label>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', maxWidth: '600px', opacity: formData.aiStatus ? 1 : 0.4, pointerEvents: formData.aiStatus ? 'auto' : 'none' }}>
                                <div className="form-group"><label>OpenAI Default Key</label><input name="openAiKey" type="password" value={formData.openAiKey || ''} onChange={handleChange} /></div>
                                <div className="form-group"><label>Google Gemini Key</label><input name="geminiKey" type="password" value={formData.geminiKey || ''} onChange={handleChange} /></div>
                                <div className="form-group">
                                    <label>Preferred / Default AI Model</label>
                                    <select name="defaultModel" value={formData.defaultModel || 'OpenAI'} onChange={handleChange}>
                                        <option value="OpenAI" style={{ background: '#0d1b2e' }}>OpenAI</option>
                                        <option value="Gemini" style={{ background: '#0d1b2e' }}>Google Gemini</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem' }}>
                                <button type="submit" className="primary-btn" disabled={loading}>{loading ? <Loader2 size={16} className="spinner" /> : 'Save AI Settings'}</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsPanel;
