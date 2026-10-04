import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { fetchRoles, createRole, updateRole, deleteRole, clearRoleMessages } from '../../../store/roleSlice';
import { Plus, Edit2, ShieldAlert, X, Loader2, Save, CheckCircle2, Shield, Settings2 } from 'lucide-react';

const MODULES = [
    'User Management',
    'Academic Setup',
    'Courses & Curriculum',
    'Timetable',
    'Academic Calendar',
    'Admissions',
    'Enrollment',
    'Attendance',
    'Grading & Results',
    'Reports & Analytics',
    'System Settings'
];

const ACTIONS = ['Create', 'Read', 'Update', 'Delete'];

const emptyRole = {
    name: '',
    description: '',
    status: 'Active',
    permissions: MODULES.map(m => ({ moduleName: m, actions: [] }))
};

const RoleManagement = () => {
    const dispatch = useDispatch();
    const { list: roles, loading, error, successMessage } = useSelector(state => state.roles);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState(emptyRole);

    useEffect(() => {
        dispatch(fetchRoles({ limit: 50 }));
    }, [dispatch]);

    useEffect(() => {
        if (successMessage || error) {
            const timer = setTimeout(() => dispatch(clearRoleMessages()), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, error, dispatch]);

    const openAdd = () => {
        setFormData(emptyRole);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const openEdit = (role) => {
        // Merge existing permissions with our MODULES list to ensure all rows appear
        const mergedPermissions = MODULES.map(moduleName => {
            const existing = role.permissions?.find(p => p.moduleName === moduleName);
            return existing ? { ...existing } : { moduleName, actions: [] };
        });

        setSelectedRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            status: role.status || 'Active',
            permissions: mergedPermissions
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleActionToggle = (moduleName, action) => {
        const newPerms = formData.permissions.map(perm => {
            if (perm.moduleName === moduleName) {
                const hasAction = perm.actions.includes(action);
                return {
                    ...perm,
                    actions: hasAction 
                        ? perm.actions.filter(a => a !== action) 
                        : [...perm.actions, action]
                };
            }
            return perm;
        });
        setFormData({ ...formData, permissions: newPerms });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Cleanup permissions to only send ones with >0 actions to save DB space
        const payload = {
            ...formData,
            permissions: formData.permissions.filter(p => p.actions.length > 0)
        };

        if (isEditMode && selectedRole) {
            dispatch(updateRole({ id: selectedRole._id, data: payload }));
        } else {
            dispatch(createRole(payload));
        }
        setIsModalOpen(false);
    };

    return (
        <div style={{ padding: '1rem', color: '#fff' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--uni-gold)', fontFamily: 'Playfair Display' }}>
                        <ShieldAlert size={28} /> Roles & Permissions Matrix
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>
                        Define fine-grained access control across all university modules.
                    </p>
                </div>
                <button className="primary-btn" onClick={openAdd} style={{ padding: '10px 20px', borderRadius: '10px' }}>
                    <Plus size={18} /> Create Custom Role
                </button>
            </div>

            {/* Messages */}
            {error && <div className="um-alert error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {successMessage && <div className="um-alert success" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

            {/* Roles Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {loading && roles.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gridColumn: '1 / -1', padding: '3rem' }}>
                        <Loader2 className="spinner-large" size={40} color="var(--uni-gold)" />
                    </div>
                ) : (
                    roles.map(role => (
                        <div key={role._id} className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={20} color={role.status === 'Active' ? '#50cc7f' : '#ff1b6b'} />
                                        {role.name}
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }}>
                                        {role.permissions?.reduce((acc, p) => acc + p.actions.length, 0) || 0} Permissions Configured
                                    </span>
                                </div>
                                <button className="action-btn edit" onClick={() => openEdit(role)} style={{ background: 'rgba(207, 181, 59, 0.15)', color: 'var(--uni-gold)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                                    <Settings2 size={18} />
                                </button>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '1rem', minHeight: '40px' }}>
                                {role.description || 'No description provided.'}
                            </p>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {role.permissions?.slice(0, 3).map(p => (
                                    <span key={p.moduleName} style={{ fontSize: '0.75rem', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(15,240,252,0.05)' }}>
                                        {p.moduleName}
                                    </span>
                                ))}
                                {role.permissions?.length > 3 && (
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>+{role.permissions.length - 3} more</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── Modal for Permissions Matrix ── */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '800px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px', padding: '2rem' }}>
                        <div className="modal-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--uni-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ShieldAlert size={22} /> {isEditMode ? `Edit Permissions: ${selectedRole?.name}` : 'Create New Role'}
                            </h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)' }}><X size={20} color="#fff" /></button>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            {/* Role Basic Info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label style={{ color: 'rgba(255,255,255,0.6)' }}>Role Name</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'rgba(255,255,255,0.6)' }}>Description</label>
                                    <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'rgba(255,255,255,0.6)' }}>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Permissions Matrix */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '1rem', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Module Name</th>
                                            {ACTIONS.map(a => (
                                                <th key={a} style={{ padding: '1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>
                                                    {a}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.permissions.map((perm, idx) => (
                                            <tr key={perm.moduleName} style={{ borderBottom: idx === formData.permissions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', color: '#0ff0fc', fontWeight: 500, fontSize: '0.9rem' }}>
                                                    {perm.moduleName}
                                                </td>
                                                {ACTIONS.map(action => {
                                                    const isChecked = perm.actions.includes(action);
                                                    return (
                                                        <td key={action} style={{ padding: '1rem', textAlign: 'center' }}>
                                                            <div 
                                                                onClick={() => handleActionToggle(perm.moduleName, action)}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    width: '24px', height: '24px', borderRadius: '6px',
                                                                    border: `2px solid ${isChecked ? '#50cc7f' : 'rgba(255,255,255,0.2)'}`,
                                                                    background: isChecked ? '#50cc7f' : 'transparent',
                                                                    cursor: 'pointer', transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                {isChecked && <CheckCircle2 size={16} color="#000" />}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '2rem', borderTop: 'none' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--uni-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {loading ? <Loader2 className="spinner" size={18} /> : <><Save size={18} /> Save Role</>}
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

export default RoleManagement;
