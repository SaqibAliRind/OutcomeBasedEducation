import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Trash2, CheckCircle, Save, GitMerge, FileSpreadsheet, Lock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TeacherQuestionMapping = ({ initialCourseId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
    
    // Dropdown data
    const [assessments, setAssessments] = useState([]);
    const [clos, setClos] = useState([]);
    const [plos, setPlos] = useState([]);
    const [gas, setGas] = useState([]);

    const [selectedAssessment, setSelectedAssessment] = useState('');
    
    // Current mapping being edited
    const [mapping, setMapping] = useState(null);
    const [questions, setQuestions] = useState([]);
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
        axios.get(`${API}/plos`, { headers: hdrs }).then(r => setPlos(r.data)).catch(console.error);
        axios.get(`${API}/gas`, { headers: hdrs }).then(r => setGas(r.data)).catch(console.error);
    }, []);

    // Load Assessments & Existing Mapping
    useEffect(() => {
        if (!selectedCourse) return;
        setLoading(true);
        
        // Find a course offering that matches selectedCourse to get its semester/section (used loosely if needed)
        const offering = courses.find(c => c.course?._id === selectedCourse);

        // Fetch all assessments globally or for this course
        axios.get(`${API}/assessments-def?course=${selectedCourse}`, { headers: hdrs })
            .then(r => setAssessments(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedCourse, courses]);

    // Load Mapping for selected Assessment
    useEffect(() => {
        if (!selectedCourse || !selectedAssessment) return;
        setLoading(true);
        axios.get(`${API}/question-mappings?course=${selectedCourse}&assessment=${selectedAssessment}&teacher=${user._id}`, { headers: hdrs })
            .then(r => {
                if (r.data.length > 0) {
                    setMapping(r.data[0]);
                    setQuestions(r.data[0].questions || []);
                } else {
                    setMapping(null);
                    setQuestions([]);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedAssessment, selectedCourse, user._id]);

    const addQuestionRow = () => {
        setQuestions([...questions, {
            questionNumber: `Q${questions.length + 1}`,
            marks: 5,
            clo: '', plo: '', ga: '',
            btLevel: 'Remember', actionVerb: '', difficulty: 'Medium'
        }]);
    };

    const removeRow = (idx) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const updateRow = (idx, field, val) => {
        const newQ = [...questions];
        newQ[idx][field] = val;
        
        if (field === 'clo') {
            const selectedCLO = clos.find(c => c._id === val);
            if (selectedCLO) {
                // Auto-select PLO if only 1 exists
                if (selectedCLO.plos && selectedCLO.plos.length === 1) {
                    newQ[idx].plo = selectedCLO.plos[0].plo?._id || selectedCLO.plos[0].plo;
                } else {
                    newQ[idx].plo = '';
                }
                
                // Auto-select GA if only 1 exists
                if (selectedCLO.gas && selectedCLO.gas.length === 1) {
                    newQ[idx].ga = selectedCLO.gas[0].ga?._id || selectedCLO.gas[0].ga;
                } else {
                    newQ[idx].ga = '';
                }
                
                // Auto-select BT Level
                if (selectedCLO.bloomsLevel) {
                    newQ[idx].btLevel = selectedCLO.bloomsLevel;
                }
            }
        }
        
        setQuestions(newQ);
    };

    const handleSave = async (status = 'Draft') => {
        if (!selectedAssessment) return showToast('Select Assessment', 'error');
        if (questions.length === 0) return showToast('Add at least one question', 'error');

        // Validation
        const currAss = assessments.find(a => a._id === selectedAssessment);
        const totalQMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);
        if (currAss && totalQMarks !== currAss.totalMarks) {
            return showToast(`Total marks mapped (${totalQMarks}) do not match assessment max marks (${currAss.totalMarks})`, 'error');
        }

        try {
            const cleanedQuestions = questions.map(q => {
                const copy = { ...q };
                if (!copy.clo) delete copy.clo;
                if (!copy.plo) delete copy.plo;
                if (!copy.ga) delete copy.ga;
                return copy;
            });

            const offering = courses.find(c => c.course?._id === selectedCourse);
            const payload = {
                course: selectedCourse,
                semester: offering?.semester?._id || offering?.semester,
                section: offering?.section?._id || offering?.section,
                teacher: user._id,
                assessment: selectedAssessment,
                questions: cleanedQuestions,
                status
            };

            // Assuming we just want to create or update. If mapping exists, PUT, else POST.
            if (mapping) {
                await axios.put(`${API}/question-mappings/${mapping._id}`, payload, { headers: hdrs });
                showToast(`Mapping updated to ${status}`);
            } else {
                await axios.post(`${API}/question-mappings`, payload, { headers: hdrs });
                showToast(`Mapping created as ${status}`);
            }
            
            // Reload
            const r = await axios.get(`${API}/question-mappings?course=${selectedCourse}&assessment=${selectedAssessment}&teacher=${user._id}`, { headers: hdrs });
            setMapping(r.data[0]);
        } catch (error) {
            showToast(error.response?.data?.message || 'Error saving mapping', 'error');
        }
    };

    const isLocked = mapping && ['Approved', 'Locked'].includes(mapping.status);
    const currAssessment = assessments.find(a => a._id === selectedAssessment) || {};
    const totalQMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <GitMerge size={22} color="#10B981" /> Question Mapping
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
                <div style={{ textAlign: 'center', padding: '3rem', color: '#10B981' }}>Loading mapping...</div>
            ) : !selectedCourse || !selectedAssessment ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Please select a course and assessment to manage its mapping.</div>
            ) : (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <div>
                            <h4 style={{ margin: 0, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {currAssessment.name} Mapping
                                {totalQMarks !== currAssessment.totalMarks && <span style={{ color: '#ff1b6b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 10 }}><AlertTriangle size={14} /> Mismatch: {totalQMarks}/{currAssessment.totalMarks}</span>}
                            </h4>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {mapping && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: isLocked ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: isLocked ? '#F59E0B' : '#10B981' }}>
                                    {isLocked ? <Lock size={14} /> : <CheckCircle size={14} />} {mapping.status}
                                </span>
                            )}
                            {!isLocked && (
                                <>
                                    <button onClick={() => handleSave('Draft')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                                        <Save size={16} /> Save Draft
                                    </button>
                                    <button onClick={() => handleSave('Submitted')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg, #10B981, #0ff0fc)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
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
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Q#</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Marks</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>CLO</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>PLO</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>GA</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>BT Level</th>
                                    <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Difficulty</th>
                                    {!isLocked && <th style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)' }}>Act</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {questions.map((q, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                        <td style={{ padding: '8px' }}>
                                            <input type="text" value={q.questionNumber} onChange={e => updateRow(i, 'questionNumber', e.target.value)} disabled={isLocked} style={{ width: '60px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <input type="number" value={q.marks} onChange={e => updateRow(i, 'marks', e.target.value)} disabled={isLocked} style={{ width: '60px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={q.clo?._id || q.clo} onChange={e => updateRow(i, 'clo', e.target.value)} disabled={isLocked} style={{ width: '100px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                <option value="">-</option>
                                                {clos.map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={q.plo?._id || q.plo} onChange={e => updateRow(i, 'plo', e.target.value)} disabled={isLocked} style={{ width: '100px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                <option value="">-</option>
                                                {plos.map(p => <option key={p._id} value={p._id}>{p.code}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={q.ga?._id || q.ga} onChange={e => updateRow(i, 'ga', e.target.value)} disabled={isLocked} style={{ width: '100px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                <option value="">-</option>
                                                {gas.map(g => <option key={g._id} value={g._id}>{g.code}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={q.btLevel} onChange={e => updateRow(i, 'btLevel', e.target.value)} disabled={isLocked} style={{ width: '110px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <select value={q.difficulty} onChange={e => updateRow(i, 'difficulty', e.target.value)} disabled={isLocked} style={{ width: '90px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                                {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
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
                        {questions.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>No questions mapped yet.</div>}
                    </div>

                    {!isLocked && (
                        <button onClick={addQuestionRow} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                            <Plus size={16} /> Add Question to Map
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherQuestionMapping;
