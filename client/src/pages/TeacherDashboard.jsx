import React, { useState } from 'react';
import '../style/TeacherDashboard.css';
import Sidebar from '../components/Sidebar';
import AttendanceManagement from '../components/AttendanceManagement';
import MarksManagement from '../components/MarksManagement';
import Courses from '../components/Courses';
import ObeReports from '../components/ObeReports';

const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                {activeTab === 'overview' && (
                    <div className="glass-panel-dash" style={{ padding: '2rem', borderRadius: '12px', background: 'var(--uni-white)', marginTop: '4rem' }}>
                        <h2>Teacher Dashboard Overview</h2>
                        <p>Welcome to your customized dashboard panel.</p>
                    </div>
                )}
                {activeTab === 'courses' && <Courses />}
                {activeTab === 'attendance' && <AttendanceManagement />}
                {activeTab === 'marks' && <MarksManagement />}
                {activeTab === 'obereports' && <ObeReports />}
            </main>
        </div>
    );
};

export default TeacherDashboard;
