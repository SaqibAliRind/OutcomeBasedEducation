import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardMetrics } from '../../store/dashboardSlice';
import { fetchUniversities, deleteUniversity, createUniversity, updateUniversity } from '../../store/universitySlice';
import { createUniversityAdmin } from '../../store/adminSlice';
import { fetchAcademicData } from '../../store/academicSlice';
import {
    Users, Building2, GraduationCap, UsersRound, BookOpen, Activity, Loader2,
    Cpu, Database, Server, Zap, Globe, Clock, Settings, Save, CheckCircle
} from 'lucide-react';

import Sidebar from '../../components/Sidebar';
import UserManagementPanel from '../../components/superadmin/UserManagementPanel.jsx';
import RoleManagement from '../../components/superadmin/RoleManagement.jsx';
import SystemSettingsPanel from '../../components/superadmin/SystemSettingsPanel.jsx';
import LogsPanel from '../../components/superadmin/LogsPanel.jsx';
import ReportsPanel from '../../components/superadmin/ReportsPanel.jsx';
import Faculties from '../../components/Faculties';
import UniversityList from '../../components/superadmin/UniversityList';
import CreateUniversity from '../../components/superadmin/CreateUniversity';
import CreateAdmin from '../../components/superadmin/CreateAdmin';

import '../../style/Dashboard.css';
import '../../style/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { data: metrics, loading: metricsLoading } = useSelector((state) => state.dashboard);
    const { list: universities, loading: uniLoading } = useSelector((state) => state.university);
    const academic = useSelector((state) => state.academic?.records || {});

    const [activeTab, setActiveTab] = useState('overview');
    const [showUniModal, setShowUniModal] = useState(false);
    const [editingUni, setEditingUni] = useState(null);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [selectedUniId, setSelectedUniId] = useState(null);

    // Settings tab state
    const [selectedSettingsUniId, setSelectedSettingsUniId] = useState('');
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        logo: '',
        banner: '',
        email: '',
        phone: '',
        timeZone: '',
        settings: {
            academic: { currentSession: '', currentSemester: '' },
            localization: { language: 'en', dateFormat: 'DD/MM/YYYY' },
            branding: { themeColor: '#002147', favicon: '' }
        }
    });

    useEffect(() => {
        dispatch(fetchDashboardMetrics());
        dispatch(fetchUniversities());
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchAcademicData('semesters'));
    }, [dispatch]);

    // Periodically refresh dashboard metrics
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeTab === 'overview') {
                dispatch(fetchDashboardMetrics());
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [dispatch, activeTab]);

    // Handle university selection for settings tab
    useEffect(() => {
        if (selectedSettingsUniId && Array.isArray(universities)) {
            const uni = universities.find(u => u._id === selectedSettingsUniId);
            if (uni) {
                setSettingsForm({
                    name: uni.name || '',
                    logo: uni.logo || '',
                    banner: uni.banner || '',
                    email: uni.email || '',
                    phone: uni.phone || '',
                    timeZone: uni.timeZone || 'Asia/Karachi',
                    settings: {
                        academic: {
                            currentSession: uni.settings?.academic?.currentSession || '',
                            currentSemester: uni.settings?.academic?.currentSemester || ''
                        },
                        localization: {
                            language: uni.settings?.localization?.language || 'en',
                            dateFormat: uni.settings?.localization?.dateFormat || 'DD/MM/YYYY'
                        },
                        branding: {
                            themeColor: uni.settings?.branding?.themeColor || '#002147',
                            favicon: uni.settings?.branding?.favicon || ''
                        }
                    }
                });
            }
        }
    }, [selectedSettingsUniId, universities]);

    // Default to first university when opening Settings tab
    useEffect(() => {
        if (activeTab === 'settings' && Array.isArray(universities) && universities.length > 0 && !selectedSettingsUniId) {
            setSelectedSettingsUniId(universities[0]._id);
        }
    }, [activeTab, universities, selectedSettingsUniId]);

    const handleSaveUni = async (formData) => {
        let actionResult;
        if (formData._id) {
            actionResult = await dispatch(updateUniversity({ id: formData._id, data: formData }));
        } else {
            actionResult = await dispatch(createUniversity(formData));
        }

        if (createUniversity.fulfilled.match(actionResult) || updateUniversity.fulfilled.match(actionResult)) {
            setShowUniModal(false);
            setEditingUni(null);
            dispatch(fetchUniversities());
        }
    };

    const handleDeleteUni = async (id, permanent) => {
        await dispatch(deleteUniversity({ id, permanent }));
        dispatch(fetchUniversities());
    };

    const handleSaveAdmin = async (formData) => {
        const actionResult = await dispatch(createUniversityAdmin(formData));
        if (createUniversityAdmin.fulfilled.match(actionResult)) {
            setShowAdminModal(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        if (!selectedSettingsUniId) return;
        const actionResult = await dispatch(updateUniversity({ id: selectedSettingsUniId, data: settingsForm }));
        if (updateUniversity.fulfilled.match(actionResult)) {
            alert('Settings updated successfully!');
            dispatch(fetchUniversities());
        }
    };

    const handleSettingsChange = (e, section, field) => {
        const { value } = e.target;
        if (section) {
            setSettingsForm(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [section]: {
                        ...prev.settings[section],
                        [field]: value
                    }
                }
            }));
        } else {
            setSettingsForm(prev => ({ ...prev, [field]: value }));
        }
    };

    if (metricsLoading && !metrics) {
        return (
            <div className="dashboard-loading">
                <Loader2 size={48} className="spinner-large" />
                <h2 style={{ marginTop: '10px', color: '#0ff0fc' }}>Initializing Systems...</h2>
            </div>
        );
    }

    const sys = metrics?.systemHealth || {};
    const act = metrics?.activeUsers || {};
    const db = metrics?.databaseStatus || {};
    const srv = metrics?.serverStatus || {};
    const activities = metrics?.recentActivities || [];
    const stats = metrics?.academicStats || {};

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers || 0, icon: UserIconWrapper(Users, '#0ff0fc') },
        { label: 'Universities', value: universities?.length || stats.totalUniversities || 0, icon: UserIconWrapper(Globe, '#ffcc00') },
        { label: 'Departments', value: stats.totalDepartments || 0, icon: UserIconWrapper(Building2, '#bc13fe') },
        { label: 'Programs', value: stats.totalPrograms || 0, icon: UserIconWrapper(BookOpen, '#ff1b6b') },
        { label: 'Students', value: stats.totalStudents || 0, icon: UserIconWrapper(GraduationCap, '#45caff') },
        { label: 'Teachers', value: stats.totalTeachers || 0, icon: UserIconWrapper(UsersRound, '#ff9a9e') },
        { label: 'Active Sessions', value: stats.totalActiveSessions || 0, icon: UserIconWrapper(Activity, '#50cc7f') }
    ];

    return (
        <div className="dashboard-wrapper superadmin-theme">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Custom Tab added to Sidebar navigation dynamically by checking activeTab, 
                but since Sidebar is static, we can also inject Settings into checking inside SuperAdminDashboard */}

            <main className="main-content">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <>
                        <header className="top-header">
                            <div>
                                <h1 style={{ background: 'linear-gradient(135deg, #0ff0fc, #bc13fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SuperAdmin Console</h1>
                                <p style={{ color: 'var(--uni-text-muted)', fontSize: '0.95rem' }}>Welcome back, {user?.name}. System health is normal.</p>
                            </div>
                            <button
                                className="primary-btn"
                                onClick={() => setActiveTab('settings')}
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <Settings size={16} /> Server Settings
                            </button>
                        </header>

                        {/* Top Widgets List */}
                        <div className="stats-grid">
                            {statCards.map((stat, idx) => (
                                <div className="stat-card glass-panel-dash" key={idx}>
                                    <div className="stat-content">
                                        <h3>{stat.label}</h3>
                                        <h2>{stat.value}</h2>
                                    </div>
                                    <div className="stat-iconBox">{stat.icon}</div>
                                </div>
                            ))}
                        </div>

                        {/* Health, DB, Server & Activities sections made fully dynamic */}
                        <div className="health-grid">
                            {/* System Health Card */}
                            <div className="detailed-card glass-panel-dash">
                                <div className="card-header border-bottom">
                                    <Cpu size={20} color="#0ff0fc" />
                                    <h3>System Health</h3>
                                </div>
                                <div className="metrics-list mt-3">
                                    <div className="metric-item">
                                        <span>CPU Usage</span>
                                        <strong className={parseInt(sys.cpuUsage) > 80 ? 'text-danger' : 'text-success'}>
                                            {sys.cpuUsage}
                                        </strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>RAM Usage</span>
                                        <strong className={parseInt(sys.ramUsage) > 85 ? 'text-danger' : 'text-info'}>
                                            {sys.ramUsage}
                                        </strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Disk Storage Used</span>
                                        <strong>{sys.diskStorage}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Server Uptime</span>
                                        <strong>{sys.serverUptime}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>API Response Speed</span>
                                        <strong className="text-success">{sys.responseTime}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Active Sessions / Online Users Card */}
                            <div className="detailed-card glass-panel-dash">
                                <div className="card-header border-bottom">
                                    <Activity size={20} color="#bc13fe" />
                                    <h3>Active Real-time Sessions</h3>
                                </div>
                                <div className="metrics-list mt-3">
                                    <div className="metric-item">
                                        <span>Total Live Connection</span>
                                        <strong className="text-info" style={{ fontSize: '1.25rem' }}>{act.totalOnline || 0}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Administrator Portals</span>
                                        <strong>{act.onlineAdmins || 0}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Teacher Desks</span>
                                        <strong>{act.onlineTeachers || 0}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Student Portals</span>
                                        <strong>{act.onlineStudents || 0}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Database Status Card */}
                            <div className="detailed-card glass-panel-dash">
                                <div className="card-header border-bottom">
                                    <Database size={20} color="#ff1b6b" />
                                    <h3>Database Status</h3>
                                </div>
                                <div className="metrics-list mt-3">
                                    <div className="metric-item">
                                        <span>MongoDB Connectivity</span>
                                        <strong className={db.connected ? 'text-success' : 'text-danger'}>
                                            {db.connected ? 'CONNECTED (1)' : 'DISCONNECTED (0)'}
                                        </strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Database Size on Disk</span>
                                        <strong>{db.dbSize}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Mongoose Collections</span>
                                        <strong>{db.collectionsCount} Collections</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Scheduled Backup Job</span>
                                        <span className="badge-code" style={{ background: 'rgba(80, 204, 127, 0.1)', color: '#50cc7f', padding: '2px 6px', borderRadius: '4px' }}>
                                            {db.backupStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Host Server Information Card */}
                            <div className="detailed-card glass-panel-dash">
                                <div className="card-header border-bottom">
                                    <Server size={20} color="#50cc7f" />
                                    <h3>Server Status</h3>
                                </div>
                                <div className="metrics-list mt-3">
                                    <div className="metric-item">
                                        <span>Server Engine</span>
                                        <strong className="text-success">{srv.running ? 'Running' : 'Offline'}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>Node JS Runtime</span>
                                        <strong>{srv.nodeVersion}</strong>
                                    </div>
                                    <div className="metric-item">
                                        <span>REST API Status</span>
                                        <strong className="text-info">{srv.apiStatus}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent System Activities Section */}
                        <div className="recent-activities-section glass-panel-dash" style={{ marginTop: '2rem' }}>
                            <div className="card-header border-bottom">
                                <Clock size={20} color="#ffcc00" />
                                <h3>Audit Trails & Recent Activities</h3>
                            </div>
                            <div className="activities-list mt-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {activities.length > 0 ? (
                                    activities.map((activity, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                                            <div>
                                                <strong style={{ color: '#0ff0fc' }}>{activity.action}</strong>
                                                <span style={{ color: '#ddd', marginLeft: '10px' }}>{activity.description}</span>
                                            </div>
                                            <span style={{ color: 'var(--uni-text-muted)', fontSize: '0.8rem' }}>
                                                {new Date(activity.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--uni-text-muted)' }}>
                                        No recent audit logs available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* --- UNIVERSITY MANAGEMENT TAB --- */}
                {activeTab === 'universities' && (
                    <div className="glass-panel-dash" style={{ maxWidth: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0ff0fc' }}>University Registry Dashboard</h3>
                                <p style={{ margin: '5px 0 0 0', color: 'var(--uni-text-muted)', fontSize: '0.9rem' }}>Manage systems, settings, and university administrators</p>
                            </div>
                            <button className="primary-btn" onClick={() => { setEditingUni(null); setShowUniModal(true); }}>
                                + Add University
                            </button>
                        </div>
                        <UniversityList
                            onEdit={(uni) => { setEditingUni(uni); setShowUniModal(true); }}
                            onDelete={handleDeleteUni}
                            onAddAdmin={(id) => { setSelectedUniId(id); setShowAdminModal(true); }}
                        />
                    </div>
                )}

                {/* --- OTHER TABS --- */}
                {activeTab === 'admins'    && <UserManagementPanel />}
                {activeTab === 'roles'     && <RoleManagement />}
                {activeTab === 'faculties' && <Faculties />}
                {activeTab === 'settings'  && <SystemSettingsPanel />}
                {activeTab === 'logs'      && <LogsPanel />}
                {activeTab === 'reports_management'   && <ReportsPanel />}

                {/* --- MODALS --- */}
                {showUniModal && (
                    <CreateUniversity
                        initialData={editingUni}
                        onClose={() => { setShowUniModal(false); setEditingUni(null); }}
                        onSave={handleSaveUni}
                    />
                )}
                {showAdminModal && (
                    <CreateAdmin
                        universityId={selectedUniId}
                        onClose={() => setShowAdminModal(false)}
                        onSave={handleSaveAdmin}
                    />
                )}
            </main>
        </div>
    );
};

function UserIconWrapper(IconComponent, color) {
    return <IconComponent size={28} color={color} style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />;
}

export default SuperAdminDashboard;
