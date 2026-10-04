import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeacherDashboard, fetchAssignedCourses } from '../../store/teacherDashSlice';
import Sidebar from '../../components/Sidebar';
import WorkflowManagement from '../../components/WorkflowManagement';
import ReportsManagement from '../../components/ReportsManagement';
import AIFeatures from '../../components/AIFeatures';
import CourseWorkspace from '../../components/CourseWorkspace';
import TeacherAttendance from '../../components/TeacherAttendance';
import TeacherAssessment from '../../components/TeacherAssessment';
import TeacherMarks from '../../components/TeacherMarks';
import TeacherQuestionMapping from '../../components/TeacherQuestionMapping';
import TeacherBlueprint from '../../components/TeacherBlueprint';
import TeacherRubrics from '../../components/TeacherRubrics';
import TeacherOBE from '../../components/TeacherOBE';
import TeacherQuestionBank from '../../components/TeacherQuestionBank';
import CourseFileManagement from '../../components/CourseFileManagement';
import TeacherReports from '../../components/TeacherReports';
import TeacherBTCoverage from '../../components/TeacherBTCoverage';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import {
    LayoutDashboard, BookOpen, Users, Layers, CalendarCheck,
    Clock, ClipboardList, FileText, CheckSquare, Bell, Zap,
    RefreshCw, AlertTriangle, Loader2, Target, TrendingUp,
    BarChart2, GraduationCap, Brain, ChevronRight, Star,
    AlertCircle, CheckCircle, BookMarked, FolderOpen
} from 'lucide-react';
import '../../style/Dashboard.css';

/* ─── Course Card ─── */
const CourseCard = ({ offering, onClick }) => {
    const c = offering.course || {};
    const s = offering.section || {};
    const sem = offering.semester || {};
    const prog = offering.program || {};
    const isActive = sem.status === 'Active';
    return (
        <div
            onClick={() => onClick && onClick(offering)}
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(15,240,252,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '14px',
                padding: '1.2rem 1.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(15,240,252,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: isActive ? 'linear-gradient(90deg,#0ff0fc,#bc13fe)' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <div>
                    <div style={{ color: '#0ff0fc', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '3px' }}>{c.code || '—'}</div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{c.name || '—'}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', background: isActive ? 'rgba(15,240,252,0.15)' : 'rgba(255,255,255,0.06)', color: isActive ? '#0ff0fc' : 'rgba(255,255,255,0.4)' }}>
                    {sem.status || 'N/A'}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                {[
                    ['Program', prog.name || '—'],
                    ['Section', s.name || '—'],
                    ['Semester', sem.name || '—'],
                    ['Students', offering.totalStudents ?? '—'],
                    ['Credits', c.creditHours ?? '—'],
                    ['Type', c.type || '—']
                ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: '5px', color: 'rgba(255,255,255,0.5)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}:</span>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{val}</span>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Attendance', 'Marks', 'Assessments', 'OBE', 'Course File'].map(act => (
                    <span key={act} style={{ padding: '3px 9px', background: 'rgba(188,19,254,0.12)', border: '1px solid rgba(188,19,254,0.2)', borderRadius: '20px', fontSize: '0.7rem', color: '#bc13fe', fontWeight: '600', cursor: 'pointer' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(188,19,254,0.22)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(188,19,254,0.12)'}
                    >{act}</span>
                ))}
                <span style={{ padding: '3px 9px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '20px', fontSize: '0.7rem', color: '#0ff0fc', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Open Workspace <ChevronRight size={11} />
                </span>
            </div>
        </div>
    );
};

/* ─── Bar Chart ─── */
const MiniBar = ({ data, valueKey, labelKey, color = '#0ff0fc', height = 80 }) => {
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

/* ─── Main Dashboard ─── */
const TeacherDashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(s => s.auth);
    const { dashboard, courses, loading, coursesLoading, error } = useSelector(s => s.teacherDash);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        dispatch(fetchTeacherDashboard());
        dispatch(fetchAssignedCourses());
    }, [dispatch]);

    const st = dashboard?.stats || {};
    const obe = dashboard?.obe || {};
    const charts = dashboard?.charts || {};

    const statCards = [
        { label: 'Assigned Courses', value: st.assignedCourses ?? 0, icon: <BookOpen size={24} />, color: '#0ff0fc' },
        { label: 'Total Students', value: st.totalStudents ?? 0, icon: <Users size={24} />, color: '#bc13fe' },
        { label: 'Active Sections', value: st.activeSections ?? 0, icon: <Layers size={24} />, color: '#10B981' },
        { label: "Today's Classes", value: st.todaysClasses ?? 0, icon: <CalendarCheck size={24} />, color: '#F59E0B' },
        { label: 'Pending Attendance', value: st.pendingAttendance ?? 0, icon: <Clock size={24} />, color: '#ff1b6b' },
        { label: 'Pending Assessments', value: st.pendingAssessments ?? 0, icon: <ClipboardList size={24} />, color: '#ff6b35' },
        { label: 'Pending Workflows', value: st.pendingWorkflows ?? 0, icon: <CheckSquare size={24} />, color: '#ffcc00' },
        { label: 'Total CLOs', value: obe.totalCLOs ?? 0, icon: <Target size={24} />, color: '#50cc7f' }
    ];

    const quickActions = [
        { label: 'My Courses', icon: <BookOpen size={18} />, color: '#0ff0fc', tab: 'my_courses' },
        { label: 'OBE Monitoring', icon: <Target size={18} />, color: '#bc13fe', tab: 'obereports' },
        { label: 'Workflow', icon: <CheckSquare size={18} />, color: '#ffcc00', tab: 'workflow_approval' },
        { label: 'Reports', icon: <BarChart2 size={18} />, color: '#10B981', tab: 'reports' },
        { label: 'AI Assistant', icon: <Brain size={18} />, color: '#ff6b35', tab: 'aifeatures' },
    ];

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                {selectedCourse ? (
                    <CourseWorkspace offering={selectedCourse} onBack={() => setSelectedCourse(null)} />
                ) : (
                    <>
                        {/* ══════════════════ OVERVIEW ══════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="fade-in">
                                <header className="top-header">
                                    <div className="header-title">
                                        <h1>Teacher Dashboard</h1>
                                        <p>Welcome, <span style={{ color: 'var(--uni-primary)', fontWeight: '700' }}>{user?.name}</span> — here's your teaching overview.</p>
                                    </div>
                                    <button
                                        onClick={() => { dispatch(fetchTeacherDashboard()); dispatch(fetchAssignedCourses()); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '10px', color: '#0ff0fc', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
                                    >
                                        <RefreshCw size={15} /> Refresh
                                    </button>
                                </header>

                                {loading ? (
                                    <div className="dashboard-loading"><Loader2 size={48} className="spinner-large" color="var(--uni-primary)" /></div>
                                ) : error ? (
                                    <div style={{ padding: '16px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '12px', color: '#ff1b6b', margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <AlertTriangle size={18} /> {error}
                                    </div>
                                ) : (
                                    <>
                                        {/* Quick Actions */}
                                        <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                                <Zap size={20} color="#ffcc00" />
                                                <h3 style={{ color: '#ffcc00', margin: 0, fontSize: '1rem', fontWeight: '700' }}>Quick Actions</h3>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                                                {quickActions.map((btn, i) => (
                                                    <button key={i} onClick={() => setActiveTab(btn.tab)} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${btn.color}30`, borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', transition: 'all 0.2s' }}
                                                        onMouseOver={e => { e.currentTarget.style.background = `${btn.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                                        <div style={{ color: btn.color }}>{btn.icon}</div>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: '600', textAlign: 'center' }}>{btn.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Task Widgets (Today's Tasks & Pending Tasks) */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                                            {/* Today's Tasks */}
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                                    <CalendarCheck size={20} color="#0ff0fc" />
                                                    <h3 style={{ color: '#0ff0fc', margin: 0, fontSize: '1rem', fontWeight: '700' }}>Today's Tasks</h3>
                                                </div>
                                                {dashboard?.todaysTasks?.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        {dashboard.todaysTasks.map((t, idx) => (
                                                            <div key={idx} style={{ background: 'rgba(15,240,252,0.05)', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>{t.label}</span>
                                                                <span style={{ background: '#0ff0fc', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{t.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem 0' }}>No tasks for today.</div>
                                                )}
                                            </div>

                                            {/* Pending Tasks */}
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                                    <AlertCircle size={20} color="#ff1b6b" />
                                                    <h3 style={{ color: '#ff1b6b', margin: 0, fontSize: '1rem', fontWeight: '700' }}>Pending Tasks</h3>
                                                </div>
                                                {dashboard?.pendingTasks?.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        {dashboard.pendingTasks.map((t, idx) => (
                                                            <div key={idx} style={{ background: 'rgba(255,27,107,0.05)', border: '1px solid rgba(255,27,107,0.2)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500' }}>{t.label}</span>
                                                                <span style={{ background: '#ff1b6b', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{t.count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem 0' }}>No pending tasks.</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* KPI Cards */}
                                        <div className="stats-grid fade-in" style={{ marginTop: '2rem' }}>
                                            {statCards.map((sc, i) => (
                                                <div className="stat-card glass-panel-dash" key={i}>
                                                    <div className="stat-content">
                                                        <h3>{sc.label}</h3>
                                                        <h2 style={{ color: sc.color }}>{sc.value}</h2>
                                                    </div>
                                                    <div className="stat-iconBox" style={{ background: `${sc.color}18`, color: sc.color }}>{sc.icon}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* OBE Status */}
                                        <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                                <Target size={22} color="#bc13fe" />
                                                <h3 style={{ color: '#bc13fe', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>OBE Achievement Status</h3>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                                {[
                                                    { label: 'Total CLOs', value: `${obe.totalCLOs || 0}`, unit: 'CLOs', color: '#0ff0fc' },
                                                    { label: 'CLO Achievement', value: `${(obe.cloAchievement || 0).toFixed(1)}`, unit: '%', color: '#10B981' },
                                                    { label: 'PLO Contribution', value: `${(obe.ploContribution || 0).toFixed(1)}`, unit: '%', color: '#bc13fe' },
                                                    { label: 'GA Contribution', value: `${(obe.gaContribution || 0).toFixed(1)}`, unit: '%', color: '#ffcc00' }
                                                ].map((item, idx) => (
                                                    <div key={idx} style={{ background: `${item.color}08`, border: `1px solid ${item.color}28`, borderRadius: '12px', padding: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', fontWeight: '600' }}>{item.label}</span>
                                                        <span style={{ color: item.color, fontSize: '1.5rem', fontWeight: '800' }}>{item.value}<span style={{ fontSize: '0.9rem' }}>{item.unit}</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Charts Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                                            {/* Attendance Trend */}
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                                    <CalendarCheck size={20} color="#0ff0fc" />
                                                    <h3 style={{ color: '#0ff0fc', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Attendance Trend (Last 4 Weeks)</h3>
                                                </div>
                                                {charts.attendanceTrend?.length > 0 ? (
                                                    <MiniBar data={charts.attendanceTrend} valueKey="rate" labelKey="week" color="#0ff0fc" height={100} />
                                                ) : <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No attendance data yet</div>}
                                            </div>

                                            {/* Grade Distribution */}
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                                    <GraduationCap size={20} color="#bc13fe" />
                                                    <h3 style={{ color: '#bc13fe', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Grade Distribution</h3>
                                                </div>
                                                {charts.gradeDistribution?.some(g => g.count > 0) ? (
                                                    <MiniBar data={charts.gradeDistribution} valueKey="count" labelKey="grade" color="#bc13fe" height={100} />
                                                ) : <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No grade data yet</div>}
                                            </div>
                                        </div>

                                        {/* CLO / PLO Achievement Charts */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                                            {/* CLO Achievement Bar */}
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                                    <Target size={20} color="#0ff0fc" />
                                                    <h3 style={{ color: '#0ff0fc', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>CLO Achievement (%)</h3>
                                                </div>
                                                {charts.cloAchievementGraph?.length > 0 ? (
                                                    <MiniBar data={charts.cloAchievementGraph} valueKey="achievement" labelKey="clo" color="#0ff0fc" height={110} />
                                                ) : <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No CLO attainment data yet. Submit marks and run Calculate OBE.</div>}
                                            </div>

                                            {/* PLO Achievement Bar */}
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                                    <TrendingUp size={20} color="#50cc7f" />
                                                    <h3 style={{ color: '#50cc7f', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>PLO Achievement (%)</h3>
                                                </div>
                                                {charts.ploAchievementGraph?.length > 0 ? (
                                                    <MiniBar data={charts.ploAchievementGraph} valueKey="achievement" labelKey="plo" color="#50cc7f" height={110} />
                                                ) : <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>No PLO attainment data yet.</div>}
                                            </div>
                                        </div>

                                        {/* Pass / Fail Ratio */}
                                        {charts.passFailRatio?.length > 0 && (
                                            <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                                    <Star size={20} color="#ffcc00" />
                                                    <h3 style={{ color: '#ffcc00', margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Pass / Fail Ratio (All Assessments)</h3>
                                                </div>
                                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                    {charts.passFailRatio.map((item, i) => (
                                                        <div key={i} style={{ flex: 1, minWidth: '120px', background: `${item.fill}10`, border: `1px solid ${item.fill}30`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '2rem', fontWeight: '800', color: item.fill }}>{item.value}%</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '4px' }}>{item.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Assigned Courses Quick View */}
                                        <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <BookMarked size={22} color="#F59E0B" />
                                                    <h3 style={{ color: '#F59E0B', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Assigned Courses</h3>
                                                </div>
                                                <button onClick={() => setActiveTab('my_courses')} style={{ background: 'none', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', padding: '5px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    View All <ChevronRight size={13} />
                                                </button>
                                            </div>
                                            {coursesLoading ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 size={28} color="#0ff0fc" className="spinner-large" /></div>
                                            ) : courses.length === 0 ? (
                                                <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2.5rem', fontSize: '0.95rem' }}>
                                                    <BookOpen size={36} style={{ opacity: 0.2, marginBottom: '0.5rem' }} /><br />
                                                    No courses assigned yet.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                                    {courses.slice(0, 6).map((o, i) => (
                                                        <CourseCard key={o._id || i} offering={o} onClick={() => setSelectedCourse(o)} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ══════════════════ MY COURSES ══════════════════ */}
                        {activeTab === 'my_courses' && (
                            <div className="fade-in">
                                <header className="top-header">
                                    <div className="header-title">
                                        <h1>My Assigned Courses</h1>
                                        <p>All courses assigned to you this semester</p>
                                    </div>
                                    <button onClick={() => dispatch(fetchAssignedCourses())} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '10px', color: '#0ff0fc', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        <RefreshCw size={15} /> Refresh
                                    </button>
                                </header>
                                {coursesLoading ? (
                                    <div className="dashboard-loading"><Loader2 size={48} className="spinner-large" color="var(--uni-primary)" /></div>
                                ) : courses.length === 0 ? (
                                    <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '4rem', textAlign: 'center', marginTop: '2rem' }}>
                                        <BookOpen size={60} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                                        <h3 style={{ color: 'rgba(255,255,255,0.3)' }}>No courses assigned yet.</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.2)' }}>Please contact your HOD or University Admin to assign courses.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
                                        {courses.map((o, i) => (
                                            <CourseCard key={o._id || i} offering={o} onClick={() => setSelectedCourse(o)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'obereports' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherOBE />
                            </div>
                        )}
                        {activeTab === 'workflow_approval' && <WorkflowManagement />}
                        {activeTab === 'reports_management' && <ReportsManagement />}
                        {activeTab === 'aifeatures' && <AIFeatures />}
                        {activeTab === 'attendance' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherAttendance />
                            </div>
                        )}
                        {activeTab === 'assessments' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherAssessment />
                            </div>
                        )}
                        {activeTab === 'marks' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherMarks />
                            </div>
                        )}
                        {activeTab === 'qmapping' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherQuestionMapping />
                            </div>
                        )}
                        {activeTab === 'blueprint' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherBlueprint />
                            </div>
                        )}
                        {activeTab === 'rubrics' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherRubrics />
                            </div>
                        )}
                        {activeTab === 'questionbank' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherQuestionBank />
                            </div>
                        )}
                        {activeTab === 'coursefile' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <CourseFileManagement />
                            </div>
                        )}
                        {activeTab === 'btcoverage' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <ErrorBoundary>
                                    <TeacherBTCoverage />
                                </ErrorBoundary>
                            </div>
                        )}
                        {activeTab === 'academic_analytics' && (
                            <div className="fade-in glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', minHeight: '80vh' }}>
                                <TeacherReports />
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;
