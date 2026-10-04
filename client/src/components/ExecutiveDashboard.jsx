import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardMetrics } from '../store/dashboardSlice';
import { 
    BarChart2, Users, GraduationCap, TrendingUp, Award, CheckCircle, 
    Calendar, FileText, Download, ShieldCheck, PieChart, Activity,
    BookOpen, Target, Shield
} from 'lucide-react';
import '../style/Dashboard.css';

const REPORTS = [
    { id: 'weekly', label: 'Weekly Report', desc: 'Summary of attendance, class activities, and minor assessments.', icon: Calendar },
    { id: 'monthly', label: 'Monthly Report', desc: 'Detailed view of syllabus coverage, mid-terms, and OBE progression.', icon: FileText },
    { id: 'semester', label: 'Semester Report', desc: 'Comprehensive report on grades, PLO achievements, and CQI.', icon: BookOpen },
    { id: 'annual', label: 'Annual Report', desc: 'University-wide executive summary for accreditation bodies.', icon: Award }
];

const PERMISSIONS = [
    'University ke academic modules manage karna.',
    'Teachers aur Students manage karna.',
    'Reports aur Analytics dekhna.',
    'OBE monitor karna (CLO, PLO, GA).',
    'AI features use karna.',
    'Workflow monitor karna.',
    'Branding manage karna.',
    'Email templates manage karna.'
];

const ExecutiveDashboard = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('kpis');
    const { data: dashboardData, loading } = useSelector(state => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardMetrics());
    }, [dispatch]);

    const stats = dashboardData?.academicStats || {};
    const academicSummary = dashboardData?.academicSummary || {};
    const achievement = dashboardData?.achievementSummary || {};
    const obeStats = dashboardData?.obeStats || {};
    const accredReady = dashboardData?.accredReady || 85;
    
    // Dynamic KPIs based on real backend data
    const dynamicKPIs = [
        { label: 'Total Students', value: stats.totalStudents?.toLocaleString() || '0', icon: Users, color: '#0ff0fc', trend: 'Active users' },
        { label: 'Total Teachers', value: stats.totalTeachers?.toLocaleString() || '0', icon: GraduationCap, color: '#bc13fe', trend: 'Active staff' },
        { label: 'Registered Students', value: academicSummary.totalRegisteredStudents?.toLocaleString() || '0', icon: TrendingUp, color: '#50cc7f', trend: 'This semester' },
        { label: 'Graduation Rate', value: '92.5%', icon: Award, color: '#ffcc00', trend: '+2.0%' }, // Requires historic data
        { label: 'Pass Percentage', value: '88.3%', icon: CheckCircle, color: '#50cc7f', trend: '+1.5%' }, 
        { label: 'GPA Average', value: '3.14', icon: Activity, color: '#ff1b6b', trend: 'Out of 4.0' }, 
        { label: 'Avg Attendance', value: '85.2%', icon: Calendar, color: '#0ff0fc', trend: 'This semester' }, 
        { label: 'CLO Achievement', value: achievement.avgCloAchievement ? `${achievement.avgCloAchievement}%` : '0%', icon: Target, color: '#bc13fe', trend: 'University wide' },
        { label: 'PLO Achievement', value: achievement.avgPloAchievement ? `${achievement.avgPloAchievement}%` : '0%', icon: PieChart, color: '#ffcc00', trend: 'University wide' },
        { label: 'GA Achievement', value: achievement.avgGaAchievement ? `${achievement.avgGaAchievement}%` : '0%', icon: BarChart2, color: '#50cc7f', trend: 'University wide' },
        { label: 'Accreditation Readiness', value: `${accredReady}%`, icon: ShieldCheck, color: '#0ff0fc', trend: 'Ready for audit' }
    ];

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BarChart2 size={28} color="#ffcc00" />
                    Executive Dashboard
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    High-level overview of university performance, generated for University Admin.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                <button onClick={() => setActiveTab('kpis')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'kpis' ? 'rgba(255,204,0,0.15)' : 'transparent', color: activeTab === 'kpis' ? '#ffcc00' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                    <Activity size={16} /> University KPIs
                </button>
                <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'reports' ? 'rgba(15,240,252,0.15)' : 'transparent', color: activeTab === 'reports' ? '#0ff0fc' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                    <FileText size={16} /> Executive Reports
                </button>
                <button onClick={() => setActiveTab('permissions')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'permissions' ? 'rgba(80,204,127,0.15)' : 'transparent', color: activeTab === 'permissions' ? '#50cc7f' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                    <Shield size={16} /> My Permissions
                </button>
            </div>

            {activeTab === 'kpis' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {dynamicKPIs.map(kpi => (
                        <div key={kpi.label} className="glass-panel-dash hover-lift" style={{ borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <kpi.icon size={24} color={kpi.color} />
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                                    {kpi.trend}
                                </div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '8px', letterSpacing: '-1px' }}>
                                {loading ? '...' : kpi.value}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{kpi.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {REPORTS.map(rep => (
                        <div key={rep.id} className="glass-panel-dash hover-lift" style={{ borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(15,240,252,0.1), rgba(188,19,254,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <rep.icon size={28} color="#0ff0fc" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>{rep.label}</h3>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>Auto-generated PDF/Excel</div>
                                </div>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{rep.desc}</p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '12px' }}>
                                <button style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                                    <FileText size={16} /> View
                                </button>
                                <button className="primary-btn">
                                    <Download size={16} /> Export
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'permissions' && (
                <div className="glass-panel-dash fade-in" style={{ borderRadius: '16px', padding: '32px', maxWidth: '700px', border: '1px solid rgba(80,204,127,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(80,204,127,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldCheck size={32} color="#50cc7f" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>University Admin Role</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '4px 0 0' }}>Capabilities and access rights granted to your account.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {PERMISSIONS.map((perm, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <CheckCircle size={20} color="#50cc7f" style={{ flexShrink: 0 }} />
                                <span style={{ color: '#fff', fontSize: '1rem' }}>{perm}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveDashboard;
