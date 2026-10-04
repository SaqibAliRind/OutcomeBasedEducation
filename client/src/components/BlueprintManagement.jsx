import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlueprints, createBlueprint, updateBlueprint, deleteBlueprint, copyBlueprint, clearBlueprintMessages } from '../store/blueprintSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchAssessments } from '../store/assessmentDefSlice';
import { fetchUsers } from '../store/userSlice';
import { fetchCLOs, fetchPLOs, fetchGAs } from '../store/obeSlice';
import { Plus, Edit2, Trash2, X, Loader2, Copy, Download, Save, Printer, BarChart2, CheckCircle2, Grid } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const inputStyle = { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '500' };

// CSV Export
const exportToCSV = (bp) => {
    const headers = ['Topic', 'CLO', 'BT Level', 'Questions', 'Marks'];
    const rows = bp.rows.map(r => [
        `"${r.topic}"`, r.clo?.code || '', r.bloomsLevel, r.questionCount, r.marks
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Blueprint_${bp.course?.code}_${bp.assessment?.name}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const BlueprintManagement = () => {
    const dispatch = useDispatch();
    const { blueprints, loading, error, successMessage } = useSelector(s => s.blueprints);
    const { records: { courses = [], sessions = [], semesters = [], departments = [], programs = [], sections = [] } } = useSelector(s => s.academic);
    const { users = [] } = useSelector(s => s.users);
    const teachers = users.filter(u => u.role === 'Teacher');
    const { assessments = [] } = useSelector(s => s.assessmentDef);
    const { clos = [], plos = [], gas = [] } = useSelector(s => s.obe);

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(null); // stores the blueprint being analyzed
    
    // Print ref
    const printRef = useRef(null);

    const [formMeta, setFormMeta] = useState({ course: '', session: '', semester: '', department: '', program: '', section: '', teacher: '', assessment: '', version: 1, totalQuestions: 0, totalMarks: 100, status: 'Draft' });
    const [rows, setRows] = useState([]);
    const [copyTargetId, setCopyTargetId] = useState('');

    useEffect(() => {
        dispatch(fetchBlueprints());
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
        return () => dispatch(clearBlueprintMessages());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) { setToast({ msg: successMessage, type: 'success' }); setTimeout(() => setToast(null), 4000); dispatch(clearBlueprintMessages()); setShowModal(false); setShowCopyModal(false); }
        if (error) { setToast({ msg: error, type: 'error' }); setTimeout(() => setToast(null), 5000); dispatch(clearBlueprintMessages()); }
    }, [successMessage, error]);

    const filtered = useMemo(() => blueprints.filter(b => {
        const text = `${b.course?.code} ${b.course?.name} ${b.teacher?.name} ${b.assessment?.name}`.toLowerCase();
        return !search || text.includes(search.toLowerCase());
    }), [blueprints, search]);

    const handleMetaChange = (e) => setFormMeta(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleAddRow = () => {
        setRows([...rows, { topic: '', clo: '', bloomsLevel: 'Understand', questionCount: 1, marks: 5 }]);
    };
    
    const handleRemoveRow = (idx) => {
        setRows(rows.filter((_, i) => i !== idx));
    };

    const handleRowChange = (idx, field, value) => {
        const updated = [...rows];
        updated[idx][field] = value;
        setRows(updated);
        
        // Auto-calculate totals
        const tQ = updated.reduce((sum, r) => sum + Number(r.questionCount || 0), 0);
        const tM = updated.reduce((sum, r) => sum + Number(r.marks || 0), 0);
        setFormMeta(f => ({ ...f, totalQuestions: tQ, totalMarks: tM }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = { ...formMeta, rows };
        if (editingId) dispatch(updateBlueprint({ id: editingId, payload }));
        else dispatch(createBlueprint(payload));
    };

    const handleEdit = (b) => {
        setEditingId(b._id);
        setFormMeta({
            course: b.course?._id || '', session: b.session?._id || '', semester: b.semester?._id || '',
            department: b.department?._id || '', program: b.program?._id || '', section: b.section?._id || '',
            teacher: b.teacher?._id || '', assessment: b.assessment?._id || '',
            totalQuestions: b.totalQuestions, totalMarks: b.totalMarks, version: b.version || 1, status: b.status || 'Draft'
        });
        setRows(b.rows.map(r => ({
            topic: r.topic, clo: r.clo?._id || '', bloomsLevel: r.bloomsLevel,
            questionCount: r.questionCount, marks: r.marks
        })));
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this blueprint permanently?')) dispatch(deleteBlueprint(id));
    };

    const handleCopy = (e) => {
        e.preventDefault();
        if (!copyTargetId) return alert('Select a source blueprint to copy from');
        dispatch(copyBlueprint({
            sourceBlueprintId: copyTargetId,
            newCourse: formMeta.course, newSession: formMeta.session, newSemester: formMeta.semester,
            newDepartment: formMeta.department, newProgram: formMeta.program, newSection: formMeta.section,
            newTeacher: formMeta.teacher, newAssessment: formMeta.assessment
        }));
    };

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Quick restore of React state
    };

    // Calculate Analysis data for a blueprint
    const getAnalysisData = (bp) => {
        const btCoverage = {};
        const cloCoverage = {};
        const topicCoverage = {};
        
        bp.rows.forEach(r => {
            btCoverage[r.bloomsLevel] = (btCoverage[r.bloomsLevel] || 0) + r.marks;
            const cloCode = r.clo?.code || 'Unmapped';
            cloCoverage[cloCode] = (cloCoverage[cloCode] || 0) + r.marks;
            topicCoverage[r.topic] = (topicCoverage[r.topic] || 0) + r.marks;
        });

        return { btCoverage, cloCoverage, topicCoverage };
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
                        <Grid size={28} color="#bc13fe" /> Table of Specification (Blueprint)
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Map assessment weightage across topics, CLOs, and Bloom's Levels for HEC/NCEAC compliance.</p>
                </div>
                <button onClick={() => { 
                    setEditingId(null); 
                    setFormMeta({ course: '', session: '', semester: '', department: '', program: '', section: '', teacher: '', assessment: '', version: 1, totalQuestions: 0, totalMarks: 100, status: 'Draft' }); 
                    setRows([]); 
                    setShowModal(true); 
                }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg, #bc13fe, #7c3aed)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                    <Plus size={16} /> Create Blueprint
                </button>
            </div>

            {/* Grid display */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by course, teacher, assessment..." style={{ ...inputStyle, maxWidth: '400px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {loading && blueprints.length === 0 ? (
                    <div style={{ padding: '3rem', width: '100%', gridColumn: '1/-1', display: 'flex', justifyContent: 'center' }}><Loader2 className="spin" size={32} color="#bc13fe" /></div>
                ) : filtered.map(b => (
                    <div key={b._id} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.2rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 4px', color: '#0ff0fc', fontSize: '1.2rem' }}>{b.course?.code} - {b.assessment?.name}</h3>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{b.teacher?.name} | {b.semester?.name} | Sec: {b.section?.name || '—'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ background: b.status === 'Approved' ? 'rgba(80,204,127,0.1)' : 'rgba(255,152,0,0.1)', color: b.status === 'Approved' ? '#50cc7f' : '#ff9800', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{b.status}</span>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '4px' }}>v{b.version || 1}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div><div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)'}}>Total Marks</div><div style={{fontWeight: 'bold', color: '#fff'}}>{b.totalMarks}</div></div>
                            <div><div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)'}}>Questions</div><div style={{fontWeight: 'bold', color: '#fff'}}>{b.totalQuestions}</div></div>
                            <div><div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)'}}>Topics</div><div style={{fontWeight: 'bold', color: '#fff'}}>{new Set(b.rows.map(r=>r.topic)).size}</div></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.2rem', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => setShowAnalysis(b)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(188,19,254,0.15)', color: '#bc13fe', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}><BarChart2 size={14}/> Analysis</button>
                                <button onClick={() => exportToCSV(b)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}><Download size={14}/> Excel</button>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleEdit(b)} style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(b._id)} style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.25)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash" style={{ width: '90vw', maxWidth: '1000px', padding: '2rem', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Grid size={22} /> {editingId ? 'Edit Blueprint' : 'Create Blueprint'}
                            </h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!editingId && (
                                    <button type="button" onClick={() => setShowCopyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15,240,252,0.15)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                        <Copy size={14} /> Copy Previous
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
                                    <label style={labelStyle}>Questions</label>
                                    <input type="number" value={formMeta.totalQuestions} readOnly style={{ ...inputStyle, background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.6)' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Total Marks</label>
                                    <input type="number" value={formMeta.totalMarks} readOnly style={{ ...inputStyle, background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.6)' }} />
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

                            {/* Matrix Grid */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: '#fff' }}>Blueprint Matrix</h4>
                                    <button type="button" onClick={handleAddRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(80,204,127,0.15)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}><Plus size={14}/> Add Row</button>
                                </div>
                                
                                <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                {['Topic', 'CLO', 'BT Level', 'Questions', 'Marks', ''].map(h => (
                                                    <th key={h} style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '8px' }}><input value={r.topic} onChange={e => handleRowChange(idx, 'topic', e.target.value)} required placeholder="e.g. Arrays" style={inputStyle} /></td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={r.clo?._id || r.clo} onChange={e => handleRowChange(idx, 'clo', e.target.value)} required style={inputStyle}>
                                                            <option value="">Select CLO</option>
                                                            {clos.filter(c => formMeta.course ? c.course === formMeta.course : true).map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={r.bloomsLevel} onChange={e => handleRowChange(idx, 'bloomsLevel', e.target.value)} required style={inputStyle}>
                                                            {BLOOMS.map(b => <option key={b}>{b}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}><input type="number" min="1" value={r.questionCount} onChange={e => handleRowChange(idx, 'questionCount', e.target.value)} required style={{ ...inputStyle, width: '80px' }} /></td>
                                                    <td style={{ padding: '8px' }}><input type="number" min="0" value={r.marks} onChange={e => handleRowChange(idx, 'marks', e.target.value)} required style={{ ...inputStyle, width: '80px' }} /></td>
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <button type="button" onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer', padding: '4px' }}><X size={16}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {rows.length === 0 && (
                                                <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No topics mapped yet. Click "Add Row".</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading} className="primary-btn">
                                    {loading ? <Loader2 className="spin" size={16} /> : <><Save size={16} /> {editingId ? 'Update Blueprint' : 'Save Blueprint'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Analysis Dashboard Modal ── */}
            {showAnalysis && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto' }}>
                    <div ref={printRef} className="glass-panel-dash" style={{ width: '90vw', maxWidth: '800px', padding: '2rem', borderRadius: '16px', background: '#1a1f2e', color: '#fff', margin: '2rem 0' }}>
                        {/* Printable CSS overrides */}
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                .glass-panel-dash, .glass-panel-dash * { visibility: visible; }
                                .glass-panel-dash { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; background: white !important; color: black !important; }
                                .no-print { display: none !important; }
                                .print-bar { background-color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .print-text { color: black !important; }
                            }
                        `}</style>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                            <div>
                                <h2 className="print-text" style={{ margin: 0, color: '#bc13fe' }}>Table of Specification (Blueprint)</h2>
                                <p className="print-text" style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)' }}>{showAnalysis.course?.code} - {showAnalysis.assessment?.name} ({showAnalysis.semester?.name})</p>
                                <p className="print-text" style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Prepared by: {showAnalysis.teacher?.name}</p>
                            </div>
                            <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15,240,252,0.15)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: '600' }}><Printer size={16}/> Print / PDF</button>
                                <button onClick={() => setShowAnalysis(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Topic Coverage */}
                            <div>
                                <h4 className="print-text" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>Topic Coverage (Marks)</h4>
                                {Object.entries(getAnalysisData(showAnalysis).topicCoverage).map(([topic, marks]) => (
                                    <div key={topic} style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '2px' }}><span className="print-text">{topic}</span><span className="print-text">{marks} ({Math.round((marks/showAnalysis.totalMarks)*100)}%)</span></div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div className="print-bar" style={{ width: `${(marks/showAnalysis.totalMarks)*100}%`, height: '100%', background: '#bc13fe' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* BT Coverage */}
                            <div>
                                <h4 className="print-text" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>Bloom's Taxonomy Coverage</h4>
                                {Object.entries(getAnalysisData(showAnalysis).btCoverage).map(([bt, marks]) => (
                                    <div key={bt} style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '2px' }}><span className="print-text">{bt}</span><span className="print-text">{marks} ({Math.round((marks/showAnalysis.totalMarks)*100)}%)</span></div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div className="print-bar" style={{ width: `${(marks/showAnalysis.totalMarks)*100}%`, height: '100%', background: '#0ff0fc' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CLO Coverage */}
                            <div>
                                <h4 className="print-text" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>CLO Coverage</h4>
                                {Object.entries(getAnalysisData(showAnalysis).cloCoverage).map(([clo, marks]) => (
                                    <div key={clo} style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '2px' }}><span className="print-text">{clo}</span><span className="print-text">{marks} ({Math.round((marks/showAnalysis.totalMarks)*100)}%)</span></div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div className="print-bar" style={{ width: `${(marks/showAnalysis.totalMarks)*100}%`, height: '100%', background: '#50cc7f' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Overall Stats */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 className="print-text" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>Summary</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span className="print-text">Total Marks:</span> <strong className="print-text">{showAnalysis.totalMarks}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span className="print-text">Total Questions:</span> <strong className="print-text">{showAnalysis.totalQuestions}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span className="print-text">Status:</span> <strong className="print-text" style={{ color: showAnalysis.status === 'Finalized' ? '#50cc7f' : '#ff9800' }}>{showAnalysis.status}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Raw Matrix */}
                        <div style={{ marginTop: '2rem' }}>
                            <h4 className="print-text" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>Matrix Detail</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                        <th className="print-text" style={{ padding: '8px 4px' }}>Topic</th>
                                        <th className="print-text" style={{ padding: '8px 4px' }}>CLO</th>
                                        <th className="print-text" style={{ padding: '8px 4px' }}>BT Level</th>
                                        <th className="print-text" style={{ padding: '8px 4px' }}>Questions</th>
                                        <th className="print-text" style={{ padding: '8px 4px' }}>Marks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {showAnalysis.rows.map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td className="print-text" style={{ padding: '8px 4px' }}>{r.topic}</td>
                                            <td className="print-text" style={{ padding: '8px 4px' }}>{r.clo?.code}</td>
                                            <td className="print-text" style={{ padding: '8px 4px' }}>{r.bloomsLevel}</td>
                                            <td className="print-text" style={{ padding: '8px 4px' }}>{r.questionCount}</td>
                                            <td className="print-text" style={{ padding: '8px 4px' }}>{r.marks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ── Copy Modal ── */}
            {showCopyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div className="glass-panel-dash" style={{ width: '500px', padding: '2rem', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><Copy size={20} /> Copy Previous Blueprint</h3>
                            <button onClick={() => setShowCopyModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleCopy}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Source Blueprint</label>
                                <select value={copyTargetId} onChange={e => setCopyTargetId(e.target.value)} required style={inputStyle}>
                                    <option value="">Select a blueprint...</option>
                                    {blueprints.map(b => (
                                        <option key={b._id} value={b._id}>{b.course?.code} | {b.teacher?.name} | {b.assessment?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowCopyModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading || !copyTargetId || !formMeta.course || !formMeta.teacher || !formMeta.assessment} className="primary-btn">
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

export default BlueprintManagement;
