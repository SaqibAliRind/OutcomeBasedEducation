import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FileBadge, Search, Filter, Download, CheckCircle2, Lock, Unlock, RefreshCcw, Send, TrendingUp, TrendingDown, Users, Award, BookX, BookOpenCheck, BarChart3, Medal, Loader2, AlertCircle } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/results`;

const StatusBadge = ({ status }) => {
    const colors = {
        Passed:   { bg: 'rgba(80,204,127,0.15)',  color: '#50cc7f', border: 'rgba(80,204,127,0.3)' },
        Failed:   { bg: 'rgba(255,27,107,0.15)',  color: '#ff1b6b', border: 'rgba(255,27,107,0.3)' },
        Probation:{ bg: 'rgba(255,152,0,0.15)',   color: '#ff9800', border: 'rgba(255,152,0,0.3)' },
    };
    const c = colors[status] || colors.Passed;
    return (
        <span style={{ color: c.color, border: `1px solid ${c.border}`, background: c.bg, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
            {status}
        </span>
    );
};

const CategoryBadge = ({ category }) => {
    const colors = {
        University: { bg: 'rgba(188,19,254,0.15)', color: '#bc13fe' },
        Department: { bg: 'rgba(15,240,252,0.15)', color: '#0ff0fc' },
        Program:    { bg: 'rgba(80,204,127,0.15)', color: '#50cc7f' },
    };
    const c = colors[category] || colors.Program;
    return (
        <span style={{ ...c, padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
            {category}
        </span>
    );
};

const ResultProcessing = () => {
    const { token } = useSelector(state => state.auth);
    const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    const [activeTab, setActiveTab]     = useState('summary');
    const [resultStatus, setResultStatus] = useState('Draft');
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm]   = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [sessionFilter, setSessionFilter]   = useState('');

    // Filter options
    const [filterOptions, setFilterOptions] = useState({ sessions: [], semesters: [] });

    // Data states
    const [summary, setSummary]         = useState(null);
    const [semResults, setSemResults]   = useState([]);
    const [meritList, setMeritList]     = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);

    // Pagination
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);

    const fetchFilters = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/filters`, cfg);
            setFilterOptions(data);
        } catch {}
    }, [token]);

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (semesterFilter) params.semester = semesterFilter;
            if (sessionFilter)  params.session  = sessionFilter;
            const { data } = await axios.get(`${API}/summary`, { ...cfg, params });
            setSummary(data);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [token, semesterFilter, sessionFilter]);

    const fetchSemResults = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit: 50 };
            if (semesterFilter) params.semester = semesterFilter;
            if (sessionFilter)  params.session  = sessionFilter;
            if (searchTerm)     params.search   = searchTerm;
            const { data } = await axios.get(`${API}/semester`, { ...cfg, params });
            setSemResults(data.results || []);
            setTotalPages(data.pages || 1);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [token, page, semesterFilter, sessionFilter, searchTerm]);

    const fetchMerit = useCallback(async () => {
        try {
            setLoading(true);
            const params = { topN: 30 };
            if (semesterFilter) params.semester = semesterFilter;
            if (sessionFilter)  params.session  = sessionFilter;
            const { data } = await axios.get(`${API}/merit`, { ...cfg, params });
            setMeritList(data.meritList || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [token, semesterFilter, sessionFilter]);

    useEffect(() => { fetchFilters(); }, [fetchFilters]);
    useEffect(() => {
        if (activeTab === 'summary')  fetchSummary();
        if (activeTab === 'semester') fetchSemResults();
        if (activeTab === 'merit')    fetchMerit();
    }, [activeTab, semesterFilter, sessionFilter, fetchSummary, fetchSemResults, fetchMerit]);

    const handleAction = (action, newStatus) => {
        if (window.confirm(`Are you sure you want to ${action} results?`)) {
            setIsGenerating(true);
            setTimeout(() => {
                setIsGenerating(false);
                if (newStatus) setResultStatus(newStatus);
            }, 1500);
        }
    };

    const handleRecalculate = () => {
        setIsGenerating(true);
        if (activeTab === 'summary')  fetchSummary().finally(() => setIsGenerating(false));
        if (activeTab === 'semester') fetchSemResults().finally(() => setIsGenerating(false));
        if (activeTab === 'merit')    fetchMerit().finally(() => setIsGenerating(false));
    };

    return (
        <div className="" style={{ padding: '20px' }}>
            {error && (
                <div style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff1b6b' }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(188,19,254,0.1)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(188,19,254,0.2)' }}>
                        <FileBadge size={30} color="#bc13fe" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #bc13fe, #0ff0fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Result Processing
                        </h1>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Generate, analyze, and publish semester results & merit lists
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="filter-select" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} style={{ minWidth: 140 }}>
                        <option value="">All Sessions</option>
                        {filterOptions.sessions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="filter-select" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} style={{ minWidth: 160 }}>
                        <option value="">All Semesters</option>
                        {filterOptions.semesters.map((s, i) => {
                            const val = typeof s === 'string' ? s : s._id;
                            const label = typeof s === 'string' ? s : s.name;
                            return <option key={val || i} value={val}>{label}</option>;
                        })}
                    </select>
                </div>

                {/* Operations Toolbar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px', paddingRight: '15px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginRight: '8px' }}>Status:</span>
                        <span style={{ 
                            background: resultStatus === 'Published' ? 'rgba(80,204,127,0.2)' : resultStatus === 'Locked' ? 'rgba(255,27,107,0.2)' : 'rgba(255,204,0,0.2)',
                            color: resultStatus === 'Published' ? '#50cc7f' : resultStatus === 'Locked' ? '#ff1b6b' : '#ffcc00',
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700'
                        }}>{resultStatus}</span>
                    </div>

                    <button onClick={handleRecalculate} disabled={isGenerating || resultStatus === 'Locked'}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <RefreshCcw size={14} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} /> Recalculate
                    </button>
                    
                    {resultStatus !== 'Published' && resultStatus !== 'Locked' && (
                        <button onClick={() => handleAction('Publish', 'Published')} disabled={isGenerating}
                            style={{ background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', color: '#0ff0fc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            <Send size={14} /> Publish Results
                        </button>
                    )}
                    {resultStatus === 'Published' && (
                        <button onClick={() => handleAction('Lock', 'Locked')} disabled={isGenerating}
                            style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: '#ff1b6b', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            <Lock size={14} /> Lock Results
                        </button>
                    )}
                    {resultStatus === 'Locked' && (
                        <button onClick={() => handleAction('Unlock', 'Published')} disabled={isGenerating}
                            style={{ background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', color: '#ffcc00', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            <Unlock size={14} /> Unlock Results
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-wrapper">
                <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                    <BarChart3 size={16} /> Result Summary
                </button>
                <button className={`tab-btn ${activeTab === 'semester' ? 'active' : ''}`} onClick={() => setActiveTab('semester')}>
                    <Users size={16} /> Semester Results
                </button>
                <button className={`tab-btn ${activeTab === 'merit' ? 'active' : ''}`} onClick={() => setActiveTab('merit')}>
                    <Medal size={16} /> Merit List
                </button>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 size={36} color="#bc13fe" className="spinner" />
                </div>
            )}

            {!loading && (
                <>
                    {/* ═══════════════════ SUMMARY TAB ═══════════════════ */}
                    {activeTab === 'summary' && (
                        <div className="fade-in">
                            {!summary || summary.totalStudents === 0 ? (
                                <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    <BookX size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <p>No result data found. Add enrollments and marks to generate results.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                    <div style={{ background: 'linear-gradient(145deg, rgba(80,204,127,0.1), rgba(80,204,127,0.02))', border: '1px solid rgba(80,204,127,0.2)', padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Passed</p>
                                                <h2 style={{ margin: '8px 0', fontSize: '2.5rem', color: '#50cc7f', fontWeight: '800' }}>{summary.totalPassed}</h2>
                                            </div>
                                            <div style={{ background: 'rgba(80,204,127,0.15)', padding: '12px', borderRadius: '12px' }}><CheckCircle2 size={24} color="#50cc7f" /></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#50cc7f', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <TrendingUp size={14} /> {summary.passPercentage}% Pass Rate
                                        </div>
                                    </div>

                                    <div style={{ background: 'linear-gradient(145deg, rgba(255,27,107,0.1), rgba(255,27,107,0.02))', border: '1px solid rgba(255,27,107,0.2)', padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Failed</p>
                                                <h2 style={{ margin: '8px 0', fontSize: '2.5rem', color: '#ff1b6b', fontWeight: '800' }}>{summary.totalFailed}</h2>
                                            </div>
                                            <div style={{ background: 'rgba(255,27,107,0.15)', padding: '12px', borderRadius: '12px' }}><BookX size={24} color="#ff1b6b" /></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff1b6b', fontSize: '0.85rem', fontWeight: '600' }}>
                                            <TrendingDown size={14} /> {summary.failPercentage}% Fail Rate
                                        </div>
                                    </div>

                                    <div style={{ background: 'linear-gradient(145deg, rgba(15,240,252,0.1), rgba(15,240,252,0.02))', border: '1px solid rgba(15,240,252,0.2)', padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Highest GPA</p>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', margin: '8px 0' }}>
                                                    <div><span style={{ fontSize: '2rem', color: '#0ff0fc', fontWeight: '800' }}>{summary.highestGpa?.toFixed(2)}</span></div>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(15,240,252,0.15)', padding: '12px', borderRadius: '12px' }}><Award size={24} color="#0ff0fc" /></div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'linear-gradient(145deg, rgba(188,19,254,0.1), rgba(188,19,254,0.02))', border: '1px solid rgba(188,19,254,0.2)', padding: '24px', borderRadius: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Performers</p>
                                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#bc13fe' }}>DEPT</span>
                                                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>{summary.topDepartment}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#bc13fe' }}>PROG</span>
                                                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>{summary.topProgram}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(188,19,254,0.15)', padding: '12px', borderRadius: '12px' }}><BookOpenCheck size={24} color="#bc13fe" /></div>
                                        </div>
                                        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                            {summary.totalStudents} total students evaluated
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════ SEMESTER RESULTS TAB ═══════════════════ */}
                    {activeTab === 'semester' && (
                        <div className="fade-in">
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', minWidth: 280 }}>
                                        <Search size={18} color="rgba(255,255,255,0.4)" />
                                        <input type="text" placeholder="Search by ID or Name..." value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            style={{ background: 'none', border: 'none', color: '#fff', padding: '0 10px', width: '100%', outline: 'none' }}
                                            onKeyDown={e => e.key === 'Enter' && fetchSemResults()}
                                        />
                                    </div>
                                    <button onClick={fetchSemResults}
                                        style={{ background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.2)', color: '#0ff0fc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                        <Filter size={16} /> Apply
                                    </button>
                                </div>

                                {semResults.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                        <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No results found. Add student enrollments and mark records first.</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    {['Student', 'Program', 'CGPA', 'Credit Hrs', 'Failed Courses', 'Status'].map(h => (
                                                        <th key={h} style={{ padding: '15px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {semResults.map((student, idx) => (
                                                    <tr key={student._id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td style={{ padding: '15px 20px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ color: '#fff', fontWeight: '600' }}>{student.name}</span>
                                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{student.id}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '15px 20px', color: 'rgba(255,255,255,0.7)' }}>{student.program || '—'}</td>
                                                        <td style={{ padding: '15px 20px' }}>
                                                            <span style={{ color: '#0ff0fc', fontWeight: '800', fontSize: '1.1rem' }}>{student.cgpa?.toFixed(2)}</span>
                                                        </td>
                                                        <td style={{ padding: '15px 20px', color: 'rgba(255,255,255,0.7)' }}>{student.credits}</td>
                                                        <td style={{ padding: '15px 20px' }}>
                                                            {student.failed > 0 ? (
                                                                <span style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700' }}>{student.failed} Courses</span>
                                                            ) : (
                                                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>—</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '15px 20px' }}>
                                                            <StatusBadge status={student.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setPage(p)}
                                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: p === page ? 'rgba(188,19,254,0.2)' : 'transparent', color: p === page ? '#bc13fe' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 600 }}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════ MERIT LIST TAB ═══════════════════ */}
                    {activeTab === 'merit' && (
                        <div className="fade-in">
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                                {meritList.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                        <Medal size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                        <p>No merit list data available. Students must pass all courses to appear in the merit list.</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                {['Rank', 'Student', 'Program', 'CGPA', 'Category'].map(h => (
                                                    <th key={h} style={{ padding: '15px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {meritList.map((entry, idx) => (
                                                <tr key={entry._id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <span style={{
                                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: '800', fontSize: '0.9rem',
                                                            background: entry.rank === 1 ? 'rgba(255,204,0,0.2)' : entry.rank === 2 ? 'rgba(192,192,192,0.2)' : entry.rank === 3 ? 'rgba(205,127,50,0.2)' : 'rgba(255,255,255,0.05)',
                                                            color: entry.rank === 1 ? '#ffcc00' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.5)',
                                                        }}>{entry.rank}</span>
                                                    </td>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ color: '#fff', fontWeight: '600' }}>{entry.name}</span>
                                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{entry.id}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px 20px', color: 'rgba(255,255,255,0.7)' }}>{entry.program || '—'}</td>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <span style={{ color: '#0ff0fc', fontWeight: '800', fontSize: '1.1rem' }}>{entry.cgpa?.toFixed(2)}</span>
                                                    </td>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <CategoryBadge category={entry.category} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ResultProcessing;
