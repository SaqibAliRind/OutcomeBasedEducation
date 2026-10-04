import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettingsCategory } from '../store/settingsSlice';
import { GraduationCap, Plus, Trash2, Save, Edit2, Check, X, AlertTriangle, BookOpen, RefreshCw, FileQuestion, Loader2 } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const DEFAULT_SCALES = [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100, gpa: 4.00 },
    { grade: 'A',  minPercentage: 85, maxPercentage: 89,  gpa: 4.00 },
    { grade: 'A-', minPercentage: 80, maxPercentage: 84,  gpa: 3.70 },
    { grade: 'B+', minPercentage: 75, maxPercentage: 79,  gpa: 3.30 },
    { grade: 'B',  minPercentage: 70, maxPercentage: 74,  gpa: 3.00 },
    { grade: 'B-', minPercentage: 65, maxPercentage: 69,  gpa: 2.70 },
    { grade: 'C+', minPercentage: 60, maxPercentage: 64,  gpa: 2.30 },
    { grade: 'C',  minPercentage: 55, maxPercentage: 59,  gpa: 2.00 },
    { grade: 'D',  minPercentage: 50, maxPercentage: 54,  gpa: 1.00 },
    { grade: 'F',  minPercentage: 0,  maxPercentage: 49,  gpa: 0.00 },
];

const GradeManagement = () => {
    const dispatch = useDispatch();
    const { config, loading } = useSelector(s => s.settings);

    const [activeTab, setActiveTab] = useState('scales');
    const [scales, setScales] = useState(DEFAULT_SCALES);
    const [policies, setPolicies] = useState({ passingPercentage: 50, improvementPolicy: '', repeatCoursePolicy: '', incompleteGradePolicy: '' });

    const [editingIdx, setEditingIdx] = useState(null);
    const [editRow, setEditRow] = useState({});
    const [addingNew, setAddingNew] = useState(false);
    const [newRow, setNewRow] = useState({ grade: '', minPercentage: '', maxPercentage: '', gpa: '' });
    const [toast, setToast] = useState(null);

    useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

    useEffect(() => {
        if (config?.grades) {
            setScales(config.grades.scales?.length ? config.grades.scales : DEFAULT_SCALES);
            setPolicies({
                passingPercentage: config.grades.policies?.passingPercentage ?? 50,
                improvementPolicy: config.grades.policies?.improvementPolicy ?? '',
                repeatCoursePolicy: config.grades.policies?.repeatCoursePolicy ?? '',
                incompleteGradePolicy: config.grades.policies?.incompleteGradePolicy ?? ''
            });
        }
    }, [config]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const startEdit = (idx) => { setEditingIdx(idx); setEditRow({ ...scales[idx] }); setAddingNew(false); };
    const cancelEdit = () => { setEditingIdx(null); setEditRow({}); };
    const confirmEdit = () => {
        setScales(scales.map((s, i) => i === editingIdx ? { ...editRow, gpa: Number(editRow.gpa), minPercentage: Number(editRow.minPercentage), maxPercentage: Number(editRow.maxPercentage) } : s));
        setEditingIdx(null);
    };
    const deleteScale = (idx) => { if (window.confirm('Delete this grade?')) setScales(scales.filter((_, i) => i !== idx)); };
    const confirmAdd = () => {
        if (!newRow.grade.trim()) return alert('Grade letter required');
        setScales([...scales, { grade: newRow.grade.trim(), minPercentage: Number(newRow.minPercentage), maxPercentage: Number(newRow.maxPercentage), gpa: Number(newRow.gpa) }]);
        setNewRow({ grade: '', minPercentage: '', maxPercentage: '', gpa: '' });
        setAddingNew(false);
    };
    const resetToDefaults = () => { if (window.confirm('Reset to default grade scale?')) setScales(DEFAULT_SCALES); };
    const saveScales = async () => { await dispatch(updateSettingsCategory({ category: 'grades', data: { scales } })); showToast('Grade Scales saved!'); };
    const savePolicies = async () => { await dispatch(updateSettingsCategory({ category: 'grades', data: { policies } })); showToast('Grade Policies saved!'); };

    const gpaColor = (gpa) => gpa >= 3.5 ? '#50cc7f' : gpa >= 2.5 ? '#0ff0fc' : gpa >= 1.0 ? '#ffcc00' : '#ff1b6b';

    const inputStyle = (w) => ({ width: w, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px 10px', color: '#fff' });

    return (
        <div style={{ padding: 0 }}>
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: toast.type === 'success' ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.15)', border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`, color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b', padding: '12px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(8px)', fontWeight: '600' }}>
                    {toast.type === 'success' ? <Check size={16}/> : <AlertTriangle size={16}/>} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(15,240,252,0.1)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(15,240,252,0.2)' }}>
                    <GraduationCap size={30} color="#0ff0fc"/>
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Grade Management</h1>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Configure grade scales, GPA mappings, and academic policies</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-wrapper">
                <button className={`tab-btn ${activeTab === 'scales' ? 'active' : ''}`} onClick={() => setActiveTab('scales')}>📊 Grade Scale</button>
                <button className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => setActiveTab('policies')}>📜 Grade Policies</button>
            </div>

            {/* ══ GRADE SCALE TAB ══ */}
            {activeTab === 'scales' && (
                <div className="fade-in">
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                        {/* Card Header */}
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontWeight: '700' }}>University Grade Scale</h3>
                                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>Percentage ranges and GPA equivalents used across all programs.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button onClick={resetToDefaults} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                    <RefreshCw size={14}/> Reset to Default
                                </button>
                                <button onClick={() => { setAddingNew(true); setEditingIdx(null); }} style={{ background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', color: '#0ff0fc', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                                    <Plus size={14}/> Add Grade
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(15,240,252,0.04)' }}>
                                        {['Grade', 'Min %', 'Max %', 'Range Bar', 'GPA', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Actions' ? 'center' : 'left', color: '#0ff0fc', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {scales.map((s, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            {editingIdx === idx ? (
                                                <>
                                                    <td style={{ padding: '10px 20px' }}><input value={editRow.grade} onChange={e => setEditRow({...editRow, grade: e.target.value})} style={{...inputStyle('60px'), fontWeight: '700', textAlign: 'center', borderColor: 'rgba(15,240,252,0.4)'}}/></td>
                                                    <td style={{ padding: '10px 20px' }}><input type="number" value={editRow.minPercentage} onChange={e => setEditRow({...editRow, minPercentage: e.target.value})} style={inputStyle('70px')}/></td>
                                                    <td style={{ padding: '10px 20px' }}><input type="number" value={editRow.maxPercentage} onChange={e => setEditRow({...editRow, maxPercentage: e.target.value})} style={inputStyle('70px')}/></td>
                                                    <td style={{ padding: '10px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{editRow.minPercentage}%–{editRow.maxPercentage}%</td>
                                                    <td style={{ padding: '10px 20px' }}><input type="number" step="0.01" value={editRow.gpa} onChange={e => setEditRow({...editRow, gpa: e.target.value})} style={inputStyle('70px')}/></td>
                                                    <td style={{ padding: '10px 20px', textAlign: 'center' }}>
                                                        <button onClick={confirmEdit} style={{ background: 'rgba(80,204,127,0.15)', border: 'none', color: '#50cc7f', padding: '6px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' }}><Check size={14}/></button>
                                                        <button onClick={cancelEdit} style={{ background: 'rgba(255,27,107,0.15)', border: 'none', color: '#ff1b6b', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><X size={14}/></button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{ background: `${gpaColor(s.gpa)}20`, border: `1px solid ${gpaColor(s.gpa)}40`, color: gpaColor(s.gpa), padding: '4px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '1rem', fontFamily: 'monospace' }}>{s.grade}</span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{s.minPercentage}%</td>
                                                    <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{s.maxPercentage}%</td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ height: '6px', width: '140px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                                                            <div style={{ position: 'absolute', left: `${s.minPercentage}%`, width: `${s.maxPercentage - s.minPercentage}%`, height: '100%', background: gpaColor(s.gpa), borderRadius: '3px' }}/>
                                                        </div>
                                                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', display: 'block', marginTop: '3px' }}>{s.minPercentage}–{s.maxPercentage}%</span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}><span style={{ color: gpaColor(s.gpa), fontWeight: '800', fontSize: '1.1rem' }}>{Number(s.gpa).toFixed(2)}</span></td>
                                                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                        <button onClick={() => startEdit(idx)} style={{ background: 'rgba(15,240,252,0.1)', border: 'none', color: '#0ff0fc', padding: '6px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' }} title="Edit"><Edit2 size={14}/></button>
                                                        <button onClick={() => deleteScale(idx)} style={{ background: 'rgba(255,27,107,0.1)', border: 'none', color: '#ff1b6b', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Delete"><Trash2 size={14}/></button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}

                                    {/* Add New Row */}
                                    {addingNew && (
                                        <tr style={{ background: 'rgba(15,240,252,0.03)', borderBottom: '1px solid rgba(15,240,252,0.1)' }}>
                                            <td style={{ padding: '12px 20px' }}><input value={newRow.grade} onChange={e => setNewRow({...newRow, grade: e.target.value})} placeholder="A+" style={{...inputStyle('60px'), borderColor: 'rgba(15,240,252,0.4)', color: '#0ff0fc', fontWeight: '700', textAlign: 'center'}}/></td>
                                            <td style={{ padding: '12px 20px' }}><input type="number" value={newRow.minPercentage} onChange={e => setNewRow({...newRow, minPercentage: e.target.value})} placeholder="0" style={inputStyle('70px')}/></td>
                                            <td style={{ padding: '12px 20px' }}><input type="number" value={newRow.maxPercentage} onChange={e => setNewRow({...newRow, maxPercentage: e.target.value})} placeholder="100" style={inputStyle('70px')}/></td>
                                            <td style={{ padding: '12px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{newRow.minPercentage||'0'}%–{newRow.maxPercentage||'100'}%</td>
                                            <td style={{ padding: '12px 20px' }}><input type="number" step="0.01" value={newRow.gpa} onChange={e => setNewRow({...newRow, gpa: e.target.value})} placeholder="4.00" style={inputStyle('70px')}/></td>
                                            <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                <button onClick={confirmAdd} style={{ background: 'rgba(80,204,127,0.15)', border: 'none', color: '#50cc7f', padding: '6px', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' }}><Check size={14}/></button>
                                                <button onClick={() => setAddingNew(false)} style={{ background: 'rgba(255,27,107,0.15)', border: 'none', color: '#ff1b6b', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><X size={14}/></button>
                                            </td>
                                        </tr>
                                    )}
                                    {scales.length === 0 && !addingNew && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>No grade scales defined. Click "Add Grade" or "Reset to Default".</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1.2rem 2rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={saveScales} disabled={loading} className="primary-btn">
                                {loading ? <Loader2 size={18} className="spin"/> : <Save size={18}/>} Save Grade Scale
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ POLICIES TAB ══ */}
            {activeTab === 'policies' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                        { icon: <Check size={20} color="#50cc7f"/>, bg: 'rgba(80,204,127,0.08)', border: 'rgba(80,204,127,0.2)', title: 'Passing Percentage', subtitle: 'Minimum percentage a student must achieve to pass a course.',
                          content: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '1rem' }}>
                                  <input type="number" min="0" max="100" value={policies.passingPercentage} onChange={e => setPolicies({...policies, passingPercentage: Number(e.target.value)})}
                                      style={{ width: '100px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '1.1rem', fontWeight: '700', textAlign: 'center' }}/>
                                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem' }}>%</span>
                                  <div style={{ height: '8px', flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', maxWidth: '300px' }}>
                                      <div style={{ width: `${policies.passingPercentage}%`, height: '100%', background: 'linear-gradient(90deg,#50cc7f,#0ff0fc)', borderRadius: '4px', transition: 'width 0.4s ease' }}/>
                                  </div>
                              </div>
                          )
                        },
                        { icon: <BookOpen size={20} color="#bc13fe"/>, bg: 'rgba(188,19,254,0.06)', border: 'rgba(188,19,254,0.2)', title: 'Improvement Policy', subtitle: 'Rules for students attempting grade improvement exams.',
                          content: <textarea rows={4} value={policies.improvementPolicy} onChange={e => setPolicies({...policies, improvementPolicy: e.target.value})} placeholder="e.g. Students may appear in an improvement exam once within 1 year of passing the course..." style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}/>
                        },
                        { icon: <RefreshCw size={20} color="#ffcc00"/>, bg: 'rgba(255,204,0,0.06)', border: 'rgba(255,204,0,0.2)', title: 'Repeat Course Policy', subtitle: 'Rules for students who fail and need to repeat a course.',
                          content: <textarea rows={4} value={policies.repeatCoursePolicy} onChange={e => setPolicies({...policies, repeatCoursePolicy: e.target.value})} placeholder="e.g. Students who fail (F grade) must repeat the course. The new grade will replace the old one in GPA..." style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}/>
                        },
                        { icon: <FileQuestion size={20} color="#ff9800"/>, bg: 'rgba(255,152,0,0.06)', border: 'rgba(255,152,0,0.2)', title: 'Incomplete Grade Policy', subtitle: 'Policy for issuing and resolving an "Incomplete" (I) grade.',
                          content: <textarea rows={4} value={policies.incompleteGradePolicy} onChange={e => setPolicies({...policies, incompleteGradePolicy: e.target.value})} placeholder="e.g. An Incomplete (I) grade may be issued when a student cannot complete requirements due to documented emergency..." style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}/>
                        }
                    ].map((p, i) => (
                        <div key={i} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: '14px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>{p.icon}</div>
                                <div>
                                    <h4 style={{ margin: 0, color: '#fff', fontWeight: '700' }}>{p.title}</h4>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>{p.subtitle}</p>
                                </div>
                            </div>
                            {p.content}
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={savePolicies} disabled={loading} className="primary-btn">
                            {loading ? <Loader2 size={18} className="spin"/> : <Save size={18}/>} Save Policies
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeManagement;

