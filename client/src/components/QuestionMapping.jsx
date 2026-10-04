import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMappings, createMapping, updateMapping, deleteMapping, copyMapping, clearMappingMessages } from '../store/questionMappingSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchAssessments } from '../store/assessmentDefSlice';
import { fetchUsers } from '../store/userSlice';
import { fetchCLOs, fetchPLOs, fetchGAs } from '../store/obeSlice';
import { Plus, Edit2, Trash2, X, Loader2, Copy, Download, Network, Save, FileText } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };

// CSV export helper
const exportToCSV = (mapping) => {
    const headers = ['Q#', 'Marks', 'CLO', 'PLO', 'GA', 'BT Level', 'Action Verb', 'Difficulty Level'];
    const rows = mapping.questions.map(q => [
        q.questionNumber, q.marks,
        q.clo?.code || '', q.plo?.code || '', q.ga?.code || '',
        q.btLevel, q.actionVerb || '', q.difficulty
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Mapping_${mapping.course?.code}_${mapping.assessment?.name}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const QuestionMapping = () => {
    const dispatch = useDispatch();
    const { mappings, loading, error, successMessage } = useSelector(s => s.questionMappings);
    const { records: { courses = [], semesters = [], sessions = [], departments = [], programs = [], sections = [] } } = useSelector(s => s.academic);
    const { usersList = [] } = useSelector(s => s.users);
    const teachers = usersList.filter(u => u.role === 'Teacher');
    const { assessments = [] } = useSelector(s => s.assessmentDef);
    const { clos = [], plos = [], gas = [] } = useSelector(s => s.obe);

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCopyModal, setShowCopyModal] = useState(false);

    // Form state for mapping metadata
    const [formMeta, setFormMeta] = useState({ course: '', teacher: '', session: '', semester: '', department: '', program: '', section: '', assessment: '', version: 1, status: 'Draft' });
    // Form state for questions array
    const [questions, setQuestions] = useState([]);
    
    // Copy state
    const [copyTargetId, setCopyTargetId] = useState('');

    useEffect(() => {
        dispatch(fetchMappings());
        dispatch(fetchAcademicData('courses'));
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchUsers());
        dispatch(fetchAssessments());
        dispatch(fetchCLOs());
        dispatch(fetchPLOs());
        dispatch(fetchGAs());
        return () => dispatch(clearMappingMessages());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) { setToast({ msg: successMessage, type: 'success' }); setTimeout(() => setToast(null), 4000); dispatch(clearMappingMessages()); setShowModal(false); setShowCopyModal(false); }
        if (error) { setToast({ msg: error, type: 'error' }); setTimeout(() => setToast(null), 5000); dispatch(clearMappingMessages()); }
    }, [successMessage, error]);

    const filtered = useMemo(() => mappings.filter(m => {
        const text = `${m.course?.code} ${m.course?.name} ${m.teacher?.name} ${m.assessment?.name} ${m.semester?.name}`.toLowerCase();
        return !search || text.includes(search.toLowerCase());
    }), [mappings, search]);

    const handleMetaChange = (e) => setFormMeta(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleAddRow = () => {
        setQuestions([...questions, { questionNumber: `Q${questions.length + 1}`, marks: 5, clo: '', plo: '', ga: '', btLevel: 'Understand', actionVerb: '', difficulty: 'Medium' }]);
    };
    
    const handleRemoveRow = (idx) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const handleRowChange = (idx, field, value) => {
        const updated = [...questions];
        updated[idx][field] = value;
        setQuestions(updated);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = { ...formMeta, questions };
        if (editingId) dispatch(updateMapping({ id: editingId, payload }));
        else dispatch(createMapping(payload));
    };

    const handleEdit = (m) => {
        setEditingId(m._id);
        setFormMeta({
            course: m.course?._id || '', teacher: m.teacher?._id || '',
            session: m.session?._id || '', semester: m.semester?._id || '',
            department: m.department?._id || '', program: m.program?._id || '',
            section: m.section?._id || '', assessment: m.assessment?._id || '',
            version: m.version || 1, status: m.status || 'Draft'
        });
        setQuestions(m.questions.map(q => ({
            questionNumber: q.questionNumber, marks: q.marks,
            clo: q.clo?._id || '', plo: q.plo?._id || '', ga: q.ga?._id || '',
            btLevel: q.btLevel, actionVerb: q.actionVerb || '', difficulty: q.difficulty
        })));
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this mapping permanently?')) dispatch(deleteMapping(id));
    };

    const handleCopy = (e) => {
        e.preventDefault();
        if (!copyTargetId) return alert('Select a source mapping to copy from');
        dispatch(copyMapping({
            sourceMappingId: copyTargetId,
            newCourse: formMeta.course, newTeacher: formMeta.teacher,
            newSession: formMeta.session, newSemester: formMeta.semester,
            newDepartment: formMeta.department, newProgram: formMeta.program,
            newSection: formMeta.section, newAssessment: formMeta.assessment
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
                        <Network size={28} color="#0ff0fc" /> Question Mapping
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Map specific assessment questions to CLO, PLO, GA, and Bloom's Levels per teacher.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { 
                        setEditingId(null); 
                        setFormMeta({ course: '', teacher: '', session: '', semester: '', department: '', program: '', section: '', assessment: '', version: 1, status: 'Draft' }); 
                        setQuestions([]); 
                        setShowModal(true); 
                    }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg, #0ff0fc, #0288d1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                        <Plus size={16} /> Add Mapping
                    </button>
                </div>
            </div>

            {/* Grid display */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by course code, teacher, semester, assessment..." style={{ ...inputStyle, maxWidth: '400px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading && mappings.length === 0 ? (
                    <div style={{ padding: '3rem', width: '100%', gridColumn: '1/-1', display: 'flex', justifyContent: 'center' }}><Loader2 className="spin" size={32} color="#0ff0fc" /></div>
                ) : filtered.map(m => (
                    <div key={m._id} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.2rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px', color: '#0ff0fc', fontSize: '1.2rem' }}>{m.course?.code} - {m.assessment?.name}</h3>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                    {m.teacher?.name} | {m.semester?.name} | Sec: {m.section?.name || '—'}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ background: m.status === 'Approved' ? 'rgba(80,204,127,0.1)' : 'rgba(255,152,0,0.1)', color: m.status === 'Approved' ? '#50cc7f' : '#ff9800', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{m.status}</span>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '4px' }}>v{m.version || 1}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Mapping Matrix</div>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ color: '#bc13fe', textAlign: 'left' }}>
                                            <th style={{ paddingBottom: '4px' }}>Q#</th>
                                            <th style={{ paddingBottom: '4px' }}>CLO</th>
                                            <th style={{ paddingBottom: '4px' }}>PLO</th>
                                            <th style={{ paddingBottom: '4px' }}>GA</th>
                                            <th style={{ paddingBottom: '4px' }}>BT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {m.questions.map((q, i) => (
                                            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '4px 0', color: '#fff', fontWeight: '600' }}>{q.questionNumber}</td>
                                                <td style={{ padding: '4px 0', color: 'rgba(255,255,255,0.7)' }}>{q.clo?.code}</td>
                                                <td style={{ padding: '4px 0', color: 'rgba(255,255,255,0.7)' }}>{q.plo?.code}</td>
                                                <td style={{ padding: '4px 0', color: 'rgba(255,255,255,0.7)' }}>{q.ga?.code}</td>
                                                <td style={{ padding: '4px 0', color: 'rgba(255,255,255,0.7)' }}>{q.btLevel?.substring(0,3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem', gap: '8px' }}>
                            <button onClick={() => exportToCSV(m)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}><Download size={14}/> Export</button>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleEdit(m)} style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(m._id)} style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash" style={{ width: '90vw', maxWidth: '1200px', padding: '2rem', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Network size={22} /> {editingId ? 'Edit Question Mapping' : 'Create Question Mapping'}
                            </h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!editingId && (
                                    <button type="button" onClick={() => setShowCopyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(188,19,254,0.15)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                        <Copy size={14} /> Copy Previous Mapping
                                    </button>
                                )}
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                        </div>

                        <form className="modal-form" onSubmit={handleSave}>
                            {/* Meta Data */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '2rem' }}>
                                <div>
                                    <label style={labelStyle}>Session</label>
                                    <select name="session" value={formMeta.session} onChange={handleMetaChange} style={inputStyle}>
                                        <option value="">Select Session</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Semester <span style={{color: '#ff1b6b'}}>*</span></label>
                                    <select name="semester" value={formMeta.semester} onChange={handleMetaChange} required style={inputStyle}>
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
                                    <label style={labelStyle}>Course <span style={{color: '#ff1b6b'}}>*</span></label>
                                    <select name="course" value={formMeta.course} onChange={handleMetaChange} required style={inputStyle}>
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
                                    <label style={labelStyle}>Teacher <span style={{color: '#ff1b6b'}}>*</span></label>
                                    <select name="teacher" value={formMeta.teacher} onChange={handleMetaChange} required style={inputStyle}>
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Assessment <span style={{color: '#ff1b6b'}}>*</span></label>
                                    <select name="assessment" value={formMeta.assessment} onChange={handleMetaChange} required style={inputStyle}>
                                        <option value="">Select Assessment</option>
                                        {assessments.filter(a => formMeta.course ? a.course?._id === formMeta.course : true).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
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

                            {/* Questions Grid */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: '#fff' }}>Mapping Matrix ({questions.length} questions)</h4>
                                    <button type="button" onClick={handleAddRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(80,204,127,0.15)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}><Plus size={14}/> Add Row</button>
                                </div>
                                
                                <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                {['Q#', 'Marks', 'CLO', 'PLO', 'GA', 'BT Level', 'Action Verb', 'Difficulty', ''].map(h => (
                                                    <th key={h} style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {questions.map((q, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '8px' }}><input value={q.questionNumber} onChange={e => handleRowChange(idx, 'questionNumber', e.target.value)} required style={{ ...inputStyle, padding: '8px', minWidth: '60px' }} placeholder="Q1" /></td>
                                                    <td style={{ padding: '8px' }}><input type="number" min="0" value={q.marks} onChange={e => handleRowChange(idx, 'marks', e.target.value)} required style={{ ...inputStyle, padding: '8px', width: '60px' }} /></td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={q.clo} onChange={e => handleRowChange(idx, 'clo', e.target.value)} required style={{ ...inputStyle, padding: '8px', minWidth: '100px' }}>
                                                            <option value="">Select CLO</option>
                                                            {clos.filter(c => formMeta.course ? (c.course?._id || c.course) === formMeta.course : true).map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={q.plo} onChange={e => handleRowChange(idx, 'plo', e.target.value)} required style={{ ...inputStyle, padding: '8px', minWidth: '100px' }}>
                                                            <option value="">Select PLO</option>
                                                            {plos.map(p => <option key={p._id} value={p._id}>{p.code}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={q.ga} onChange={e => handleRowChange(idx, 'ga', e.target.value)} required style={{ ...inputStyle, padding: '8px', minWidth: '100px' }}>
                                                            <option value="">Select GA</option>
                                                            {gas.map(g => <option key={g._id} value={g._id}>{g.code}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={q.btLevel} onChange={e => handleRowChange(idx, 'btLevel', e.target.value)} required style={{ ...inputStyle, padding: '8px', minWidth: '120px' }}>
                                                            {BLOOMS.map(b => <option key={b}>{b}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}><input value={q.actionVerb} onChange={e => handleRowChange(idx, 'actionVerb', e.target.value)} placeholder="e.g. Design" style={{ ...inputStyle, padding: '8px', minWidth: '100px' }} /></td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={q.difficulty} onChange={e => handleRowChange(idx, 'difficulty', e.target.value)} required style={{ ...inputStyle, padding: '8px', minWidth: '90px' }}>
                                                            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <button type="button" onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer', padding: '4px' }}><X size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {questions.length === 0 && (
                                                <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No questions added yet. Click "Add Row".</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading} className="primary-btn">
                                    {loading ? <Loader2 className="spin" size={16} /> : <><Save size={16} /> {editingId ? 'Update Mapping' : 'Save Mapping'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Copy Mapping Modal ── */}
            {showCopyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="glass-panel-dash" style={{ width: '500px', padding: '2rem', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> Copy Previous Mapping</h3>
                            <button onClick={() => setShowCopyModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Select a previous mapping to clone its matrix to the current setup:
                            <br/><strong style={{color: '#fff'}}>{formMeta.course ? courses.find(c=>c._id===formMeta.course)?.code : 'N/A'} - {formMeta.assessment ? assessments.find(a=>a._id===formMeta.assessment)?.name : 'N/A'}</strong>
                        </p>
                        <form className="modal-form" onSubmit={handleCopy}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Source Mapping</label>
                                <select value={copyTargetId} onChange={e => setCopyTargetId(e.target.value)} required style={inputStyle}>
                                    <option value="">Select a mapping...</option>
                                    {mappings.map(m => (
                                        <option key={m._id} value={m._id}>{m.semester?.name} | {m.course?.code} | {m.teacher?.name} | {m.assessment?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowCopyModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading || !copyTargetId || !formMeta.course || !formMeta.teacher || !formMeta.semester || !formMeta.assessment} className="primary-btn">
                                    {loading ? <Loader2 className="spin" size={16} /> : <><Copy size={15} /> Copy & Save</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionMapping;
