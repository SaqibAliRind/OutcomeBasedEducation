import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeanDashboard } from '../../store/deanSlice';
import Sidebar from '../../components/Sidebar';
import Departments from '../../components/Departments';
import Programs from '../../components/Programs';
import ObeReports from '../../components/ObeReports';
import WorkflowManagement from '../../components/WorkflowManagement';
import ReportsManagement from '../../components/ReportsManagement';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import AIFeatures from '../../components/AIFeatures';
import CourseFileManagement from '../../components/CourseFileManagement';
import TargetVsAchieved from '../../components/TargetVsAchieved';
import GapAnalysis from '../../components/GapAnalysis';
import ClosingTheLoop from '../../components/ClosingTheLoop';
import ObeHistory from '../../components/ObeHistory';
import {
    LayoutDashboard, Building2, Users, GraduationCap, Target,
    FileText, BarChart2, Clock, TrendingUp, Award, ShieldCheck,
    BookOpen, CheckCircle, XCircle, Hourglass, Network, Layers,
    School, Map, Zap, UserPlus, Tag, CalendarCheck, X,
    FolderOpen, Bell, Loader2, RefreshCw, AlertTriangle,
    CheckSquare
} from 'lucide-react';
import '../../style/Dashboard.css';

/* ─── Inline Mini Bar ─── */
const MiniBar = ({ data, valueKey, labelKey, color = '#0ff0fc', height = 90 }) => {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: `${height}px`, marginTop: '0.5rem' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', background: `${color}20`, borderRadius: '4px 4px 0 0', overflow: 'hidden', height: `${height - 20}px`, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', height: `${((d[valueKey] || 0) / max) * 100}%`, background: color, transition: 'height 0.8s ease', borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d[labelKey]}</div>
                </div>
            ))}
        </div>
    );
};

const DeanDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { data, loading, error } = useSelector(state => state.dean);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { dispatch(fetchDeanDashboard()); }, [dispatch]);

    const s = data?.stats || {};
    const obe = data?.obe || {};
    const charts = data?.charts || {};
    const approvals = data?.recentApprovals || [];

    const statCards = [
        { label: 'Total Departments', value: s.totalDepartments || 0, icon: <Building2 size={26} color="#10B981" />, bgColor: '#10B981' },
        { label: 'Total Programs', value: s.totalPrograms || 0, icon: <Map size={26} color="#8B5CF6" />, bgColor: '#8B5CF6' },
        { label: 'Active Teachers', value: s.totalTeachers || 0, icon: <GraduationCap size={26} color="#0ff0fc" />, bgColor: '#0ff0fc' },
        { label: 'Total Students', value: s.totalStudents || 0, icon: <Users size={26} color="#F59E0B" />, bgColor: '#F59E0B' },
        { label: 'Active Students', value: s.activeStudents || 0, icon: <CheckCircle size={26} color="#22C55E" />, bgColor: '#22C55E' },
        { label: 'Graduated Students', value: s.graduatedStudents || 0, icon: <Award size={26} color="#EC4899" />, bgColor: '#EC4899' },
        { label: 'Permanent Teachers', value: s.permanentTeachers || 0, icon: <ShieldCheck size={26} color="#3B82F6" />, bgColor: '#3B82F6' },
        { label: 'Visiting Teachers', value: s.visitingTeachers || 0, icon: <Clock size={26} color="#06B6D4" />, bgColor: '#06B6D4' },
        { label: 'New Students (30d)', value: s.newStudents30d || 0, icon: <TrendingUp size={26} color="#50cc7f" />, bgColor: '#50cc7f' },
        { label: 'Pending Approvals', value: s.pendingApprovals || 0, icon: <AlertTriangle size={26} color="#ff1b6b" />, bgColor: '#ff1b6b' },
        { label: 'Open Offerings', value: s.openOfferings || 0, icon: <BookOpen size={26} color="#bc13fe" />, bgColor: '#bc13fe' },
    ];

    const quickActions = [
        { label: 'View Departments', icon: <Building2 size={18} />, color: '#10B981', action: () => setActiveTab('departments') },
        { label: 'View Programs', icon: <Map size={18} />, color: '#8B5CF6', action: () => setActiveTab('programs') },
        { label: 'Approval Workflow', icon: <CheckSquare size={18} />, color: '#ffcc00', action: () => setActiveTab('workflow_approval') },
        { label: 'Course Files', icon: <FileText size={18} />, color: '#0ff0fc', action: () => setActiveTab('coursefiles') },
        { label: 'OBE Monitoring', icon: <Target size={18} />, color: '#bc13fe', action: () => setActiveTab('obereports') },
        { label: 'Generate Report', icon: <BarChart2 size={18} />, color: '#ff1b6b', action: () => setActiveTab('reports') },
    ];

    const statusIcon = (status) => {
        if (status === 'Met') return <CheckCircle size={16} color="#50cc7f" />;
        if (status === 'Not Met') return <XCircle size={16} color="#ff1b6b" />;
        return <Hourglass size={16} color="#ffcc00" />;
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">

                {activeTab === 'overview' && (
                    <div className="fade-in">
                        <header className="top-header">
                            <div className="header-title">
                                <h1>Dean Dashboard</h1>
                                <p>Welcome back, <span style={{ color: 'var(--uni-primary)', fontWeight: '600' }}>{user?.name}</span>. Here is the overview of your faculty statistics.</p>
                            </div>
                            <button onClick={() => dispatch(fetchDeanDashboard())} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '10px', color: '#0ff0fc', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <RefreshCw size={15} /> Refresh
                            </button>
                        </header>

                        {loading ? (
                            <div className="dashboard-loading">
                                <Loader2 size={48} className="spinner-large" color="var(--uni-primary)" />
                            </div>
                        ) : error ? (
                            <div style={{ padding: '16px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '12px', color: '#ff1b6b', margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <AlertTriangle size={18} /> {error} — Please restart the backend server and refresh.
                            </div>
                        ) : (
                            <>
                                {/* ===== QUICK ACTIONS ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                        <Zap size={22} color="#ffcc00" />
                                        <h3 style={{ color: '#ffcc00', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Quick Actions</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                        {quickActions.map((btn, idx) => (
                                            <button key={idx} onClick={btn.action} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${btn.color}30`, borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', color: 'rgba(255,255,255,0.8)' }}
                                                onMouseOver={e => { e.currentTarget.style.background = `${btn.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                                <div style={{ color: btn.color }}>{btn.icon}</div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '500', textAlign: 'center' }}>{btn.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ===== FACULTY SUMMARY ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                        <School size={22} color="var(--uni-primary)" />
                                        <h3 style={{ color: 'var(--uni-primary)', margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.02em' }}>Faculty Summary</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
                                        {[
                                            { label: 'Departments', value: s.totalDepartments ?? 0, icon: <Building2 size={20} color="#10B981" />, color: '#10B981' },
                                            { label: 'Programs', value: s.totalPrograms ?? 0, icon: <Map size={20} color="#8B5CF6" />, color: '#8B5CF6' },
                                            { label: 'Active Teachers', value: s.totalTeachers ?? 0, icon: <GraduationCap size={20} color="#0ff0fc" />, color: '#0ff0fc' },
                                            { label: 'Total Students', value: s.totalStudents ?? 0, icon: <Users size={20} color="#F59E0B" />, color: '#F59E0B' },
                                            { label: 'Open Offerings', value: s.openOfferings ?? 0, icon: <BookOpen size={20} color="#22C55E" />, color: '#22C55E' },
                                            { label: 'Pending Approvals', value: s.pendingApprovals ?? 0, icon: <CheckSquare size={20} color="#ff1b6b" />, color: '#ff1b6b' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{ background: `${item.color}08`, border: `1px solid ${item.color}28`, borderRadius: '12px', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <div style={{ background: `${item.color}18`, borderRadius: '8px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                                                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                                                </div>
                                                <div style={{ color: item.color, fontSize: '1.6rem', fontWeight: '700', paddingLeft: '2px', lineHeight: 1.2 }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ===== OBE ACHIEVEMENT STATUS ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                        <Network size={22} color="#bc13fe" />
                                        <h3 style={{ color: '#bc13fe', margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.02em' }}>OBE Achievement Status</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        {[
                                            { label: 'CLO Achievement', value: obe.avgCloAchievement, color: '#0ff0fc' },
                                            { label: 'PLO Achievement', value: obe.avgPloAchievement, color: '#bc13fe' },
                                            { label: 'GA Achievement', value: obe.avgGaAchievement, color: '#ffcc00' },
                                            { label: 'University Achievement', value: obe.universityAchievement, color: '#50cc7f' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{ background: `${item.color}08`, border: `1px solid ${item.color}28`, borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: '600' }}>{item.label}</span>
                                                <span style={{ color: item.color, fontSize: '1.4rem', fontWeight: '800' }}>{(item.value || 0).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* OBE Totals */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                        {[['PEOs', obe.totalPEOs], ['PLOs', obe.totalPLOs], ['CLOs', obe.totalCLOs], ['GAs', obe.totalGAs]].map(([lbl, val]) => (
                                            <div key={lbl} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 900 }}>{val || 0}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '4px' }}>Total {lbl}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ===== STATS GRID ===== */}
                                <div className="stats-grid fade-in" style={{ marginTop: '2rem' }}>
                                    {statCards.map((sc, i) => (
                                        <div className="stat-card glass-panel-dash" key={i}>
                                            <div className="stat-content">
                                                <h3>{sc.label}</h3>
                                                <h2>{sc.value}</h2>
                                            </div>
                                            <div className="stat-iconBox" style={{ background: `${sc.bgColor}15` }}>{sc.icon}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* ===== BOTTOM ROW: Pending Approvals + Department Breakdown ===== */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>

                                    {/* Pending Approvals */}
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <CheckSquare size={24} color="#ffcc00" />
                                            <h3 style={{ color: '#ffcc00', margin: 0 }}>Pending Approvals</h3>
                                        </div>
                                        {approvals.length === 0 ? (
                                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem' }}>
                                                <CheckCircle size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 10px' }} />
                                                All caught up! No pending approvals.
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '280px', overflowY: 'auto' }}>
                                                {approvals.map(a => (
                                                    <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid #ffcc00' }}>
                                                        <div>
                                                            <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{a.type || 'Workflow Request'}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.77rem', marginTop: '3px' }}>{a.requestedBy?.name || 'Unknown'} · {new Date(a.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', background: a.status === 'Pending' ? 'rgba(255,204,0,0.15)' : 'rgba(80,204,127,0.15)', color: a.status === 'Pending' ? '#ffcc00' : '#50cc7f' }}>{a.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Department Breakdown */}
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <Building2 size={24} color="#0ff0fc" />
                                            <h3 style={{ color: '#0ff0fc', margin: 0 }}>Students by Department</h3>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {charts.departmentBreakdown?.length > 0 ? charts.departmentBreakdown.slice(0, 6).map(d => {
                                                const max = Math.max(...charts.departmentBreakdown.map(x => x.count), 1);
                                                return (
                                                    <div key={d.name}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: '500' }}>{d.name}</span>
                                                            <span style={{ color: '#0ff0fc', fontWeight: 'bold', fontSize: '0.85rem' }}>{d.count}</span>
                                                        </div>
                                                        <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${(d.count / max) * 100}%`, background: 'linear-gradient(90deg,#0ff0fc,#bc13fe)', borderRadius: '4px', transition: 'width 1s ease' }} />
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No department data available yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ===== CLO / PLO ACHIEVEMENT CHARTS ===== */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <Target size={20} color="#0ff0fc" />
                                            <h3 style={{ color: '#0ff0fc', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>CLO Achievement (%)</h3>
                                        </div>
                                        {charts.cloAchievementGraph?.length > 0 ? (
                                            <MiniBar data={charts.cloAchievementGraph} valueKey="achievement" labelKey="clo" color="#0ff0fc" height={110} />
                                        ) : <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No CLO data yet.</div>}
                                    </div>

                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <TrendingUp size={20} color="#50cc7f" />
                                            <h3 style={{ color: '#50cc7f', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>PLO Achievement (%)</h3>
                                        </div>
                                        {charts.ploAchievementGraph?.length > 0 ? (
                                            <MiniBar data={charts.ploAchievementGraph} valueKey="achievement" labelKey="plo" color="#50cc7f" height={110} />
                                        ) : <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No PLO data yet.</div>}
                                    </div>
                                </div>

                                {charts.passFailRatio?.length > 0 && (
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <CheckCircle size={20} color="#ffcc00" />
                                            <h3 style={{ color: '#ffcc00', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Pass / Fail Ratio (Faculty)</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                            {charts.passFailRatio.map((item, i) => (
                                                <div key={i} style={{ flex: 1, minWidth: '120px', background: `${item.fill}10`, border: `1px solid ${item.fill}30`, borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: item.fill }}>{item.value}%</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '4px' }}>{item.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ===== CLOSING THE LOOP STATUS ===== */}
                                {obe.closingTheLoopStatus?.length > 0 && (
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                            <Target size={22} color="#50cc7f" />
                                            <h3 style={{ color: '#50cc7f', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Closing the Loop Status</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                            {obe.closingTheLoopStatus.map((item, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {statusIcon(item.status)}
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{item.ploCode}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.77rem', marginTop: '2px' }}>{item.actionTaken}</div>
                                                    </div>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', background: item.status === 'Met' ? 'rgba(80,204,127,0.15)' : item.status === 'Not Met' ? 'rgba(255,27,107,0.15)' : 'rgba(255,204,0,0.15)', color: item.status === 'Met' ? '#50cc7f' : item.status === 'Not Met' ? '#ff1b6b' : '#ffcc00' }}>{item.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'departments' && <Departments />}
                {activeTab === 'programs' && (
                    <ErrorBoundary>
                        <Programs />
                    </ErrorBoundary>
                )}
                {activeTab === 'coursefiles' && <CourseFileManagement />}
                {activeTab === 'workflow_approval' && <WorkflowManagement />}
                {activeTab === 'obereports' && <ObeReports />}
                {activeTab === 'targetvsachieved' && <TargetVsAchieved />}
                {activeTab === 'gapanalysis' && <GapAnalysis />}
                {activeTab === 'closingtheloop' && <ClosingTheLoop />}
                {activeTab === 'obe_archive' && <ObeHistory />}
                {activeTab === 'reports_management' && <ReportsManagement />}
                {activeTab === 'aifeatures' && <AIFeatures />}
            </main>
        </div>
    );
};

export default DeanDashboard;
