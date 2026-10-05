import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLogs, clearOldLogs, clearLogMessages } from '../../store/logsSlice';
import { Activity, Search, FileText, AlertTriangle, Trash2, RefreshCw, Loader2, Eye } from 'lucide-react';

const TABS = [
    { id: 'activity', label: 'Activity Logs', icon: Activity,      color: '#0ff0fc' },
    { id: 'audit',    label: 'Audit Logs',    icon: FileText,      color: '#bc13fe' },
    { id: 'error',    label: 'Error Logs',    icon: AlertTriangle, color: '#ff1b6b' },
];

const fmt = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') {
        try { return JSON.stringify(val, null, 2); }
        catch { return String(val); }
    }
    return String(val);
};

const LogsPanel = () => {
    const dispatch = useDispatch();
    const { logs, loading, error, successMessage } = useSelector(s => s.logs);

    const [activeTab, setActiveTab] = useState('activity');
    const [search, setSearch] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        dispatch(fetchLogs(activeTab));
        setSearch('');
        setExpandedRow(null);
    }, [activeTab, dispatch]);

    useEffect(() => {
        if (successMessage || error) {
            const t = setTimeout(() => dispatch(clearLogMessages()), 4000);
            return () => clearTimeout(t);
        }
    }, [successMessage, error, dispatch]);

    const handleRefresh = () => dispatch(fetchLogs(activeTab));

    const handleClearOld = () => {
        if (window.confirm('Delete all logs older than 30 days?')) {
            dispatch(clearOldLogs()).then(() => dispatch(fetchLogs(activeTab)));
        }
    };

    const safeLogs = Array.isArray(logs) ? logs : (logs?.data || []);
    const filtered = safeLogs.filter(log => {
        const q = search.toLowerCase();
        if (!q) return true;
        if (activeTab === 'activity')
            return [log.user, log.module, log.action, log.ipAddress].some(v => String(v || '').toLowerCase().includes(q));
        if (activeTab === 'audit')
            return [log.changedBy, fmt(log.oldValue), fmt(log.newValue)].some(v => v.toLowerCase().includes(q));
        if (activeTab === 'error')
            return [log.errorCode, log.errorMessage, log.stackTrace].some(v => String(v || '').toLowerCase().includes(q));
        return true;
    });

    const headerStyle = { padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };
    const cellStyle = { padding: '12px 14px', fontSize: '0.88rem', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#ddd', verticalAlign: 'top' };
    const codePre = { fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '8px 10px', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#bc13fe', margin: 0 };

    return (
        <div className="user-management">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0ff0fc', fontSize: '1.4rem' }}>System Logs</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Monitor activity, audit trails, and error diagnostics</p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button className="cancel-btn" onClick={handleRefresh} title="Refresh" style={{ padding: '8px 14px' }}>
                        <RefreshCw size={15} />
                    </button>
                    <button className="cancel-btn" onClick={handleClearOld} title="Clear logs older than 30 days"
                        style={{ padding: '8px 14px', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}>
                        <Trash2 size={15} /> Clear Old
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {error          && <div className="um-alert error"   style={{ marginBottom: '1rem' }}>{error}</div>}
            {successMessage && <div className="um-alert success" style={{ marginBottom: '1rem' }}>{successMessage}</div>}

            {/* Tab row */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
                                borderRadius: 8, border: `1px solid ${active ? tab.color : 'rgba(255,255,255,0.1)'}`,
                                background: active ? `${tab.color}18` : 'transparent',
                                color: active ? tab.color : 'rgba(255,255,255,0.55)',
                                cursor: 'pointer', fontWeight: active ? 700 : 400,
                                fontSize: '0.9rem', transition: 'all 0.2s'
                            }}>
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        className="search-input"
                        style={{ paddingLeft: 36 }}
                        placeholder={`Search ${activeTab} logs…`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="table-container glass-panel-dash" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader2 className="spinner-large" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
                        No {activeTab} logs found.
                    </div>
                ) : (
                    <table className="uni-table" style={{ minWidth: 800 }}>
                        {/* ─── Activity Logs ─── */}
                        {activeTab === 'activity' && (
                            <>
                                <thead>
                                    <tr>
                                        {['User', 'Module', 'Action', 'Date', 'Time', 'IP Address'].map(h => (
                                            <th key={h} style={headerStyle}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((log, i) => {
                                        const d = new Date(log.timestamp);
                                        return (
                                            <tr key={log._id || i}>
                                                <td style={cellStyle}><strong style={{ color: '#0ff0fc' }}>{log.user || '—'}</strong></td>
                                                <td style={cellStyle}><span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem' }}>{log.module || '—'}</span></td>
                                                <td style={cellStyle}><span style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', padding: '2px 8px', borderRadius: 4, fontSize: '0.82rem', fontWeight: 600 }}>{log.action || '—'}</span></td>
                                                <td style={cellStyle}>{d.toLocaleDateString()}</td>
                                                <td style={cellStyle}>{d.toLocaleTimeString()}</td>
                                                <td style={cellStyle}><code style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>{log.ipAddress || '—'}</code></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </>
                        )}

                        {/* ─── Audit Logs ─── */}
                        {activeTab === 'audit' && (
                            <>
                                <thead>
                                    <tr>
                                        {['Changed By', 'Changed Date', 'Old Value', 'New Value'].map(h => (
                                            <th key={h} style={headerStyle}>{h}</th>
                                        ))}
                                        <th style={headerStyle}>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((log, i) => {
                                        const expanded = expandedRow === (log._id || i);
                                        return (
                                            <React.Fragment key={log._id || i}>
                                                <tr>
                                                    <td style={cellStyle}><strong style={{ color: '#bc13fe' }}>{log.changedBy || '—'}</strong></td>
                                                    <td style={cellStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td style={{ ...cellStyle, maxWidth: 200 }}><div style={{ maxHeight: 60, overflow: 'hidden', color: 'rgba(255,107,107,0.9)', fontSize: '0.83rem' }}>{fmt(log.oldValue)}</div></td>
                                                    <td style={{ ...cellStyle, maxWidth: 200 }}><div style={{ maxHeight: 60, overflow: 'hidden', color: 'rgba(80,204,127,0.9)', fontSize: '0.83rem' }}>{fmt(log.newValue)}</div></td>
                                                    <td style={cellStyle}>
                                                        <button onClick={() => setExpandedRow(expanded ? null : (log._id || i))}
                                                            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Eye size={13} /> {expanded ? 'Hide' : 'Expand'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expanded && (
                                                    <tr>
                                                        <td colSpan={5} style={{ ...cellStyle, background: 'rgba(0,0,0,0.25)' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                                <div>
                                                                    <div style={{ color: 'rgba(255,107,107,0.7)', fontSize: '0.78rem', marginBottom: 4, fontWeight: 600 }}>OLD VALUE</div>
                                                                    <pre style={codePre}>{fmt(log.oldValue)}</pre>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: 'rgba(80,204,127,0.7)', fontSize: '0.78rem', marginBottom: 4, fontWeight: 600 }}>NEW VALUE</div>
                                                                    <pre style={{ ...codePre, color: '#50cc7f' }}>{fmt(log.newValue)}</pre>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </>
                        )}

                        {/* ─── Error Logs ─── */}
                        {activeTab === 'error' && (
                            <>
                                <thead>
                                    <tr>
                                        {['Error Code', 'Error Message', 'Date', 'Stack Trace'].map(h => (
                                            <th key={h} style={headerStyle}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((log, i) => {
                                        const expanded = expandedRow === (log._id || i);
                                        return (
                                            <React.Fragment key={log._id || i}>
                                                <tr>
                                                    <td style={cellStyle}><code style={{ color: '#ff1b6b', fontSize: '0.85rem' }}>{log.errorCode || '—'}</code></td>
                                                    <td style={{ ...cellStyle, maxWidth: 300 }}><span style={{ color: '#ffcc00' }}>{log.errorMessage || '—'}</span></td>
                                                    <td style={cellStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td style={cellStyle}>
                                                        {log.stackTrace ? (
                                                            <button onClick={() => setExpandedRow(expanded ? null : (log._id || i))}
                                                                style={{ background: 'none', border: '1px solid rgba(255,27,107,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ff6b6b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Eye size={13} /> {expanded ? 'Hide Trace' : 'View Trace'}
                                                            </button>
                                                        ) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                                                    </td>
                                                </tr>
                                                {expanded && log.stackTrace && (
                                                    <tr>
                                                        <td colSpan={4} style={{ ...cellStyle, background: 'rgba(0,0,0,0.3)' }}>
                                                            <pre style={{ ...codePre, color: '#ff6b6b', maxHeight: 200 }}>{log.stackTrace}</pre>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </>
                        )}
                    </table>
                )}
            </div>

            <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', textAlign: 'right' }}>
                Showing {filtered.length} of {safeLogs.length} {activeTab} logs (max 200)
            </div>
        </div>
    );
};

export default LogsPanel;
