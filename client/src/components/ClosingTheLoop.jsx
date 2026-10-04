import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { RefreshCw, PlusCircle, Edit, Archive, ClipboardEdit, Search, X } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const ClosingTheLoop = () => {
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [loops, setLoops] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    
    // For creating new CQI
    const [formData, setFormData] = useState({
        course: '',
        outcomeType: 'CLO',
        outcomeId: '',
        targetAttainment: '',
        actualAttainment: '',
        rootCause: '',
        actionPlan: '',
        dueDate: '',
        status: 'Draft'
    });

    const fetchCQI = () => {
        setLoading(true);
        axios.get(`${API}/reports/obe/cqi-report`, { headers: hdrs })
            .then(res => setLoops(res.data?.cqi || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCQI();
    }, []);

    const filteredLoops = loops.filter(l => 
        (l.course || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (l.outcome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'Completed': return '#50cc7f';
            case 'Approved': return '#0ff0fc';
            case 'Under Review': return '#ff9800';
            case 'Submitted': return '#2196f3';
            default: return 'rgba(255,255,255,0.5)'; // Draft
        }
    };

    const handleSave = () => {
        axios.post(`${API}/cqi`, formData, { headers: hdrs })
            .then(() => {
                fetchCQI();
                setShowModal(false);
                setFormData({ course: '', outcomeType: 'CLO', outcomeId: '', targetAttainment: '', actualAttainment: '', rootCause: '', actionPlan: '', dueDate: '', status: 'Draft' });
            })
            .catch(err => alert(err.response?.data?.message || 'Error saving CQI'));
    };

    const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <RefreshCw size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> Closing the Loop (CQI)
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Manage and track Continuous Quality Improvement (CQI) corrective actions.</p>
                </div>
                {/* Add button removed: CQI Actions are now added via Course Files */}
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#0ff0fc' }}>Loading CQI Actions...</div>
            ) : (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', width: '300px' }}>
                            <Search size={16} color="rgba(255,255,255,0.5)" />
                            <input type="text" placeholder="Search by course or outcome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none' }} />
                        </div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>ID</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Outcome</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Context</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Root Cause (Summary)</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Due Date</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLoops.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                        No CQI actions found. Click "Add CQI Action" to document a gap.
                                    </td>
                                </tr>
                            ) : filteredLoops.map(row => (
                                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{row.id}</td>
                                    <td style={{ padding: '12px', color: '#fff', fontWeight: '600' }}>
                                        {row.outcome}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.8)' }}>Course: {row.course}</div>
                                    </td>
                                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                        {row.rootCause?.length > 40 ? row.rootCause.substring(0,40)+'...' : row.rootCause}
                                    </td>
                                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                        {row.targetDate}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ 
                                            background: `${getStatusColor(row.status)}20`,
                                            color: getStatusColor(row.status),
                                            border: `1px solid ${getStatusColor(row.status)}40`,
                                            padding: '4px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem'
                                        }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Edit"><Edit size={14} /></button>
                                            <button style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Update Status"><ClipboardEdit size={14} /></button>
                                            <button style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Archive"><Archive size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for Add/Edit */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#111827', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '12px', padding: '24px', width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: '#0ff0fc', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw size={20} /> Add CQI Action
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Course ID</label>
                                <input type="text" style={inputStyle} value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} placeholder="Mongo Course ID..." />
                            </div>
                            <div>
                                <label style={labelStyle}>Outcome Type</label>
                                <select style={inputStyle} value={formData.outcomeType} onChange={e => setFormData({...formData, outcomeType: e.target.value})}>
                                    <option>CLO</option>
                                    <option>PLO</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Target Attainment (%)</label>
                                <input type="number" style={inputStyle} value={formData.targetAttainment} onChange={e => setFormData({...formData, targetAttainment: e.target.value})} />
                            </div>
                            <div>
                                <label style={labelStyle}>Actual Attainment (%)</label>
                                <input type="number" style={inputStyle} value={formData.actualAttainment} onChange={e => setFormData({...formData, actualAttainment: e.target.value})} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Root Cause Analysis *</label>
                            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={formData.rootCause} onChange={e => setFormData({...formData, rootCause: e.target.value})} placeholder="Why did this gap occur?"></textarea>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Corrective Action / Improvement Plan *</label>
                            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={formData.actionPlan} onChange={e => setFormData({...formData, actionPlan: e.target.value})} placeholder="What specific steps will be taken to close the loop?"></textarea>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={labelStyle}>Due Date</label>
                                <input type="date" style={inputStyle} value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                            </div>
                            <div>
                                <label style={labelStyle}>Status</label>
                                <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                    <option>Draft</option>
                                    <option>Submitted</option>
                                    <option>Under Review</option>
                                    <option>Approved</option>
                                    <option>Completed</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button onClick={handleSave} className="primary-btn">Save Action Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClosingTheLoop;
