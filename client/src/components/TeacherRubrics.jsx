import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Trash2, CheckCircle, Save, ClipboardCheck, Lock, Edit2, X } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const PERF_LEVELS = ['excellent', 'good', 'satisfactory', 'poor'];
const PERF_COLORS = { excellent: '#10B981', good: '#0ff0fc', satisfactory: '#F59E0B', poor: '#ff1b6b' };

const emptyRubric = () => ({
    name: '',
    rubricType: 'Lab Rubric',
    assessmentType: 'Lab',
    criteria: [
        { name: 'Logic', marks: 10, descriptions: { excellent: '', good: '', satisfactory: '', poor: '' } }
    ],
    status: 'Draft'
});

const TeacherRubrics = ({ initialCourseId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
    const [rubrics, setRubrics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyRubric());
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        axios.get(`${API}/teachers/courses`, { headers: hdrs })
            .then(r => setCourses(r.data || []))
            .catch(console.error);
    }, []);

    const fetchRubrics = () => {
        if (!selectedCourse) return;
        setLoading(true);
        const filter = selectedCourse ? `?course=${selectedCourse}` : '';
        axios.get(`${API}/rubrics${filter}`, { headers: hdrs })
            .then(r => setRubrics(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRubrics();
    }, [selectedCourse]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyRubric(), course: selectedCourse, teacher: user._id });
        setShowModal(true);
    };

    const openEdit = (r) => {
        setEditingId(r._id);
        setForm({
            name: r.name,
            rubricType: r.rubricType,
            assessmentType: r.assessmentType || 'Lab',
            course: r.course?._id || r.course || selectedCourse,
            teacher: user._id,
            criteria: r.criteria || [],
            status: r.status
        });
        setShowModal(true);
    };

    const handleSave = async (e, status = form.status) => {
        e.preventDefault();
        if (!form.name) return showToast('Rubric name required', 'error');
        if (form.criteria.length === 0) return showToast('Add at least one criterion', 'error');

        const totalMarks = form.criteria.reduce((s, c) => s + Number(c.marks || 0), 0);
        const payload = { ...form, totalMarks, status, course: selectedCourse, teacher: user._id };

        try {
            if (editingId) {
                await axios.put(`${API}/rubrics/${editingId}`, payload, { headers: hdrs });
                showToast('Rubric updated');
            } else {
                await axios.post(`${API}/rubrics`, payload, { headers: hdrs });
                showToast('Rubric created');
            }
            setShowModal(false);
            fetchRubrics();
        } catch (error) {
            showToast(error.response?.data?.message || 'Error saving rubric', 'error');
        }
    };

    const addCriterion = () => {
        setForm(f => ({
            ...f,
            criteria: [...f.criteria, { name: '', marks: 5, descriptions: { excellent: '', good: '', satisfactory: '', poor: '' } }]
        }));
    };

    const removeCriterion = (idx) => {
        setForm(f => ({ ...f, criteria: f.criteria.filter((_, i) => i !== idx) }));
    };

    const updateCriterion = (idx, field, val) => {
        const newC = [...form.criteria];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            newC[idx][parent] = { ...newC[idx][parent], [child]: val };
        } else {
            newC[idx][field] = val;
        }
        setForm(f => ({ ...f, criteria: newC }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this rubric?')) return;
        try {
            await axios.delete(`${API}/rubrics/${id}`, { headers: hdrs });
            showToast('Rubric deleted');
            fetchRubrics();
        } catch (error) {
            showToast('Error deleting rubric', 'error');
        }
    };

    const totalMarks = form.criteria.reduce((s, c) => s + Number(c.marks || 0), 0);

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <ClipboardCheck size={22} color="#F59E0B" /> Rubrics Management
                </h3>
                <button onClick={openCreate} className="primary-btn">
                    <Plus size={16} /> Create Rubric
                </button>
            </div>

            {/* Course filter */}
            <div style={{ marginBottom: '2rem' }}>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', minWidth: 280 }}>
                    <option value="">-- All Courses --</option>
                    {[...new Map(courses.map(c => [c.course._id, c.course])).values()].map(c => (
                        <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                    ))}
                </select>
            </div>

            {/* Rubrics List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#F59E0B' }}>Loading rubrics...</div>
            ) : rubrics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>No rubrics found. Create your first rubric.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                    {rubrics.map(r => {
                        const isLocked = ['Approved', 'Locked'].includes(r.status);
                        return (
                            <div key={r._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.2rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #F59E0B, #ff6b35)', borderRadius: '12px 12px 0 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>{r.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{r.rubricType} • {r.assessmentType}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openEdit(r)} style={{ background: 'none', border: 'none', color: '#0ff0fc', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(r._id)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                {/* Criteria table preview */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                            <th style={{ padding: '5px', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>Criteria</th>
                                            <th style={{ padding: '5px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Marks</th>
                                            {PERF_LEVELS.map(l => <th key={l} style={{ padding: '5px', textAlign: 'center', color: PERF_COLORS[l], textTransform: 'capitalize' }}>{l.charAt(0).toUpperCase() + l.slice(1)}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(r.criteria || []).map((cr, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '5px', color: '#fff' }}>{cr.name}</td>
                                                <td style={{ padding: '5px', textAlign: 'center', color: '#0ff0fc', fontWeight: 'bold' }}>{cr.marks}</td>
                                                {PERF_LEVELS.map(l => <td key={l} style={{ padding: '5px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{cr.descriptions?.[l] || '—'}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Total: <b style={{ color: '#F59E0B' }}>{r.totalMarks} marks</b></span>
                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', background: isLocked ? 'rgba(245,158,11,0.1)' : r.status === 'Draft' ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.1)', color: isLocked ? '#F59E0B' : r.status === 'Draft' ? 'rgba(255,255,255,0.5)' : '#10B981' }}>
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: '#1a1a2e', borderRadius: '16px', border: '1px solid rgba(245,158,11,0.3)', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: '#F59E0B' }}>{editingId ? 'Edit Rubric' : 'Create Rubric'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Rubric Name *</label>
                                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lab Rubric - OOP" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Rubric Type</label>
                                    <select value={form.rubricType} onChange={e => setForm(f => ({ ...f, rubricType: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        {['Lab Rubric', 'Programming Rubric', 'Presentation Rubric', 'Project Rubric', 'Viva Rubric'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Assessment Type</label>
                                    <select value={form.assessmentType} onChange={e => setForm(f => ({ ...f, assessmentType: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        {['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Mid Exam', 'Final Exam', 'Viva', 'General'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Criteria */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: '#fff' }}>Criteria <span style={{ fontSize: '0.8rem', color: '#F59E0B' }}>(Total: {totalMarks} marks)</span></h4>
                                    <button type="button" onClick={addCriterion} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', color: '#F59E0B', cursor: 'pointer' }}>
                                        <Plus size={14} /> Add Criterion
                                    </button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                <th style={{ padding: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.8rem' }}>Criterion Name</th>
                                                <th style={{ padding: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.8rem' }}>Marks</th>
                                                {PERF_LEVELS.map(l => (
                                                    <th key={l} style={{ padding: '8px', color: PERF_COLORS[l], fontWeight: '600', fontSize: '0.8rem', textTransform: 'capitalize' }}>{l}</th>
                                                ))}
                                                <th style={{ padding: '8px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.criteria.map((cr, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '8px' }}>
                                                        <input value={cr.name} onChange={e => updateCriterion(i, 'name', e.target.value)} placeholder="e.g. Logic" style={{ width: '140px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="number" min={0} value={cr.marks} onChange={e => updateCriterion(i, 'marks', e.target.value)} style={{ width: '65px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#F59E0B', textAlign: 'center' }} />
                                                    </td>
                                                    {PERF_LEVELS.map(l => (
                                                        <td key={l} style={{ padding: '8px' }}>
                                                            <input value={cr.descriptions?.[l] || ''} onChange={e => updateCriterion(i, `descriptions.${l}`, e.target.value)} placeholder={l} style={{ width: '120px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.8rem' }} />
                                                        </td>
                                                    ))}
                                                    <td style={{ padding: '8px' }}>
                                                        <button type="button" onClick={() => removeCriterion(i)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {form.criteria.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>No criteria added yet.</div>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" onClick={e => handleSave(e, 'Draft')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px', color: '#F59E0B', cursor: 'pointer' }}>
                                    <Save size={16} /> Save Draft
                                </button>
                                <button type="submit" onClick={e => handleSave(e, 'Submitted')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #F59E0B, #ff6b35)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                                    <CheckCircle size={16} /> Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherRubrics;
