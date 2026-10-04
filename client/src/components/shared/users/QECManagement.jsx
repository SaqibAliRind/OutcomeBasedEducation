import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword } from '../../../store/userSlice';
import { Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound, Loader2, X, Search, FileText } from 'lucide-react';

const generateEmployeeId = () => `EMP-${Date.now().toString().slice(-6)}`;

const GENDERS = ['Male', 'Female', 'Other'];
const emptyForm = {
    name: '', email: '', password: '', phone: '', cnic: '',
    gender: '', dateOfBirth: '', address: '',
    joiningDate: '', qualification: '', experience: '',
    profilePicture: '', role: 'QEC'
};

const QECManagement = ({ users, loading }) => {
    const dispatch = useDispatch();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // ── Filtering ──────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch =
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.employeeId || '').toLowerCase().includes(q) ||
            (u.cnic || '').toLowerCase().includes(q);
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && u.isActive) ||
            (filterStatus === 'inactive' && !u.isActive);
        return matchSearch && matchStatus;
    });

    // ── Handlers ───────────────────────────────────────────────────
    const openAdd = () => {
        setFormData({ ...emptyForm, employeeId: generateEmployeeId() });
        setIsCreateModalOpen(true);
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '', email: user.email || '', password: '',
            phone: user.phone || '', cnic: user.cnic || '',
            gender: user.gender || '', dateOfBirth: user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '',
            address: user.address || '',
            joiningDate: user.joiningDate ? user.joiningDate.substring(0, 10) : '',
            qualification: user.qualification || '', experience: user.experience || '',
            profilePicture: user.profilePicture || '', role: 'QEC'
        });
        setIsEditModalOpen(true);
    };

    const openView = (user) => { setSelectedUser(user); setIsViewModalOpen(true); };
    const openReset = (user) => { setSelectedUser(user); setNewPassword(''); setIsResetModalOpen(true); };
    const closeAll = () => { setIsCreateModalOpen(false); setIsEditModalOpen(false); setIsResetModalOpen(false); setIsViewModalOpen(false); setSelectedUser(null); };

    const handleCreate = (e) => {
        e.preventDefault();
        dispatch(createUser({ ...formData, role: 'QEC', employeeId: formData.employeeId || generateEmployeeId() }));
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

    // ── Shared form fields ─────────────────────────────────────────
    const renderForm = (isCreate) => (
        <form className="modal-form" onSubmit={isCreate ? handleCreate : handleEditSave}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input required type="text" placeholder="e.g. Ali Reza" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input required type="email" placeholder="qec@university.edu.pk" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
            </div>
            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Employee ID</label>
                    <input type="text" readOnly value={formData.employeeId || 'Auto-generated'} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                    <label>CNIC</label>
                    <input type="text" placeholder="35201-1234567-1" value={formData.cnic} onChange={e => setFormData({ ...formData, cnic: e.target.value })} />
                </div>
            </div>
            {/* Row 3 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="">-- Select --</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" placeholder="+92-300-1234567" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
            </div>
            {/* Row 4 */}
            <div className="form-group">
                <label>Address</label>
                <input type="text" placeholder="House No, Street, City" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
            {/* Row 5 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Joining Date</label>
                    <input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Qualification</label>
                    <input type="text" placeholder="e.g. Quality Assurance Management" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                </div>
            </div>
            {/* Row 6 */}
            <div className="form-group">
                <label>Experience</label>
                <input type="text" placeholder="e.g. 5 years" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
            </div>
            {/* Password — only for create */}
            {isCreate && (
                <div className="form-group">
                    <label>Temporary Password</label>
                    <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={closeAll} className="cancel-btn">Cancel</button>
                <button type="submit" className="primary-btn">{isCreate ? 'Create QEC Officer' : 'Save Changes'}</button>
            </div>
        </form>
    );

    return (
        <div className="role-management">
            {/* Tools */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input type="text" className="search-input" placeholder="Search QEC Officers..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
                <button onClick={openAdd} className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={18} /> Add QEC Officer</button>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="uni-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && users.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="spinner" size={30} color="var(--uni-primary)" /></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No QEC officers found.</td></tr>
                        ) : filtered.map(u => (
                            <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.5 }}>
                                <td>{u.employeeId || '—'}</td>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.name.charAt(0)}</div>
                                    <strong style={{ color: '#fff' }}>{u.name}</strong>
                                </div></td>
                                <td>{u.email}</td>
                                <td>
                                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', background: u.isActive ? 'rgba(80,204,127,0.2)' : 'rgba(255,27,107,0.2)', color: u.isActive ? '#50cc7f' : '#ff1b6b' }}>
                                        {u.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                        <button onClick={() => openEdit(u)} className="action-btn" title="Edit"><Edit2 size={15} color="#0ff0fc" /></button>
                                        <button onClick={() => openReset(u)} className="action-btn" title="Reset Password"><KeyRound size={15} color="#ffc107" /></button>
                                        <button onClick={() => { if(window.confirm(`Toggle status for ${u.name}?`)) dispatch(toggleUserStatus(u._id)) }} className="action-btn" title={u.isActive ? 'Deactivate' : 'Activate'}>
                                            {u.isActive ? <ShieldBan size={15} color="#ff1b6b" /> : <ShieldCheck size={15} color="#50cc7f" />}
                                        </button>
                                        <button onClick={() => { if(window.confirm(`Delete ${u.name}?`)) dispatch(deleteUser(u._id)) }} className="action-btn" title="Delete"><UserX size={15} color="#ff1b6b" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {isCreateModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3><Plus size={20} /> Add QEC Officer</h3>
                            <button onClick={closeAll} className="close-btn"><X size={20} /></button>
                        </div>
                        {renderForm(true)}
                    </div>
                </div>,
                document.body
            )}

            {isEditModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3><Edit2 size={20} /> Edit QEC Officer</h3>
                            <button onClick={closeAll} className="close-btn"><X size={20} /></button>
                        </div>
                        {renderForm(false)}
                    </div>
                </div>,
                document.body
            )}

            {isResetModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '400px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 style={{ color: '#ffc107' }}><KeyRound size={20} /> Reset Password</h3>
                            <button onClick={closeAll} className="close-btn"><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Reset password for <strong>{selectedUser?.name}</strong>
                        </p>
                        <form className="modal-form" onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={closeAll} className="page-btn">Cancel</button>
                                <button type="submit" disabled={resetLoading} className="page-btn" style={{ background: '#ffc107', color: '#000', fontWeight: 'bold', border: 'none' }}>
                                    {resetLoading ? <Loader2 className="spinner" size={16} /> : 'Reset Password'}
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

export default QECManagement;
