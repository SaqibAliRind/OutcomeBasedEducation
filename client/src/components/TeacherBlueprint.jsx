import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Trash2, CheckCircle, Save, Table2, Lock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TeacherBlueprint = ({ initialCourseId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
    
    // Dropdown data
    const [assessments, setAssessments] = useState([]);
    const [clos, setClos] = useState([]);

    const [selectedAssessment, setSelectedAssessment] = useState('');
    
    // Current Blueprint being edited
    const [blueprint, setBlueprint] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Initial Load
    useEffect(() => {
        axios.get(`${API}/teachers/courses`, { headers: hdrs })
            .then(r => setCourses(r.data || []))
            .catch(console.error);
        
        axios.get(`${API}/clos`, { headers: hdrs }).then(r => setClos(r.data)).catch(console.error);
    }, []);

    // Load Assessments when course changes
    useEffect(() => {
        if (!selectedCourse) return;
        axios.get(`${API}/assessments`, { headers: hdrs })
            .then(r => setAssessments(r.data))
            .catch(console.error);
    }, [selectedCourse]);

    // Load Blueprint for selected Assessment
    useEffect(() => {
        if (!selectedCourse || !selectedAssessment) return;
        setLoading(true);
        axios.get(`${API}/blueprints?course=${selectedCourse}&assessment=${selectedAssessment}&teacher=${user._id}`, { headers: hdrs })
            .then(r => {
                if (r.data.length > 0) {
                    setBlueprint(r.data[0]);
                    setRows(r.data[0].rows || []);
                } else {
                    setBlueprint(null);
                    setRows([]);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedAssessment, selectedCourse, user._id]);

    const addRow = () => {
        setRows([...rows, {
            topic: '',
            clo: '',
            bloomsLevel: 'Remember',
            questionCount: 1,
            marks: 5
        }]);
    };

    const removeRow = (idx) => {
        setRows(rows.filter((_, i) => i !== idx));
    };

    const updateRow = (idx, field, val) => {
        const newR = [...rows];
        newR[idx][field] = val;
        setRows(newR);
    };

    const handleSave = async (status = 'Draft') => {
        if (!selectedAssessment) return showToast('Select Assessment', 'error');
        if (rows.length === 0) return showToast('Add at least one row', 'error');
        if (rows.some(r => !r.topic || !r.clo)) return showToast('Topic and CLO are required for all rows', 'error');

        const currAss = assessments.find(a => a._id === selectedAssessment);
        const totalMarks = rows.reduce((sum, r) => sum + Number(r.marks), 0);
        const totalQuestions = rows.reduce((sum, r) => sum + Number(r.questionCount), 0);

        if (currAss && totalMarks !== currAss.totalMarks) {
            return showToast(`Total marks mapped (${totalMarks}) do not match assessment max marks (${currAss.totalMarks})`, 'error');
        }

        try {
            const payload = {
                course: selectedCourse,
                teacher: user._id,
                assessment: selectedAssessment,
                totalQuestions,
                totalMarks,
                rows,
                status
            };

            if (blueprint) {
                await axios.put(`${API}/blueprints/${blueprint._id}`, payload, { headers: hdrs });
                showToast(`Blueprint updated to ${status}`);
            } else {
                await axios.post(`${API}/blueprints`, payload, { headers: hdrs });
                showToast(`Blueprint created as ${status}`);
            }
            
            // Reload
            const r = await axios.get(`${API}/blueprints?course=${selectedCourse}&assessment=${selectedAssessment}&teacher=${user._id}`, { headers: hdrs });
            setBlueprint(r.data[0]);
        } catch (error) {
            showToast(error.response?.data?.message || 'Error saving blueprint', 'error');
        }
    };

    const isLocked = blueprint && ['Approved', 'Locked'].includes(blueprint.status);
    const currAssessment = assessments.find(a => a._id === selectedAssessment) || {};
    const totalQMarks = rows.reduce((sum, r) => sum + Number(r.marks || 0), 0);

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <Table2 size={22} color="#0ff0fc" /> Table of Specification (Blueprint)
                </h3>
            </div>

            {/* Selection Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Select Course</label>
                    <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        <option value="">-- Choose Course --</option>
                        {[...new Map(courses.map(c => [c.course._id, c.course])).values()].map(c => (
                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Select Assessment</label>
                    <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)} disabled={!selectedCourse} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        <option value="">-- Choose Assessment --</option>
                        {assessments.map(a => (
                            <option key={a._id} value={a._id}>{a.name} ({a.type}) - Max {a.totalMarks}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#0ff0fc' }}>Loading blueprint...</div>
            ) : !selectedCourse || !selectedAssessment ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Please select a course and assessment to view its blueprint.</div>
            ) : (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <div>
                            <h4 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {currAssessment.name} Blueprint
                                {totalQMarks !== currAssessment.totalMarks && <span style={{ color: '#ff1b6b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 10 }}><AlertTriangle size={14} /> Mismatch: {totalQMarks}/{currAssessment.totalMarks}</span>}
                            </h4>
                            {blueprint && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>v{blueprint.version}.0</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {blueprint && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: isLocked ? 'rgba(245,158,11,0.1)' : 'rgba(15,240,252,0.1)', color: isLocked ? '#F59E0B' : '#0ff0fc' }}>
                                    {isLocked ? <Lock size={14} /> : <CheckCircle size={14} />} {blueprint.status}
                                </span>
                            )}
                            {!isLocked && (
                                <>
                                    <button onClick={() => handleSave('Draft')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                                        <Save size={16} /> Save Draft
                                    </button>
                                    <button onClick={() => handleSave('Submitted')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg, #0ff0fc, #bc13fe)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                                        <CheckCircle size={16} /> Submit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Topic</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>CLO</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>BT Level</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Questions</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Marks</th>
                                    {!isLocked && <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Act</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                        <td style={{ padding: '8px' }}>
                                            <input type="text" placeholder="e.g. Arrays" value={r.topic} onChange={e => updateRow(i, 'topic', e.target.value)} disabled={isLocked} style={{ width: '180px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={r.clo?._id || r.clo} onChange={e => updateRow(i, 'clo', e.target.value)} disabled={isLocked} style={{ width: '100px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                <option value="">-</option>
                                                {clos.map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={r.bloomsLevel} onChange={e => updateRow(i, 'bloomsLevel', e.target.value)} disabled={isLocked} style={{ width: '130px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input type="number" min={1} value={r.questionCount} onChange={e => updateRow(i, 'questionCount', e.target.value)} disabled={isLocked} style={{ width: '80px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input type="number" min={0} value={r.marks} onChange={e => updateRow(i, 'marks', e.target.value)} disabled={isLocked} style={{ width: '80px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                        </td>
                                        {!isLocked && (
                                            <td style={{ padding: '8px' }}>
                                                <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rows.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>No blueprint rows added.</div>}
                    </div>

                    {!isLocked && (
                        <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                            <Plus size={16} /> Add Topic to Blueprint
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherBlueprint;
