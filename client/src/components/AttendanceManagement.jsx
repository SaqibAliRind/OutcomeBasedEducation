import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchAttendance, 
    fetchAttendanceStats, 
    fetchAttendanceReports, 
    markAttendance, 
    approveAttendanceRecord, 
    clearAttendanceMessages,
    fetchAttendanceAnalytics,
    fetchDetailedReports,
    sendAttendanceAlerts 
} from '../store/attendanceSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchSettings, updateSettingsCategory } from '../store/settingsSlice';
import { Loader2, Users, CheckCircle, XCircle, AlertTriangle, Search, Save, Calendar, Clock, BarChart2, Settings, Download, Edit3, Check, X, PieChart, Bell, Send } from 'lucide-react';
import { AreaChart, Area, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, ReferenceLine } from 'recharts';
import '../style/UniversityAdminDashboard.css';

const AttendanceManagement = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(s => s.auth);
    const { records, stats, reports, analytics, detailedReports, loading, error, successMessage } = useSelector(s => s.attendance);
    const { config } = useSelector(s => s.settings);
    const { records: { courseOfferings = [] } } = useSelector(s => s.academic);

    const [activeAdminTab, setActiveAdminTab] = useState('dashboard'); // dashboard | analytics | monitoring | alerts | settings
    const [reportType, setReportType] = useState('Daily');
    const [analyticsGroup, setAnalyticsGroup] = useState('department');
    const [detailedReportType, setDetailedReportType] = useState('Student');
    const [alertSending, setAlertSending] = useState(false);
    
    // Teacher View State
    const [selectedOffering, setSelectedOffering] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [searchStudent, setSearchStudent] = useState('');
    
    // Settings State
    const [settingsForm, setSettingsForm] = useState({
        policyDescription: '',
        minimumPercentage: 75,
        lockDate: '',
        freezeAttendance: false,
        requireApproval: false
    });

    const [toast, setToast] = useState(null);

    const isUniversityAdmin = user?.role === 'UniversityAdmin' || user?.role === 'SuperAdmin';
    const isTeacher = user?.role === 'Teacher';
    const attendanceSettings = config?.attendance || {};

    useEffect(() => {
        dispatch(fetchSettings());
        if (isUniversityAdmin) {
            dispatch(fetchAttendanceStats());
            dispatch(fetchAttendance({})); // fetch records for approvals
        }
        if (isTeacher) {
            dispatch(fetchAcademicData('courseOfferings'));
            dispatch(fetchAttendance({}));
        }
        return () => dispatch(clearAttendanceMessages());
    }, [dispatch, isUniversityAdmin, isTeacher]);

    useEffect(() => {
        if (config?.attendance) {
            setSettingsForm({
                policyDescription: config.attendance.policyDescription || '',
                minimumPercentage: config.attendance.minimumPercentage || 75,
                lockDate: config.attendance.lockDate ? new Date(config.attendance.lockDate).toISOString().split('T')[0] : '',
                freezeAttendance: config.attendance.freezeAttendance || false,
                requireApproval: config.attendance.requireApproval || false
            });
        }
    }, [config]);

    useEffect(() => {
        if (isUniversityAdmin && activeAdminTab === 'monitoring') {
            dispatch(fetchAttendanceReports({ type: reportType }));
            dispatch(fetchDetailedReports(detailedReportType));
        }
    }, [dispatch, isUniversityAdmin, activeAdminTab, reportType, detailedReportType]);

    useEffect(() => {
        if (isUniversityAdmin && activeAdminTab === 'analytics') {
            dispatch(fetchAttendanceAnalytics(analyticsGroup));
        }
    }, [dispatch, isUniversityAdmin, activeAdminTab, analyticsGroup]);

    useEffect(() => {
        if (successMessage) { setToast({ msg: successMessage, type: 'success' }); setTimeout(() => setToast(null), 3000); dispatch(clearAttendanceMessages()); }
        if (error) { setToast({ msg: error, type: 'error' }); setTimeout(() => setToast(null), 4000); dispatch(clearAttendanceMessages()); }
    }, [successMessage, error, dispatch]);

    useEffect(() => {
        if (isTeacher && selectedOffering) {
            const existing = records.find(r => r.courseOffering?._id === selectedOffering && new Date(r.date).toISOString().split('T')[0] === selectedDate);
            
            if (existing) {
                setAttendanceList(existing.students.map(s => ({
                    student: s.student?._id || s.student,
                    name: s.student?.name || 'Unknown',
                    email: s.student?.email || '',
                    status: s.status,
                    remarks: s.remarks || ''
                })));
            } else {
                fetch(`/api/enrollments`, { headers: { Authorization: `Bearer ${user.token}` } })
                    .then(res => res.json())
                    .then(data => {
                        const enrolledInCourse = data.filter(e => e.courseOffering?._id === selectedOffering && e.status === 'Enrolled');
                        setAttendanceList(enrolledInCourse.map(e => ({
                            student: e.student._id,
                            name: e.student.name,
                            email: e.student.email,
                            status: 'Present',
                            remarks: ''
                        })));
                    })
                    .catch(err => console.error(err));
            }
        }
    }, [selectedOffering, selectedDate, records, isTeacher, user.token]);

    const handleStatusChange = (studentId, status) => setAttendanceList(prev => prev.map(s => s.student === studentId ? { ...s, status } : s));
    const handleRemarksChange = (studentId, remarks) => setAttendanceList(prev => prev.map(s => s.student === studentId ? { ...s, remarks } : s));
    const handleMarkAll = (status) => setAttendanceList(prev => prev.map(s => ({ ...s, status })));

    const handleSaveAttendance = () => {
        if (!selectedOffering) return alert('Select a course first');
        dispatch(markAttendance({
            courseOffering: selectedOffering,
            date: selectedDate,
            students: attendanceList.map(s => ({ student: s.student, status: s.status, remarks: s.remarks }))
        }));
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        dispatch(updateSettingsCategory({ category: 'attendance', data: settingsForm }));
    };

    const handleApprove = (id, status) => {
        dispatch(approveAttendanceRecord({ id, status }));
    };

    const handleSendAlert = async (type, allShort = false, studentId = null) => {
        setAlertSending(true);
        await dispatch(sendAttendanceAlerts({ type, allShort, studentId }));
        setAlertSending(false);
    };

    const filteredList = useMemo(() => {
        if (!searchStudent) return attendanceList;
        return attendanceList.filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()) || s.email.toLowerCase().includes(searchStudent.toLowerCase()));
    }, [attendanceList, searchStudent]);

    const myOfferings = useMemo(() => {
        if (!isTeacher) return [];
        return courseOfferings.filter(o => o.teacher?._id === user._id || o.teacher === user._id);
    }, [courseOfferings, isTeacher, user._id]);

    const renderAdminDashboard = () => {
        if (!stats) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="spin" size={32} color="#0ff0fc" /></div>;

        // Chart data derived from stats
        const pieData = [
            { name: 'Present', value: stats.totalPresent || 0, fill: '#50cc7f' },
            { name: 'Absent', value: stats.totalAbsent || 0, fill: '#ff1b6b' },
            { name: 'Late', value: stats.totalLate || 0, fill: '#ff9800' },
            { name: 'Excused', value: stats.totalExcused || 0, fill: '#bc13fe' },
        ].filter(d => d.value > 0);

        const weeklyTrend = stats.weeklyTrend || [
            { day: 'Mon', present: 0, absent: 0 },
            { day: 'Tue', present: 0, absent: 0 },
            { day: 'Wed', present: 0, absent: 0 },
            { day: 'Thu', present: 0, absent: 0 },
            { day: 'Fri', present: 0, absent: 0 },
        ];

        const deptData = stats.departmentWise || [];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
                {/* ===== KPI STAT CARDS ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                    {[
                        { label: 'Total Records', value: stats.totalRecords || 0, color: '#0ff0fc', icon: <Users color="#0ff0fc" size={26} /> },
                        { label: "Today's Classes", value: stats.todayRecords || 0, color: '#bc13fe', icon: <Calendar color="#bc13fe" size={26} /> },
                        { label: 'Present %', value: `${stats.presentPercentage || 0}%`, color: '#50cc7f', icon: <CheckCircle color="#50cc7f" size={26} /> },
                        { label: 'Absent %', value: `${stats.absentPercentage || 0}%`, color: '#ff1b6b', icon: <XCircle color="#ff1b6b" size={26} /> },
                        { label: 'Short Attendance', value: stats.shortAttendanceStudents?.length || 0, color: '#ff9800', icon: <AlertTriangle color="#ff9800" size={26} /> },
                    ].map((card, i) => (
                        <div key={i} className="glass-panel-dash" style={{ padding: '1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${card.color}20` }}>
                            <div style={{ background: `${card.color}15`, padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                                <div style={{ color: card.color, fontSize: '1.7rem', fontWeight: '700', lineHeight: 1.1 }}>{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===== CHARTS ROW ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>

                    {/* PIE — Present / Absent / Late / Excused */}
                    <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px' }}>
                        <h4 style={{ color: '#fff', margin: '0 0 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <PieChart size={18} color="#0ff0fc" /> Attendance Breakdown
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            <ResponsiveContainer width={180} height={180}>
                                <RechartsPieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {pieData.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.fill }} />
                                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{d.name}</span>
                                        <span style={{ color: d.fill, fontWeight: 'bold', marginLeft: 'auto', paddingLeft: '1rem' }}>{d.value}</span>
                                    </div>
                                ))}
                                {pieData.length === 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No data yet</span>}
                            </div>
                        </div>
                    </div>

                    {/* AREA — Weekly Trend */}
                    <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px' }}>
                        <h4 style={{ color: '#fff', margin: '0 0 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart2 size={18} color="#bc13fe" /> Weekly Attendance Trend
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#50cc7f" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#50cc7f" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff1b6b" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ff1b6b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <RechartsTooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                <Legend />
                                <Area type="monotone" dataKey="present" name="Present" stroke="#50cc7f" fill="url(#gradPresent)" strokeWidth={2} />
                                <Area type="monotone" dataKey="absent" name="Absent" stroke="#ff1b6b" fill="url(#gradAbsent)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DEPARTMENT BAR CHART */}
                {deptData.length > 0 && (
                    <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px' }}>
                        <h4 style={{ color: '#fff', margin: '0 0 1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart2 size={18} color="#ffcc00" /> Department-wise Attendance %
                        </h4>
                        <ResponsiveContainer width="100%" height={220}>
                            <RechartsBarChart data={deptData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} domain={[0, 100]} />
                                <RechartsTooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`${v}%`, 'Attendance']} />
                                <Bar dataKey="percentage" name="Attendance %" radius={[6, 6, 0, 0]}>
                                    {deptData.map((entry, index) => (
                                        <Cell key={index} fill={entry.percentage >= 75 ? '#50cc7f' : '#ff1b6b'} />
                                    ))}
                                </Bar>
                                <ReferenceLine y={75} stroke="#ffcc00" strokeDasharray="4 4" label={{ value: 'Min 75%', fill: '#ffcc00', fontSize: 11, position: 'right' }} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        );
    };


    const renderAnalytics = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
                <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Attendance Analytics</h3>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                            {['department', 'program', 'semester', 'course', 'teacher'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setAnalyticsGroup(type)}
                                    style={{
                                        background: analyticsGroup === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: analyticsGroup === type ? '#0ff0fc' : 'rgba(255,255,255,0.6)',
                                        border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: '0.2s', textTransform: 'capitalize'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    {loading && analytics.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="spin" size={24} color="#0ff0fc" /></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {analytics.map((a, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: '500' }}>{a.label || 'Unknown'}</h4>
                                    <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
                                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={a.percentage >= settingsForm.minimumPercentage ? '#50cc7f' : '#ff1b6b'} strokeWidth="3" strokeDasharray={`${a.percentage}, 100`} />
                                        </svg>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {a.percentage?.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {analytics.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', gridColumn: '1/-1' }}>No analytics data available.</div>}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAlerts = () => {
        if (!stats) return null;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
                <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle color="#ff9800" size={20} /> Short Attendance Alerts
                            </h3>
                            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Students below the {stats.minPercentage}% minimum threshold.</p>
                        </div>
                        <button 
                            onClick={() => handleSendAlert('Warning', true)}
                            disabled={alertSending || !stats.shortAttendanceStudents?.length}
                            style={{ background: 'rgba(255,152,0,0.15)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {alertSending ? <Loader2 className="spin" size={16} /> : <Send size={16} />} Send Warning to All
                        </button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Student</th>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Course</th>
                                <th style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Attendance</th>
                                <th style={{ textAlign: 'right', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.shortAttendanceStudents?.map((s, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 0' }}>
                                        <div style={{ color: '#fff', fontSize: '0.9rem' }}>{s.studentName}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{s.email}</div>
                                    </td>
                                    <td style={{ padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{s.course}</td>
                                    <td style={{ padding: '12px 0', textAlign: 'center', color: '#ff1b6b', fontWeight: 'bold' }}>{s.percentage}%</td>
                                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                        <button 
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Send Notice
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!stats.shortAttendanceStudents?.length && (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No students with short attendance currently.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderMonitoring = () => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
                {/* Time-based Reports */}
                <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Aggregated Reports</h3>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                            {['Daily', 'Weekly', 'Monthly'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    style={{
                                        background: reportType === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: reportType === type ? '#0ff0fc' : 'rgba(255,255,255,0.6)',
                                        border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: '0.2s'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    {loading && reports.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="spin" size={24} color="#0ff0fc" /></div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Period ({reportType})</th>
                                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Total Marked</th>
                                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Present Count</th>
                                    <th style={{ textAlign: 'right', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Avg Present %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px 0', color: '#fff' }}>{r.label}</td>
                                        <td style={{ padding: '12px 0', textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>{r.total}</td>
                                        <td style={{ padding: '12px 0', textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>{r.present}</td>
                                        <td style={{ padding: '12px 0', textAlign: 'right', color: r.percentage >= 75 ? '#50cc7f' : '#ff1b6b', fontWeight: 'bold' }}>{r.percentage}%</td>
                                    </tr>
                                ))}
                                {reports.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No data available.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Detailed Reports */}
                <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Detailed Reports</h3>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
                            {['Student', 'Teacher'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setDetailedReportType(type)}
                                    style={{
                                        background: detailedReportType === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: detailedReportType === type ? '#0ff0fc' : 'rgba(255,255,255,0.6)',
                                        border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: '0.2s'
                                    }}
                                >
                                    {type} View
                                </button>
                            ))}
                        </div>
                    </div>
                    {loading && detailedReports.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="spin" size={24} color="#0ff0fc" /></div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Name</th>
                                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Email</th>
                                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>{detailedReportType === 'Student' ? 'Total Classes' : 'Classes Marked'}</th>
                                    {detailedReportType === 'Student' && <th style={{ textAlign: 'right', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Attendance %</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {detailedReports.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px 0', color: '#fff' }}>{r.name}</td>
                                        <td style={{ padding: '12px 0', color: 'rgba(255,255,255,0.5)' }}>{r.email}</td>
                                        <td style={{ padding: '12px 0', textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>{detailedReportType === 'Student' ? r.totalClasses : r.totalSessionsMarked}</td>
                                        {detailedReportType === 'Student' && <td style={{ padding: '12px 0', textAlign: 'right', color: r.percentage >= 75 ? '#50cc7f' : '#ff1b6b', fontWeight: 'bold' }}>{r.percentage}%</td>}
                                    </tr>
                                ))}
                                {detailedReports.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No data available.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.2rem' }}>Recent Submissions & Approvals</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Course</th>
                                <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Teacher</th>
                                <th style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 0', color: '#fff', fontSize: '0.9rem' }}>{new Date(r.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{r.course?.name || 'N/A'}</td>
                                    <td style={{ padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{r.teacher?.name || 'N/A'}</td>
                                    <td style={{ padding: '12px 0', textAlign: 'center' }}>
                                        <span style={{ 
                                            background: r.approvalStatus === 'Approved' ? 'rgba(80,204,127,0.15)' : r.approvalStatus === 'Pending' ? 'rgba(255,152,0,0.15)' : 'rgba(255,27,107,0.15)', 
                                            color: r.approvalStatus === 'Approved' ? '#50cc7f' : r.approvalStatus === 'Pending' ? '#ff9800' : '#ff1b6b', 
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' 
                                        }}>
                                            {r.approvalStatus}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                        {r.approvalStatus === 'Pending' && attendanceSettings.requireApproval && (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleApprove(r._id, 'Approved')} style={{ background: 'rgba(80,204,127,0.2)', border: 'none', color: '#50cc7f', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Approve"><Check size={16} /></button>
                                                <button onClick={() => handleApprove(r._id, 'Rejected')} style={{ background: 'rgba(255,27,107,0.2)', border: 'none', color: '#ff1b6b', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Reject"><X size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSettings = () => {
        return (
            <div className="glass-panel-dash fade-in" style={{ padding: '2rem', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 1.5rem', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={20} color="#0ff0fc" /> Attendance Policy & Settings</h3>
                <form className="modal-form" onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                    
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.9rem' }}>Global Policy Description</label>
                        <textarea 
                            value={settingsForm.policyDescription} 
                            onChange={e => setSettingsForm({...settingsForm, policyDescription: e.target.value})}
                            style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', minHeight: '80px', resize: 'vertical' }}
                            placeholder="Describe the university attendance policy..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.9rem' }}>Minimum Required Attendance (%)</label>
                            <input 
                                type="number" min="0" max="100"
                                value={settingsForm.minimumPercentage} 
                                onChange={e => setSettingsForm({...settingsForm, minimumPercentage: parseInt(e.target.value)})}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.9rem' }}>Attendance Lock Date</label>
                            <input 
                                type="date"
                                value={settingsForm.lockDate} 
                                onChange={e => setSettingsForm({...settingsForm, lockDate: e.target.value})}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                            />
                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Attendance prior to this date cannot be modified.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={settingsForm.requireApproval}
                                onChange={e => setSettingsForm({...settingsForm, requireApproval: e.target.checked})}
                                style={{ width: '18px', height: '18px', accentColor: '#0ff0fc' }}
                            />
                            Require Admin Approval
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff1b6b', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={settingsForm.freezeAttendance}
                                onChange={e => setSettingsForm({...settingsForm, freezeAttendance: e.target.checked})}
                                style={{ width: '18px', height: '18px', accentColor: '#ff1b6b' }}
                            />
                            Emergency Freeze (Disable All Marking)
                        </label>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <button type="submit" disabled={loading} className="primary-btn">
                            {loading ? <Loader2 className="spin" size={18} /> : <Save size={18} />} Save Settings
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const renderTeacherView = () => {
        const isFrozen = attendanceSettings.freezeAttendance;
        const isLocked = attendanceSettings.lockDate && new Date(selectedDate) < new Date(attendanceSettings.lockDate);
        const isDisabled = isFrozen || isLocked;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {attendanceSettings.policyDescription && (
                    <div className="glass-panel-dash" style={{ padding: '1rem 1.5rem', borderRadius: '8px', borderLeft: '4px solid #0ff0fc', background: 'rgba(15,240,252,0.05)' }}>
                        <h4 style={{ margin: '0 0 4px', color: '#0ff0fc', fontSize: '0.9rem' }}>University Attendance Policy</h4>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{attendanceSettings.policyDescription} (Minimum req: {attendanceSettings.minimumPercentage}%)</p>
                    </div>
                )}

                {isFrozen && (
                    <div style={{ padding: '1rem', background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                        <AlertTriangle size={20} /> Attendance marking is currently frozen by administration.
                    </div>
                )}

                {isLocked && !isFrozen && (
                    <div style={{ padding: '1rem', background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                        <Clock size={20} /> The selected date is locked. You cannot modify attendance for past locked dates.
                    </div>
                )}

                <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Course / Section</label>
                        <select 
                            value={selectedOffering} 
                            onChange={e => setSelectedOffering(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                        >
                            <option value="">Select Class to Mark</option>
                            {myOfferings.map(o => (
                                <option key={o._id} value={o._id}>{o.course?.name} ({o.section?.name}) - {o.session?.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px', maxWidth: '200px' }}>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' }}>Date</label>
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                        />
                    </div>
                </div>

                {selectedOffering && attendanceList.length > 0 && (
                    <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', opacity: isDisabled ? 0.6 : 1, pointerEvents: isDisabled ? 'none' : 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Search student..." 
                                        value={searchStudent}
                                        onChange={e => setSearchStudent(e.target.value)}
                                        style={{ padding: '8px 12px 8px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', width: '250px' }} 
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleMarkAll('Present')} style={{ background: 'rgba(80,204,127,0.15)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Mark All Present</button>
                                <button onClick={() => handleMarkAll('Absent')} style={{ background: 'rgba(255,27,107,0.15)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>Mark All Absent</button>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Student</th>
                                    <th style={{ textAlign: 'center', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Attendance Status</th>
                                    <th style={{ textAlign: 'left', padding: '10px 0', color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85rem' }}>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.map((s) => (
                                    <tr key={s.student} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px 0' }}>
                                            <div style={{ color: '#fff', fontSize: '0.9rem' }}>{s.name}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{s.email}</div>
                                        </td>
                                        <td style={{ padding: '12px 0', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
                                                {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                                                    <button 
                                                        key={status}
                                                        onClick={() => handleStatusChange(s.student, status)}
                                                        style={{
                                                            background: s.status === status ? (status === 'Present' ? '#50cc7f' : status === 'Absent' ? '#ff1b6b' : status === 'Late' ? '#ff9800' : '#bc13fe') : 'transparent',
                                                            color: s.status === status ? '#000' : 'rgba(255,255,255,0.6)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '6px 12px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 0' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Add remark..." 
                                                value={s.remarks}
                                                onChange={e => handleRemarksChange(s.student, e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', alignItems: 'center', gap: '15px' }}>
                            {attendanceSettings.requireApproval && <span style={{ color: '#ff9800', fontSize: '0.85rem' }}>* Will be submitted for admin approval</span>}
                            <button 
                                onClick={handleSaveAttendance} 
                                disabled={loading || isDisabled}
                                className="primary-btn"
                            >
                                {loading ? <Loader2 className="spin" size={16} /> : <><Save size={16} /> Submit Attendance</>}
                            </button>
                        </div>
                    </div>
                )}
                
                {selectedOffering && attendanceList.length === 0 && !loading && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                        No students found enrolled in this section.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '10px', zIndex: 3000, color: '#fff', fontWeight: 600, background: toast.type === 'success' ? 'rgba(80,204,127,0.95)' : 'rgba(255,27,107,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <Clock size={28} color="#0ff0fc" /> Attendance Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>
                        {isUniversityAdmin ? 'Monitor university-wide attendance statistics and settings.' : 'Mark and manage attendance for your assigned classes.'}
                    </p>
                </div>
                {isUniversityAdmin && (
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
                        <button onClick={() => setActiveAdminTab('dashboard')} style={{ background: activeAdminTab === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeAdminTab === 'dashboard' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                            <BarChart2 size={16} /> Dashboard
                        </button>
                        <button onClick={() => setActiveAdminTab('analytics')} style={{ background: activeAdminTab === 'analytics' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeAdminTab === 'analytics' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                            <PieChart size={16} /> Analytics
                        </button>
                        <button onClick={() => setActiveAdminTab('monitoring')} style={{ background: activeAdminTab === 'monitoring' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeAdminTab === 'monitoring' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                            <Search size={16} /> Reports
                        </button>
                        <button onClick={() => setActiveAdminTab('alerts')} style={{ background: activeAdminTab === 'alerts' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeAdminTab === 'alerts' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                            <Bell size={16} /> Alerts
                        </button>
                        <button onClick={() => setActiveAdminTab('settings')} style={{ background: activeAdminTab === 'settings' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeAdminTab === 'settings' ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                            <Settings size={16} /> Settings
                        </button>
                    </div>
                )}
            </div>

            {isTeacher && renderTeacherView()}
            {isUniversityAdmin && activeAdminTab === 'dashboard' && renderAdminDashboard()}
            {isUniversityAdmin && activeAdminTab === 'analytics' && renderAnalytics()}
            {isUniversityAdmin && activeAdminTab === 'monitoring' && renderMonitoring()}
            {isUniversityAdmin && activeAdminTab === 'alerts' && renderAlerts()}
            {isUniversityAdmin && activeAdminTab === 'settings' && renderSettings()}

        </div>
    );
};

export default AttendanceManagement;
