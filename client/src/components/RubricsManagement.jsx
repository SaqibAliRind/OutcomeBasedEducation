import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRubrics, createRubric, updateRubric, deleteRubric, copyRubric, clearRubricMessages } from '../store/rubricSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, X, Loader2, Copy, Save, LayoutTemplate } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const RUBRIC_TYPES = ['Lab Rubric', 'Programming Rubric', 'Presentation Rubric', 'Project Rubric', 'Viva Rubric'];
const ASSESSMENT_TYPES = ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Mid Exam', 'Final Exam', 'Viva', 'General'];

const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };
const textAreaStyle = { ...inputStyle, minHeight: '80px', resize: 'vertical', fontSize: '0.8rem' };

const RubricsManagement = () => {
    const dispatch = useDispatch();
    const { rubrics, loading, error, successMessage } = useSelector(s => s.rubrics);
    const { records: { sessions = [], semesters = [], departments = [], programs = [], courses = [], sections = [] } } = useSelector(s => s.academic);
    const { users = [] } = useSelector(s => s.users);
    const teachers = users.filter(u => u.role === 'Teacher');

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCopyModal, setShowCopyModal] = useState(false);

    // Form states
    const [formMeta, setFormMeta] = useState({ name: '', rubricType: 'Lab Rubric', assessmentType: 'General', session: '', semester: '', department: '', program: '', course: '', section: '', teacher: '', version: 1, status: 'Draft' });
    const [criteria, setCriteria] = useState([]);
    const [copyTargetId, setCopyTargetId] = useState('');

    useEffect(() => {
        dispatch(fetchRubrics());
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('courses'));
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchUsers());
        return () => dispatch(clearRubricMessages());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) { setToast({ msg: successMessage, type: 'success' }); setTimeout(() => setToast(null), 4000); dispatch(clearRubricMessages()); setShowModal(false); setShowCopyModal(false); }
        if (error) { setToast({ msg: error, type: 'error' }); setTimeout(() => setToast(null), 5000); dispatch(clearRubricMessages()); }
    }, [successMessage, error]);

    const filtered = useMemo(() => rubrics.filter(r => {
        const textMatch = !search || r.name.toLowerCase().includes(search.toLowerCase());
        const typeMatch = !filterType || r.rubricType === filterType;
        return textMatch && typeMatch;
    }), [rubrics, search, filterType]);

    const handleMetaChange = (e) => setFormMeta(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleAddCriterion = () => {
        setCriteria([...criteria, { 
            name: '', marks: 10, 
            descriptions: { excellent: '', good: '', satisfactory: '', poor: '' } 
        }]);
    };
    
    const handleRemoveCriterion = (idx) => {
        setCriteria(criteria.filter((_, i) => i !== idx));
    };

    const handleCriterionChange = (idx, field, value) => {
        const updated = [...criteria];
        updated[idx][field] = value;
        setCriteria(updated);
    };

    const handleDescriptionChange = (idx, level, value) => {
        const updated = [...criteria];
        updated[idx].descriptions[level] = value;
        setCriteria(updated);
    };

    const totalMarks = useMemo(() => criteria.reduce((sum, c) => sum + Number(c.marks || 0), 0), [criteria]);

    const handleSave = (e) => {
        e.preventDefault();
        if(criteria.length === 0) return alert('Please add at least one criterion.');
        const payload = { ...formMeta, criteria };
        if (editingId) dispatch(updateRubric({ id: editingId, payload }));
        else dispatch(createRubric(payload));
    };

    const handleEdit = (r) => {
        setEditingId(r._id);
        setFormMeta({ 
            name: r.name, rubricType: r.rubricType, assessmentType: r.assessmentType, 
            session: r.session?._id || '', semester: r.semester?._id || '', department: r.department?._id || '', 
            program: r.program?._id || '', course: r.course?._id || '', section: r.section?._id || '', 
            teacher: r.teacher?._id || '', version: r.version || 1, status: r.status || 'Draft'
        });
        setCriteria(r.criteria.map(c => ({
            name: c.name, marks: c.marks,
            descriptions: {
                excellent: c.descriptions?.excellent || '',
                good: c.descriptions?.good || '',
                satisfactory: c.descriptions?.satisfactory || '',
                poor: c.descriptions?.poor || ''
            }
        })));
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this rubric permanently?')) dispatch(deleteRubric(id));
    };

    const handleCopy = (e) => {
        e.preventDefault();
        if (!copyTargetId) return alert('Select a source rubric to copy from');
        if (!formMeta.name) return alert('Enter a name for the new rubric');
        dispatch(copyRubric({ 
            sourceRubricId: copyTargetId, newName: formMeta.name,
            newSession: formMeta.session, newSemester: formMeta.semester, newDepartment: formMeta.department,
            newProgram: formMeta.program, newCourse: formMeta.course, newSection: formMeta.section, newTeacher: formMeta.teacher
        }));
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '10px', zIndex: 3000, color: '#fff', fontWeight: 600, background: toast.type === 'success' ? 'rgba(80,204,127,0.95)' : 'rgba(255,27,107,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <LayoutTemplate size={28} color="#0ff0fc" /> Rubrics Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Create and manage evaluation rubrics for standardizing assessments.</p>
                </div>
                <button onClick={() => { 
                    setEditingId(null); 
                    setFormMeta({ name: '', rubricType: 'Programming Rubric', assessmentType: 'General', session: '', semester: '', department: '', program: '', course: '', section: '', teacher: '', version: 1, status: 'Draft' }); 
                    setCriteria([{ name: 'Logic', marks: 10, descriptions: { excellent: 'Flawless logic', good: 'Minor logical flaws', satisfactory: 'Partial logic', poor: 'Incorrect logic' } }]); 
                    setShowModal(true); 
                }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg, #0ff0fc, #0288d1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                    <Plus size={16} /> Create Rubric
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rubrics..." style={{ ...inputStyle, maxWidth: '300px' }} />
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, maxWidth: '250px' }}>
                    <option value="">All Rubric Types</option>
                    {RUBRIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Grid display */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading && rubrics.length === 0 ? (
                    <div style={{ padding: '3rem', width: '100%', gridColumn: '1/-1', display: 'flex', justifyContent: 'center' }}><Loader2 className="spin" size={32} color="#0ff0fc" /></div>
                ) : filtered.map(r => (
                    <div key={r._id} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.2rem', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '1.2rem' }}>{r.name}</h3>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{r.rubricType} | {r.assessmentType}</p>
                                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{r.course?.code} | {r.semester?.name} | {r.teacher?.name}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ background: r.status === 'Approved' ? 'rgba(80,204,127,0.1)' : 'rgba(255,152,0,0.1)', color: r.status === 'Approved' ? '#50cc7f' : '#ff9800', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{r.status}</span>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '4px' }}>v{r.version || 1}</div>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '15px' }}>
                                <div><div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)'}}>Total Marks</div><div style={{fontWeight: 'bold', color: '#0ff0fc'}}>{r.totalMarks}</div></div>
                                <div><div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)'}}>Criteria Count</div><div style={{fontWeight: 'bold', color: '#fff'}}>{r.criteria.length}</div></div>
                            </div>
                            
                            <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Criteria breakdown</div>
                                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                    {r.criteria.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i !== r.criteria.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: '0.85rem' }}>
                                            <span style={{color: 'rgba(255,255,255,0.8)'}}>{c.name}</span>
                                            <span style={{color: '#bc13fe', fontWeight: '600'}}>{c.marks} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem', gap: '8px' }}>
                            <button onClick={() => handleEdit(r)} style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(r._id)} style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash" style={{ width: '95vw', maxWidth: '1200px', padding: '2rem', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <LayoutTemplate size={22} /> {editingId ? 'Edit Rubric' : 'Create Rubric'}
                            </h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!editingId && (
                                    <button type="button" onClick={() => setShowCopyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(188,19,254,0.15)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                        <Copy size={14} /> Copy Existing Rubric
                                    </button>
                                )}
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                        </div>

                        <form className="modal-form" onSubmit={handleSave}>
                            {/* Meta Data */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '2rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Rubric Name <span style={{color: '#ff1b6b'}}>*</span></label>
                                    <input name="name" value={formMeta.name} onChange={handleMetaChange} required placeholder="e.g. OOP Project Evaluation" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Rubric Type</label>
                                    <select name="rubricType" value={formMeta.rubricType} onChange={handleMetaChange} style={inputStyle}>
                                        {RUBRIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Assessment Scope</label>
                                    <select name="assessmentType" value={formMeta.assessmentType} onChange={handleMetaChange} style={inputStyle}>
                                        {ASSESSMENT_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Session</label>
                                    <select name="session" value={formMeta.session} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Session</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Semester</label>
                                    <select name="semester" value={formMeta.semester} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Semester</option>
                                        {semesters.map(s => <option key={s._id} value={s._id}>{s.name} {s.year}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Department</label>
                                    <select name="department" value={formMeta.department} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Program</label>
                                    <select name="program" value={formMeta.program} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Program</option>
                                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Course</label>
                                    <select name="course" value={formMeta.course} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Course</option>
                                        {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Section</label>
                                    <select name="section" value={formMeta.section} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Section</option>
                                        {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Teacher</label>
                                    <select name="teacher" value={formMeta.teacher} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Version</label>
                                    <input type="number" name="version" value={formMeta.version} onChange={handleMetaChange} min="1" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select name="status" value={formMeta.status} onChange={handleMetaChange} style={inputStyle}>
                                        <option>Draft</option><option>Submitted</option><option>Approved</option><option>Rejected</option><option>Archived</option>
                                    </select>
                                </div>
                            </div>

                            {/* Matrix Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 5px', color: '#fff' }}>Evaluation Criteria Matrix</h4>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Define what constitutes performance levels (Excellent=4, Good=3, Satisfactory=2, Poor=1) for each criterion.</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: 'rgba(15,240,252,0.1)', padding: '6px 12px', borderRadius: '6px', color: '#0ff0fc', fontWeight: 'bold' }}>Total: {totalMarks} Marks</div>
                                    <button type="button" onClick={handleAddCriterion} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(80,204,127,0.15)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}><Plus size={14}/> Add Criterion</button>
                                </div>
                            </div>
                            
                            {/* Matrix Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '2rem' }}>
                                {criteria.map((c, idx) => (
                                    <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                                                <div style={{ flex: 2 }}>
                                                    <label style={labelStyle}>Criterion Name</label>
                                                    <input value={c.name} onChange={e => handleCriterionChange(idx, 'name', e.target.value)} required placeholder="e.g. Code Quality" style={inputStyle} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>Max Marks</label>
                                                    <input type="number" min="0" value={c.marks} onChange={e => handleCriterionChange(idx, 'marks', e.target.value)} required style={inputStyle} />
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveCriterion(idx)} style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: '#ff1b6b', borderRadius: '8px', cursor: 'pointer', padding: '10px', marginTop: '22px' }}><Trash2 size={16}/></button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '5px' }}>
                                            <div>
                                                <div style={{ color: '#50cc7f', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Excellent (4)</div>
                                                <textarea value={c.descriptions.excellent} onChange={e => handleDescriptionChange(idx, 'excellent', e.target.value)} placeholder="Description..." style={textAreaStyle} required />
                                            </div>
                                            <div>
                                                <div style={{ color: '#0ff0fc', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Good (3)</div>
                                                <textarea value={c.descriptions.good} onChange={e => handleDescriptionChange(idx, 'good', e.target.value)} placeholder="Description..." style={textAreaStyle} required />
                                            </div>
                                            <div>
                                                <div style={{ color: '#ff9800', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Satisfactory (2)</div>
                                                <textarea value={c.descriptions.satisfactory} onChange={e => handleDescriptionChange(idx, 'satisfactory', e.target.value)} placeholder="Description..." style={textAreaStyle} required />
                                            </div>
                                            <div>
                                                <div style={{ color: '#ff1b6b', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Poor (1)</div>
                                                <textarea value={c.descriptions.poor} onChange={e => handleDescriptionChange(idx, 'poor', e.target.value)} placeholder="Description..." style={textAreaStyle} required />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {criteria.length === 0 && (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>No criteria added yet. Click "Add Criterion" to start building your rubric matrix.</div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading} className="primary-btn">
                                    {loading ? <Loader2 className="spin" size={16} /> : <><Save size={16} /> {editingId ? 'Update Rubric' : 'Save Rubric'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Copy Modal ── */}
            {showCopyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="glass-panel-dash" style={{ width: '500px', padding: '2rem', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> Copy Previous Rubric</h3>
                            <button onClick={() => setShowCopyModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleCopy}>
                            <div style={{ marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '10px' }}>
                                <label style={labelStyle}>Select Source Rubric to Clone</label>
                                <select value={copyTargetId} onChange={e => setCopyTargetId(e.target.value)} required style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select a rubric...</option>
                                    {rubrics.map(r => (
                                        <option key={r._id} value={r._id}>{r.name} ({r.rubricType})</option>
                                    ))}
                                </select>

                                <label style={labelStyle}>New Rubric Name <span style={{color: '#ff1b6b'}}>*</span></label>
                                <input value={formMeta.name} onChange={e => setFormMeta({...formMeta, name: e.target.value})} placeholder="e.g. Web Dev Project Rubric v2" required style={{...inputStyle, marginBottom: '1rem'}} />

                                <label style={labelStyle}>New Session</label>
                                <select value={formMeta.session} onChange={e => setFormMeta({...formMeta, session: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>

                                <label style={labelStyle}>New Semester</label>
                                <select value={formMeta.semester} onChange={e => setFormMeta({...formMeta, semester: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s._id} value={s._id}>{s.name} {s.year}</option>)}
                                </select>

                                <label style={labelStyle}>New Department</label>
                                <select value={formMeta.department} onChange={e => setFormMeta({...formMeta, department: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>

                                <label style={labelStyle}>New Program</label>
                                <select value={formMeta.program} onChange={e => setFormMeta({...formMeta, program: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Program</option>
                                    {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>

                                <label style={labelStyle}>New Course</label>
                                <select value={formMeta.course} onChange={e => setFormMeta({...formMeta, course: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                                </select>

                                <label style={labelStyle}>New Section</label>
                                <select value={formMeta.section} onChange={e => setFormMeta({...formMeta, section: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>

                                <label style={labelStyle}>New Teacher</label>
                                <select value={formMeta.teacher} onChange={e => setFormMeta({...formMeta, teacher: e.target.value})} style={{...inputStyle, marginBottom: '1rem'}}>
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowCopyModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading || !copyTargetId || !formMeta.name} className="primary-btn">
                                    <Copy size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Copy & Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RubricsManagement;
