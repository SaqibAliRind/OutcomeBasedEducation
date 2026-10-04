import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, BookOpen, Users, Layout } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const CourseOfferings = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const { usersList } = useSelector(state => state.users);

    const offerings = records.courseofferings || [];
    const courses = records.courses || [];
    const sections = records.sections || [];
    const semesters = records.semesters || [];
    const programs = records.programs || [];
    const sessions = records.sessions || [];
    const availableTeachers = usersList.filter(u => u.role === 'Teacher' || u.role === 'ProgramCoordinator');

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const emptyForm = { 
        course: '', 
        teacher: '', 
        section: '', 
        semester: '', 
        program: '',
        session: '',
        academicYear: '',
        enrollmentLimit: 50, 
        status: 'Open' 
    };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('courseofferings'));
        dispatch(fetchAcademicData('courses'));
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchUsers());
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

    const filtered = offerings.filter(o => {
        const courseStr = o.course?.name || o.course?.code || o.course || '';
        const teacherStr = o.teacher?.name || o.teacher || '';
        const sectionStr = o.section?.name || o.section || '';
        
        return courseStr.toLowerCase().includes(search.toLowerCase()) || 
               teacherStr.toLowerCase().includes(search.toLowerCase()) ||
               sectionStr.toLowerCase().includes(search.toLowerCase());
    });

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (offering) => {
        setEditingId(offering._id);
        setFormData({
            course: offering.course?._id || offering.course || '',
            teacher: offering.teacher?._id || offering.teacher || '',
            section: offering.section?._id || offering.section || '',
            semester: offering.semester?._id || offering.semester || '',
            program: offering.program?._id || offering.program || '',
            session: offering.session?._id || offering.session || '',
            academicYear: offering.academicYear || '',
            enrollmentLimit: offering.enrollmentLimit || 50,
            status: offering.status || 'Open'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Course offering updated!' : 'Course offering created!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'courseofferings', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'courseofferings', payload: formData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this course offering?')) {
            pendingAction.current = 'Course offering deleted.';
            dispatch(deleteAcademicData({ entity: 'courseofferings', id }));
        }
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
                    <h2>Course Offerings</h2>
                    <p>Assign courses to teachers, sections, and semesters with enrollment limits</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Offer Course
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search offerings..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Teacher</th>
                                <th>Section</th>
                                <th>Semester</th>
                                <th>Limit</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && offerings.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(o => (
                                <tr key={o._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BookOpen size={14} color="#bc13fe" />
                                            <strong>{o.course?.name || o.course?.code || o.course}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Users size={14} color="#0ff0fc" />
                                            {o.teacher?.name || o.teacher}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Layout size={14} color="#ffcc00" />
                                            {o.section?.name || o.section}
                                        </div>
                                    </td>
                                    <td>{o.semester?.name || o.semester}</td>
                                    <td>
                                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>
                                            {o.enrollmentLimit} Max
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(o.status || 'Open').toLowerCase()}`} style={{
                                            background: o.status === 'Open' ? 'rgba(80, 204, 127, 0.15)' : 'rgba(255, 27, 107, 0.15)',
                                            color: o.status === 'Open' ? '#50cc7f' : '#ff1b6b'
                                        }}>
                                            {o.status || 'Open'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn edit" title="Edit Offering" onClick={() => openEdit(o)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Offering" onClick={() => handleDelete(o._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No course offerings found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Course Offering' : 'Offer a Course'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            
                            <div className="form-group">
                                <label>Course</label>
                                <select required value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })}>
                                    <option value="">-- Select Course --</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Assign Teacher</label>
                                <select required value={formData.teacher} onChange={e => setFormData({ ...formData, teacher: e.target.value })}>
                                    <option value="">-- Select Teacher --</option>
                                    {availableTeachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Assign Section</label>
                                    <select required value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
                                        <option value="">-- Select Section --</option>
                                        {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Semester</label>
                                    <select required value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                        <option value="">-- Select Semester --</option>
                                        {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Program</label>
                                    <select required value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })}>
                                        <option value="">-- Select Program --</option>
                                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Session</label>
                                    <select required value={formData.session} onChange={e => setFormData({ ...formData, session: e.target.value })}>
                                        <option value="">-- Select Session --</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Academic Year</label>
                                    <input required type="text" placeholder="e.g. 2026-2027" value={formData.academicYear} onChange={e => setFormData({ ...formData, academicYear: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Maximum Students</label>
                                    <input required type="number" min="1" max="200" value={formData.enrollmentLimit} onChange={e => setFormData({ ...formData, enrollmentLimit: parseInt(e.target.value) || 50 })} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
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

export default CourseOfferings;
