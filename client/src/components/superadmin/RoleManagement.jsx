import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles, createRole, updateRole, deleteRole, clearRoleMessages } from '../../store/roleSlice';
import Pagination from '../shared/Pagination';
import { Plus, Edit2, Trash2, X, Loader2, Shield, Search } from 'lucide-react';

const MODULES = ['Universities', 'Users', 'Roles', 'Faculties', 'Departments', 'Programs', 'Sessions', 'Courses', 'Settings', 'Teachers', 'Students'];
const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Reject', 'Export', 'Import'];

const createEmptyPermissions = () => MODULES.map(m => ({ moduleName: m, actions: [] }));

const INIT_FORM = { name: '', description: '', status: 'Active', permissions: createEmptyPermissions() };

const RoleManagement = () => {
    const dispatch = useDispatch();
    const { list: roles, pagination, loading, error, successMessage } = useSelector(s => s.roles);

    const [modal, setModal]   = useState(null); // 'create' | 'edit'
    const [selected, setSelected] = useState(null);
    const [form, setForm]     = useState(INIT_FORM);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const load = useCallback((page = 1) => {
        dispatch(fetchRoles({ page, limit: 10, search, status: statusFilter }));
    }, [dispatch, search, statusFilter]);

    useEffect(() => { load(1); }, [search, statusFilter]);

    useEffect(() => {
        if (successMessage) {
            closeModal();
            load(pagination.page);
            setTimeout(() => dispatch(clearRoleMessages()), 3000);
        }
    }, [successMessage]);

    const closeModal = () => { setModal(null); setSelected(null); setForm(INIT_FORM); };

    const openCreate = () => { setForm(INIT_FORM); setModal('create'); };
    const openEdit   = (role) => {
        // Merge saved permissions with missing modules
        const mergedPermissions = MODULES.map(m => {
            const existing = (role.permissions || []).find(p => p.moduleName === m);
            return existing ? { moduleName: m, actions: [...existing.actions] } : { moduleName: m, actions: [] };
        });
        setSelected(role);
        setForm({ name: role.name, description: role.description || '', status: role.status, permissions: mergedPermissions });
        setModal('edit');
    };

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handlePermissionToggle = (moduleName, action) => {
        setForm(prev => {
            const newPerms = prev.permissions.map(p => {
                if (p.moduleName !== moduleName) return p;
                const hasAction = p.actions.includes(action);
                return {
                    ...p,
                    actions: hasAction ? p.actions.filter(a => a !== action) : [...p.actions, action]
                };
            });
            return { ...prev, permissions: newPerms };
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        await dispatch(createRole(form));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        await dispatch(updateRole({ id: selected._id, data: form }));
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Soft-delete role "${name}"? It will no longer be shown but data is preserved.`)) return;
        await dispatch(deleteRole(id));
        load(pagination.page);
    };

    const renderPermissionMatrix = () => (
        <div style={{ marginTop: '1rem', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ color: '#bc13fe', marginBottom: '1rem', fontSize: '0.95rem' }}>Permission Matrix</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '8px', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Module</th>
                        {ACTIONS.map(a => <th key={a} style={{ padding: '8px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{a}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {form.permissions.map(p => (
                        <tr key={p.moduleName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ textAlign: 'left', padding: '10px 8px', color: '#fff', fontWeight: 500 }}>{p.moduleName}</td>
                            {ACTIONS.map(a => (
                                <td key={a} style={{ padding: '10px 8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={p.actions.includes(a)}
                                        onChange={() => handlePermissionToggle(p.moduleName, a)}
                                        style={{ cursor: 'pointer', accentColor: '#0ff0fc', width: '16px', height: '16px' }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="user-management">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#bc13fe', fontSize: '1.4rem' }}>Role Management</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Define and manage system roles</p>
                </div>
                <button className="primary-btn" onClick={openCreate} className="primary-btn">
                    <Plus size={16} /> Create Role
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input className="search-input" style={{ paddingLeft: '2rem' }} placeholder="Search roles…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Statuses</option>
                    <option value="Active"   style={{ background: '#0d1b2e' }}>Active</option>
                    <option value="Inactive" style={{ background: '#0d1b2e' }}>Inactive</option>
                </select>
            </div>

            {/* Alerts */}
            {error          && <div className="um-alert error"   style={{ marginBottom: '1rem' }}>{error}</div>}
            {successMessage && <div className="um-alert success" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

            {/* Table */}
            <div className="table-container glass-panel-dash">
                {loading && roles.length === 0 ? <div className="table-loading"><Loader2 className="spinner-large" /></div> : roles.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No roles found.</div> : (
                    <table className="uni-table">
                        <thead><tr><th><Shield size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />Role Name</th><th>Description</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role._id}>
                                    <td><strong style={{ color: '#bc13fe' }}>{role.name}</strong></td>
                                    <td style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '300px' }}>{role.description || <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>No description</span>}</td>
                                    <td><span className={`status-badge ${role.status === 'Active' ? 'active' : 'inactive'}`}>{role.status}</span></td>
                                    <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>{new Date(role.createdAt).toLocaleDateString()}</td>
                                    <td className="actions-col">
                                        <button className="action-btn edit" title="Edit Role" onClick={() => openEdit(role)}><Edit2 size={14} /></button>
                                        <button className="action-btn delete" title="Delete Role" onClick={() => handleDelete(role._id, role.name)}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={p => load(p)} />

            {/* ── CREATE / EDIT MODAL ── */}
            {modal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '800px', width: '96%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3><Shield size={18} color="#bc13fe" style={{ marginRight: 8 }} />{modal === 'create' ? 'Create New Role' : 'Edit Role'}</h3>
                            <button type="button" className="close-btn" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={modal === 'create' ? handleCreate : handleUpdate}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 2fr)', gap: '1.5rem' }}>
                                {/* Basic Info */}
                                <div>
                                    <div className="form-group"><label>Role Name *</label><input name="name" required value={form.name} onChange={handleChange} placeholder="e.g., Examiner" /></div>
                                    <div className="form-group"><label>Status</label><select name="status" value={form.status} onChange={handleChange}><option value="Active" style={{ background: '#0d1b2e' }}>Active</option><option value="Inactive" style={{ background: '#0d1b2e' }}>Inactive</option></select></div>
                                    <div className="form-group"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem', color: '#fff', outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box' }} /></div>
                                </div>
                                {/* Matrix */}
                                <div>
                                    {renderPermissionMatrix()}
                                </div>
                            </div>
                            
                            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading} className="primary-btn">
                                    {loading ? <Loader2 size={16} className="spinner" /> : modal === 'create' ? 'Create Role' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
