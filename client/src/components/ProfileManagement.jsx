import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchMyProfile, updateMyProfile, changePassword,
    uploadProfilePicture, clearProfileMessages
} from '../store/profileSlice';
import {
    User, Lock, Camera, Save, Eye, EyeOff, CheckCircle, XCircle, Loader2,
    Phone, MapPin, Briefcase, GraduationCap, Heart
} from 'lucide-react';

const FIELD_STYLE = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none'
};
const LABEL_STYLE = { color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginBottom: '5px', display: 'block' };
const SECTION_HEADER = { color: '#0ff0fc', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(15,240,252,0.2)' };

const FG = ({ label, children }) => (
    <div style={{ marginBottom: '1rem' }}>
        <label style={LABEL_STYLE}>{label}</label>
        {children}
    </div>
);

const ProfileManagement = () => {
    const dispatch = useDispatch();
    const { myProfile, loading, successMessage, error } = useSelector(s => s.profile);
    const { user: authUser } = useSelector(s => s.auth);

    const [activeTab, setActiveTab] = useState('personal');
    const [form, setForm] = useState({});
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { dispatch(fetchMyProfile()); }, [dispatch]);

    useEffect(() => {
        if (myProfile) {
            setForm({
                name: myProfile.name || '',
                phone: myProfile.phone || '',
                address: myProfile.address || '',
                gender: myProfile.gender || '',
                dateOfBirth: myProfile.dateOfBirth ? myProfile.dateOfBirth.split('T')[0] : '',
                fatherName: myProfile.fatherName || '',
                bloodGroup: myProfile.bloodGroup || '',
                nationality: myProfile.nationality || 'Pakistani',
                religion: myProfile.religion || '',
                maritalStatus: myProfile.maritalStatus || '',
                emergencyContact: myProfile.emergencyContact || '',
                cnic: myProfile.cnic || '',
                designation: myProfile.designation || '',
                qualification: myProfile.qualification || '',
                specialization: myProfile.specialization || '',
                experience: myProfile.experience || '',
                office: myProfile.office || '',
            });
        }
    }, [myProfile]);

    useEffect(() => {
        if (successMessage || error) {
            const t = setTimeout(() => dispatch(clearProfileMessages()), 4000);
            return () => clearTimeout(t);
        }
    }, [successMessage, error, dispatch]);

    const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
    const setPw = (field) => (e) => setPwForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSave = (e) => {
        e.preventDefault();
        dispatch(updateMyProfile(form));
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) return alert('Passwords do not match!');
        dispatch(changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }));
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('profilePicture', file);
        setUploading(true);
        await dispatch(uploadProfilePicture(fd));
        setUploading(false);
        dispatch(fetchMyProfile());
    };

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const avatarUrl = myProfile?.profilePicture
        ? (myProfile.profilePicture.startsWith('http') ? myProfile.profilePicture : `${baseUrl}${myProfile.profilePicture}`)
        : null;

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'professional', label: 'Professional', icon: Briefcase },
        { id: 'security', label: 'Security', icon: Lock },
    ];

    return (
        <div style={{ padding: '1.5rem 0' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <User color="#0ff0fc" /> Profile Management
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Manage your personal information and security settings.</p>
            </header>

            {successMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(80,204,127,0.15)', border: '1px solid rgba(80,204,127,0.4)', borderRadius: '10px', padding: '12px 16px', color: '#50cc7f', marginBottom: '1rem' }}>
                    <CheckCircle size={16} /> {successMessage}
                </div>
            )}
            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,27,107,0.15)', border: '1px solid rgba(255,27,107,0.4)', borderRadius: '10px', padding: '12px 16px', color: '#ff1b6b', marginBottom: '1rem' }}>
                    <XCircle size={16} /> {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Avatar Card */}
                <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '2rem', minWidth: '220px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', overflow: 'hidden' }}>
                            {avatarUrl
                                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '2.5rem', color: '#000', fontWeight: 800 }}>{(myProfile?.name || authUser?.name || 'U')[0]}</span>
                            }
                        </div>
                        <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: 0, right: 0, background: '#0ff0fc', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                            {uploading ? <Loader2 size={14} color="#000" className="spinner" /> : <Camera size={14} color="#000" />}
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </div>
                    <h3 style={{ color: '#fff', margin: '0 0 4px' }}>{myProfile?.name || authUser?.name}</h3>
                    <p style={{ color: '#0ff0fc', fontSize: '0.85rem', margin: '0 0 4px' }}>{myProfile?.role || authUser?.role}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{myProfile?.email || authUser?.email}</p>
                    {myProfile?.department?.name && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '4px' }}>{myProfile.department.name}</p>}
                    {myProfile?.employeeId && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '4px' }}>ID: {myProfile.employeeId}</p>}
                    {myProfile?.rollNumber && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '4px' }}>Roll: {myProfile.rollNumber}</p>}
                </div>

                {/* Main Panel */}
                <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem', flex: 1, minWidth: '300px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: activeTab === tab.id ? 'linear-gradient(135deg,#0ff0fc,#bc13fe)' : 'rgba(255,255,255,0.08)', color: activeTab === tab.id ? '#000' : 'rgba(255,255,255,0.7)' }}>
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Personal Tab */}
                    {activeTab === 'personal' && (
                        <form onSubmit={handleSave}>
                            <p style={SECTION_HEADER}>Basic Information</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <FG label="Full Name"><input style={FIELD_STYLE} value={form.name || ''} onChange={set('name')} /></FG>
                                <FG label="Phone"><input style={FIELD_STYLE} value={form.phone || ''} onChange={set('phone')} /></FG>
                                <FG label="CNIC"><input style={FIELD_STYLE} value={form.cnic || ''} onChange={set('cnic')} /></FG>
                                <FG label="Gender">
                                    <select style={FIELD_STYLE} value={form.gender || ''} onChange={set('gender')}>
                                        <option value="">Select</option>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </FG>
                                <FG label="Date of Birth"><input type="date" style={FIELD_STYLE} value={form.dateOfBirth || ''} onChange={set('dateOfBirth')} /></FG>
                                <FG label="Father's Name"><input style={FIELD_STYLE} value={form.fatherName || ''} onChange={set('fatherName')} /></FG>
                                <FG label="Blood Group">
                                    <select style={FIELD_STYLE} value={form.bloodGroup || ''} onChange={set('bloodGroup')}>
                                        <option value="">Select</option>
                                        {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </FG>
                                <FG label="Marital Status">
                                    <select style={FIELD_STYLE} value={form.maritalStatus || ''} onChange={set('maritalStatus')}>
                                        <option value="">Select</option>
                                        {['Single','Married','Divorced','Widowed'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </FG>
                                <FG label="Nationality"><input style={FIELD_STYLE} value={form.nationality || ''} onChange={set('nationality')} /></FG>
                                <FG label="Religion"><input style={FIELD_STYLE} value={form.religion || ''} onChange={set('religion')} /></FG>
                            </div>
                            <p style={SECTION_HEADER}>Contact</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <FG label="Emergency Contact"><input style={FIELD_STYLE} value={form.emergencyContact || ''} onChange={set('emergencyContact')} /></FG>
                                <FG label="Address"><input style={FIELD_STYLE} value={form.address || ''} onChange={set('address')} /></FG>
                            </div>
                            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', padding: '11px 24px', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: loading ? 'rgba(255,255,255,0.4)' : '#000', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? <Loader2 size={15} className="spinner" /> : <Save size={15} />} {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {/* Professional Tab */}
                    {activeTab === 'professional' && (
                        <form onSubmit={handleSave}>
                            <p style={SECTION_HEADER}>Professional Information</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <FG label="Designation"><input style={FIELD_STYLE} value={form.designation || ''} onChange={set('designation')} /></FG>
                                <FG label="Specialization"><input style={FIELD_STYLE} value={form.specialization || ''} onChange={set('specialization')} /></FG>
                                <FG label="Qualification"><input style={FIELD_STYLE} value={form.qualification || ''} onChange={set('qualification')} /></FG>
                                <FG label="Experience"><input style={FIELD_STYLE} value={form.experience || ''} onChange={set('experience')} /></FG>
                                <FG label="Office / Room"><input style={FIELD_STYLE} value={form.office || ''} onChange={set('office')} /></FG>
                                <FG label="Department"><input style={FIELD_STYLE} value={myProfile?.department?.name || '—'} readOnly style={{ ...FIELD_STYLE, opacity: 0.5 }} /></FG>
                                {myProfile?.faculty && <FG label="Faculty"><input style={{ ...FIELD_STYLE, opacity: 0.5 }} value={myProfile?.faculty?.name || '—'} readOnly /></FG>}
                                {myProfile?.program && <FG label="Program"><input style={{ ...FIELD_STYLE, opacity: 0.5 }} value={myProfile?.program?.name || '—'} readOnly /></FG>}
                            </div>
                            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', padding: '11px 24px', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: loading ? 'rgba(255,255,255,0.4)' : '#000', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? <Loader2 size={15} className="spinner" /> : <Save size={15} />} {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <form onSubmit={handlePasswordChange}>
                            <p style={SECTION_HEADER}>Change Password</p>
                            <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <FG label="Current Password">
                                    <input type={showPw ? 'text' : 'password'} style={FIELD_STYLE} value={pwForm.currentPassword} onChange={setPw('currentPassword')} required />
                                </FG>
                                <FG label="New Password">
                                    <input type={showPw ? 'text' : 'password'} style={FIELD_STYLE} value={pwForm.newPassword} onChange={setPw('newPassword')} required minLength={6} />
                                </FG>
                                <FG label="Confirm New Password">
                                    <input type={showPw ? 'text' : 'password'} style={FIELD_STYLE} value={pwForm.confirmPassword} onChange={setPw('confirmPassword')} required minLength={6} />
                                </FG>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button type="button" onClick={() => setShowPw(p => !p)} style={{ background: 'none', border: 'none', color: '#0ff0fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? 'Hide' : 'Show'} Password
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', padding: '11px 24px', background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#ff1b6b,#bc13fe)', border: 'none', borderRadius: '10px', color: loading ? 'rgba(255,255,255,0.4)' : '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? <Loader2 size={15} className="spinner" /> : <Lock size={15} />} {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileManagement;
