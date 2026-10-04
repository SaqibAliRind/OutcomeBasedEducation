import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Book } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const PRESET_COURSES = [
    { code: 'CS101', name: 'Introduction to Computing', credits: 3 },
    { code: 'CS102', name: 'Programming Fundamentals', credits: 4 },
    { code: 'CS201', name: 'Object Oriented Programming', credits: 4 },
    { code: 'CS202', name: 'Data Structures and Algorithms', credits: 4 },
    { code: 'CS301', name: 'Database Systems', credits: 4 },
    { code: 'CS302', name: 'Operating Systems', credits: 4 },
    { code: 'CS303', name: 'Software Engineering', credits: 3 },
    { code: 'CS401', name: 'Artificial Intelligence', credits: 3 },
    { code: 'MATH101', name: 'Calculus and Analytical Geometry', credits: 3 },
    { code: 'MATH102', name: 'Linear Algebra', credits: 3 },
    { code: 'PHY101', name: 'Applied Physics', credits: 4 },
    { code: 'ENG101', name: 'English Comprehension', credits: 3 },
    { code: 'ENG102', name: 'Communication Skills', credits: 3 },
    { code: 'ISL101', name: 'Islamic Studies', credits: 2 }
];

const Courses = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const courses = records.courses || [];
    const programs = records.programs || [];
    const semesters = records.semesters || [];
    const departments = records.departments || [];

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [useCustomName, setUseCustomName] = useState(false);

    const emptyForm = { 
        code: '', 
        name: '', 
        shortName: '',
        creditHours: 3, 
        contactHours: 3,
        type: 'Theory', 
        prerequisite: '', 
        department: '',
        program: '',
        semester: '',
        description: '',
        status: 'Active' 
    };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('courses'));
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('departments'));
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

    const filtered = courses.filter(c => 
        (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (c.code || '').toLowerCase().includes(search.toLowerCase())
    );

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setUseCustomName(false);
        setShowModal(true);
    };

    const openEdit = (course) => {
        setEditingId(course._id);
        const isPreset = PRESET_COURSES.some(p => p.code === course.code);
        setUseCustomName(!isPreset);
        setFormData({
            code: course.code || '',
            name: course.name || '',
            shortName: course.shortName || '',
            creditHours: course.creditHours || 3,
            contactHours: course.contactHours || 3,
            type: course.type || 'Theory',
            prerequisite: course.prerequisite?._id || course.prerequisite || '',
            department: course.department?._id || course.department || '',
            program: course.program?._id || course.program || '',
            semester: course.semester?._id || course.semester || '',
            description: course.description || '',
            status: course.status || 'Active'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Course updated!' : 'Course added!';
        
        const payload = { ...formData };
        if (payload.prerequisite === 'none' || payload.prerequisite === '') {
            payload.prerequisite = null;
        }
        
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'courses', id: editingId, payload }));
        } else {
            dispatch(createAcademicData({ entity: 'courses', payload }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this course?')) {
            pendingAction.current = 'Course deleted.';
            dispatch(deleteAcademicData({ entity: 'courses', id }));
        }
    };

    const typeColors = {
        'Theory': '#bc13fe',
        'Lab': '#0ff0fc',
        'Theory + Lab': '#ffcc00'
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
                    <h2>Courses Management</h2>
                    <p>Manage academic courses, credit hours, prerequisites, and theory/lab types</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Add Course
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search by name or code..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Course Name</th>
                                <th>Type</th>
                                <th>Cr. Hr</th>
                                <th>Prerequisite</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && courses.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(c => (
                                <tr key={c._id}>
                                    <td><strong>{c.code}</strong></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Book size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                                            {c.name}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            background: `${typeColors[c.type]}15`, 
                                            color: typeColors[c.type], 
                                            border: `1px solid ${typeColors[c.type]}44`,
                                            padding: '3px 10px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600 
                                        }}>
                                            {c.type || 'Theory'}
                                        </span>
                                    </td>
                                    <td>{c.creditHours}</td>
                                    <td style={{ color: (!c.prerequisite) ? 'rgba(255,255,255,0.4)' : '#0ff0fc', fontSize: '0.9rem' }}>
                                        {c.prerequisite ? (c.prerequisite.name || c.prerequisite.code || (typeof c.prerequisite === 'string' ? c.prerequisite : 'Unknown')) : 'None'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(c.status || 'Active').toLowerCase()}`}>
                                            {c.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn edit" title="Edit Course" onClick={() => openEdit(c)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Course" onClick={() => handleDelete(c._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No courses found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Course' : 'Add New Course'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Course Code & Name</span>
                                    <button type="button" onClick={() => { setUseCustomName(!useCustomName); setFormData(p => ({ ...p, name: '', code: '', creditHours: 3 })); }}
                                        style={{ background: 'none', border: 'none', color: '#0ff0fc', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                        {useCustomName ? '← Choose from list' : '+ Custom course'}
                                    </button>
                                </label>
                                {useCustomName ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px' }}>
                                        <input required type="text" placeholder="Code (CS101)" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                                        <input required type="text" placeholder="Name (Intro to CS)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <input type="text" placeholder="Short Name" value={formData.shortName} onChange={e => setFormData({ ...formData, shortName: e.target.value })} />
                                    </div>
                                ) : (
                                    <select required value={formData.code} onChange={e => {
                                        const selected = PRESET_COURSES.find(p => p.code === e.target.value);
                                        setFormData({ 
                                            ...formData, 
                                            code: selected ? selected.code : '', 
                                            name: selected ? selected.name : '',
                                            creditHours: selected ? selected.credits : formData.creditHours
                                        });
                                    }}>
                                        <option value="">-- Select Course --</option>
                                        {PRESET_COURSES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                    </select>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Credit Hours</label>
                                    <input required type="number" min="1" max="10" value={formData.creditHours} onChange={e => setFormData({ ...formData, creditHours: parseInt(e.target.value) || 3 })} />
                                </div>
                                <div className="form-group">
                                    <label>Contact Hours</label>
                                    <input required type="number" min="1" max="20" value={formData.contactHours} onChange={e => setFormData({ ...formData, contactHours: parseInt(e.target.value) || 3 })} />
                                </div>
                                <div className="form-group">
                                    <label>Course Type</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="Theory">Theory</option>
                                        <option value="Lab">Lab</option>
                                        <option value="Theory + Lab">Theory + Lab</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                        <option value="">-- Select Department --</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Program</label>
                                    <select value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })}>
                                        <option value="">-- Select Program --</option>
                                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Semester</label>
                                    <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                        <option value="">-- Select Semester --</option>
                                        {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Prerequisite Course</label>
                                    <select value={formData.prerequisite} onChange={e => setFormData({ ...formData, prerequisite: e.target.value })}>
                                        <option value="">-- None --</option>
                                        {courses.filter(c => c._id !== editingId).map(c => (
                                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Course Description</label>
                                <textarea placeholder="Enter brief description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '10px' }}></textarea>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
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

export default Courses;
