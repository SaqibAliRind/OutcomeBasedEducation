import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../../../store/academicSlice';
import { createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword, importUsers } from '../../../store/userSlice';
import { resetProfile } from '../../../store/teacherProfileSlice';
import TeacherProfileView from './TeacherProfileView';
import {
    Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound,
    Loader2, X, Download, Upload, Search, Eye, BookOpen, RefreshCw, ChevronDown
} from 'lucide-react';

const generateEmployeeId = () => `EMP-${Date.now().toString().slice(-6)}`;

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];
const EMPLOYMENT_TYPES = ['Permanent', 'Visiting', 'Contract', 'Part-Time'];
const TEACHER_STATUSES = ['Active', 'Inactive', 'On Leave', 'Resigned'];

const emptyForm = {
    // Personal Information
    name: '', email: '', password: '', employeeId: '',
    fatherName: '', cnic: '', gender: '', dateOfBirth: '',
    bloodGroup: '', nationality: 'Pakistani', religion: '', maritalStatus: '',
    // Contact
    phone: '', emergencyContact: '', address: '',
    // Professional
    designation: '', department: '', faculty: '', employmentType: '',
    joiningDate: '', experience: '', specialization: '',
    // Qualification (stored as flat string for now; full detail via TeacherProfileView)
    qualification: '',
    // Status
    role: 'Teacher'
};

const SectionHeader = ({ title }) => (
    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(15,240,252,0.2)' }}>
        <p style={{ margin: 0, color: '#0ff0fc', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {title}
        </p>
    </div>
);

const FG = ({ label, children }) => (
    <div className="form-group" style={{ marginBottom: '0.8rem' }}>
        <label style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginBottom: '4px', display: 'block' }}>{label}</label>
        {children}
    </div>
);

const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)',
    color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box',
    outline: 'none'
};

const TeacherManagement = ({ users, loading }) => {
    const dispatch = useDispatch();
    const { records } = useSelector(state => state.academic);
    const departments = records.departments || [];
    const faculties   = records.faculties   || [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
    const [isResetModalOpen,  setIsResetModalOpen]  = useState(false);
    const [selectedUser,      setSelectedUser]      = useState(null);
    const [viewingProfile,    setViewingProfile]    = useState(null);
    const [formData,          setFormData]          = useState(emptyForm);
    const [newPassword,       setNewPassword]       = useState('');
    const [resetLoading,      setResetLoading]      = useState(false);

    // Search & Filter
    const [search,        setSearch]        = useState('');
    const [filterStatus,  setFilterStatus]  = useState('all');
    const [filterDept,    setFilterDept]    = useState('all');
    const [filterEmpType, setFilterEmpType] = useState('all');

    useEffect(() => {
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('faculties'));
    }, [dispatch]);

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // ── Filtering ────────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch =
            (u.name         || '').toLowerCase().includes(q) ||
            (u.email        || '').toLowerCase().includes(q) ||
            (u.employeeId   || '').toLowerCase().includes(q) ||
            (u.phone        || '').toLowerCase().includes(q) ||
            (u.cnic         || '').toLowerCase().includes(q) ||
            (u.designation  || '').toLowerCase().includes(q) ||
            (u.specialization || '').toLowerCase().includes(q);
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active'   &&  u.isActive) ||
            (filterStatus === 'inactive' && !u.isActive);
        const matchDept =
            filterDept === 'all' ||
            (u.department?._id || u.department) === filterDept;
        const matchEmpType =
            filterEmpType === 'all' || u.employmentType === filterEmpType;
        return matchSearch && matchStatus && matchDept && matchEmpType;
    });

    // ── Export CSV ──────────────────────────────────────────────────
    const handleExport = () => {
        const headers = ['Employee ID', 'Name', 'Father Name', 'CNIC', 'Gender', 'Blood Group',
            'Email', 'Phone', 'Emergency Contact', 'Department', 'Faculty', 'Designation',
            'Employment Type', 'Qualification', 'Specialization', 'Experience', 'Joining Date', 'Status'];
        const rows = filtered.map(u => [
            u.employeeId || '', u.name, u.fatherName || '', u.cnic || '', u.gender || '', u.bloodGroup || '',
            u.email, u.phone || '', u.emergencyContact || '',
            u.department?.name || '', u.faculty?.name || '', u.designation || '',
            u.employmentType || '', u.qualification || '', u.specialization || '',
            u.experience || '', u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '',
            u.isActive ? 'Active' : 'Inactive'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'teachers_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    // ── Import CSV ──────────────────────────────────────────────────
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target.result;
            const lines = csv.split('\n');
            const result = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = lines[i].split(',');
                if (cols.length >= 2) {
                    result.push({
                        name: cols[0]?.trim(), email: cols[1]?.trim(),
                        password: cols[2]?.trim() || 'default123',
                        phone: cols[3]?.trim() || '',
                        role: 'Teacher', employeeId: generateEmployeeId()
                    });
                }
            }
            if (result.length > 0) {
                if (window.confirm(`Import ${result.length} teacher(s)?`)) dispatch(importUsers(result));
            } else {
                alert('No valid data found. CSV format: Name, Email, Password, Phone');
            }
            e.target.value = null;
        };
        reader.readAsText(file);
    };

    // ── Handlers ────────────────────────────────────────────────────
    const closeAll = () => { setIsCreateModalOpen(false); setIsEditModalOpen(false); setIsResetModalOpen(false); setSelectedUser(null); };

    const openAdd = () => { setFormData({ ...emptyForm, employeeId: generateEmployeeId() }); setIsCreateModalOpen(true); };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '', email: user.email || '', password: '',
            employeeId: user.employeeId || '',
            fatherName: user.fatherName || '', cnic: user.cnic || '',
            gender: user.gender || '', dateOfBirth: user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '',
            bloodGroup: user.bloodGroup || '', nationality: user.nationality || 'Pakistani',
            religion: user.religion || '', maritalStatus: user.maritalStatus || '',
            phone: user.phone || '', emergencyContact: user.emergencyContact || '', address: user.address || '',
            designation: user.designation || '',
            department: user.department?._id || user.department || '',
            faculty: user.faculty?._id || user.faculty || '',
            employmentType: user.employmentType || '', joiningDate: user.joiningDate ? user.joiningDate.substring(0, 10) : '',
            experience: user.experience || '', specialization: user.specialization || '',
            qualification: user.qualification || '',
            role: 'Teacher'
        });
        setIsEditModalOpen(true);
    };

    const openReset = (user) => { setSelectedUser(user); setNewPassword(''); setIsResetModalOpen(true); };

    const handleCreate = (e) => { e.preventDefault(); dispatch(createUser({ ...formData, role: 'Teacher' })); closeAll(); };
    const handleEditSave = (e) => { e.preventDefault(); const { password, ...rest } = formData; dispatch(updateUser({ id: selectedUser._id, userData: rest })); closeAll(); };
    const handleResetPassword = async (e) => {
        e.preventDefault(); setResetLoading(true);
        await dispatch(adminResetUserPassword({ id: selectedUser._id, newPassword }));
        setResetLoading(false); closeAll();
    };

    // ── Form ─────────────────────────────────────────────────────────
    const renderForm = (isCreate) => (
        <form className="modal-form" onSubmit={isCreate ? handleCreate : handleEditSave} className="modal-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.2rem' }}>

                {/* PERSONAL INFORMATION */}
                <SectionHeader title="Personal Information" />

                <FG label="Full Name *">
                    <input required type="text" style={inputStyle} placeholder="e.g. Mr. Bilal Ahmad" value={formData.name} onChange={set('name')} />
                </FG>
                <FG label="Father Name">
                    <input type="text" style={inputStyle} placeholder="e.g. Mr. Tariq Ahmad" value={formData.fatherName} onChange={set('fatherName')} />
                </FG>
                <FG label="CNIC">
                    <input type="text" style={inputStyle} placeholder="35201-1234567-1" value={formData.cnic} onChange={set('cnic')} />
                </FG>
                <FG label="Date of Birth">
                    <input type="date" style={inputStyle} value={formData.dateOfBirth} onChange={set('dateOfBirth')} />
                </FG>
                <FG label="Gender">
                    <select style={inputStyle} value={formData.gender} onChange={set('gender')}>
                        <option value="">-- Select --</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </FG>
                <FG label="Blood Group">
                    <select style={inputStyle} value={formData.bloodGroup} onChange={set('bloodGroup')}>
                        <option value="">-- Select --</option>
                        {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </FG>
                <FG label="Nationality">
                    <input type="text" style={inputStyle} placeholder="e.g. Pakistani" value={formData.nationality} onChange={set('nationality')} />
                </FG>
                <FG label="Religion">
                    <input type="text" style={inputStyle} placeholder="e.g. Islam" value={formData.religion} onChange={set('religion')} />
                </FG>
                <FG label="Marital Status">
                    <select style={inputStyle} value={formData.maritalStatus} onChange={set('maritalStatus')}>
                        <option value="">-- Select --</option>
                        {MARITAL_STATUSES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </FG>
                <FG label="Employee ID">
                    <input type="text" style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} readOnly value={formData.employeeId || 'Auto-generated'} />
                </FG>

                {/* CONTACT INFORMATION */}
                <SectionHeader title="Contact Information" />

                <FG label="Email Address *">
                    <input required type="email" style={inputStyle} placeholder="teacher@university.edu.pk" value={formData.email} onChange={set('email')} />
                </FG>
                <FG label="Phone">
                    <input type="tel" style={inputStyle} placeholder="+92-300-1234567" value={formData.phone} onChange={set('phone')} />
                </FG>
                <FG label="Emergency Contact">
                    <input type="tel" style={inputStyle} placeholder="+92-321-0000000" value={formData.emergencyContact} onChange={set('emergencyContact')} />
                </FG>
                <div /> {/* spacer */}
                <FG label="Address">
                    <input type="text" style={inputStyle} placeholder="House, Street, City" value={formData.address} onChange={set('address')} />
                </FG>

                {/* PROFESSIONAL INFORMATION */}
                <SectionHeader title="Professional Information" />

                <FG label="Designation">
                    <input type="text" style={inputStyle} placeholder="e.g. Assistant Professor" value={formData.designation} onChange={set('designation')} />
                </FG>
                <FG label="Employment Type">
                    <select style={inputStyle} value={formData.employmentType} onChange={set('employmentType')}>
                        <option value="">-- Select --</option>
                        {EMPLOYMENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </FG>
                <FG label="Department">
                    <select style={inputStyle} value={formData.department} onChange={set('department')}>
                        <option value="">-- Select Department --</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </FG>
                <FG label="Faculty">
                    <select style={inputStyle} value={formData.faculty} onChange={set('faculty')}>
                        <option value="">-- Select Faculty --</option>
                        {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                </FG>
                <FG label="Joining Date">
                    <input type="date" style={inputStyle} value={formData.joiningDate} onChange={set('joiningDate')} />
                </FG>
                <FG label="Experience">
                    <input type="text" style={inputStyle} placeholder="e.g. 8 years" value={formData.experience} onChange={set('experience')} />
                </FG>
                <FG label="Specialization">
                    <input type="text" style={inputStyle} placeholder="e.g. Machine Learning, NLP" value={formData.specialization} onChange={set('specialization')} />
                </FG>
                <FG label="Highest Qualification">
                    <input type="text" style={inputStyle} placeholder="e.g. PhD Computer Science" value={formData.qualification} onChange={set('qualification')} />
                </FG>

                {/* PASSWORD (create only) */}
                {isCreate && (
                    <>
                        <SectionHeader title="Account" />
                        <FG label="Initial Password *">
                            <input required type="password" style={inputStyle} placeholder="Min. 8 characters" value={formData.password} onChange={set('password')} />
                        </FG>
                    </>
                )}
            </div>

            <div className="modal-footer" style={{ marginTop: '1.2rem' }}>
                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={18} /> : isCreate ? 'Add Teacher' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    // ── Profile view shortcut ────────────────────────────────────────
    if (viewingProfile) {
        return (
            <TeacherProfileView
                teacher={viewingProfile}
                onBack={() => { setViewingProfile(null); dispatch(resetProfile()); }}
            />
        );
    }

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--uni-primary)' }}>Teachers List</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={handleExport}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#50cc7f', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                        <Download size={15} /> Export CSV
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#45caff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                        <Upload size={15} /> Import CSV
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
                    </label>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }} onClick={openAdd}>
                        <Plus size={16} /> Add Teacher
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input type="text" className="search-input"
                        placeholder="Search by name, email, CNIC, Employee ID, designation..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px', width: '100%' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '130px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '165px' }}>
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <select value={filterEmpType} onChange={e => setFilterEmpType(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '145px' }}>
                    <option value="all">All Types</option>
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                {loading && users.length === 0 ? (
                    <div className="table-loading"><Loader2 className="spinner-large" /></div>
                ) : (
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Full Name</th>
                                <th>Designation</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Employment Type</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(usr => (
                                <tr key={usr._id}>
                                    <td><span style={{ fontFamily: 'monospace', color: '#0ff0fc', fontSize: '0.82rem' }}>{usr.employeeId || '—'}</span></td>
                                    <td>
                                        <strong>{usr.name}</strong>
                                        {usr.specialization && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{usr.specialization}</div>}
                                    </td>
                                    <td>{usr.designation || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                                    <td>{usr.department?.name || usr.department || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                                    <td>{usr.email}</td>
                                    <td>{usr.phone || '—'}</td>
                                    <td>
                                        {usr.employmentType ? (
                                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, background: usr.employmentType === 'Permanent' ? 'rgba(80,204,127,0.12)' : 'rgba(255,204,0,0.12)', color: usr.employmentType === 'Permanent' ? '#50cc7f' : '#ffcc00' }}>
                                                {usr.employmentType}
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${usr.isActive ? 'active' : 'inactive'}`}>
                                            {usr.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn" onClick={() => setViewingProfile(usr)} title="View Full Profile"
                                            style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc' }}><Eye size={15} /></button>
                                        <button className="action-btn edit" onClick={() => openEdit(usr)} title="Edit"><Edit2 size={15} /></button>
                                        <button className="action-btn" onClick={() => openReset(usr)} title="Reset Password"
                                            style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00' }}><KeyRound size={15} /></button>
                                        <button className="action-btn toggle" onClick={() => dispatch(toggleUserStatus(usr._id))} title={usr.isActive ? 'Deactivate' : 'Activate'}>
                                            {usr.isActive ? <ShieldBan size={15} /> : <ShieldCheck size={15} />}
                                        </button>
                                        <button className="action-btn delete" onClick={() => window.confirm('Delete this Teacher permanently?') && dispatch(deleteUser(usr._id))} title="Delete">
                                            <UserX size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No Teachers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
                📋 Import CSV format: <code style={{ color: 'rgba(255,255,255,0.5)' }}>Name, Email, Password, Phone</code> (header row required)
            </div>

            {/* ── Add / Edit Modal ── */}
            {(isCreateModalOpen || isEditModalOpen) && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '780px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <BookOpen size={18} color="#0ff0fc" />
                                {isCreateModalOpen ? 'Add New Teacher' : 'Edit Teacher'}
                            </h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        {renderForm(isCreateModalOpen)}
                    </div>
                </div>,
                document.body
            )}

            {/* ── Reset Password Modal ── */}
            {isResetModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '380px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>Reset Password</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Resetting password for <strong style={{ color: '#fff' }}>{selectedUser.name}</strong>.
                        </p>
                        <form className="modal-form" onSubmit={handleResetPassword} className="modal-form">
                            <div className="form-group">
                                <label>New Password</label>
                                <input required type="password" placeholder="Min. 8 characters"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={resetLoading}
                                    className="primary-btn">
                                    {resetLoading ? <Loader2 className="spinner" size={18} /> : <><RefreshCw size={14} /> Reset Password</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TeacherManagement;
