import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../../../store/academicSlice';
import { createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword } from '../../../store/userSlice';
import {
    Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound,
    Loader2, X, Search, Download, Map, Eye, RefreshCw
} from 'lucide-react';

const generateEmployeeId = () => `EMP-${Date.now().toString().slice(-6)}`;

const emptyForm = {
    name: '', email: '', password: '', phone: '',
    employeeId: '', program: '', department: '',
    role: 'ProgramCoordinator'
};

const CoordinatorManagement = ({ users, loading }) => {
    const dispatch = useDispatch();
    const { records } = useSelector(state => state.academic);
    const programs    = records.programs    || [];
    const departments = records.departments || [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
    const [isResetModalOpen,  setIsResetModalOpen]  = useState(false);
    const [isViewModalOpen,   setIsViewModalOpen]   = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    const [selectedUser,  setSelectedUser]  = useState(null);
    const [formData,      setFormData]      = useState(emptyForm);
    const [newPassword,   setNewPassword]   = useState('');
    const [resetLoading,  setResetLoading]  = useState(false);

    // Assign Program state
    const [selectedProg,  setSelectedProg]  = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    // Search & Filter
    const [search,       setSearch]       = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProg,   setFilterProg]   = useState('all');
    const [filterDept,   setFilterDept]   = useState('all');

    useEffect(() => {
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('departments'));
    }, [dispatch]);

    // ── Filtering ───────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch =
            (u.name        || '').toLowerCase().includes(q) ||
            (u.email       || '').toLowerCase().includes(q) ||
            (u.employeeId  || '').toLowerCase().includes(q) ||
            (u.phone       || '').toLowerCase().includes(q);
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active'   &&  u.isActive) ||
            (filterStatus === 'inactive' && !u.isActive);
        const matchProg =
            filterProg === 'all' ||
            (u.program?._id || u.program) === filterProg;
        const matchDept =
            filterDept === 'all' ||
            (u.department?._id || u.department) === filterDept;
        return matchSearch && matchStatus && matchProg && matchDept;
    });

    // ── Export CSV ──────────────────────────────────────────────────
    const exportCSV = () => {
        const headers = ['Employee ID', 'Full Name', 'Email', 'Phone', 'Program', 'Department', 'Status'];
        const rows = filtered.map(u => [
            u.employeeId || '', u.name, u.email, u.phone || '',
            u.program?.name    || u.program    || '',
            u.department?.name || u.department || '',
            u.isActive ? 'Active' : 'Inactive'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'coordinators_export.csv'; a.click();
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
            program:    user.program?._id    || user.program    || '',
            department: user.department?._id || user.department || '',
            role: 'ProgramCoordinator'
        });
        setIsEditModalOpen(true);
    };

    const openView   = (user) => { setSelectedUser(user); setIsViewModalOpen(true); };
    const openReset  = (user) => { setSelectedUser(user); setNewPassword(''); setIsResetModalOpen(true); };
    const openAssign = (user) => {
        setSelectedUser(user);
        setSelectedProg(user.program?._id || user.program || '');
        setIsAssignModalOpen(true);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        dispatch(createUser({ ...formData, role: 'ProgramCoordinator' }));
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

    const handleAssignProgram = (e) => {
        e.preventDefault();
        setAssignLoading(true);
        dispatch(updateUser({ id: selectedUser._id, userData: { program: selectedProg } }));
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
                    <input required type="text" placeholder="e.g. Dr. Usman Ali"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input required type="email" placeholder="coord@university.edu.pk"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
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
                    <input type="tel" placeholder="+92-300-1234567"
                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
            </div>

            {/* Row 3: Program & Department */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Program</label>
                    <select value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })}>
                        <option value="">-- Select Program --</option>
                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Department</label>
                    <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                        <option value="">-- Select Department --</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Password — create only */}
            {isCreate && (
                <div className="form-group">
                    <label>Initial Password</label>
                    <input required type="password" placeholder="Min. 8 characters"
                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
            )}

            <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={18} /> : isCreate ? 'Add Coordinator' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--uni-primary)' }}>Program Coordinators List</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }} onClick={openAdd}>
                        <Plus size={16} /> Add Coordinator
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
                    <input type="text" className="search-input"
                        placeholder="Search by name, email, Employee ID, phone..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px', width: '100%' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '130px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select value={filterProg} onChange={e => setFilterProg(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '155px' }}>
                    <option value="all">All Programs</option>
                    {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '165px' }}>
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
                                <th>Program</th>
                                <th>Department</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(usr => (
                                <tr key={usr._id}>
                                    <td><span style={{ fontFamily: 'monospace', color: '#0ff0fc', fontSize: '0.82rem' }}>{usr.employeeId || '—'}</span></td>
                                    <td><strong>{usr.name}</strong></td>
                                    <td>{usr.program?.name    || usr.program    || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}</td>
                                    <td>{usr.department?.name || usr.department || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}</td>
                                    <td>{usr.email}</td>
                                    <td>{usr.phone || '—'}</td>
                                    <td>
                                        <span className={`status-badge ${usr.isActive ? 'active' : 'inactive'}`}>
                                            {usr.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn" onClick={() => openView(usr)} title="View Profile"
                                            style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc' }}><Eye size={15} /></button>
                                        <button className="action-btn" onClick={() => openAssign(usr)} title="Assign / Change Program"
                                            style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe' }}><Map size={15} /></button>
                                        <button className="action-btn edit" onClick={() => openEdit(usr)} title="Edit"><Edit2 size={15} /></button>
                                        <button className="action-btn" onClick={() => openReset(usr)} title="Reset Password"
                                            style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00' }}><KeyRound size={15} /></button>
                                        <button className="action-btn toggle" onClick={() => dispatch(toggleUserStatus(usr._id))} title={usr.isActive ? 'Deactivate' : 'Activate'}>
                                            {usr.isActive ? <ShieldBan size={15} /> : <ShieldCheck size={15} />}
                                        </button>
                                        <button className="action-btn delete" onClick={() => window.confirm('Delete this Coordinator permanently?') && dispatch(deleteUser(usr._id))} title="Delete">
                                            <UserX size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No Coordinators found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Add / Edit Modal ── */}
            {(isCreateModalOpen || isEditModalOpen) && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>{isCreateModalOpen ? 'Add New Coordinator' : 'Edit Coordinator'}</h3>
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
                    <div className="modal-content glass-panel-dash" style={{ width: '440px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>Coordinator Profile</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1rem' }}>
                            <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg, #0ff0fc, #50cc7f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '1.3rem' }}>
                                {selectedUser.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedUser.name}</div>
                                <div style={{ color: '#0ff0fc', fontSize: '0.82rem' }}>{selectedUser.employeeId || 'No Employee ID'}</div>
                                <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        {[
                            ['Email',      selectedUser.email],
                            ['Phone',      selectedUser.phone],
                            ['Program',    selectedUser.program?.name    || selectedUser.program],
                            ['Department', selectedUser.department?.name || selectedUser.department],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ minWidth: 110, color: 'rgba(255,255,255,0.45)', fontSize: '0.84rem' }}>{label}</span>
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

            {/* ── Assign / Change Program Modal ── */}
            {isAssignModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '400px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>Assign / Change Program</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                            Setting program for <strong style={{ color: '#fff' }}>{selectedUser.name}</strong>.
                            {selectedUser.program && (
                                <> Current: <span style={{ color: '#bc13fe' }}>{selectedUser.program?.name || selectedUser.program}</span></>
                            )}
                        </p>
                        <form className="modal-form" onSubmit={handleAssignProgram} className="modal-form">
                            <div className="form-group">
                                <label>Select Program</label>
                                <select required value={selectedProg} onChange={e => setSelectedProg(e.target.value)}>
                                    <option value="">-- Select Program --</option>
                                    {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={assignLoading}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {assignLoading ? <Loader2 className="spinner" size={16} /> : <><RefreshCw size={14} /> Assign Program</>}
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

export default CoordinatorManagement;
