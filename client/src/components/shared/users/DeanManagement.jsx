import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../../../store/academicSlice';
import { createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword } from '../../../store/userSlice';
import { Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound, Loader2, X, Search, Filter, Download, Building2, Eye, Camera } from 'lucide-react';

const generateEmployeeId = () => `EMP-${Date.now().toString().slice(-6)}`;

const GENDERS = ['Male', 'Female', 'Other'];
const emptyForm = {
    name: '', email: '', password: '', phone: '', cnic: '',
    gender: '', dateOfBirth: '', address: '', faculty: '',
    joiningDate: '', qualification: '', experience: '',
    profilePicture: '', role: 'Dean'
};

const DeanManagement = ({ users, loading }) => {
    const dispatch = useDispatch();
    const { records } = useSelector(state => state.academic);
    const faculties = records.faculties || [];

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
    const [filterFaculty, setFilterFaculty] = useState('all');

    useEffect(() => {
        dispatch(fetchAcademicData('faculties'));
    }, [dispatch]);

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
        const matchFaculty =
            filterFaculty === 'all' ||
            (u.faculty?._id || u.faculty) === filterFaculty;
        return matchSearch && matchStatus && matchFaculty;
    });

    // ── Export CSV ─────────────────────────────────────────────────
    const exportCSV = () => {
        const headers = ['Employee ID', 'Full Name', 'CNIC', 'Gender', 'Email', 'Phone', 'Faculty', 'Joining Date', 'Qualification', 'Experience', 'Status'];
        const rows = filtered.map(u => [
            u.employeeId || '', u.name, u.cnic || '', u.gender || '',
            u.email, u.phone || '',
            u.faculty?.name || u.faculty || '',
            u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '',
            u.qualification || '', u.experience || '',
            u.isActive ? 'Active' : 'Inactive'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'deans_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

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
            address: user.address || '', faculty: user.faculty?._id || user.faculty || '',
            joiningDate: user.joiningDate ? user.joiningDate.substring(0, 10) : '',
            qualification: user.qualification || '', experience: user.experience || '',
            profilePicture: user.profilePicture || '', role: 'Dean'
        });
        setIsEditModalOpen(true);
    };

    const openView = (user) => { setSelectedUser(user); setIsViewModalOpen(true); };
    const openReset = (user) => { setSelectedUser(user); setNewPassword(''); setIsResetModalOpen(true); };
    const closeAll = () => { setIsCreateModalOpen(false); setIsEditModalOpen(false); setIsResetModalOpen(false); setIsViewModalOpen(false); setSelectedUser(null); };

    const handleCreate = (e) => {
        e.preventDefault();
        dispatch(createUser({ ...formData, role: 'Dean', employeeId: formData.employeeId || generateEmployeeId() }));
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
        <form className="modal-form" onSubmit={isCreate ? handleCreate : handleEditSave} className="modal-form">
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input required type="text" placeholder="e.g. Dr. Ahmed Khan" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input required type="email" placeholder="dean@university.edu.pk" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
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
                    <label>Faculty</label>
                    <select value={formData.faculty} onChange={e => setFormData({ ...formData, faculty: e.target.value })}>
                        <option value="">-- Select Faculty --</option>
                        {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Joining Date</label>
                    <input type="date" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                </div>
            </div>
            {/* Row 6 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Qualification</label>
                    <input type="text" placeholder="e.g. PhD Computer Science" value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Experience</label>
                    <input type="text" placeholder="e.g. 15 years" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} />
                </div>
            </div>
            {/* Profile Picture URL */}
            <div className="form-group">
                <label>Profile Picture URL (Optional)</label>
                <input type="text" placeholder="https://... or leave blank" value={formData.profilePicture} onChange={e => setFormData({ ...formData, profilePicture: e.target.value })} />
            </div>
            {/* Password — only for create */}
            {isCreate && (
                <div className="form-group">
                    <label>Initial Password</label>
                    <input required type="password" placeholder="Min. 8 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                </div>
            )}
            <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={18} /> : isCreate ? 'Add Dean' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--uni-primary)' }}>Deans List</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }} onClick={openAdd}>
                        <Plus size={16} /> Add Dean
                    </button>
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#50cc7f', cursor: 'pointer', fontWeight: 600 }}>
                        <Download size={15} /> Export CSV
                    </button>
                </div>
            </div>

            {/* ── Search & Filter ── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, CNIC, Employee ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px', width: '100%' }}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '130px' }}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select
                    value={filterFaculty}
                    onChange={e => setFilterFaculty(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '160px' }}
                >
                    <option value="all">All Faculties</option>
                    {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
            </div>

            {/* ── Table ── */}
            <div className="table-container">
                {loading && users.length === 0 ? (
                    <div className="table-loading"><Loader2 className="spinner-large" /></div>
                ) : (
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Profile</th>
                                <th>Employee ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Faculty</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(usr => (
                                <tr key={usr._id}>
                                    <td>
                                        {usr.profilePicture
                                            ? <img src={usr.profilePicture} alt={usr.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(15,240,252,0.4)' }} />
                                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0ff0fc, #bc13fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.85rem' }}>{usr.name?.charAt(0)?.toUpperCase()}</div>
                                        }
                                    </td>
                                    <td><span style={{ fontFamily: 'monospace', color: '#0ff0fc', fontSize: '0.85rem' }}>{usr.employeeId || '—'}</span></td>
                                    <td><strong>{usr.name}</strong>{usr.qualification && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{usr.qualification}</div>}</td>
                                    <td>{usr.email}</td>
                                    <td>{usr.faculty?.name || usr.faculty || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Unassigned</span>}</td>
                                    <td>{usr.phone || '—'}</td>
                                    <td>
                                        <span className={`status-badge ${usr.isActive ? 'active' : 'inactive'}`}>
                                            {usr.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn" onClick={() => openView(usr)} title="View Profile" style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc' }}><Eye size={15} /></button>
                                        <button className="action-btn edit" onClick={() => openEdit(usr)} title="Edit"><Edit2 size={15} /></button>
                                        <button className="action-btn" onClick={() => openReset(usr)} title="Reset Password" style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00' }}><KeyRound size={15} /></button>
                                        <button className="action-btn toggle" onClick={() => dispatch(toggleUserStatus(usr._id))} title={usr.isActive ? 'Deactivate' : 'Activate'}>
                                            {usr.isActive ? <ShieldBan size={15} /> : <ShieldCheck size={15} />}
                                        </button>
                                        <button className="action-btn delete" onClick={() => window.confirm('Delete this Dean permanently?') && dispatch(deleteUser(usr._id))} title="Delete"><UserX size={15} /></button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No Deans found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Add / Edit Modal ── */}
            {(isCreateModalOpen || isEditModalOpen) && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '620px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>{isCreateModalOpen ? 'Add New Dean' : 'Edit Dean'}</h3>
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
                    <div className="modal-content glass-panel-dash" style={{ width: '500px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>Dean Profile</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0.5rem 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                {selectedUser.profilePicture
                                    ? <img src={selectedUser.profilePicture} alt={selectedUser.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #0ff0fc' }} />
                                    : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0ff0fc, #bc13fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '1.5rem' }}>{selectedUser.name?.charAt(0)?.toUpperCase()}</div>
                                }
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedUser.name}</div>
                                    <div style={{ color: '#0ff0fc', fontSize: '0.85rem' }}>{selectedUser.employeeId || 'No Employee ID'}</div>
                                    <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                            {[
                                ['Email', selectedUser.email],
                                ['CNIC', selectedUser.cnic],
                                ['Gender', selectedUser.gender],
                                ['Date of Birth', selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : '—'],
                                ['Phone', selectedUser.phone],
                                ['Address', selectedUser.address],
                                ['Faculty', selectedUser.faculty?.name || selectedUser.faculty],
                                ['Joining Date', selectedUser.joiningDate ? new Date(selectedUser.joiningDate).toLocaleDateString() : '—'],
                                ['Qualification', selectedUser.qualification],
                                ['Experience', selectedUser.experience],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span style={{ minWidth: 130, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{label}</span>
                                    <span style={{ color: val ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{val || '—'}</span>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer" style={{ marginTop: '1rem' }}>
                            <button className="cancel-btn" onClick={closeAll}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Reset Password Modal ── */}
            {isResetModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '400px', borderRadius: '14px', padding: '1.5rem' }}>
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
                                <input required type="password" placeholder="Min. 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={resetLoading} className="primary-btn">
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

export default DeanManagement;
