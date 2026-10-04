import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../../../store/academicSlice';
import { createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword } from '../../../store/userSlice';
import {
    Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound,
    Loader2, X, Search, Download, Users, Eye, RefreshCw
} from 'lucide-react';

const generateEmployeeId = () => `EMP-${Date.now().toString().slice(-6)}`;

const emptyForm = {
    name: '', email: '', password: '', phone: '',
    employeeId: '', department: '',
    qualification: '', experience: '', office: '',
    role: 'HOD'
};

const HODManagement = ({ users, loading }) => {
    const dispatch = useDispatch();
    const { records } = useSelector(state => state.academic);
    const departments = records.departments || [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
    const [isResetModalOpen,  setIsResetModalOpen]  = useState(false);
    const [isViewModalOpen,   setIsViewModalOpen]   = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const [selectedUser,       setSelectedUser]      = useState(null);
    const [formData,           setFormData]          = useState(emptyForm);
    const [newPassword,        setNewPassword]       = useState('');
    const [resetLoading,       setResetLoading]      = useState(false);

    // Assign Department state
    const [selectedDept,  setSelectedDept]  = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    // Search & Filter
    const [search,         setSearch]        = useState('');
    const [filterStatus,   setFilterStatus]  = useState('all');
    const [filterDept,     setFilterDept]    = useState('all');

    useEffect(() => {
        dispatch(fetchAcademicData('departments'));
    }, [dispatch]);

    // ── Filtering ───────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch =
            (u.name  || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.employeeId || '').toLowerCase().includes(q) ||
            (u.office || '').toLowerCase().includes(q);
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active'   &&  u.isActive) ||
            (filterStatus === 'inactive' && !u.isActive);
        const matchDept =
            filterDept === 'all' ||
            (u.department?._id || u.department) === filterDept;
        return matchSearch && matchStatus && matchDept;
    });

    // ── Export CSV ──────────────────────────────────────────────────
    const exportCSV = () => {
        const headers = ['Employee ID', 'Full Name', 'Email', 'Phone', 'Department', 'Qualification', 'Experience', 'Office', 'Status'];
        const rows = filtered.map(u => [
            u.employeeId || '', u.name, u.email, u.phone || '',
            u.department?.name || u.department || '',
            u.qualification || '', u.experience || '', u.office || '',
            u.isActive ? 'Active' : 'Inactive'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'hods_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    // ── Handlers ────────────────────────────────────────────────────
    const closeAll = () => {
        setIsCreateModalOpen(false); setIsEditModalOpen(false);
        setIsResetModalOpen(false);  setIsViewModalOpen(false);
        setIsAssignModalOpen(false); setSelectedUser(null);
    };

    const openAdd = () => {
        setFormData({ ...emptyForm, employeeId: generateEmployeeId() });
        setIsCreateModalOpen(true);
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '', email: user.email || '', password: '',
            phone: user.phone || '', employeeId: user.employeeId || '',
            department: user.department?._id || user.department || '',
            qualification: user.qualification || '',
            experience:   user.experience   || '',
            office:       user.office       || '',
            role: 'HOD'
        });
        setIsEditModalOpen(true);
    };

    const openView   = (user) => { setSelectedUser(user); setIsViewModalOpen(true); };
    const openReset  = (user) => { setSelectedUser(user); setNewPassword(''); setIsResetModalOpen(true); };
    const openAssign = (user) => {
        setSelectedUser(user);
        setSelectedDept(user.department?._id || user.department || '');
        setIsAssignModalOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        dispatch(createUser({ ...formData, role: 'HOD' }));
        closeAll();
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        const { password, ...rest } = formData;
        dispatch(updateUser({ id: selectedUser._id, userData: rest }));
        closeAll();
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        await dispatch(adminResetUserPassword({ id: selectedUser._id, newPassword }));
        setResetLoading(false);
        closeAll();
    };

    const handleAssignDept = (e) => {
        e.preventDefault();
        setAssignLoading(true);
        // Update HOD's department field via updateUser
        dispatch(updateUser({ id: selectedUser._id, userData: { department: selectedDept } }));
        setAssignLoading(false);
        closeAll();
    };

    // ── Shared form body ────────────────────────────────────────────
    const renderForm = (isCreate) => (
        <form className="modal-form" onSubmit={isCreate ? handleCreate : handleEditSave} className="modal-form">
            {/* Row 1: Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input required type="text" placeholder="Dr. Salman Baig" value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input required type="email" placeholder="hod@university.edu.pk" value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
            </div>

            {/* Row 2: Employee ID & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Employee ID</label>
                    <input type="text" readOnly value={formData.employeeId || 'Auto-generated'}
                        style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" placeholder="+92-300-1234567" value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
            </div>

            {/* Row 3: Department & Office */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Department</label>
                    <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                        <option value="">-- Select Department --</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Office</label>
                    <input type="text" placeholder="e.g. Room 302, Block A" value={formData.office}
                        onChange={e => setFormData({ ...formData, office: e.target.value })} />
                </div>
            </div>

            {/* Row 4: Qualification & Experience */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Qualification</label>
                    <input type="text" placeholder="e.g. PhD Computer Science" value={formData.qualification}
                        onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Experience</label>
                    <input type="text" placeholder="e.g. 12 years" value={formData.experience}
                        onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                </div>
            </div>

            {/* Password — create only */}
            {isCreate && (
                <div className="form-group">
                    <label>Initial Password</label>
                    <input required type="password" placeholder="Min. 8 characters" value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
            )}

            <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={18} /> : isCreate ? 'Add HOD' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--uni-primary)' }}>HODs List</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }} onClick={openAdd}>
                        <Plus size={16} /> Add HOD
                    </button>
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#50cc7f', cursor: 'pointer', fontWeight: 600 }}>
                        <Download size={15} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                        type="text" className="search-input"
                        placeholder="Search by name, email, Employee ID, office..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px', width: '100%' }}
                    />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '130px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '170px' }}>
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
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
                                <th>Department</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Office</th>
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
                                        {usr.qualification && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{usr.qualification}</div>}
                                    </td>
                                    <td>{usr.department?.name || usr.department || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}</td>
                                    <td>{usr.email}</td>
                                    <td>{usr.phone || '—'}</td>
                                    <td>{usr.office || '—'}</td>
                                    <td>
                                        <span className={`status-badge ${usr.isActive ? 'active' : 'inactive'}`}>
                                            {usr.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn" onClick={() => openView(usr)} title="View Profile"
                                            style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc' }}><Eye size={15} /></button>
                                        <button className="action-btn" onClick={() => openAssign(usr)} title="Assign / Change Department"
                                            style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe' }}><Users size={15} /></button>
                                        <button className="action-btn edit" onClick={() => openEdit(usr)} title="Edit"><Edit2 size={15} /></button>
                                        <button className="action-btn" onClick={() => openReset(usr)} title="Reset Password"
                                            style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00' }}><KeyRound size={15} /></button>
                                        <button className="action-btn toggle" onClick={() => dispatch(toggleUserStatus(usr._id))} title={usr.isActive ? 'Deactivate' : 'Activate'}>
                                            {usr.isActive ? <ShieldBan size={15} /> : <ShieldCheck size={15} />}
                                        </button>
                                        <button className="action-btn delete" onClick={() => window.confirm('Delete this HOD permanently?') && dispatch(deleteUser(usr._id))} title="Delete">
                                            <UserX size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No HODs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Add / Edit Modal ── */}
            {(isCreateModalOpen || isEditModalOpen) && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '580px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>{isCreateModalOpen ? 'Add New HOD' : 'Edit HOD'}</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        {renderForm(isCreateModalOpen)}
                    </div>
                </div>,
                document.body
            )}

            {/* ── View Profile Modal ── */}
            {isViewModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '460px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>HOD Profile</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1rem' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #bc13fe, #0ff0fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '1.3rem' }}>
                                {selectedUser.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedUser.name}</div>
                                <div style={{ color: '#bc13fe', fontSize: '0.82rem' }}>{selectedUser.employeeId || 'No Employee ID'}</div>
                                <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        {[
                            ['Email',         selectedUser.email],
                            ['Phone',         selectedUser.phone],
                            ['Department',    selectedUser.department?.name || selectedUser.department],
                            ['Office',        selectedUser.office],
                            ['Qualification', selectedUser.qualification],
                            ['Experience',    selectedUser.experience],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ minWidth: 120, color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem' }}>{label}</span>
                                <span style={{ color: val ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.84rem' }}>{val || '—'}</span>
                            </div>
                        ))}
                        <div className="modal-footer" style={{ marginTop: '1rem' }}>
                            <button className="cancel-btn" onClick={closeAll}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Assign / Change Department Modal ── */}
            {isAssignModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '400px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>Assign / Change Department</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                            Setting department for <strong style={{ color: '#fff' }}>{selectedUser.name}</strong>.
                            {selectedUser.department && (
                                <> Current: <span style={{ color: '#bc13fe' }}>{selectedUser.department?.name || selectedUser.department}</span></>
                            )}
                        </p>
                        <form className="modal-form" onSubmit={handleAssignDept} className="modal-form">
                            <div className="form-group">
                                <label>Select Department</label>
                                <select required value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                                    <option value="">-- Select Department --</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={assignLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {assignLoading ? <Loader2 className="spinner" size={16} /> : <><RefreshCw size={14} /> Assign Department</>}
                                </button>
                            </div>
                        </form>
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
                                    {resetLoading ? <Loader2 className="spinner" size={18} /> : 'Reset Password'}
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

export default HODManagement;
