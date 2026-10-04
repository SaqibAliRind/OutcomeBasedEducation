import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLogs } from '../store/logsSlice';
import { ClipboardList, Search, Calendar, ChevronLeft, ChevronRight, Eye, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import '../style/Dashboard.css';

const ACTION_COLORS = {
    CREATE: '#50cc7f',
    UPDATE: '#0ff0fc',
    DELETE: '#ff1b6b'
};

const AuditLogs = () => {
    const dispatch = useDispatch();
    const { data: logs = [], loading, error, total, pages } = useSelector(s => s.logs.audit || {});

    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [entityType, setEntityType] = useState('');
    const [page, setPage] = useState(1);
    const [viewDetails, setViewDetails] = useState(null);

    const load = () => {
        const params = { page, limit: 20 };
        if (searchTerm) params.search = searchTerm;
        if (filterDate) params.date = filterDate;
        if (entityType) params.entityType = entityType;
        dispatch(fetchAuditLogs(params));
    };

    useEffect(() => { load(); }, [page, filterDate, entityType]);

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ClipboardList size={28} color="#bc13fe" />
                        Granular Audit Trail
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        Immutable record of all entity-level changes. Total: <strong style={{ color: '#bc13fe' }}>{total}</strong>
                    </p>
                </div>
                <button onClick={load} style={{ padding: '8px 16px', background: 'rgba(188,19,254,0.1)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#bc13fe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="glass-panel-dash" style={{ display: 'flex', gap: '12px', padding: '16px', borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input type="text" placeholder="Search entity type or action..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && load()}
                        style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
                <div style={{ position: 'relative' }}>
                    <Filter size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', appearance: 'none', cursor: 'pointer' }}>
                        <option value="">All Entities</option>
                        <option value="Mark">Mark</option>
                        <option value="Assessment">Assessment</option>
                        <option value="CLO">CLO</option>
                    </select>
                </div>
                <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }}
                        style={{ padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
            </div>

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
                                <th style={{ padding: '16px' }}>Entity</th>
                                <th style={{ padding: '16px' }}>Action</th>
                                <th style={{ padding: '16px' }}>Fields Changed</th>
                                <th style={{ padding: '16px' }}>Performed By</th>
                                <th style={{ padding: '16px' }}>Date & Time</th>
                                <th style={{ padding: '16px' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#bc13fe' }}>Loading audit trail...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No audit records yet. Changes to Marks, Assessments, and CLOs will appear here.</td></tr>
                            ) : logs.map(log => {
                                const changedFields = Object.keys(log.changes || {}).join(', ') || '—';
                                const actionColor = ACTION_COLORS[log.action] || '#fff';
                                return (
                                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{log.entityType}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontFamily: 'monospace' }}>…{String(log.entityId).slice(-8)}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: '20px', background: `${actionColor}20`, border: `1px solid ${actionColor}50`, color: actionColor, fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#0ff0fc', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{changedFields}</td>
                                        <td style={{ padding: '16px', color: '#fff', fontSize: '0.85rem' }}>
                                            <div>{log.performedBy?.name || 'System'}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{log.performedBy?.role || ''}</div>
                                        </td>
                                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                            <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <button onClick={() => setViewDetails(log)} style={{ padding: '6px 12px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '6px', color: '#0ff0fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Page {page} of {pages || 1} — {total} total</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: Math.min(5, pages || 1) }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                style={{ padding: '6px 12px', background: page === p ? 'rgba(188,19,254,0.15)' : 'rgba(255,255,255,0.05)', border: page === p ? '1px solid #bc13fe' : 'none', borderRadius: '6px', color: page === p ? '#bc13fe' : '#fff', cursor: 'pointer' }}>
                                {p}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages || !pages}
                            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: (page === pages || !pages) ? 'rgba(255,255,255,0.2)' : '#fff', cursor: (page === pages || !pages) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {viewDetails && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash fade-in" style={{ width: '560px', maxHeight: '80vh', overflowY: 'auto', padding: '24px', borderRadius: '16px' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={20} /> Change Details</h3>
                        <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                            {[
                                { label: 'Entity Type', value: viewDetails.entityType },
                                { label: 'Entity ID', value: String(viewDetails.entityId), color: '#0ff0fc' },
                                { label: 'Action', value: viewDetails.action, color: ACTION_COLORS[viewDetails.action] },
                                { label: 'Performed By', value: `${viewDetails.performedBy?.name || 'System'} (${viewDetails.performedBy?.role || 'N/A'})` },
                                { label: 'Timestamp', value: new Date(viewDetails.timestamp).toLocaleString() },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{row.label}:</span>
                                    <span style={{ color: row.color || '#fff', fontWeight: 'bold', fontFamily: row.label === 'Entity ID' ? 'monospace' : 'inherit', fontSize: '0.85rem' }}>{row.value || '—'}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Field Changes</div>
                            {Object.entries(viewDetails.changes || {}).length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No field-level changes recorded.</div>
                            ) : Object.entries(viewDetails.changes).map(([field, val]) => (
                                <div key={field} style={{ marginBottom: '12px' }}>
                                    <div style={{ color: '#0ff0fc', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px' }}>{field}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.2)', borderRadius: '6px', color: '#ff1b6b', fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>OLD</div>
                                            {typeof val?.old === 'object' ? JSON.stringify(val?.old) : String(val?.old ?? '—')}
                                        </div>
                                        <div style={{ padding: '8px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.2)', borderRadius: '6px', color: '#50cc7f', fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '2px' }}>NEW</div>
                                            {typeof val?.new === 'object' ? JSON.stringify(val?.new) : String(val?.new ?? '—')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setViewDetails(null)} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
