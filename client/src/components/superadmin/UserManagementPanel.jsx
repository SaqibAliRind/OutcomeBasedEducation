import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchUniversityAdmins, createUniversityAdmin, updateUniversityAdmin,
    deleteUniversityAdmin, resetAdminPassword, toggleAdminStatus, clearAdminMessages
} from '../../store/adminSlice';
import { fetchUniversities } from '../../store/universitySlice';
import Pagination from '../shared/Pagination';
import { Plus, Edit2, Trash2, KeyRound, ShieldBan, ShieldCheck, X, Loader2, Copy, Check, User } from 'lucide-react';

// ─── Small Helpers ───────────────────────────────────────────
const INITIAL_FORM = { name: '', email: '', phone: '', username: '', password: '', confirmPassword: '', profilePicture: '', status: 'Active', university: '' };

const UserManagementPanel = () => {
    const dispatch = useDispatch();
    const { admins, pagination, loading, error, successMessage, tempPassword } = useSelector(s => s.admin);
    const { list: universities } = useSelector(s => s.university);

    const [modal, setModal]     = useState(null); // 'create' | 'edit' | 'tempPass'
    const [selected, setSelected] = useState(null);
    const [form, setForm]       = useState(INITIAL_FORM);
    const [formErr, setFormErr] = useState('');
    const [search, setSearch]   = useState('');
    const [copied, setCopied]   = useState(false);

    const load = useCallback((page = 1) => {
        dispatch(fetchUniversityAdmins({ page, limit: 10, search }));
    }, [dispatch, search]);

    useEffect(() => { load(1); }, [search]);
    useEffect(() => { dispatch(fetchUniversities()); }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            if (tempPassword) { setModal('tempPass'); }
            else { closeModal(); load(pagination.page); }
            setTimeout(() => dispatch(clearAdminMessages()), 4000);
        }
    }, [successMessage, tempPassword]);

    const closeModal = () => { setModal(null); setSelected(null); setForm(INITIAL_FORM); setFormErr(''); };

    const openCreate = () => { setForm(INITIAL_FORM); setModal('create'); };
    const openEdit   = (admin) => { setSelected(admin); setForm({ name: admin.name, email: admin.email, phone: admin.phone || '', username: admin.username || '', profilePicture: admin.profilePicture || '', password: '', confirmPassword: '', status: admin.isActive ? 'Active' : 'Inactive', university: admin.university?._id || '' }); setModal('edit'); };

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        setFormErr('');
        if (form.password !== form.confirmPassword) return setFormErr('Passwords do not match');
        if (form.password.length < 6) return setFormErr('Password must be at least 6 characters');
        const { confirmPassword, ...payload } = form;
        await dispatch(createUniversityAdmin({ ...payload, isActive: form.status === 'Active' }));
        load(1);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        await dispatch(updateUniversityAdmin({ id: selected._id, data: { name: form.name, email: form.email, phone: form.phone, profilePicture: form.profilePicture, university: form.university, status: form.status } }));
        load(pagination.page);
        closeModal();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this admin account? This action can be reversed by the database.')) return;
        await dispatch(deleteUniversityAdmin(id));
        load(pagination.page);
    };

    const handleReset = async (id) => {
        if (!window.confirm('Generate a new temporary password for this admin?')) return;
        dispatch(resetAdminPassword(id));
    };

    const copyTemp = () => {
        navigator.clipboard.writeText(tempPassword || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="user-management">
            {/* Header */}
            <div className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0ff0fc', fontSize: '1.4rem' }}>University Admin Registry</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Manage all university administrator accounts</p>
                </div>
                <button className="primary-btn" onClick={openCreate}>
                    <Plus size={16} /> Add Admin
                </button>
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: '1.2rem' }}>
                <input
                    className="search-input"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Alerts */}
            {error          && <div className="um-alert error"   style={{ marginBottom: '1rem' }}>{error}</div>}
            {successMessage && !tempPassword && <div className="um-alert success" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

            {/* Table */}
            <div className="table-container glass-panel-dash">
                {loading && admins.length === 0 ? (
                    <div className="table-loading"><Loader2 className="spinner-large" /></div>
                ) : admins.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No university admins found.</div>
                ) : (
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Admin</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>University</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(adm => (
                                <tr key={adm._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {adm.profilePicture
                                                ? <img src={adm.profilePicture} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(15,240,252,0.3)' }} />
                                                : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(15,240,252,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#0ff0fc" /></div>
                                            }
                                            <div>
                                                <strong>{adm.name}</strong>
                                                {adm.username && <div style={{ fontSize: '0.77rem', color: 'rgba(255,255,255,0.4)' }}>@{adm.username}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{adm.email}</td>
                                    <td>{adm.phone || '—'}</td>
                                    <td>{adm.university?.name || <span style={{ color: 'rgba(255,255,255,0.35)' }}>Unassigned</span>}</td>
                                    <td>
                                        <span className={`status-badge ${adm.isActive ? 'active' : 'inactive'}`}>
                                            {adm.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn edit"   title="Edit"     onClick={() => openEdit(adm)}><Edit2 size={14} /></button>
                                        <button className="action-btn toggle" title={adm.isActive ? 'Deactivate' : 'Activate'} onClick={() => dispatch(toggleAdminStatus(adm._id)).then(() => load(pagination.page))}>
                                            {adm.isActive ? <ShieldBan size={14} /> : <ShieldCheck size={14} />}
                                        </button>
                                        <button className="action-btn reset"  title="Reset Password" onClick={() => handleReset(adm._id)}><KeyRound size={14} /></button>
                                        <button className="action-btn delete" title="Delete"    onClick={() => handleDelete(adm._id)}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={p => load(p)} />

            {/* ── CREATE MODAL ── */}
            {modal === 'create' && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3><User size={18} color="#0ff0fc" style={{ marginRight: 8 }} />Create University Admin</h3>
                            <button className="close-btn" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleCreate}>
                            {formErr && <div className="um-alert error">{formErr}</div>}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input name="name" required value={form.name} onChange={handleChange} placeholder="Ali Hassan" />
                                </div>
                                <div className="form-group">
                                    <label>Username</label>
                                    <input name="username" value={form.username} onChange={handleChange} placeholder="ali_hassan" />
                                </div>
                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="ali@university.edu" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+923001234567" />
                                </div>
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Min 6 characters" />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password *</label>
                                    <input name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Profile Picture URL</label>
                                <input name="profilePicture" value={form.profilePicture} onChange={handleChange} placeholder="https://example.com/photo.jpg" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Assign University</label>
                                    <select name="university" value={form.university} onChange={handleChange}>
                                        <option value="">— Unassigned —</option>
                                        {universities.map(u => <option key={u._id} value={u._id} style={{ background: '#0d1b2e' }}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Account Status</label>
                                    <select name="status" value={form.status} onChange={handleChange}>
                                        <option value="Active"   style={{ background: '#0d1b2e' }}>Active</option>
                                        <option value="Inactive" style={{ background: '#0d1b2e' }}>Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? <Loader2 size={16} className="spinner" /> : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── EDIT MODAL ── */}
            {modal === 'edit' && selected && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '520px', width: '92%' }}>
                        <div className="modal-header">
                            <h3><Edit2 size={18} color="#0ff0fc" style={{ marginRight: 8 }} />Edit Admin Profile</h3>
                            <button className="close-btn" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleUpdate}>
                            <div className="form-group"><label>Full Name</label><input name="name" value={form.name} onChange={handleChange} /></div>
                            <div className="form-group"><label>Email Address</label><input name="email" type="email" value={form.email} onChange={handleChange} /></div>
                            <div className="form-group"><label>Phone Number</label><input name="phone" type="tel" value={form.phone} onChange={handleChange} /></div>
                            <div className="form-group"><label>Profile Picture URL</label><input name="profilePicture" value={form.profilePicture} onChange={handleChange} placeholder="https://…" /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                <div className="form-group">
                                    <label>Assign University</label>
                                    <select name="university" value={form.university} onChange={handleChange}>
                                        <option value="">— Unassigned —</option>
                                        {universities.map(u => <option key={u._id} value={u._id} style={{ background: '#0d1b2e' }}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Account Status</label>
                                    <select name="status" value={form.status} onChange={handleChange}>
                                        <option value="Active"   style={{ background: '#0d1b2e' }}>Active</option>
                                        <option value="Inactive" style={{ background: '#0d1b2e' }}>Inactive</option>
                                    </select>
                                </div>
                            </div>
                            {form.profilePicture && (
                                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    <img src={form.profilePicture} alt="Preview" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(15,240,252,0.4)' }} />
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? <Loader2 size={16} className="spinner" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── TEMP PASSWORD MODAL ── */}
            {modal === 'tempPass' && tempPassword && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
                        <div className="modal-header">
                            <h3><KeyRound size={18} color="#ffcc00" style={{ marginRight: 8 }} />Temporary Password</h3>
                            <button className="close-btn" onClick={() => { closeModal(); dispatch(clearAdminMessages()); }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '1.5rem 0' }}>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                Share this password with the admin. They will be forced to change it on first login.
                            </p>
                            <div style={{ background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                <code style={{ fontSize: '1.3rem', letterSpacing: '0.15em', color: '#ffcc00', fontFamily: 'monospace' }}>{tempPassword}</code>
                                <button onClick={copyTemp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#50cc7f' : 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}>
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                            {copied && <p style={{ color: '#50cc7f', marginTop: '0.5rem', fontSize: '0.85rem' }}>Copied to clipboard!</p>}
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'center' }}>
                            <button className="primary-btn" onClick={() => { closeModal(); dispatch(clearAdminMessages()); }}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementPanel;
