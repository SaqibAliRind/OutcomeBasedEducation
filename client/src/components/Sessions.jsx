import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData, setActiveSession } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, CheckCircle } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const TERMS = ['Spring', 'Fall', 'Summer'];

const Sessions = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const sessions = records.sessions || [];

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const emptyForm = { name: '', term: 'Fall', year: new Date().getFullYear(), startDate: '', endDate: '', status: 'Upcoming' };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = React.useRef(false);
    const pendingAction = React.useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('sessions'));
    }, [dispatch]);

    useEffect(() => {
        if (prevLoading.current && !academicLoading) {
            if (pendingAction.current) {
                setToast({ type: 'success', msg: pendingAction.current });
                pendingAction.current = null;
                setTimeout(() => setToast(null), 3000);
            }
        }
        prevLoading.current = academicLoading;
    }, [academicLoading]);

    const filtered = sessions.filter(s => 
        (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (s.term || '').toLowerCase().includes(search.toLowerCase()) ||
        String(s.year).includes(search)
    );

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (session) => {
        setEditingId(session._id);
        setFormData({
            name: session.name || '',
            term: session.term || 'Fall',
            year: session.year || new Date().getFullYear(),
            startDate: session.startDate ? session.startDate.substring(0, 10) : '',
            endDate: session.endDate ? session.endDate.substring(0, 10) : '',
            status: session.status || 'Upcoming'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Session updated!' : 'Session added!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'sessions', id: editingId, payload: formData }));
        } else {
            // Auto-generate name if left blank (e.g. "Fall 2024")
            const finalData = { ...formData, name: formData.name || `${formData.term} ${formData.year}` };
            dispatch(createAcademicData({ entity: 'sessions', payload: finalData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this session?')) {
            pendingAction.current = 'Session deleted.';
            dispatch(deleteAcademicData({ entity: 'sessions', id }));
        }
    };

    const handleActivate = (id) => {
        if (window.confirm('Mark this session as active? All other sessions will be deactivated.')) {
            pendingAction.current = 'Session activated successfully!';
            dispatch(setActiveSession(id));
        }
    };

    const termColors = { Fall: '#bc13fe', Spring: '#50cc7f', Summer: '#ffcc00' };

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 9999, background: 'rgba(80,204,127,0.15)', border: '1px solid #50cc7f', color: '#50cc7f', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                    {toast.msg}
                </div>
            )}
            {academicError && (
                <div className="um-alert error" style={{ marginBottom: '1rem' }}>{academicError}</div>
            )}

            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Sessions Management</h2>
                    <p>Manage academic terms, spring/fall/summer sessions, and set the active session</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Add Session
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search sessions..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Session Name</th>
                                <th>Term</th>
                                <th>Year</th>
                                <th>Dates</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && sessions.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(sess => (
                                <tr key={sess._id} style={{ background: sess.status === 'Active' ? 'rgba(80, 204, 127, 0.05)' : 'transparent' }}>
                                    <td>
                                        <strong style={{ color: sess.status === 'Active' ? '#50cc7f' : '#fff' }}>{sess.name}</strong>
                                    </td>
                                    <td>
                                        <span style={{ color: termColors[sess.term] || '#fff', fontWeight: 600 }}>{sess.term || '—'}</span>
                                    </td>
                                    <td>{sess.year}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                        {sess.startDate ? new Date(sess.startDate).toLocaleDateString() : 'TBD'} - {sess.endDate ? new Date(sess.endDate).toLocaleDateString() : 'TBD'}
                                    </td>
                                    <td>
                                        {sess.status === 'Active' ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#50cc7f', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <CheckCircle size={14} /> Active Current Session
                                            </span>
                                        ) : (
                                            <span style={{ color: sess.status === 'Closed' ? '#ff1b6b' : 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{sess.status || 'Upcoming'}</span>
                                        )}
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        {sess.status !== 'Active' && (
                                            <button className="action-btn toggle" title="Set as Active Session" onClick={() => handleActivate(sess._id)} style={{ color: '#50cc7f' }}>
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        <button className="action-btn edit" title="Edit Session" onClick={() => openEdit(sess)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Session" onClick={() => handleDelete(sess._id)} disabled={sess.status === 'Active'} style={{ opacity: sess.status === 'Active' ? 0.3 : 1 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No sessions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '450px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Session' : 'Add New Session'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Term</label>
                                    <select value={formData.term} onChange={e => setFormData({ ...formData, term: e.target.value })}>
                                        {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Year</label>
                                    <input required type="number" min="2000" max="2100" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Session Name (Optional)</label>
                                <input type="text" placeholder={`e.g. ${formData.term} ${formData.year}`} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <small style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'block' }}>Leave blank to auto-generate from term and year</small>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Active">Active</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="page-btn primary-btn" style={{ padding: '8px 16px' }} disabled={academicLoading}>
                                    {academicLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sessions;
