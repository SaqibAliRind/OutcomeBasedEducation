import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Calendar, Clock, MapPin, User, BookOpen, GraduationCap, Layers, Printer, Download } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Timetables = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const { usersList } = useSelector(state => state.users || { usersList: [] });

    const timetables = records.timetables || [];
    const courseOfferings = records.courseofferings || [];
    const courses = records.courses || [];
    const sections = records.sections || [];
    const programs = records.programs || [];
    const semesters = records.semesters || [];
    const sessions = records.sessions || [];

    const availableTeachers = usersList.filter(u => u.role === 'Teacher' || u.role === 'ProgramCoordinator');
    const activeOfferings = courseOfferings.filter(o => o.status === 'Open');

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const emptyForm = { 
        course: '', 
        section: '', 
        teacher: '', 
        session: '', 
        room: '', 
        building: '',
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
        status: 'Active'
    };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('timetables'));
        dispatch(fetchAcademicData('courseofferings'));
        dispatch(fetchAcademicData('courses'));
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        if (prevLoading.current && !academicLoading) {
            if (academicError) {
                pendingAction.current = null;
            } else if (pendingAction.current) {
                setToast({ type: 'success', msg: pendingAction.current });
                pendingAction.current = null;
                setTimeout(() => setToast(null), 3000);
            }
        }
        prevLoading.current = academicLoading;
    }, [academicLoading, academicError]);

    const filtered = timetables.filter(t => 
        (t.course?.name || t.course || '').toLowerCase().includes(search.toLowerCase()) || 
        (t.teacher?.name || t.teacher || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.room || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.section?.name || t.section || '').toLowerCase().includes(search.toLowerCase())
    );

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (timetable) => {
        setEditingId(timetable._id);
        setFormData({
            course: timetable.course?._id || timetable.course || '',
            section: timetable.section?._id || timetable.section || '',
            teacher: timetable.teacher?._id || timetable.teacher || '',
            session: timetable.session?._id || timetable.session || '',
            room: timetable.room || '',
            building: timetable.building || '',
            day: timetable.day || 'Monday',
            startTime: timetable.startTime || '09:00',
            endTime: timetable.endTime || '10:30',
            status: timetable.status || 'Active'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Timetable updated!' : 'Timetable created!';
        
        // Validation: Start Time < End Time
        const start = parseInt(formData.startTime.replace(':', ''));
        const end = parseInt(formData.endTime.replace(':', ''));
        if (start >= end) {
            alert("End time must be after start time!");
            return;
        }

        if (editingId) {
            dispatch(updateAcademicData({ entity: 'timetables', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'timetables', payload: formData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this timetable entry?')) {
            pendingAction.current = 'Timetable deleted.';
            dispatch(deleteAcademicData({ entity: 'timetables', id }));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        const headers = ['Course', 'Teacher', 'Section', 'Session', 'Room', 'Building', 'Day', 'Start Time', 'End Time', 'Status'];
        const rows = filtered.map(t => [
            t.course?.name || t.course || '',
            t.teacher?.name || t.teacher || '',
            t.section?.name || t.section || '',
            t.session?.name || t.session || '',
            t.room || '',
            t.building || '',
            t.day || '',
            t.startTime || '',
            t.endTime || '',
            t.status || 'Active'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'timetable_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleOfferingSelect = (offeringId) => {
        const offering = courseOfferings.find(o => o._id === offeringId);
        if (offering) {
            setFormData(prev => ({
                ...prev,
                courseOffering: offering.course || prev.courseOffering,
                teacher: offering.teacher || prev.teacher,
                section: offering.section || prev.section,
                semester: offering.semester || prev.semester
            }));
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        return `${hours}:${minutes} ${ampm}`;
    };

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 9999, background: 'rgba(80,204,127,0.15)', border: '1px solid #50cc7f', color: '#50cc7f', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                    {toast.msg}
                </div>
            )}
            {academicError && (
                <div className="um-alert error" style={{ marginBottom: '1rem', border: '1px solid #ff1b6b', background: 'rgba(255,27,107,0.1)' }}>
                    <strong>Error: </strong> {academicError}
                </div>
            )}

            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Timetable & Scheduling</h2>
                    <p>Manage class schedules with dynamic program, semester, course, section & teacher dropdowns</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrint}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#0ff0fc', cursor: 'pointer', fontWeight: 600 }}>
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleExport}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#50cc7f', cursor: 'pointer', fontWeight: 600 }}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                        <Plus size={18} /> Add Schedule
                    </button>
                </div>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search schedule..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Schedule</th>
                                <th>Session</th>
                                <th>Course & Section</th>
                                <th>Teacher</th>
                                <th>Room</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && timetables.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(t => (
                                <tr key={t._id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ color: '#0ff0fc', fontWeight: 600 }}>{t.day}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {formatTime(t.startTime)} - {formatTime(t.endTime)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#45caff' }}>
                                                <GraduationCap size={14} /> {t.session?.name || t.session || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                                <BookOpen size={14} color="#bc13fe" /> {t.course?.name || t.course}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', paddingLeft: '20px' }}>Section: {t.section?.name || t.section}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <User size={14} color="#ffcc00" /> {t.teacher?.name || t.teacher}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} color="#50cc7f" /> {t.room} {t.building ? `(${t.building})` : ''}
                                        </div>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn edit" title="Edit Schedule" onClick={() => openEdit(t)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Schedule" onClick={() => handleDelete(t._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No schedules found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '520px', padding: '1.5rem', borderRadius: '14px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Schedule' : 'Add New Schedule'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Session</label>
                                <select required value={formData.session} onChange={e => setFormData({ ...formData, session: e.target.value })}>
                                    <option value="">-- Select Session --</option>
                                    {sessions.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Course & Section Dropdowns */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Course</label>
                                    <select required value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })}>
                                        <option value="">-- Select Course --</option>
                                        {courses.map(c => (
                                            <option key={c._id} value={c._id}>{c.code ? `${c.code} - ${c.name}` : c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Section</label>
                                    <select required value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
                                        <option value="">-- Select Section --</option>
                                        {sections.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Teacher Dropdown */}
                            <div className="form-group">
                                <label>Assign Teacher</label>
                                <select required value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })}>
                                    <option value="">-- Select Teacher --</option>
                                    {availableTeachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.name} ({t.email || t.role})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Room Allocation */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Room</label>
                                    <input required type="text" placeholder="e.g. CR-101" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Building (Optional)</label>
                                    <input type="text" placeholder="e.g. Block A" value={formData.building} onChange={e => setFormData({ ...formData, building: e.target.value })} />
                                </div>
                            </div>

                            {/* Day & Time Selection */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Day</label>
                                    <select required value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input required type="time" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input required type="time" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="page-btn primary-btn" style={{ padding: '8px 16px' }} disabled={academicLoading}>
                                    {academicLoading ? 'Checking Clash...' : 'Save Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timetables;
