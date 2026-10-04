import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Calendar as CalIcon, Flag, AlertCircle, Download } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const EVENT_TYPES = ['Semester Start', 'Semester End', 'Admission Schedule', 'Registration', 'Course Registration', 'Add/Drop Week', 'Quiz Schedule', 'Mid Exams', 'Final Exams', 'Viva', 'Result Declaration', 'Holidays', 'Workshops', 'Seminars', 'Convocation', 'Event'];

const AcademicCalendar = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const calendarEvents = records.calendar || [];
    const sessions = records.sessions || [];

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const emptyForm = { 
        title: '', 
        eventType: 'Event', 
        startDate: '', 
        endDate: '', 
        session: '', 
        description: '', 
        status: 'Upcoming' 
    };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('calendar'));
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

    const filtered = calendarEvents.filter(e => 
        (e.title || '').toLowerCase().includes(search.toLowerCase()) || 
        (e.eventType || '').toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (event) => {
        setEditingId(event._id);
        setFormData({
            title: event.title || '',
            eventType: event.eventType || 'Event',
            startDate: event.startDate ? event.startDate.substring(0, 10) : '',
            endDate: event.endDate ? event.endDate.substring(0, 10) : '',
            session: event.session?._id || event.session || '',
            description: event.description || '',
            status: event.status || 'Upcoming'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Event updated!' : 'Event added!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'calendar', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'calendar', payload: formData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this calendar event?')) {
            pendingAction.current = 'Event deleted.';
            dispatch(deleteAcademicData({ entity: 'calendar', id }));
        }
    };

    const handleExport = () => {
        const headers = ['Event Title', 'Type', 'Start Date', 'End Date', 'Session', 'Status', 'Description'];
        const rows = filtered.map(ev => [
            ev.title,
            ev.eventType,
            ev.startDate ? new Date(ev.startDate).toLocaleDateString() : '',
            ev.endDate ? new Date(ev.endDate).toLocaleDateString() : '',
            ev.session?.name || ev.session || 'General',
            ev.status || 'Upcoming',
            ev.description || ''
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'academic_calendar.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const typeColors = {
        'Semester Start': '#0ff0fc',
        'Semester End': '#bc13fe',
        'Holiday': '#50cc7f',
        'Mid Exam': '#ffcc00',
        'Final Exam': '#ff1b6b',
        'Result': '#45caff',
        'Event': '#fff'
    };

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
                    <h2>Academic Calendar</h2>
                    <p>Manage semester dates, holidays, mid/final exams, and result dates</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleExport}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#50cc7f', cursor: 'pointer', fontWeight: 600 }}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                        <Plus size={18} /> Add Event
                    </button>
                </div>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Dates</th>
                                <th>Event Details</th>
                                <th>Type</th>
                                <th>Session</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && calendarEvents.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(ev => (
                                <tr key={ev._id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#0ff0fc' }}>
                                                <CalIcon size={14} /> {new Date(ev.startDate).toLocaleDateString()}
                                            </span>
                                            {ev.startDate !== ev.endDate && (
                                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', paddingLeft: '20px' }}>
                                                    to {new Date(ev.endDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <strong>{ev.title}</strong>
                                            {ev.description && <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{ev.description}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            background: `${typeColors[ev.eventType] || '#fff'}15`, 
                                            color: typeColors[ev.eventType] || '#fff', 
                                            border: `1px solid ${typeColors[ev.eventType] || '#fff'}44`,
                                            padding: '4px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.8rem', 
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            width: 'max-content'
                                        }}>
                                            {ev.eventType === 'Holiday' ? <Flag size={12} /> : ev.eventType.includes('Exam') ? <AlertCircle size={12} /> : null}
                                            {ev.eventType}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: !ev.session ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {ev.session?.name || ev.session || 'General'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(ev.status || 'Upcoming').toLowerCase()}`}>
                                            {ev.status || 'Upcoming'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn edit" title="Edit Event" onClick={() => openEdit(ev)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Event" onClick={() => handleDelete(ev._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No events scheduled.</td></tr>
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
                            <h3>{editingId ? 'Edit Event' : 'Add Calendar Event'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            
                            <div className="form-group">
                                <label>Event Title</label>
                                <input required type="text" placeholder="e.g. Eid Holidays" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Event Type</label>
                                    <select required value={formData.eventType} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select required value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input required type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input required type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Session / Year (Optional)</label>
                                <select value={formData.session} onChange={e => setFormData({ ...formData, session: e.target.value })}>
                                    <option value="">General (All Sessions)</option>
                                    {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea rows="2" placeholder="Any additional details..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="page-btn primary-btn" style={{ padding: '8px 16px' }} disabled={academicLoading}>
                                    {academicLoading ? 'Saving...' : 'Save Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicCalendar;
