import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Unlock, Lock } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const PRESET_SEMESTERS = [
    { name: 'Semester 1', number: 1 },
    { name: 'Semester 2', number: 2 },
    { name: 'Semester 3', number: 3 },
    { name: 'Semester 4', number: 4 },
    { name: 'Semester 5', number: 5 },
    { name: 'Semester 6', number: 6 },
    { name: 'Semester 7', number: 7 },
    { name: 'Semester 8', number: 8 }
];

const Semesters = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const semesters = records.semesters || [];
    const sessions = records.sessions || [];

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [useCustomName, setUseCustomName] = useState(false);

    const emptyForm = { name: '', number: 1, session: '', startDate: '', endDate: '', registrationStart: '', registrationEnd: '', description: '', status: 'Upcoming' };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('semesters'));
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

    const filtered = semesters
        .filter(s => 
            (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
            String(s.number).includes(search)
        )
        .sort((a, b) => a.number - b.number); // sort by semester number

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setUseCustomName(false);
        setShowModal(true);
    };

    const openEdit = (semester) => {
        setEditingId(semester._id);
        const isPreset = PRESET_SEMESTERS.some(p => p.name === semester.name);
        setUseCustomName(!isPreset);
        setFormData({
            name: semester.name || '',
            number: semester.number || 1,
            session: semester.session || '',
            startDate: semester.startDate ? semester.startDate.substring(0, 10) : '',
            endDate: semester.endDate ? semester.endDate.substring(0, 10) : '',
            registrationStart: semester.registrationStart ? semester.registrationStart.substring(0, 10) : '',
            registrationEnd: semester.registrationEnd ? semester.registrationEnd.substring(0, 10) : '',
            description: semester.description || '',
            status: semester.status || 'Upcoming'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Semester updated!' : 'Semester added!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'semesters', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'semesters', payload: formData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this semester?')) {
            pendingAction.current = 'Semester deleted.';
            dispatch(deleteAcademicData({ entity: 'semesters', id }));
        }
    };

    const toggleStatus = (semester) => {
        const newStatus = semester.status === 'Open' ? 'Closed' : 'Open';
        pendingAction.current = `Semester ${newStatus.toLowerCase()} successfully!`;
        dispatch(updateAcademicData({ 
            entity: 'semesters', 
            id: semester._id, 
            payload: { status: newStatus } 
        }));
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
                    <h2>Semesters Management</h2>
                    <p>Manage semesters, their numbers, and control open/close status for enrollments</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Add Semester
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search semesters..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Semester Name</th>
                                <th>Session</th>
                                <th>Status</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && semesters.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(sem => (
                                <tr key={sem._id}>
                                    <td>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0ff0fc' }}>
                                            {sem.number}
                                        </div>
                                    </td>
                                    <td><strong>{sem.name}</strong></td>
                                    <td>
                                        <span style={{ color: (!sem.session || sem.session === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {typeof sem.session === 'object' ? sem.session.name : (sessions.find(s => s._id === sem.session)?.name || 'Unassigned')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            width: 'max-content',
                                            padding: '4px 12px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.8rem', 
                                            fontWeight: 600,
                                            background: sem.status === 'Open' ? 'rgba(80, 204, 127, 0.15)' : 'rgba(255, 27, 107, 0.15)',
                                            color: sem.status === 'Open' ? '#50cc7f' : '#ff1b6b',
                                            border: `1px solid ${sem.status === 'Open' ? '#50cc7f44' : '#ff1b6b44'}`
                                        }}>
                                            {sem.status === 'Open' ? <Unlock size={14} /> : <Lock size={14} />} 
                                            {sem.status || 'Closed'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{sem.description || '—'}</td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button 
                                            className="action-btn toggle" 
                                            title={sem.status === 'Open' ? 'Close Semester' : 'Open Semester'} 
                                            onClick={() => toggleStatus(sem)} 
                                            style={{ color: sem.status === 'Open' ? '#ff1b6b' : '#50cc7f' }}
                                        >
                                            {sem.status === 'Open' ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>
                                        <button className="action-btn edit" title="Edit Semester" onClick={() => openEdit(sem)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Semester" onClick={() => handleDelete(sem._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No semesters found.</td></tr>
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
                            <h3>{editingId ? 'Edit Semester' : 'Add New Semester'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Semester Name</span>
                                    <button type="button" onClick={() => { setUseCustomName(!useCustomName); setFormData(p => ({ ...p, name: '' })); }}
                                        style={{ background: 'none', border: 'none', color: '#0ff0fc', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                        {useCustomName ? '← Choose from list' : '+ Custom name'}
                                    </button>
                                </label>
                                {useCustomName ? (
                                    <input required type="text" placeholder="e.g. Semester 9" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                ) : (
                                    <select required value={formData.name} onChange={e => {
                                        const selected = PRESET_SEMESTERS.find(p => p.name === e.target.value);
                                        setFormData({ ...formData, name: e.target.value, number: selected ? selected.number : formData.number });
                                    }}>
                                        <option value="">-- Select Semester --</option>
                                        {PRESET_SEMESTERS.map(s => <option key={s.number} value={s.name}>{s.name}</option>)}
                                    </select>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Semester Number</label>
                                    <input required type="number" min="1" max="15" value={formData.number} onChange={e => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className="form-group">
                                    <label>Assign Session</label>
                                    <select value={formData.session} onChange={e => setFormData({ ...formData, session: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Registration Start</label>
                                    <input type="date" value={formData.registrationStart} onChange={e => setFormData({ ...formData, registrationStart: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Registration End</label>
                                    <input type="date" value={formData.registrationEnd} onChange={e => setFormData({ ...formData, registrationEnd: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <input type="text" placeholder="e.g. For final year students" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
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

export default Semesters;
