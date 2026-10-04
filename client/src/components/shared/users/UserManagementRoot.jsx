import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, clearUserMessages } from '../../../store/userSlice';
import DeanManagement from './DeanManagement';
import HODManagement from './HODManagement';
import CoordinatorManagement from './CoordinatorManagement';
import TeacherManagement from './TeacherManagement';
import StudentManagement from './StudentManagement';
import QECManagement from './QECManagement';
import { Users, GraduationCap, Building2, Map, BookOpen, User, ShieldCheck } from 'lucide-react';
import '../../../style/Dashboard.css';

const UserManagementRoot = () => {
    const dispatch = useDispatch();
    const { usersList, loading, error, successMessage } = useSelector((state) => state.users);
    const [activeSubTab, setActiveSubTab] = useState('dean');

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            setTimeout(() => dispatch(clearUserMessages()), 3000);
        }
    }, [successMessage, dispatch]);

    const tabs = [
        { id: 'dean', label: 'Deans', icon: Building2 },
        { id: 'hod', label: 'HODs', icon: Users },
        { id: 'coordinator', label: 'Coordinators', icon: Map },
        { id: 'teacher', label: 'Teachers', icon: BookOpen },
        { id: 'student', label: 'Students', icon: GraduationCap },
        { id: 'qec', label: 'QEC', icon: ShieldCheck }
    ];

    const getFilteredUsers = (role) => {
        return usersList.filter(u => u.role === role);
    };

    return (
        <div className="user-management fade-in">
            <div className="um-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><User color="var(--uni-primary)" /> Dynamic User Management</h2>
                    <p>Manage different roles, assignments, and perform bulk operations.</p>
                </div>
            </div>

            {error && <div className="um-alert error">{error}</div>}
            {successMessage && <div className="um-alert success">{successMessage}</div>}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '30px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            background: activeSubTab === tab.id ? '#0ff0fc' : 'rgba(255,255,255,0.05)',
                            color: activeSubTab === tab.id ? '#020917' : 'rgba(255,255,255,0.6)',
                            transition: 'all 0.3s ease',
                            boxShadow: activeSubTab === tab.id ? '0 0 15px rgba(15, 240, 252, 0.4)' : 'none',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="glass-panel-dash">
                {activeSubTab === 'dean' && <DeanManagement users={getFilteredUsers('Dean')} loading={loading} />}
                {activeSubTab === 'hod' && <HODManagement users={getFilteredUsers('HOD')} loading={loading} />}
                { activeSubTab === 'coordinator' && <CoordinatorManagement users={getFilteredUsers('ProgramCoordinator')} loading={loading} /> }
                { activeSubTab === 'teacher' && <TeacherManagement users={getFilteredUsers('Teacher')} loading={loading} /> }
                { activeSubTab === 'student' && <StudentManagement users={getFilteredUsers('Student')} loading={loading} /> }
                { activeSubTab === 'qec' && <QECManagement users={getFilteredUsers('QEC')} loading={loading} /> }
            </div>
        </div>
    );
};

export default UserManagementRoot;
