import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../../components/Sidebar';
import '../../style/Dashboard.css';
import { fetchStudentDashboard } from '../../store/studentDashSlice';
import ProfileManagement from '../../components/ProfileManagement';
import { BookOpen, GraduationCap, CheckCircle, XCircle, Target } from 'lucide-react';

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { dashboard, loading } = useSelector((state) => state.studentDash);

    useEffect(() => {
        dispatch(fetchStudentDashboard());
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
                                <h1>Student Portal</h1>
                                <p>Welcome, {user?.name}. View your courses, results, and attendance.</p>
                            </div>
                        </header>
                        
                        {loading ? (
                            <p style={{ padding: '1rem', color: '#666' }}>Loading dashboard...</p>
                        ) : (
                            <>
                                <div className="stats-grid">
                                    {[
                                        { label: 'Enrolled Courses', value: stats.enrolledCourses || 0 },
                                        { label: 'Attendance %', value: stats.attendancePercent ? `${stats.attendancePercent}%` : '0%' },
                                        { label: 'GPA', value: stats.cgpa || '0.0' },
                                        { label: 'Pending Assignments', value: stats.pendingAssignments || 0 },
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
                                    <h3 style={{ color: 'var(--uni-primary)', marginBottom: '0.5rem' }}>Student Overview</h3>
                                    <p style={{ color: 'var(--uni-muted)' }}>Check your course enrollments, attendance records, and academic results below.</p>
                                </div>
                            </>
                        )}
                    </>
                )}
                
                {activeTab === 'studentprofile' && (
                    <ProfileManagement />
                )}

                {activeTab === 'courses' && (
                    <div className="fade-in">
                        <header className="top-header" style={{ marginBottom: '20px' }}>
                            <div className="header-title">
                                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen color="#0ff0fc" /> My Courses</h1>
                                <p>Currently enrolled courses and sections.</p>
                            </div>
                        </header>
                        <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.5rem' }}>
                            {dashboard?.enrollments?.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '12px' }}>Course Code</th>
                                            <th style={{ padding: '12px' }}>Course Name</th>
                                            <th style={{ padding: '12px' }}>Section</th>
                                            <th style={{ padding: '12px' }}>Credits</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboard.enrollments.map((enr, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px', color: '#0ff0fc' }}>{enr.courseOffering?.course?.code || '—'}</td>
                                                <td style={{ padding: '12px' }}>{enr.courseOffering?.course?.name || '—'}</td>
                                                <td style={{ padding: '12px', color: '#bc13fe' }}>{enr.courseOffering?.section?.name || '—'}</td>
                                                <td style={{ padding: '12px' }}>{enr.courseOffering?.course?.creditHours || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No courses enrolled yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="fade-in">
                        <header className="top-header" style={{ marginBottom: '20px' }}>
                            <div className="header-title">
                                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GraduationCap color="#50cc7f" /> Academic Results</h1>
                                <p>Recent assessment marks and OBE achievements.</p>
                            </div>
                        </header>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Recent Marks */}
                            <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="#0ff0fc"/> Recent Assessments</h3>
                                {dashboard?.recentMarks?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {dashboard.recentMarks.map((m, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{m.assessmentName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{m.type}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 'bold', color: m.percentage >= 50 ? '#50cc7f' : '#ff1b6b' }}>{Number(m.obtained).toFixed(1).replace(/\.0$/, '')} / {m.total}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{m.percentage}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>No marks available.</p>
                                )}
                            </div>

                            {/* OBE Achievements */}
                            <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 16px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={18} color="#bc13fe"/> OBE Achievements</h3>
                                {dashboard?.attainments?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {dashboard.attainments.map((a, idx) => (
                                            <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>{a.courseOffering?.course ? `${a.courseOffering.course.code} - ${a.courseOffering.course.name}` : 'Course'}</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {(a.clos || []).map((c, i) => (
                                                        <span key={i} style={{ background: c.percentage >= c.targetThreshold ? 'rgba(80,204,127,0.1)' : 'rgba(255,27,107,0.1)', color: c.percentage >= c.targetThreshold ? '#50cc7f' : '#ff1b6b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                            {c.clo?.code || 'CLO'}: {c.percentage.toFixed(1)}%
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>No OBE attainments calculated yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;
