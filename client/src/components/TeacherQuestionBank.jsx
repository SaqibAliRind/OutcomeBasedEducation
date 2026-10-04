import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, Filter, Edit2, Trash2, Archive, CheckCircle, Clock, FileText, Database, Code, Activity, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const emptyForm = {
    text: '', type: 'MCQ', chapter: '', topic: '', difficultyLevel: 'Medium', marks: 1,
    clo: '', plo: '', ga: '', btLevel: 'BT1', actionVerb: '', targetOutcome: ''
};

const TeacherQuestionBank = ({ initialCourseId = '' }) => {
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [questions, setQuestions] = useState([]);
    const [stats, setStats] = useState(null);
    const [courses, setCourses] = useState([]);
    
    const [filterCourse, setFilterCourse] = useState(initialCourseId);
    const [filterType, setFilterType] = useState('');
    const [search, setSearch] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        axios.get(`${API}/teachers/courses`, { headers: hdrs })
            .then(r => setCourses(r.data || []))
            .catch(() => {});
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/questions`, {
                headers: hdrs,
                params: { course: filterCourse || undefined }
            });
            setQuestions(res.data);
            
            const sRes = await axios.get(`${API}/questions/stats`, {
                headers: hdrs,
                params: { course: filterCourse || undefined }
            });
            setStats(sRes.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadQuestions();
    }, [filterCourse]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.text || !form.course) return showToast('Please enter question text and select a course', 'error');
        try {
            if (editingId) {
                await axios.put(`${API}/questions/${editingId}`, form, { headers: hdrs });
                showToast('Question updated (Version tracked)');
            } else {
                await axios.post(`${API}/questions`, form, { headers: hdrs });
                showToast('Question added');
            }
            setShowModal(false);
            loadQuestions();
        } catch (error) {
            showToast(error.response?.data?.message || 'Error saving question', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete/Archive this question?')) return;
        try {
            await axios.delete(`${API}/questions/${id}`, { headers: hdrs });
            showToast('Question removed/archived');
            loadQuestions();
        } catch (error) {
            showToast('Error removing question', 'error');
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm, course: filterCourse || '' });
        setShowModal(true);
    };

    const openEdit = (q) => {
        setEditingId(q._id);
        setForm({ ...q, course: q.course?._id || q.course });
        setShowModal(true);
    };

    const filtered = questions.filter(q => {
        if (filterType && q.type !== filterType) return false;
        if (search && !q.text.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <Database size={22} color="#0ff0fc" /> Question Bank
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}>
                        <option value="">All Assigned Courses</option>
                        {[...new Map(courses.map(c => [c.course._id, c.course])).values()].map(c => (
                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                    <button onClick={openCreate} className="primary-btn">
                        <Plus size={16} /> Add Question
                    </button>
                </div>
            </div>

            {/* Dashboard Stats */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total', val: stats.total, color: '#0ff0fc' },
                        { label: 'Active', val: stats.active, color: '#10B981' },
                        { label: 'Archived', val: stats.archived, color: '#F59E0B' },
                        { label: 'MCQs', val: stats.mcq, color: '#bc13fe' },
                        { label: 'Subjective', val: stats.subjective, color: '#8B5CF6' },
                        { label: 'Coding', val: stats.coding, color: '#ff6b35' }
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.4)' }} />
                    <input type="text" placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                    <option value="">All Types</option>
                    {['MCQ', 'True/False', 'Fill in the Blank', 'Short Question', 'Long Question', 'Coding Question', 'Practical Question'].map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#0ff0fc' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>No questions found in the bank.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered.map(q => (
                        <div key={q._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.2rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', fontSize: '0.7rem', fontWeight: 'bold' }}>{q.type}</span>
                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(188,19,254,0.1)', color: '#bc13fe', fontSize: '0.7rem', fontWeight: 'bold' }}>{q.btLevel || 'N/A'}</span>
                                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: q.difficultyLevel === 'Hard' ? 'rgba(255,27,107,0.1)' : q.difficultyLevel === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: q.difficultyLevel === 'Hard' ? '#ff1b6b' : q.difficultyLevel === 'Medium' ? '#F59E0B' : '#10B981', fontSize: '0.7rem', fontWeight: 'bold' }}>{q.difficultyLevel || 'Medium'}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: 10 }}>v{q.version}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => openEdit(q)} style={{ background: 'none', border: 'none', color: '#0ff0fc', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(q._id)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.5', margin: '0.5rem 0' }}>
                                {q.text}
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>
                                <span>Marks: <b style={{ color: '#fff' }}>{q.marks}</b></span>
                                {q.clo && <span>CLO: <b style={{ color: '#fff' }}>{q.clo}</b></span>}
                                {q.chapter && <span>Chapter: <b style={{ color: '#fff' }}>{q.chapter}</b></span>}
                                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: q.status === 'Approved' ? '#10B981' : q.status === 'Archived' ? '#F59E0B' : '#0ff0fc' }}>
                                    {q.status === 'Approved' ? <CheckCircle size={14} /> : q.status === 'Archived' ? <Archive size={14} /> : <Clock size={14} />} {q.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#1a1a2e', borderRadius: '16px', border: '1px solid rgba(15,240,252,0.2)', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', color: '#0ff0fc' }}>{editingId ? 'Edit Question' : 'Create Question'}</h2>
                        <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Course *</label>
                                    <select required value={form.course} onChange={e => setForm({...form, course: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        <option value="">Select Course...</option>
                                        {[...new Map(courses.map(c => [c.course._id, c.course])).values()].map(c => (
                                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Question Type *</label>
                                    <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        {['MCQ', 'True/False', 'Fill in the Blank', 'Short Question', 'Long Question', 'Coding Question', 'Numerical Question', 'Case Study', 'Practical Question', 'Viva Question'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Question Text *</label>
                                <textarea required value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Marks</label>
                                    <input type="number" min={1} value={form.marks} onChange={e => setForm({...form, marks: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Difficulty</label>
                                    <select value={form.difficultyLevel} onChange={e => setForm({...form, difficultyLevel: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        {['Easy', 'Medium', 'Hard'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Bloom's Tax. (BT)</label>
                                    <select value={form.btLevel} onChange={e => setForm({...form, btLevel: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        {['BT1', 'BT2', 'BT3', 'BT4', 'BT5', 'BT6'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Chapter / Unit</label>
                                    <input type="text" value={form.chapter} onChange={e => setForm({...form, chapter: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Mapped CLO</label>
                                    <input type="text" placeholder="e.g. CLO-1" value={form.clo} onChange={e => setForm({...form, clo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="primary-btn">{editingId ? 'Save Changes' : 'Add Question'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherQuestionBank;
