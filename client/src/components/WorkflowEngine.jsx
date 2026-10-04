/**
 * WorkflowEngine — Generic Reusable Approval Component
 *
 * Usage from any module:
 *   <WorkflowEngine module="Blueprint" referenceId={blueprint._id} referenceModel="Blueprint" />
 *   <WorkflowEngine module="Course File" referenceId={courseFile._id} />
 *   <WorkflowEngine module="Rubrics" />  ← standalone usage (without linking a doc)
 *
 * Props:
 *   module         (string, required) — e.g. "Course Outline", "Blueprint", "Marks Submission"
 *   referenceId    (string, optional) — MongoDB ObjectId of the linked document
 *   referenceModel (string, optional) — Model name for the linked document
 *   metadata       (object, optional) — { department, program, course, session, semester }
 *   approvalChain  (array,  optional) — Custom chain, defaults to standard university chain
 *   embedded       (bool,   optional) — If true, renders compact without full page header
 *   onSuccess      (func,   optional) — Callback after submit/action
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchWorkflowRequests,
    fetchWorkflowStats,
    submitWorkflowRequest,
    actionWorkflowRequest,
    deleteWorkflowRequest,
    clearWorkflowMessages
} from '../store/workflowSlice';
import {
    GitMerge, CheckCircle, XCircle, RefreshCw, Send,
    Plus, Clock, Activity, ChevronDown, ChevronUp,
    AlertTriangle, Trash2, Eye, FileText
} from 'lucide-react';

const STATUS_COLOR = {
    'Pending': '#ffcc00',
    'Under Review': '#0ff0fc',
    'Approved': '#50cc7f',
    'Rejected': '#ff1b6b',
    'Returned for Revision': '#ff9800',
    'Completed': '#50cc7f',
    'Draft': 'rgba(255,255,255,0.4)'
};

const ACTION_OPTIONS = ['Review', 'Approve', 'Forward', 'Final Approval', 'Reject', 'Return for Revision', 'Add Comments', 'Withdraw'];

const DEFAULT_CHAIN = ['Teacher', 'Program Coordinator', 'HOD', 'QEC', 'University Admin', 'Completed'];

const WorkflowEngine = ({
    module: moduleProp,
    referenceId,
    referenceModel,
    metadata,
    approvalChain,
    embedded = false,
    onSuccess
}) => {
    const dispatch = useDispatch();
    const { requests: rawRequests, stats, loading, successMessage, error } = useSelector(s => s.workflow);
    const { user } = useSelector(s => s.auth);

    // Defensive: ensure array even during loading/uninitialized state
    const requests = Array.isArray(rawRequests) ? rawRequests : [];

    const [activeTab, setActiveTab] = useState('list');
    const [form, setForm] = useState({
        title: '',
        priority: 'Normal',
        dueDate: '',
        remarks: ''
    });
    const [actionModal, setActionModal] = useState(null);
    const [actionForm, setActionForm] = useState({ action: 'Approve', remarks: '' });
    const [expandedId, setExpandedId] = useState(null);

    // Filter requests for this module (or all if no module prop)
    const moduleRequests = moduleProp
        ? requests.filter(r => r.module === moduleProp)
        : requests;

    useEffect(() => {
        dispatch(fetchWorkflowRequests(moduleProp ? { module: moduleProp } : {}));
        dispatch(fetchWorkflowStats(moduleProp ? { module: moduleProp } : {}));
    }, [dispatch, moduleProp]);

    useEffect(() => {
        if (successMessage) {
            if (onSuccess) onSuccess();
            dispatch(clearWorkflowMessages());
            setActionModal(null);
            if (activeTab === 'new') setActiveTab('list');
        }
        if (error) {
            dispatch(clearWorkflowMessages());
        }
    }, [successMessage, error, dispatch, activeTab, onSuccess]);

    const kpiCards = [
        { label: 'Pending', value: stats['Pending'] || 0, color: '#ffcc00', icon: <Clock size={18}/> },
        { label: 'Under Review', value: stats['Under Review'] || 0, color: '#0ff0fc', icon: <Eye size={18}/> },
        { label: 'Approved', value: stats['Approved'] || 0, color: '#50cc7f', icon: <CheckCircle size={18}/> },
        { label: 'Rejected', value: stats['Rejected'] || 0, color: '#ff1b6b', icon: <XCircle size={18}/> },
        { label: 'Returned', value: stats['Returned for Revision'] || 0, color: '#ff9800', icon: <RefreshCw size={18}/> },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title) return alert('Title is required');
        dispatch(submitWorkflowRequest({
            ...form,
            module: moduleProp,
            referenceId,
            referenceModel,
            metadata,
            approvalChain: approvalChain || DEFAULT_CHAIN
        }));
    };

    const handleAction = (e) => {
        e.preventDefault();
        dispatch(actionWorkflowRequest({ id: actionModal._id, actionData: actionForm }));
    };

    const canAction = (req) => {
        if (['Approved', 'Rejected', 'Completed'].includes(req.status)) return false;
        if (user?.role === 'SuperAdmin' || user?.role === 'UniversityAdmin') return true;
        const stageMap = {
            'Teacher': 'Teacher',
            'HOD': 'HOD',
            'Dean': 'Dean',
            'QEC': 'QEC',
            'ProgramCoordinator': 'Program Coordinator',
        };
        const myStage = stageMap[user?.role] || user?.role;
        if (req.status === 'Returned for Revision' && String(req.submitter?._id) === String(user?._id)) return true;
        return req.currentStage === myStage;
    };

    const renderStageTimeline = (req) => {
        const chain = (Array.isArray(req.approvalChain) && req.approvalChain.length > 0)
            ? req.approvalChain
            : DEFAULT_CHAIN;
        const currentIdx = chain.indexOf(req.currentStage);
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                {chain.filter(s => s !== 'Completed').map((stage, i) => {
                    const historyEntry = req.history?.find(h => h.stage === stage && h.action === 'Approve');
                    const isApproved = !!historyEntry || (req.status === 'Approved' && i < currentIdx);
                    const isCurrent = stage === req.currentStage && req.status !== 'Approved' && req.status !== 'Rejected';
                    const color = isApproved ? '#50cc7f' : isCurrent ? '#0ff0fc' : 'rgba(255,255,255,0.2)';
                    return (
                        <React.Fragment key={stage}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, boxShadow: isCurrent ? `0 0 6px ${color}` : 'none' }}/>
                                <span style={{ fontSize: '0.6rem', color: color, whiteSpace: 'nowrap' }}>{stage}</span>
                            </div>
                            {i < chain.filter(s => s !== 'Completed').length - 1 && (
                                <div style={{ height: '1px', width: '16px', background: isApproved ? '#50cc7f' : 'rgba(255,255,255,0.1)', marginBottom: '12px' }}/>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    const wrapperStyle = embedded
        ? { display: 'flex', flexDirection: 'column', gap: '16px' }
        : { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' };

    return (
        <div style={wrapperStyle} className="fade-in">
            {!embedded && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                            <GitMerge size={26} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }}/>
                            {moduleProp ? `${moduleProp} — Workflow` : 'Workflow & Approvals'}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                            Hierarchical approval engine — {approvalChain?.join(' → ') || DEFAULT_CHAIN.join(' → ')}
                        </p>
                    </div>
                    <button onClick={() => setActiveTab('new')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: '800', cursor: 'pointer' }}>
                        <Plus size={16}/> New Request
                    </button>
                </div>
            )}

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
                {kpiCards.map(k => (
                    <div key={k.label} style={{ background: k.color + '10', border: `1px solid ${k.color}25`, borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase' }}>{k.label}</span>
                            <span style={{ color: k.color }}>{k.icon}</span>
                        </div>
                        <div style={{ color: k.color, fontSize: '1.8rem', fontWeight: '800' }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="tabs-wrapper" style={{ marginBottom: '0' }}>
                {[
                    { id: 'list', label: '📋 Approval Queue' },
                    { id: 'new', label: '📨 Submit Request' }
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={'tab-btn ' + (activeTab === t.id ? 'active' : '')}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* LIST TAB */}
            {activeTab === 'list' && (
                <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '20px' }}>
                    {loading ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#0ff0fc' }}>Loading requests...</div>
                    ) : moduleRequests.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <GitMerge size={40} style={{ opacity: 0.2, marginBottom: '10px' }}/>
                            <p>No workflow requests found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {moduleRequests.map(req => (
                                <div key={req._id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${STATUS_COLOR[req.status] || '#ffffff20'}30`, borderRadius: '10px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{req.title}</h4>
                                                <span style={{ background: STATUS_COLOR[req.status] + '15', color: STATUS_COLOR[req.status], padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold' }}>{req.status}</span>
                                                {req.priority !== 'Normal' && (
                                                    <span style={{ background: req.priority === 'Urgent' ? '#ff1b6b15' : '#ff980015', color: req.priority === 'Urgent' ? '#ff1b6b' : '#ff9800', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem' }}>
                                                        {req.priority}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px', flexWrap: 'wrap' }}>
                                                <span>📌 {req.module}</span>
                                                <span>👤 {req.submitter?.name}</span>
                                                <span>📍 Stage: <strong style={{ color: '#0ff0fc' }}>{req.currentStage}</strong></span>
                                                <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {renderStageTimeline(req)}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                                            <button onClick={() => setExpandedId(expandedId === req._id ? null : req._id)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                                                {expandedId === req._id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                            </button>
                                            {canAction(req) && (
                                                <button onClick={() => { setActionModal(req); setActionForm({ action: 'Approve', remarks: '' }); }} style={{ background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', color: '#000', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    Take Action
                                                </button>
                                            )}
                                            {(user?.role === 'SuperAdmin' || String(req.submitter?._id) === String(user?._id)) && (
                                                <button onClick={() => { if(window.confirm('Delete this request?')) dispatch(deleteWorkflowRequest(req._id)); }} style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid #ff1b6b30', color: '#ff1b6b', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <Trash2 size={14}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded History */}
                                    {expandedId === req._id && req.history?.length > 0 && (
                                        <div style={{ marginTop: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Activity size={14}/> Workflow History
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {req.history.map((h, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', alignItems: 'flex-start' }}>
                                                        <span style={{ color: '#0ff0fc', whiteSpace: 'nowrap' }}>{new Date(h.timestamp).toLocaleString()}</span>
                                                        <span>—</span>
                                                        <span><strong>{h.actor?.name || 'System'}</strong> ({h.stage})</span>
                                                        <span>:</span>
                                                        <span style={{ color: STATUS_COLOR[h.action] || '#bc13fe', fontWeight: 'bold' }}>{h.action}</span>
                                                        {h.remarks && <span style={{ color: 'rgba(255,255,255,0.5)' }}>— {h.remarks}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* NEW REQUEST TAB */}
            {activeTab === 'new' && (
                <form className="modal-form" onSubmit={handleSubmit} className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                    <h3 style={{ margin: 0, color: '#0ff0fc' }}>📨 Submit New Workflow Request</h3>
                    {moduleProp && (
                        <div style={{ background: 'rgba(15,240,252,0.05)', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#0ff0fc', fontSize: '0.85rem' }}>
                            📌 Module: <strong>{moduleProp}</strong>
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Request Title *</label>
                        <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. CS101 Blueprint — Fall 2024" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}/>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Priority</label>
                            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}>
                                <option>Normal</option>
                                <option>High</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Due Date (Optional)</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}/>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Remarks / Notes</label>
                        <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} rows={3} placeholder="Any initial notes..." style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}/>
                    </div>
                    {error && <div style={{ color: '#ff1b6b', fontSize: '0.85rem' }}>❌ {error}</div>}
                    {successMessage && <div style={{ color: '#50cc7f', fontSize: '0.85rem' }}>✅ {successMessage}</div>}
                    <button type="submit" disabled={loading} className="primary-btn">
                        <Send size={16}/> {loading ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                </form>
            )}

            {/* ACTION MODAL */}
            {actionModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <form className="modal-form" onSubmit={handleAction} className="glass-panel-dash fade-in" style={{ width: '420px', padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(188,19,254,0.3)' }}>
                        <h3 style={{ margin: 0, color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GitMerge size={20}/> Take Action
                        </h3>
                        <div style={{ color: '#fff', fontSize: '0.9rem', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold' }}>{actionModal.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Module: {actionModal.module} | Stage: {actionModal.currentStage}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Action *</label>
                            <select value={actionForm.action} onChange={e => setActionForm({...actionForm, action: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}>
                                {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>
                                Remarks {['Reject','Return for Revision','Add Comments'].includes(actionForm.action) ? '*' : '(optional)'}
                            </label>
                            <textarea value={actionForm.remarks} onChange={e => setActionForm({...actionForm, remarks: e.target.value})} rows={3} required={['Reject','Return for Revision','Add Comments'].includes(actionForm.action)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}/>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" disabled={loading} style={{ flex: 1, padding: '11px', background: '#bc13fe', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {loading ? 'Processing...' : 'Submit Action'}
                            </button>
                            <button type="button" onClick={() => setActionModal(null)} style={{ padding: '11px 20px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default WorkflowEngine;
