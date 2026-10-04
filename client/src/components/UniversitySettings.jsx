import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchUniversitySettings, updateGeneralSettings, updateSettingsSection,
    uploadUniversityAsset, fetchAcademicOptions, clearUniSettingsMessages
} from '../store/uniSettingsSlice';
import {
    Settings, Building2, BookOpen, Target, Bell,
    FolderOpen, Globe, Save, Upload, CheckCircle,
    AlertTriangle, Image, RefreshCw
} from 'lucide-react';
import '../style/Dashboard.css';

const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', color: '#fff', fontSize: '0.9rem',
    boxSizing: 'border-box'
};
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' };
const sectionHeaderStyle = (color) => ({
    margin: '0 0 18px', fontSize: '1rem', fontWeight: '700',
    color, display: 'flex', alignItems: 'center', gap: 8
});

const TABS = [
    { id: 'general', label: 'General', icon: Building2, color: '#0ff0fc' },
    { id: 'academic', label: 'Academic', icon: BookOpen, color: '#50cc7f' },
    { id: 'obe', label: 'OBE', icon: Target, color: '#bc13fe' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: '#ffcc00' },
    { id: 'files', label: 'File Settings', icon: FolderOpen, color: '#ff9800' },
    { id: 'branding', label: 'Branding', icon: Image, color: '#ff1b6b' },
];

const FieldGroup = ({ label, children, span = 1 }) => (
    <div style={{ gridColumn: `span ${span}` }}>
        <label style={labelStyle}>{label}</label>
        {children}
    </div>
);

const Toggle = ({ label, checked, onChange, desc }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
            <div style={{ color: '#fff', fontSize: '0.9rem' }}>{label}</div>
            {desc && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '2px' }}>{desc}</div>}
        </div>
        <div
            onClick={onChange}
            style={{ width: '44px', height: '24px', borderRadius: '12px', background: checked ? '#0ff0fc' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s', flexShrink: 0 }}
        >
            <div style={{ position: 'absolute', top: '3px', left: checked ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: checked ? '#000' : '#fff', transition: 'all 0.3s' }} />
        </div>
    </div>
);

const UniversitySettings = () => {
    const dispatch = useDispatch();
    const { university, academicOptions, loading, saving, successMessage, error } = useSelector(s => s.uniSettings);

    const [activeTab, setActiveTab] = useState('general');

    // General form state
    const [general, setGeneral] = useState({});
    // Per-section form states
    const [academic, setAcademic] = useState({});
    const [obe, setObe] = useState({});
    const [notifications, setNotifications] = useState({});
    const [files, setFiles] = useState({});
    const [branding, setBranding] = useState({});

    const logoRef = useRef(); const bannerRef = useRef(); const faviconRef = useRef();

    useEffect(() => {
        dispatch(fetchUniversitySettings());
        dispatch(fetchAcademicOptions());
    }, [dispatch]);

    useEffect(() => {
        if (university) {
            const s = university.settings || {};
            setGeneral({
                name: university.name || '', shortName: university.shortName || '',
                email: university.email || '', phone: university.phone || '',
                website: university.website || '', address: university.address || '',
                city: university.city || '', province: university.province || '',
                country: university.country || '', postalCode: university.postalCode || '',
                hecNo: university.hecNo || '', timeZone: university.timeZone || 'Asia/Karachi',
                currency: university.currency || 'PKR',
            });
            setAcademic(s.academic || {});
            setObe(s.obe || {});
            setNotifications(s.notifications || {});
            setFiles({ ...s.files, allowedTypes: (s.files?.allowedTypes || []).join(', '), documentCategories: (s.files?.documentCategories || []).join(', ') });
            setBranding(s.branding || {});
        }
    }, [university]);

    useEffect(() => {
        if (successMessage || error) {
            const t = setTimeout(() => dispatch(clearUniSettingsMessages()), 4000);
            return () => clearTimeout(t);
        }
    }, [successMessage, error, dispatch]);

    const handleUpload = (type, file) => {
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        dispatch(uploadUniversityAsset({ type, formData: fd }));
    };

    const handleSaveGeneral = (e) => {
        e.preventDefault();
        dispatch(updateGeneralSettings(general));
    };

    const handleSaveSection = (section, data) => (e) => {
        e.preventDefault();
        let payload = { ...data };
        // Convert comma-separated strings back to arrays
        if (section === 'files') {
            payload.allowedTypes = data.allowedTypes?.split(',').map(s => s.trim()).filter(Boolean);
            payload.documentCategories = data.documentCategories?.split(',').map(s => s.trim()).filter(Boolean);
        }
        dispatch(updateSettingsSection({ section, data: payload }));
    };

    const g = (setter) => (e) => setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const toggleAcademic = (key) => setAcademic(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleObe = (key) => setObe(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleNotif = (key) => setNotifications(prev => ({ ...prev, [key]: !prev[key] }));

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000');
    const logoUrl = university?.logo ? `${baseUrl}${university.logo}` : null;
    const bannerUrl = university?.banner ? `${baseUrl}${university.banner}` : null;

    const SaveBtn = ({ section, data, label = 'Save Changes' }) => (
        <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: saving ? 'rgba(255,255,255,0.4)' : '#000', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer' }}>
            <Save size={15} /> {saving ? 'Saving...' : label}
        </button>
    );

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Settings size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} />
                    University Settings
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Configure your university's academic, OBE, notifications, and system settings.
                </p>
            </div>

            {/* Alerts */}
            {successMessage && (
                <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(80,204,127,0.1)', border: '1px solid #50cc7f40', borderRadius: '10px', marginBottom: '16px', color: '#50cc7f' }}>
                    <CheckCircle size={16} /> {successMessage}
                </div>
            )}
            {error && (
                <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(255,27,107,0.1)', border: '1px solid #ff1b6b40', borderRadius: '10px', marginBottom: '16px', color: '#ff1b6b' }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#0ff0fc' }}><RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} /><p>Loading settings...</p></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', alignItems: 'start' }}>
                    {/* Sidebar Nav */}
                    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: '8px', border: activeTab === t.id ? `1px solid ${t.color}40` : '1px solid transparent', background: activeTab === t.id ? `${t.color}12` : 'transparent', color: activeTab === t.id ? t.color : 'rgba(255,255,255,0.55)', cursor: 'pointer', fontWeight: activeTab === t.id ? '700' : '400', fontSize: '0.85rem', textAlign: 'left', transition: 'all 0.2s' }}>
                                <t.icon size={16} /> {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Panel */}
                    <div>
                        {/* ─── GENERAL ─── */}
                        {activeTab === 'general' && (
                            <form className="modal-form" onSubmit={handleSaveGeneral} className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '24px' }}>
                                <h3 style={sectionHeaderStyle('#0ff0fc')}><Building2 size={18} /> General University Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                    <FieldGroup label="University Name" span={2}>
                                        <input name="name" value={general.name || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="Full University Name" />
                                    </FieldGroup>
                                    <FieldGroup label="Short Name">
                                        <input name="shortName" value={general.shortName || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="e.g. FAST" />
                                    </FieldGroup>
                                    <FieldGroup label="Time Zone">
                                        <select name="timeZone" value={general.timeZone || ''} onChange={g(setGeneral)} style={inputStyle}>
                                            <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                                            <option value="Asia/Lahore">Asia/Lahore</option>
                                            <option value="UTC">UTC</option>
                                            <option value="Asia/Dubai">Asia/Dubai</option>
                                        </select>
                                    </FieldGroup>
                                    <FieldGroup label="Email">
                                        <input name="email" type="email" value={general.email || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="info@university.edu.pk" />
                                    </FieldGroup>
                                    <FieldGroup label="Phone">
                                        <input name="phone" value={general.phone || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="+92 xx xxxxxxx" />
                                    </FieldGroup>
                                    <FieldGroup label="Website" span={2}>
                                        <input name="website" value={general.website || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="https://university.edu.pk" />
                                    </FieldGroup>
                                    <FieldGroup label="Address" span={2}>
                                        <input name="address" value={general.address || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="Full street address" />
                                    </FieldGroup>
                                    <FieldGroup label="City">
                                        <input name="city" value={general.city || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="Islamabad" />
                                    </FieldGroup>
                                    <FieldGroup label="Province">
                                        <select name="province" value={general.province || ''} onChange={g(setGeneral)} style={inputStyle}>
                                            <option value="">Select Province</option>
                                            {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'AJK', 'Gilgit-Baltistan', 'ICT'].map(p => <option key={p}>{p}</option>)}
                                        </select>
                                    </FieldGroup>
                                    <FieldGroup label="Country">
                                        <input name="country" value={general.country || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="Pakistan" />
                                    </FieldGroup>
                                    <FieldGroup label="HEC No / Accreditation ID">
                                        <input name="hecNo" value={general.hecNo || ''} onChange={g(setGeneral)} style={inputStyle} placeholder="HEC-XXXX" />
                                    </FieldGroup>
                                    <FieldGroup label="Currency">
                                        <select name="currency" value={general.currency || ''} onChange={g(setGeneral)} style={inputStyle}>
                                            <option value="PKR">PKR — Pakistani Rupee</option>
                                            <option value="USD">USD — US Dollar</option>
                                            <option value="GBP">GBP — British Pound</option>
                                        </select>
                                    </FieldGroup>
                                </div>
                                <SaveBtn />
                            </form>
                        )}

                        {/* ─── ACADEMIC ─── */}
                        {activeTab === 'academic' && (
                            <form className="modal-form" onSubmit={handleSaveSection('academic', academic)} className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '24px' }}>
                                <h3 style={sectionHeaderStyle('#50cc7f')}><BookOpen size={18} /> Academic Settings</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                    <FieldGroup label="Academic Year">
                                        <input name="academicYear" value={academic.academicYear || ''} onChange={g(setAcademic)} style={inputStyle} placeholder="e.g. 2024-25" />
                                    </FieldGroup>
                                    <FieldGroup label="Current Session">
                                        <select name="currentSession" value={academic.currentSession?._id || academic.currentSession || ''} onChange={g(setAcademic)} style={inputStyle}>
                                            <option value="">Select Session</option>
                                            {academicOptions.sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </FieldGroup>
                                    <FieldGroup label="Current Semester">
                                        <select name="currentSemester" value={academic.currentSemester?._id || academic.currentSemester || ''} onChange={g(setAcademic)} style={inputStyle}>
                                            <option value="">Select Semester</option>
                                            {academicOptions.semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </FieldGroup>
                                    <FieldGroup label="Semester Duration (Weeks)">
                                        <input name="semesterDurationWeeks" type="number" value={academic.semesterDurationWeeks ?? 18} onChange={g(setAcademic)} style={inputStyle} min={8} max={26} />
                                    </FieldGroup>
                                    <FieldGroup label="Passing Percentage (%)">
                                        <input name="passingPercentage" type="number" value={academic.passingPercentage ?? 50} onChange={g(setAcademic)} style={inputStyle} min={0} max={100} />
                                    </FieldGroup>
                                    <FieldGroup label="Attendance Threshold (%)">
                                        <input name="attendanceThreshold" type="number" value={academic.attendanceThreshold ?? 75} onChange={g(setAcademic)} style={inputStyle} min={0} max={100} />
                                    </FieldGroup>
                                    <FieldGroup label="Max Credit Hours/Semester">
                                        <input name="maxCreditHoursPerSemester" type="number" value={academic.maxCreditHoursPerSemester ?? 21} onChange={g(setAcademic)} style={inputStyle} min={9} max={30} />
                                    </FieldGroup>
                                    <FieldGroup label="Min Credit Hours/Semester">
                                        <input name="minCreditHoursPerSemester" type="number" value={academic.minCreditHoursPerSemester ?? 9} onChange={g(setAcademic)} style={inputStyle} min={1} max={18} />
                                    </FieldGroup>
                                    <FieldGroup label="GPA Scale">
                                        <select name="gpaScale" value={academic.gpaScale || '4.0'} onChange={g(setAcademic)} style={inputStyle}>
                                            <option value="4.0">4.0 Scale</option>
                                            <option value="5.0">5.0 Scale</option>
                                            <option value="Custom">Custom</option>
                                        </select>
                                    </FieldGroup>
                                    <FieldGroup label="Course Repeat Limit">
                                        <input name="courseRepeatLimit" type="number" value={academic.courseRepeatLimit ?? 2} onChange={g(setAcademic)} style={inputStyle} min={1} max={5} />
                                    </FieldGroup>
                                    <FieldGroup label="Withdrawal Deadline (Weeks)">
                                        <input name="courseWithdrawalWeeks" type="number" value={academic.courseWithdrawalWeeks ?? 6} onChange={g(setAcademic)} style={inputStyle} min={1} max={18} />
                                    </FieldGroup>
                                    <FieldGroup label="Late Registration Days">
                                        <input name="lateRegistrationDays" type="number" value={academic.lateRegistrationDays ?? 7} onChange={g(setAcademic)} style={inputStyle} min={0} max={30} />
                                    </FieldGroup>
                                </div>
                                <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                                    <Toggle label="Registration Open" checked={!!academic.registrationOpen} onChange={() => toggleAcademic('registrationOpen')} desc="Allow students to register for new courses" />
                                </div>
                                <SaveBtn />
                            </form>
                        )}

                        {/* ─── OBE ─── */}
                        {activeTab === 'obe' && (
                            <form className="modal-form" onSubmit={handleSaveSection('obe', obe)} className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '24px' }}>
                                <h3 style={sectionHeaderStyle('#bc13fe')}><Target size={18} /> OBE Settings</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                    {[
                                        { name: 'cloTarget', label: 'CLO Target (%)' },
                                        { name: 'ploTarget', label: 'PLO Target (%)' },
                                        { name: 'gaTarget', label: 'GA Target (%)' },
                                        { name: 'peoTarget', label: 'PEO Target (%)' },
                                        { name: 'passingThreshold', label: 'Passing Threshold (%)' },
                                    ].map(f => (
                                        <FieldGroup key={f.name} label={f.label}>
                                            <input name={f.name} type="number" value={obe[f.name] ?? 60} onChange={g(setObe)} style={inputStyle} min={0} max={100} />
                                        </FieldGroup>
                                    ))}
                                    <FieldGroup label="Achievement Formula">
                                        <select name="achievementFormula" value={obe.achievementFormula || 'Average'} onChange={g(setObe)} style={inputStyle}>
                                            <option>Average</option>
                                            <option>Weighted Average</option>
                                            <option>Maximum</option>
                                        </select>
                                    </FieldGroup>
                                    <FieldGroup label="Mapping Rules">
                                        <select name="mappingRules" value={obe.mappingRules || 'Both'} onChange={g(setObe)} style={inputStyle}>
                                            <option>Direct</option>
                                            <option>Indirect</option>
                                            <option>Both</option>
                                        </select>
                                    </FieldGroup>
                                </div>
                                <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                                    <Toggle label="Auto Calculation" checked={!!obe.autoCalculation} onChange={() => toggleObe('autoCalculation')} desc="Automatically calculate CLO/PLO achievements after marks entry" />
                                    <Toggle label="Auto Report Generation" checked={!!obe.autoReportGeneration} onChange={() => toggleObe('autoReportGeneration')} desc="Generate OBE reports automatically at end of semester" />
                                </div>
                                <SaveBtn />
                            </form>
                        )}

                        {/* ─── NOTIFICATIONS ─── */}
                        {activeTab === 'notifications' && (
                            <form className="modal-form" onSubmit={handleSaveSection('notifications', notifications)} className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '24px' }}>
                                <h3 style={sectionHeaderStyle('#ffcc00')}><Bell size={18} /> Notification Settings</h3>
                                <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                                    <Toggle label="Enable Email Notifications" checked={!!notifications.emailEnabled} onChange={() => toggleNotif('emailEnabled')} desc="Send system notifications via email (requires SMTP config)" />
                                    <Toggle label="Enable In-App Notifications" checked={!!notifications.inAppEnabled} onChange={() => toggleNotif('inAppEnabled')} desc="Show notifications within the ERP dashboard" />
                                    <Toggle label="Announcements Enabled" checked={!!notifications.announcementsEnabled} onChange={() => toggleNotif('announcementsEnabled')} desc="Allow admins to broadcast university-wide announcements" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                    <FieldGroup label="Default Reminder Days (before deadline)">
                                        <input name="defaultReminderDays" type="number" value={notifications.defaultReminderDays ?? 3} onChange={g(setNotifications)} style={inputStyle} min={1} max={30} />
                                    </FieldGroup>
                                    <FieldGroup label="SMTP Host">
                                        <input name="smtpHost" value={notifications.smtpHost || ''} onChange={g(setNotifications)} style={inputStyle} placeholder="smtp.gmail.com" />
                                    </FieldGroup>
                                    <FieldGroup label="SMTP Port">
                                        <input name="smtpPort" type="number" value={notifications.smtpPort || 587} onChange={g(setNotifications)} style={inputStyle} placeholder="587" />
                                    </FieldGroup>
                                    <FieldGroup label="SMTP Username">
                                        <input name="smtpUser" value={notifications.smtpUser || ''} onChange={g(setNotifications)} style={inputStyle} placeholder="user@gmail.com" />
                                    </FieldGroup>
                                    <FieldGroup label="From Email Address">
                                        <input name="smtpFrom" value={notifications.smtpFrom || ''} onChange={g(setNotifications)} style={inputStyle} placeholder="noreply@university.edu.pk" />
                                    </FieldGroup>
                                </div>
                                <SaveBtn />
                            </form>
                        )}

                        {/* ─── FILES ─── */}
                        {activeTab === 'files' && (
                            <form className="modal-form" onSubmit={handleSaveSection('files', files)} className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '24px' }}>
                                <h3 style={sectionHeaderStyle('#ff9800')}><FolderOpen size={18} /> File & Storage Settings</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                    <FieldGroup label="Max Upload Size (MB)">
                                        <input name="maxUploadSizeMB" type="number" value={files.maxUploadSizeMB ?? 10} onChange={g(setFiles)} style={inputStyle} min={1} max={500} />
                                    </FieldGroup>
                                    <FieldGroup label="Storage Limit (GB)">
                                        <input name="storageLimitGB" type="number" value={files.storageLimitGB ?? 50} onChange={g(setFiles)} style={inputStyle} min={1} />
                                    </FieldGroup>
                                    <FieldGroup label="Allowed File Types (comma-separated)" span={2}>
                                        <input name="allowedTypes" value={files.allowedTypes || ''} onChange={g(setFiles)} style={inputStyle} placeholder="pdf, doc, docx, xls, xlsx, png, jpg" />
                                    </FieldGroup>
                                    <FieldGroup label="Document Categories (comma-separated)" span={2}>
                                        <input name="documentCategories" value={files.documentCategories || ''} onChange={g(setFiles)} style={inputStyle} placeholder="Course File, Question Paper, Rubric, Blueprint" />
                                    </FieldGroup>
                                </div>
                                <SaveBtn />
                            </form>
                        )}

                        {/* ─── BRANDING ─── */}
                        {activeTab === 'branding' && (
                            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {/* Logo */}
                                <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px' }}>
                                    <h3 style={sectionHeaderStyle('#ff1b6b')}><Image size={18} /> University Logo</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Image size={32} color="rgba(255,255,255,0.2)" />}
                                        </div>
                                        <div>
                                            <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload('logo', e.target.files[0])} />
                                            <button type="button" onClick={() => logoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,27,107,0.15)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '8px', color: '#ff1b6b', cursor: 'pointer', fontWeight: 'bold' }}>
                                                <Upload size={15} /> Upload Logo
                                            </button>
                                            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>PNG or SVG, max 5MB. Used in header and reports.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner */}
                                <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px' }}>
                                    <h3 style={sectionHeaderStyle('#ff9800')}><Image size={18} /> University Banner</h3>
                                    <div style={{ width: '100%', height: '120px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(255,255,255,0.1)', marginBottom: '14px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {bannerUrl ? <img src={bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>No banner uploaded</span>}
                                    </div>
                                    <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload('banner', e.target.files[0])} />
                                    <button type="button" onClick={() => bannerRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '8px', color: '#ff9800', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <Upload size={15} /> Upload Banner
                                    </button>
                                </div>

                                {/* Favicon */}
                                <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px' }}>
                                    <h3 style={sectionHeaderStyle('#0ff0fc')}><Globe size={18} /> Favicon</h3>
                                    <input ref={faviconRef} type="file" accept="image/x-icon,image/png,image/vnd.microsoft.icon" style={{ display: 'none' }} onChange={e => handleUpload('favicon', e.target.files[0])} />
                                    <button type="button" onClick={() => faviconRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <Upload size={15} /> Upload Favicon (.ico / .png)
                                    </button>
                                    <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>Used as the browser tab icon. Recommended: 32×32px ICO or PNG.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversitySettings;
