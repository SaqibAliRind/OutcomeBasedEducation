import React from 'react';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import '../style/Dashboard.css';

import SuperAdminDashboard from './superadmin/SuperAdminDashboard';
import UniversityAdminDashboard from './universityadmin/UniversityAdminDashboard';
import DeanDashboard from './dean/DeanDashboard';
import HODDashboard from './hod/HODDashboard';
import ProgramCoordinatorDashboard from './coordinator/ProgramCoordinatorDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import QECDashboard from './qec/QECDashboard';

const Dashboard = () => {
    const { user, loading, error } = useSelector((state) => state.auth);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Loader2 size={48} className="spinner-large" />
                <h2>Initializing Systems...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <h2>System Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!user) return null;

    switch (user.role) {
        case 'SuperAdmin': return <SuperAdminDashboard />;
        case 'UniversityAdmin': 
        case 'COE': return <UniversityAdminDashboard />;
        case 'Dean': return <DeanDashboard />;
        case 'HOD': return <HODDashboard />;
        case 'ProgramCoordinator': return <ProgramCoordinatorDashboard />;
        case 'QEC': return <QECDashboard />;
        case 'Teacher': return <TeacherDashboard />;
        case 'Student': return <StudentDashboard />;
        default: return <StudentDashboard />;
    }
};

export default Dashboard;
