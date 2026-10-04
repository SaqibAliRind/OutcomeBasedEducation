import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../../components/Sidebar';
import Sections from '../../components/Sections';
import Batches from '../../components/Batches';
import Courses from '../../components/Courses';
import ObeReports from '../../components/ObeReports';
import ReportsManagement from '../../components/ReportsManagement';
import '../../style/Dashboard.css';
import { fetchCoordinatorDashboard } from '../../store/coordinatorDashSlice';

const ProgramCoordinatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { dashboard, loading } = useSelector((state) => state.coordinatorDash);

    useEffect(() => {
        dispatch(fetchCoordinatorDashboard());
    }, [dispatch]);

    const stats = dashboard?.stats || {};

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                {activeTab === 'overview' && (
                    <>
                        <header className="top-header">
                            <div className="header-title">
                                <h1>Program Coordinator Dashboard</h1>
                                <p>Welcome, {user?.name}. Manage sections, batches and course materials.</p>
                            </div>
                        </header>
                        
                        {loading ? (
                            <p style={{ padding: '1rem', color: '#666' }}>Loading dashboard...</p>
                        ) : (
                            <>
                                <div className="stats-grid">
                                    {[
                                        { label: 'Sections', value: stats.totalSections || 0 },
                                        { label: 'Batches', value: stats.totalBatches || 0 },
                                        { label: 'Courses', value: stats.totalCourses || 0 },
                                        { label: 'Students', value: stats.totalStudents || 0 },
                                    ].map((s, i) => (
                                        <div className="stat-card glass-panel-dash" key={i}>
                                            <div className="stat-content">
                                                <h3>{s.label}</h3>
                                                <h2>{s.value}</h2>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1rem' }}>
                                    <h3 style={{ color: 'var(--uni-navy)', marginBottom: '0.5rem' }}>Program Overview</h3>
                                    <p style={{ color: 'var(--uni-text-muted)' }}>As Program Coordinator, oversee sections, manage batch assignments and course enrollment.</p>
                                </div>
                            </>
                        )}
                    </>
                )}
                {activeTab === 'sections' && <Sections />}
                {activeTab === 'batches' && <Batches />}
                {activeTab === 'courses' && <Courses />}
                {activeTab === 'obereports' && <ObeReports />}
                {activeTab === 'reports_management' && <ReportsManagement />}
            </main>
        </div>
    );
};

export default ProgramCoordinatorDashboard;
