import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchSystemReports, fetchAcademicReports, fetchObeReports,
    fetchAttendanceReports, fetchMarksReports
} from '../store/reportsSlice';
import { FileText, Download, RefreshCw, BarChart2, BookOpen, Users, ClipboardList, Activity, Loader2 } from 'lucide-react';

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.2rem' };

const ReportCard = ({ title, value, sub, color = '#0ff0fc', icon: Icon }) => (
    <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ background: `rgba(${color === '#0ff0fc' ? '15,240,252' : color === '#bc13fe' ? '188,19,254' : '80,204,127'},0.1)`, padding: '12px', borderRadius: '10px' }}>
            <Icon size={22} color={color} />
        </div>
        <div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem' }}>{title}</p>
            <h3 style={{ margin: '2px 0', color: '#fff', fontSize: '1.4rem' }}>{value ?? '—'}</h3>
            {sub && <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{sub}</p>}
        </div>
    </div>
);

const ALL_TABS = [
    { id: 'system', label: 'System', icon: Activity, adminOnly: true },
    { id: 'academic', label: 'Academic', icon: BookOpen, adminOnly: false },
    { id: 'obe', label: 'OBE', icon: ClipboardList, adminOnly: false },
    { id: 'attendance', label: 'Attendance', icon: Users, adminOnly: false },
    { id: 'marks', label: 'Marks', icon: BarChart2, adminOnly: false },
];

const ReportsManagement = () => {
    const dispatch = useDispatch();
    const { data: systemReports, academic: academicReports, obe: obeReports,
        attendance: attendanceReports, marks: marksReports, loading, error } = useSelector(s => s.reports);
    const { user } = useSelector(s => s.auth);
    const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'UniversityAdmin';
    const TABS = ALL_TABS.filter(t => !t.adminOnly || isAdmin);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'system' : 'academic');
    const [academicSubTab, setAcademicSubTab] = useState('students');

    const fetchForTab = (tab) => {
        if (tab === 'system') dispatch(fetchSystemReports());
        else if (tab === 'academic') dispatch(fetchAcademicReports());
        else if (tab === 'obe') dispatch(fetchObeReports());
        else if (tab === 'attendance') dispatch(fetchAttendanceReports());
        else if (tab === 'marks') dispatch(fetchMarksReports());
    };

    useEffect(() => { fetchForTab(activeTab); }, [activeTab]);

    const renderArray = (data) => {
        if (!data || data.length === 0) return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                <FileText size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <p>No report data available</p>
            </div>
        );
        const keys = Object.keys(data[0]).filter(k => k !== '_id' && k !== '__v' && k !== 'id');
        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            {keys.map(k => (
                                <th key={k} style={{ padding: '10px 14px', textAlign: 'left', color: '#0ff0fc', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    {k.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                                {keys.map(k => (
                                    <td key={k} style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.85)' }}>
                                        {typeof row[k] === 'object' && row[k] !== null ? JSON.stringify(row[k]) : String(row[k] ?? '—')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderContent = () => {
        if (activeTab === 'system') {
            if (!systemReports) return <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}><p>No system report data</p></div>;
            const entries = Object.entries(systemReports);
            return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {entries.map(([k, v]) => (
                        <ReportCard key={k} title={k.replace(/([A-Z])/g, ' $1').trim()} value={String(v ?? '—')} icon={Activity} color="#0ff0fc" />
                    ))}
                </div>
            );
        }
        if (activeTab === 'academic') {
            const subTabs = ['students', 'teachers', 'courses', 'departments', 'programs'];
            return (
                <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {subTabs.map(t => (
                            <button key={t} onClick={() => setAcademicSubTab(t)}
                                style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: academicSubTab === t ? '#0ff0fc' : 'rgba(255,255,255,0.08)', color: academicSubTab === t ? '#000' : 'rgba(255,255,255,0.7)' }}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                    {renderArray(academicReports?.[academicSubTab])}
                </div>
            );
        }
        if (activeTab === 'obe') {
            if (!obeReports) return <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}><p>No OBE report data. Run OBE engine first.</p></div>;
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <ReportCard title="Avg CLO Attainment" value={`${obeReports.avgCloAchievement ?? 0}%`} icon={ClipboardList} color="#0ff0fc" />
                        <ReportCard title="Avg PLO Attainment" value={`${obeReports.avgPloAchievement ?? 0}%`} icon={ClipboardList} color="#bc13fe" />
                        <ReportCard title="Avg GA Attainment" value={`${obeReports.avgGaAchievement ?? 0}%`} icon={Activity} color="#f59e0b" />
                        <ReportCard title="Students Assessed" value={obeReports.totalStudentsAssessed ?? 0} icon={Users} color="#50cc7f" />
                    </div>
                    <h4 style={{ color: '#0ff0fc', marginBottom: '0.5rem' }}>PLO Attainment</h4>
                    {renderArray(obeReports.ploAttainment)}
                    <h4 style={{ color: '#50cc7f', marginBottom: '0.5rem', marginTop: '1.5rem' }}>CLO Attainment</h4>
                    {renderArray(obeReports.cloAttainment)}
                    <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem', marginTop: '1.5rem' }}>GA Attainment</h4>
                    {renderArray(obeReports.gaAttainment)}
                </div>
            );
        }
        if (activeTab === 'attendance') return renderArray(Array.isArray(attendanceReports) ? attendanceReports : attendanceReports?.data || []);
        if (activeTab === 'marks') return renderArray(Array.isArray(marksReports) ? marksReports : marksReports?.data || []);
        return null;
    };

    // dummy variable no longer needed
    const activeData = null; // kept to avoid removing return below

    return (
        <div style={{ padding: '1.5rem 0' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                        <FileText color="#0ff0fc" /> Reports Management
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.55)' }}>View and download system, academic, OBE, attendance and marks reports.</p>
                </div>
                <button onClick={() => fetchForTab(activeTab)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', fontWeight: 600 }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </header>

            {error && <div style={{ background: 'rgba(255,27,107,0.15)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#ff1b6b', marginBottom: '1rem' }}>{error}</div>}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', background: activeTab === tab.id ? 'linear-gradient(135deg,#0ff0fc,#bc13fe)' : 'rgba(255,255,255,0.06)', color: activeTab === tab.id ? '#000' : 'rgba(255,255,255,0.7)' }}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                        <Loader2 size={32} className="spinner" style={{ marginBottom: '1rem' }} />
                        <p>Loading reports...</p>
                    </div>
                ) : renderContent()}
            </div>
        </div>
    );
};

export default ReportsManagement;
