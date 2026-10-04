import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword, clearUserMessages } from '../../store/userSlice';
import { Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound, Loader2, X } from 'lucide-react';

const UserManagement = () => {
    const dispatch = useDispatch();
    const { usersList, loading, error, successMessage } = useSelector((state) => state.users);
    const { user: currentUser } = useSelector((state) => state.auth);
    const isSuperAdmin = currentUser?.role === 'SuperAdmin';

    // Roles that a UniversityAdmin can assign (cannot create SuperAdmin or UniversityAdmin)
    const availableRoles = isSuperAdmin
        ? [
            { value: 'Student',             label: 'Student' },
            { value: 'Teacher',             label: 'Teacher' },
            { value: 'ProgramCoordinator',  label: 'Program Coordinator' },
            { value: 'HOD',                 label: 'Head of Department (HOD)' },
            { value: 'Dean',                label: 'Dean' },
            { value: 'COE',                 label: 'Controller of Examination (COE)' },
            { value: 'UniversityAdmin',     label: 'University Admin' },
            { value: 'SuperAdmin',          label: 'Super Admin' },
          ]
        : [
            { value: 'Student',             label: 'Student' },
            { value: 'Teacher',             label: 'Teacher' },
            { value: 'ProgramCoordinator',  label: 'Program Coordinator' },
            { value: 'HOD',                 label: 'Head of Department (HOD)' },
            { value: 'Dean',                label: 'Dean' },
            { value: 'COE',                 label: 'Controller of Examination (COE)' },
          ];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form States
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student' });

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setTimeout(() => dispatch(clearUserMessages()), 3000);
        }
    }, [successMessage, dispatch]);

    const handleCreate = (e) => {
        e.preventDefault();
        dispatch(createUser(formData));
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        dispatch(updateUser({ id: selectedUser._id, userData: { name: formData.name, email: formData.email, role: formData.role } }));
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
        setIsEditModalOpen(true);
    };

    return (
        <div className="user-management">
            <div className="um-header">
                <div>
                    <h2>University Registry</h2>
                    <p>Manage faculty, students, and administration roles.</p>
                </div>
                <button className="primary-btn" onClick={() => {
                    setFormData({ name: '', email: '', password: '', role: 'Student' });
                    setIsCreateModalOpen(true);
                }}>
                    <Plus size={18} /> Add Member
                </button>
            </div>

            {error && <div className="um-alert error">{error}</div>}
            {successMessage && <div className="um-alert success">{successMessage}</div>}

            <div className="table-container glass-panel-dash">
                {loading && usersList.length === 0 ? (
                    <div className="table-loading"><Loader2 className="spinner-large" /></div>
                ) : (
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((usr) => (
                                <tr key={usr._id}>
                                    <td><strong>{usr.name}</strong></td>
                                    <td>{usr.email}</td>
                                    <td><span className={`role-badge ${usr.role}`}>{usr.role}</span></td>
                                    <td>
                                        <span className={`status-badge ${usr.isActive ? 'active' : 'inactive'}`}>
                                            {usr.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn edit" onClick={() => openEdit(usr)} title="Edit Details"><Edit2 size={16} /></button>
                                        <button className="action-btn toggle" onClick={() => dispatch(toggleUserStatus(usr._id))} title={usr.isActive ? 'Deactivate' : 'Activate'}>
                                            {usr.isActive ? <ShieldBan size={16} /> : <ShieldCheck size={16} />}
                                        </button>
                                        <button className="action-btn reset" onClick={() => {
                                            const autoGen = Math.random().toString(36).slice(-8);
                                            if (window.confirm(`Force reset password for ${usr.email} to: ${autoGen} ?`)) {
                                                dispatch(adminResetUserPassword({ id: usr._id, newPassword: autoGen }));
                                                alert(`Please copy the new password: ${autoGen}`);
                                            }
                                        }} title="Force Reset Password"><KeyRound size={16} /></button>
                                        <button className="action-btn delete" onClick={() => window.confirm('Delete this user completely?') && dispatch(deleteUser(usr._id))} title="Delete User"><UserX size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modals */}
            {(isCreateModalOpen || isEditModalOpen) && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash">
                        <div className="modal-header">
                            <h3>{isCreateModalOpen ? 'Enroll New Member' : 'Edit Member Data'}</h3>
                            <button className="close-btn" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={isCreateModalOpen ? handleCreate : handleEditSave} className="modal-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            {isCreateModalOpen && (
                                <div className="form-group">
                                    <label>Initial Password</label>
                                    <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>System Role</label>
                                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                    {availableRoles.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? <Loader2 className="spinner" size={18} /> : 'Save Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
