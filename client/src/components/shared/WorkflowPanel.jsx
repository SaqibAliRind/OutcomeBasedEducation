import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkflowRequests, submitWorkflowRequest, actionWorkflowRequest } from '../../store/workflowSlice';
import { Loader2, GitCommit, Plus, CheckCircle, XCircle, ArrowLeft, Clock, FileText, X } from 'lucide-react';

const WorkflowPanel = () => {
    const dispatch = useDispatch();
    const { requests, loading } = useSelector(state => state.workflow);
    const { user } = useSelector(state => state.auth);
    
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(''); // 'Approve', 'Reject', 'Return', 'Comment'
    const [comment, setComment] = useState('');
    
    const [submitData, setSubmitData] = useState({
        title: '',
        documentType: 'General',
        comment: ''
    });

    useEffect(() => {
        dispatch(fetchWorkflowRequests());
    }, [dispatch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(submitWorkflowRequest(submitData)).then((res) => {
            if (res.meta.requestStatus === 'fulfilled') {
                setShowSubmitModal(false);
                setSubmitData({ title: '', documentType: 'General', comment: '' });
            }
        });
    };

    const handleAction = (e) => {
        e.preventDefault();
        dispatch(actionWorkflowRequest({ id: selectedRequest._id, actionData: { action: actionType, comment } })).then((res) => {
            if (res.meta.requestStatus === 'fulfilled') {
                setShowActionModal(false);
                setSelectedRequest(null);
                setComment('');
                dispatch(fetchWorkflowRequests());
            }
        });
    };

    const openActionModal = (req, type) => {
        setSelectedRequest(req);
        setActionType(type);
        setComment('');
        setShowActionModal(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#ffcc00';
            case 'Approved': return '#50cc7f';
            case 'Rejected': return '#ff1b6b';
            case 'Returned': return '#bc13fe';
            default: return '#fff';
        }
    };

    return (
        <div className="workflow-container glass-panel-dash">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#bc13fe', margin: 0 }}>
                    <GitCommit size={24} /> Document Approvals
                </h2>
                
                <button className="primary-btn" onClick={() => setShowSubmitModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Plus size={18} /> New Request
                </button>
            </div>

            {loading && requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="spinner" size={24} /></div>
            ) : (
                <div className="workflow-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {requests.length === 0 && <div style={{ color: 'var(--uni-text-muted)', textAlign: 'center', padding: '2rem' }}>No workflow requests found.</div>}
                    
                    {requests.map(req => (
                        <div key={req._id} className="glass-panel-dash" style={{ padding: '20px', borderLeft: `4px solid ${getStatusColor(req.status)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#fff' }}>{req.title}</h3>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--uni-text-muted)' }}>
                                        Type: <strong style={{color: '#0ff0fc'}}>{req.documentType}</strong> • Submitted by: {req.submitter?.name}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', marginBottom: '5px' }}>
                                        Current Stage: <strong style={{ color: '#bc13fe' }}>{req.currentStage}</strong>
                                    </div>
                                    <div style={{ color: getStatusColor(req.status), fontWeight: 'bold' }}>{req.status}</div>
                                </div>
                            </div>

                            {/* Action Buttons (Only if it's currently at this user's stage) */}
                            {req.currentStage === user?.role && req.status !== 'Rejected' && req.status !== 'Approved' && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <button className="success-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => openActionModal(req, 'Approve')}><CheckCircle size={16} /> Approve</button>
                                    <button className="danger-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => openActionModal(req, 'Reject')}><XCircle size={16} /> Reject</button>
                                    <button className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => openActionModal(req, 'Return')}><ArrowLeft size={16} /> Return to Previous</button>
                                </div>
                            )}

                            {/* History Timeline */}
                            <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16}/> Approval History</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {req.history.map((h, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '15px', fontSize: '0.9rem' }}>
                                            <div style={{ minWidth: '150px', color: 'var(--uni-text-muted)' }}>{new Date(h.timestamp).toLocaleString()}</div>
                                            <div>
                                                <strong style={{ color: h.action === 'Approve' ? '#50cc7f' : h.action === 'Reject' ? '#ff1b6b' : h.action === 'Submit' ? '#0ff0fc' : '#bc13fe' }}>{h.action}</strong> 
                                                <span style={{ color: '#aaa', marginLeft: '8px' }}>by {h.actor?.name} ({h.actor?.role})</span>
                                                {h.comment && <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#ccc' }}>"{h.comment}"</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SUBMIT REQUEST MODAL */}
            {showSubmitModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash">
                        <div className="modal-header">
                            <h3>Submit New Approval Request</h3>
                            <button className="close-btn" onClick={() => setShowSubmitModal(false)}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Request Title</label>
                                <input type="text" required placeholder="e.g., Spring 2026 Curriculum Updates" value={submitData.title} onChange={e => setSubmitData({...submitData, title: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Document Type</label>
                                <select required value={submitData.documentType} onChange={e => setSubmitData({...submitData, documentType: e.target.value})}>
                                    <option value="General">General Approval</option>
                                    <option value="Course Syllabus">Course Syllabus</option>
                                    <option value="Grade Sheet">Grade Sheet</option>
                                    <option value="Financial Request">Financial Request</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Initial Comments</label>
                                <textarea rows="3" placeholder="Optional notes for reviewers..." value={submitData.comment} onChange={e => setSubmitData({...submitData, comment: e.target.value})}></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? <Loader2 size={16} className="spinner" /> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ACTION MODAL */}
            {showActionModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash">
                        <div className="modal-header">
                            <h3>{actionType} Request</h3>
                            <button className="close-btn" onClick={() => setShowActionModal(false)}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleAction} className="modal-form">
                            <p style={{ marginBottom: '15px', color: '#ccc' }}>You are about to <strong>{actionType.toLowerCase()}</strong> "{selectedRequest?.title}".</p>
                            <div className="form-group">
                                <label>Review Comments {(actionType === 'Reject' || actionType === 'Return') && <span style={{color:'#ff1b6b'}}>*</span>}</label>
                                <textarea 
                                    rows="4" 
                                    required={actionType === 'Reject' || actionType === 'Return'} 
                                    placeholder="Enter your remarks..." 
                                    value={comment} 
                                    onChange={e => setComment(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setShowActionModal(false)}>Cancel</button>
                                <button type="submit" 
                                    className={actionType === 'Approve' ? 'success-btn' : actionType === 'Reject' ? 'danger-btn' : 'secondary-btn'}
                                    disabled={loading}>
                                    {loading ? <Loader2 size={16} className="spinner" /> : `Confirm ${actionType}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowPanel;
