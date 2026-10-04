import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQECDashboard } from '../../store/qecSlice';
import Sidebar from '../../components/Sidebar';
import QECManagement from '../../components/QECManagement';
import WorkflowManagement from '../../components/WorkflowManagement';
import CourseFileManagement from '../../components/CourseFileManagement';
import SurveyManagement from '../../components/SurveyManagement';
import IndirectAssessment from '../../components/IndirectAssessment';
import TargetVsAchieved from '../../components/TargetVsAchieved';
import GapAnalysis from '../../components/GapAnalysis';
import ClosingTheLoop from '../../components/ClosingTheLoop';
import ObeHistory from '../../components/ObeHistory';
import ObeReports from '../../components/ObeReports';
import ReportsManagement from '../../components/ReportsManagement';
import AccreditationManagement from '../../components/AccreditationManagement';
import {
    ShieldCheck, Activity, CheckSquare, Award, AlertTriangle,
    CheckCircle, Target, Loader2
} from 'lucide-react';
import '../../style/Dashboard.css';

const QECDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { dashboardData, loading } = useSelector(state => state.qec);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        dispatch(fetchQECDashboard());
    }, [dispatch]);

    const kpis = dashboardData?.kpis || {};
    const compliance = dashboardData?.compliance || [];
    const alerts = dashboardData?.alerts || [];

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                {activeTab === 'overview' && (
                    <>
                        <header className="top-header">
                            <div className="header-title">
                                <h1>QEC Dashboard</h1>
                                <p>Welcome, {user?.name}. Quality Enhancement Cell — University-wide compliance oversight.</p>
                            </div>
                        </header>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <Loader2 size={40} className="spinner-large" />
                            </div>
                        ) : (
                            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* KPI Cards */}
                                <div className="stats-grid">
                                    {[
                                        { label: 'Pending Reviews', value: kpis.pendingReviews ?? 0, color: '#ffcc00', icon: <Activity size={22} /> },
                                        { label: 'Approved Reviews', value: kpis.approvedReviews ?? 0, color: '#50cc7f', icon: <CheckCircle size={22} /> },
                                        { label: 'Accreditation Progress', value: kpis.accreditationProgress ?? '0%', color: '#0ff0fc', icon: <Award size={22} /> },
                                        { label: 'Program Reviews', value: kpis.programReviews ?? 0, color: '#bc13fe', icon: <Target size={22} /> },
                                    ].map((k, i) => (
                                        <div key={i} className="stat-card glass-panel-dash" style={{ borderLeft: `4px solid ${k.color}` }}>
                                            <div className="stat-content">
                                                <h3>{k.label}</h3>
                                                <h2 style={{ color: k.color }}>{k.value}</h2>
                                            </div>
                                            <div style={{ color: k.color, opacity: 0.6 }}>{k.icon}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Compliance + Alerts */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                    <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '14px' }}>
                                        <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ShieldCheck size={18} color="#0ff0fc" /> Compliance Overview
                                        </h3>
                                        {compliance.length === 0 && (
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                                No compliance data yet. Submit course files and surveys to generate metrics.
                                            </p>
                                        )}
                                        {compliance.map(c => (
                                            <div key={c.name} style={{ marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                                                    <span style={{ color: '#fff' }}>{c.name}</span>
                                                    <span style={{ color: c.color, fontWeight: 'bold' }}>{c.score}% — {c.status}</span>
                                                </div>
                                                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${c.score}%`, background: c.color, height: '100%', borderRadius: '4px', transition: 'width 0.5s' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '14px' }}>
                                        <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <AlertTriangle size={18} color="#ffcc00" /> Active Alerts
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {alerts.map((a, i) => (
                                                <div key={i} style={{
                                                    background: a.type === 'critical' ? 'rgba(255,27,107,0.1)' : a.type === 'info' ? 'rgba(15,240,252,0.1)' : 'rgba(255,204,0,0.1)',
                                                    border: `1px solid ${a.type === 'critical' ? '#ff1b6b' : a.type === 'info' ? '#0ff0fc' : '#ffcc00'}30`,
                                                    padding: '12px', borderRadius: '8px',
                                                    color: a.type === 'critical' ? '#ff1b6b' : a.type === 'info' ? '#0ff0fc' : '#ffcc00',
                                                    fontSize: '0.82rem'
                                                }}>
                                                    <strong>{a.title}</strong><br />{a.desc}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'qec_monitoring' && <QECManagement />}
                {activeTab === 'workflow_approval' && <WorkflowManagement />}
                {activeTab === 'coursefiles' && <CourseFileManagement />}
                {activeTab === 'surveys' && <SurveyManagement />}
                {activeTab === 'indirect_assessment' && <IndirectAssessment />}
                {activeTab === 'targetvsachieved' && <TargetVsAchieved />}
                {activeTab === 'gapanalysis' && <GapAnalysis />}
                {activeTab === 'closingtheloop' && <ClosingTheLoop />}
                {activeTab === 'obe_archive' && <ObeHistory />}
                {activeTab === 'obereports' && <ObeReports />}
                {activeTab === 'accreditation_dashboard' && <AccreditationManagement />}
                {activeTab === 'reports_management' && <ReportsManagement />}
            </main>
        </div>
    );
};

export default QECDashboard;
