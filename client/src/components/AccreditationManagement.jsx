import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    ShieldCheck, Building2, CheckCircle2, AlertCircle, Clock,
    Layers, Plus, Edit, Trash2, FileText, Download, Eye, Upload, Filter, Search, 
    BookOpen, Users, ClipboardList, Target, BarChart2, CheckSquare, CalendarCheck, ListTodo, FileBadge,
    Loader2
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const ACCREDITATION_BODIES = [
    { id: 'HEC',   name: 'Higher Education Commission (HEC)',                               color: '#0ff0fc' },
    { id: 'NCEAC', name: 'National Computing Education Accreditation Council (NCEAC)',      color: '#bc13fe' },
    { id: 'PEC',   name: 'Pakistan Engineering Council (PEC)',                              color: '#ff9800' },
];

const AI_FEATURES = [
    { title: 'Missing Evidence Detection',       desc: 'Auto-scans all criteria and flags undocumented gaps instantly.',              action: 'Scan Evidence' },
    { title: 'Accreditation Readiness Score',    desc: 'Predicts current readiness probability for upcoming visits.',                 action: 'Calculate Score' },
    { title: 'Missing Document Suggestions',     desc: 'Identifies missing policies or manuals required for compliance.',            action: 'Analyze Documents' },
    { title: 'Course File Quality Check',        desc: 'Evaluates the quality and completeness of submitted course files.',          action: 'Check Quality' },
    { title: 'Report Summary Generation',        desc: 'Creates instant AI-driven summaries of lengthy accreditation reports.',      action: 'Generate Summary' },
    { title: 'Compliance Suggestions',           desc: 'Provides actionable steps to resolve overdue compliance tasks.',             action: 'Get Suggestions' },
];

const REPORTS_LIST = [
    { title: 'Course File Report',     desc: 'Summary of all course file statuses across departments.' },
    { title: 'Missing Course Files',   desc: 'List of pending or incomplete course files requiring action.' },
    { title: 'Accreditation Report',   desc: 'Comprehensive accreditation readiness and status report.' },
    { title: 'SAR Report',             desc: 'Detailed Self Assessment Report metrics and findings.' },
    { title: 'Evidence Report',        desc: 'Inventory of all uploaded evidence and missing items.' },
    { title: 'Compliance Report',      desc: 'Tracking of compliance tasks, deadlines, and overdue items.' },
    { title: 'Document Report',        desc: 'Summary of central repository documents (Policies, SOPs, etc.).' },
];

export default function AccreditationManagement() {
    const [activeTab, setActiveTab]     = useState('dashboard');
    const [selectedBody, setSelectedBody] = useState('NCEAC');
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    // Real data from API
    const [accredStats, setAccredStats] = useState(null);
    const [courseFiles, setCourseFiles] = useState([]);
    const [obeSummary, setObeSummary]   = useState(null);
    const [loading, setLoading]         = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [accredRes, cfRes, obeRes] = await Promise.allSettled([
                    axios.get(`${API}/reports/accreditation`, { headers: hdrs }),
                    axios.get(`${API}/course-files`, { headers: hdrs }),
                    axios.get(`${API}/reports/obe`, { headers: hdrs }),
                ]);
                if (accredRes.status === 'fulfilled') setAccredStats(accredRes.value.data);
                if (cfRes.status === 'fulfilled')     setCourseFiles(cfRes.value.data || []);
                if (obeRes.status === 'fulfilled')    setObeSummary(obeRes.value.data);
            } catch (e) {
                console.error('Accreditation load error:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Derived stats from real data
    const totalCFs    = courseFiles.length;
    const approvedCFs = courseFiles.filter(f => f.status === 'Approved').length;
    const submittedCFs = courseFiles.filter(f => ['Submitted', 'Under Review'].includes(f.status)).length;
    const pendingCFs  = courseFiles.filter(f => ['Draft', 'Returned'].includes(f.status)).length;
    const readinessPct = totalCFs > 0 ? Math.round((approvedCFs / totalCFs) * 100) : 0;
    const cloCount   = accredStats?.obeStatus?.totalCLOs ?? 0;
    const ploCount   = accredStats?.obeStatus?.totalPLOs ?? 0;
    const mappingOK  = accredStats?.obeStatus?.mappingComplete;

    const tabBtn = (id, label, icon) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                background: activeTab === id ? 'rgba(33,150,243,0.15)' : 'transparent',
                color: activeTab === id ? '#0ff0fc' : 'rgba(255,255,255,0.6)',
                border: 'none', borderBottom: activeTab === id ? '2px solid #0ff0fc' : '2px solid transparent',
                cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s'
            }}
        >
            {icon} {label}
        </button>
    );

    const cfStatusColor = { Draft: '#0ff0fc', Submitted: '#bc13fe', 'Under Review': '#ff9800', Approved: '#50cc7f', Returned: '#ff1b6b', Archived: 'rgba(255,255,255,0.4)' };

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(33,150,243,0.2), rgba(188,19,254,0.2))', padding: '12px', borderRadius: '12px' }}>
                    <ShieldCheck size={28} color="#0ff0fc" />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Accreditation Management
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
                        Centralized repository and compliance tracking for accreditation bodies
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', overflowX: 'auto' }}>
                {tabBtn('dashboard',   'Dashboard',           <Layers size={16} />)}
                {tabBtn('bodies',      'Accreditation Bodies',<Building2 size={16} />)}
                {tabBtn('coursefiles', 'Course Files Status', <FileText size={16} />)}
                {tabBtn('obe',         'OBE Status',          <Target size={16} />)}
                {tabBtn('sar',         'SAR Generation',      <FileBadge size={16} />)}
                {tabBtn('reports',     'Reports',             <BarChart2 size={16} />)}
                {tabBtn('ai',          '✨ AI Insights',      <Target size={16} />)}
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 size={32} className="spinner" color="#0ff0fc" />
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>Loading accreditation data…</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* ── DASHBOARD TAB ── */}
                    {activeTab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #50cc7f' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Course File Readiness</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#50cc7f' }}>{readinessPct}%</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>{approvedCFs} of {totalCFs} files approved</div>
                                </div>
                                <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #0ff0fc' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Total CLOs</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ff0fc' }}>{cloCount}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>Course Learning Outcomes</div>
                                </div>
                                <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ff9800' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Pending Files</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff9800' }}>{pendingCFs}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>Draft or Returned — need action</div>
                                </div>
                                <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #bc13fe' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>OBE Mapping</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: mappingOK ? '#50cc7f' : '#ff9800', marginTop: '8px' }}>
                                        {mappingOK ? '✓ Complete' : '⚠ Incomplete'}
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>
                                        {accredStats?.obeStatus?.totalMappings ?? 0} question mappings
                                    </div>
                                </div>
                            </div>

                            {/* Overview table with real data */}
                            <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>OBE & Academic Overview</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                    {[
                                        { label: 'Total Students', value: accredStats?.overview?.totalStudents ?? '—', color: '#0ff0fc' },
                                        { label: 'Total Teachers', value: accredStats?.overview?.totalTeachers ?? '—', color: '#bc13fe' },
                                        { label: 'Student:Teacher Ratio', value: accredStats?.overview?.studentTeacherRatio ?? '—', color: '#ff9800' },
                                        { label: 'Total Programs', value: accredStats?.overview?.totalPrograms ?? '—', color: '#50cc7f' },
                                        { label: 'Total CLOs', value: cloCount, color: '#0ff0fc' },
                                        { label: 'Total PLOs', value: ploCount, color: '#bc13fe' },
                                    ].map(item => (
                                        <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '16px' }}>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '4px' }}>{item.label}</div>
                                            <div style={{ color: item.color, fontSize: '1.5rem', fontWeight: 'bold' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ACCREDITATION BODIES TAB ── */}
                    {activeTab === 'bodies' && (
                        <div className="glass-panel-dash" style={{ padding: '24px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>Supported Accreditation Bodies</h4>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {ACCREDITATION_BODIES.map(b => (
                                    <div key={b.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${b.color}30`, borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ background: `${b.color}20`, color: b.color, padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem', display: 'inline-block', marginBottom: '12px' }}>
                                            {b.id}
                                        </div>
                                        <div style={{ fontWeight: '600', marginBottom: '8px', lineHeight: '1.4', color: '#fff' }}>{b.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                            Accreditation compliance tracked in this system.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── COURSE FILES STATUS TAB ── */}
                    {activeTab === 'coursefiles' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Summary bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                {[
                                    { label: 'Approved', count: approvedCFs,  color: '#50cc7f' },
                                    { label: 'Under Review', count: submittedCFs, color: '#ff9800' },
                                    { label: 'Pending', count: pendingCFs,    color: '#ff1b6b' },
                                    { label: 'Total Files', count: totalCFs,  color: '#0ff0fc' },
                                ].map(s => (
                                    <div key={s.label} className="glass-panel-dash" style={{ padding: '16px', borderRadius: '10px', borderTop: `3px solid ${s.color}` }}>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '4px' }}>{s.label}</div>
                                        <div style={{ color: s.color, fontSize: '1.6rem', fontWeight: 'bold' }}>{s.count}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Course Files Table */}
                            <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 16px 0' }}>Course File Details</h4>
                                {courseFiles.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
                                        <FileText size={40} style={{ marginBottom: '8px' }} />
                                        <p>No course files found. Teachers must create course files for their assigned courses.</p>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table className="uni-table">
                                            <thead>
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Teacher</th>
                                                    <th>Status</th>
                                                    <th>Completeness</th>
                                                    <th>Last Updated</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {courseFiles.map(cf => (
                                                    <tr key={cf._id}>
                                                        <td><strong>{cf.courseOffering?.course?.code || cf.courseOffering?.course?.name || '—'}</strong></td>
                                                        <td>{cf.teacher?.name || '—'}</td>
                                                        <td>
                                                            <span style={{
                                                                background: `${cfStatusColor[cf.status] || '#fff'}18`,
                                                                color: cfStatusColor[cf.status] || '#fff',
                                                                border: `1px solid ${cfStatusColor[cf.status] || '#fff'}44`,
                                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700
                                                            }}>
                                                                {cf.status || 'Draft'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px' }}>
                                                                    <div style={{ width: `${cf.completeness || 0}%`, background: '#50cc7f', borderRadius: '4px', height: '100%' }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{cf.completeness || 0}%</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                            {cf.updatedAt ? new Date(cf.updatedAt).toLocaleDateString() : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── OBE STATUS TAB ── */}
                    {activeTab === 'obe' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {[
                                    { label: 'CLO Attainment (Avg)', value: obeSummary?.avgCloAchievement != null ? `${obeSummary.avgCloAchievement.toFixed(1)}%` : '—', color: '#0ff0fc' },
                                    { label: 'PLO Attainment (Avg)', value: obeSummary?.avgPloAchievement != null ? `${obeSummary.avgPloAchievement.toFixed(1)}%` : '—', color: '#bc13fe' },
                                    { label: 'Students Assessed',    value: obeSummary?.totalStudentsAssessed ?? '—', color: '#50cc7f' },
                                ].map(s => (
                                    <div key={s.label} className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', borderTop: `3px solid ${s.color}` }}>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '8px' }}>{s.label}</div>
                                        <div style={{ color: s.color, fontSize: '2rem', fontWeight: 'bold' }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            {obeSummary?.cloAttainment?.length > 0 && (
                                <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px' }}>
                                    <h4 style={{ margin: '0 0 16px 0' }}>CLO Attainment Detail</h4>
                                    <div className="table-container">
                                        <table className="uni-table">
                                            <thead>
                                                <tr>
                                                    <th>CLO</th>
                                                    <th>Name</th>
                                                    <th>Achieved</th>
                                                    <th>Target</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {obeSummary.cloAttainment.map((c, i) => (
                                                    <tr key={i}>
                                                        <td><strong>{c.name}</strong></td>
                                                        <td style={{ color: 'rgba(255,255,255,0.6)' }}>{c.fullName || '—'}</td>
                                                        <td style={{ color: c.achieved >= c.target ? '#50cc7f' : '#ff1b6b', fontWeight: 'bold' }}>{c.achieved?.toFixed(1)}%</td>
                                                        <td style={{ color: 'rgba(255,255,255,0.5)' }}>{c.target}%</td>
                                                        <td>
                                                            <span style={{
                                                                background: c.achieved >= c.target ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.15)',
                                                                color: c.achieved >= c.target ? '#50cc7f' : '#ff1b6b',
                                                                padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700
                                                            }}>
                                                                {c.achieved >= c.target ? 'Achieved' : 'Below Target'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {(!obeSummary?.cloAttainment || obeSummary.cloAttainment.length === 0) && (
                                <div className="glass-panel-dash" style={{ padding: '24px', borderRadius: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    <Target size={40} style={{ marginBottom: '8px' }} />
                                    <p>No OBE attainment data yet. Complete assessments and run the OBE Calculation Engine first.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SAR GENERATION TAB ── */}
                    {activeTab === 'sar' && (
                        <div className="glass-panel-dash" style={{ padding: '24px', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Self Assessment Report (SAR) Generation</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {[
                                    { title: 'Department SAR', icon: <Building2 size={24} />, desc: 'Generates a comprehensive SAR for the entire department covering all programs, facilities, and faculty.', color: '#2196f3' },
                                    { title: 'Program SAR',    icon: <BookOpen size={24} />,  desc: 'Generates a specific SAR for an individual degree program based on selected criteria.',              color: '#bc13fe' },
                                ].map(s => (
                                    <div key={s.title} style={{ background: `${s.color}10`, border: `1px solid ${s.color}30`, padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                                        <div style={{ background: `${s.color}25`, color: s.color, width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                            {s.icon}
                                        </div>
                                        <h4 style={{ margin: '0 0 8px 0' }}>{s.title}</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '20px' }}>{s.desc}</p>
                                        <button className="primary-btn">Generate {s.title}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── REPORTS TAB ── */}
                    {activeTab === 'reports' && (
                        <div className="glass-panel-dash" style={{ padding: '24px', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Accreditation &amp; Compliance Reports</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {REPORTS_LIST.map(report => (
                                    <div key={report.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <div style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', padding: '10px', borderRadius: '8px' }}>
                                                <BarChart2 size={20} />
                                            </div>
                                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '1.05rem' }}>{report.title}</div>
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.4' }}>{report.desc}</div>
                                        <button className="primary-btn"><Download size={14} /> Generate Report</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── AI INSIGHTS TAB ── */}
                    {activeTab === 'ai' && (
                        <div className="glass-panel-dash" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(188,19,254,0.3)', background: 'linear-gradient(180deg, rgba(188,19,254,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ AI Accreditation Assistant</h4>
                            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Leverage AI to automatically audit compliance and predict accreditation success.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {AI_FEATURES.map(ai => (
                                    <div key={ai.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe', padding: '10px', borderRadius: '8px' }}><Target size={20} /></div>
                                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '1rem' }}>{ai.title}</div>
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: '1.4' }}>{ai.desc}</div>
                                        <button className="primary-btn">{ai.action}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
