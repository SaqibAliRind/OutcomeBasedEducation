import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser } from '../store/userSlice';
import { ShieldCheck, UserCog, User, ShieldAlert, CheckCircle, Search } from 'lucide-react';
import '../style/Dashboard.css';

const UserRoleAssignment = () => {
    const dispatch = useDispatch();
    const { list: users, loading } = useSelector(s => s.users);
    const { user: currentUser } = useSelector(s => s.auth);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [roleForm, setRoleForm] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        dispatch(fetchUsers({ limit: 100 }));
    }, [dispatch]);

    const filteredUsers = users?.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleSelectUser = (u) => {
        setSelectedUser(u);
        setRoleForm(u.role || 'Student');
        setSuccessMsg('');
    };

    const handleAssignRole = (e) => {
        e.preventDefault();
        dispatch(updateUser({ id: selectedUser._id, data: { role: roleForm } }))
            .unwrap()
            .then(() => {
                setSuccessMsg(`Role ${roleForm} successfully assigned to ${selectedUser.name}`);
                setTimeout(() => setSuccessMsg(''), 3000);
            })
            .catch(err => alert(err));
    };

    const ROLES = ['Dean', 'HOD', 'COE', 'Program Coordinator', 'Teacher', 'Student', 'QEC', 'UniversityAdmin'];

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={28} color="#0ff0fc" />
                    Limited Role & Permission Management
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Assign roles and permissions to users within your university.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* User List */}
                <div className="glass-panel-dash" style={{ flex: 1, borderRadius: '12px', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 12 }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            style={{ width: '100%', padding: '10px 10px 10px 36px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#0ff0fc', padding: '20px' }}>Loading users...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredUsers.map(u => (
                                <div
                                    key={u._id}
                                    onClick={() => handleSelectUser(u)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px', background: selectedUser?._id === u._id ? 'rgba(15,240,252,0.1)' : 'rgba(255,255,255,0.03)',
                                        border: selectedUser?._id === u._id ? '1px solid rgba(15,240,252,0.4)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0ff0fc20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={18} color="#0ff0fc" />
                                        </div>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{u.name}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{u.email}</div>
                                        </div>
                                    </div>
                                    <span style={{ background: 'rgba(188,19,254,0.15)', color: '#bc13fe', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        {u.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Role Assignment Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {selectedUser ? (
                        <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserCog size={20} /> Assign Role
                            </h3>
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '20px' }}>
                                <div style={{ color: '#fff', fontWeight: 'bold' }}>{selectedUser.name}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Current Role: <span style={{ color: '#0ff0fc' }}>{selectedUser.role}</span></div>
                            </div>

                            <form className="modal-form" onSubmit={handleAssignRole}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '8px' }}>Select New Role:</label>
                                <select
                                    value={roleForm}
                                    onChange={(e) => setRoleForm(e.target.value)}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', marginBottom: '20px' }}
                                >
                                    {ROLES.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>

                                {successMsg && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#50cc7f', fontSize: '0.85rem', marginBottom: '16px' }}>
                                        <CheckCircle size={16} /> {successMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || roleForm === selectedUser.role}
                                    style={{ width: '100%', padding: '12px', background: roleForm === selectedUser.role ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '8px', color: roleForm === selectedUser.role ? 'rgba(255,255,255,0.3)' : '#000', fontWeight: 'bold', cursor: roleForm === selectedUser.role ? 'not-allowed' : 'pointer' }}
                                >
                                    Update Role
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <ShieldAlert size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                            <div>Select a user to assign or change their role.</div>
                        </div>
                    )}

                    {selectedUser && (
                        <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 12px', color: '#0ff0fc', fontSize: '1.1rem' }}>Permissions Overview</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                                Roles are strictly mapped to predefined permissions by the Super Admin. You cannot edit individual permissions here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserRoleAssignment;
