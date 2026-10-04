import React, { useState } from 'react';
import '../style/ProgramCoordinatorDashboard.css';
import Sidebar from '../components/Sidebar';

const ProgramCoordinatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                {activeTab === 'overview' && (
                    <div className="glass-panel-dash" style={{ padding: '2rem', borderRadius: '12px', background: 'var(--uni-white)', marginTop: '4rem' }}>
                        <h2>ProgramCoordinator Dashboard Overview</h2>
                        <p>Welcome to your customized dashboard panel.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProgramCoordinatorDashboard;
