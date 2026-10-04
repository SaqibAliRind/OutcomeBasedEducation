import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActivityLogs } from '../store/logsSlice';
import { Activity, Search, Calendar, Monitor, Globe, ChevronLeft, ChevronRight, User, RefreshCw, AlertCircle } from 'lucide-react';
import '../style/Dashboard.css';

const ActivityLogs = () => {
    const dispatch = useDispatch();
    const { data: logs = [], loading, error, total, pages } = useSelector(s => s.logs.activity || {});

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        const params = { page, limit: 20 };
        if (searchTerm) params.search = searchTerm;
        if (filterRole) params.role = filterRole;
        if (filterModule) params.module = filterModule;
        if (filterDate) params.date = filterDate;
        dispatch(fetchActivityLogs(params));
    }, [dispatch, page, searchTerm, filterRole, filterModule, filterDate]);

    useEffect(() => { load(); }, [load]);

    const getStatusColor = (status) => {
        if (status === 'Success') return '#50cc7f';
        if (status === 'Failed') return '#ff1b6b';
        return '#ffcc00';
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Activity size={28} color="#0ff0fc" />
                        Activity Logs
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        Track all user activities within your university. Total: <strong style={{ color: '#0ff0fc' }}>{total}</strong>
                    </p>
                </div>
                <button onClick={load} style={{ padding: '8px 16px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="glass-panel-dash" style={{ display: 'flex', gap: '12px', padding: '16px', borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input type="text" placeholder="Search by user or action..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                    <option value="">All Roles</option>
                    <option>Dean</option><option>HOD</option><option>Teacher</option><option>Student</option><option>UniversityAdmin</option>
                </select>
                <select value={filterModule} onChange={e => { setFilterModule(e.target.value); setPage(1); }} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}>
                    <option value="">All Modules</option>
                    <option>Curriculum</option><option>Grades</option><option>Course Registration</option><option>Workflow</option><option>Attendance</option>
                </select>
                <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }} style={{ padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '12px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: '#ff1b6b', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: 8 }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="glass-panel-dash" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '16px' }}>User & Role</th>
                                <th style={{ padding: '16px' }}>Module</th>
                                <th style={{ padding: '16px' }}>Action</th>
                                <th style={{ padding: '16px' }}>Date & Time</th>
                                <th style={{ padding: '16px' }}>Network / Device</th>
                                <th style={{ padding: '16px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#0ff0fc' }}>Loading activity logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No activity logs found.</td></tr>
                            ) : logs.map(log => (
                                <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#0ff0fc" /></div>
                                            <div>
                                                <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{log.user || 'N/A'}</div>
                                                <div style={{ color: '#bc13fe', fontSize: '0.75rem' }}>{log.role || '—'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{log.module || '—'}</td>
                                    <td style={{ padding: '16px', color: '#fff', fontSize: '0.85rem' }}>{log.action || '—'}</td>
                                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                        <div>{new Date(log.timestamp || log.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={12} /> {log.ipAddress || '—'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}><Monitor size={12} /> {log.device || '—'} / {log.browser || '—'}</div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: `${getStatusColor(log.status)}20`, color: getStatusColor(log.status) }}>
                                            {log.status || 'Success'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Page {page} of {pages} — {total} total entries</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={14} /></button>
                        {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', background: page === p ? 'rgba(15,240,252,0.15)' : 'rgba(255,255,255,0.05)', border: page === p ? '1px solid #0ff0fc' : 'none', borderRadius: '6px', color: page === p ? '#0ff0fc' : '#fff', cursor: 'pointer' }}>{p}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: page === pages ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page === pages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;
