import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
    ClipboardList, Plus, Edit, Trash2, CheckCircle, XCircle, AlertTriangle,
    Loader2, Calendar, BarChart2, Archive, Copy, BookOpen, RefreshCw, Save
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TYPE_COLORS = {
    Quiz: '#0ff0fc', Assignment: '#10B981', Lab: '#8B5CF6',
    Presentation: '#F59E0B', Project: '#ff6b35', Viva: '#bc13fe',
    'Mid Exam': '#ff1b6b', 'Final Exam': '#50cc7f'
};

const STATUS_COLORS = { Active: '#10B981', Inactive: '#ff1b6b', Archived: '#F59E0B' };

const ASSESSMENT_TYPES = ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Viva', 'Mid Exam', 'Final Exam'];

const emptyForm = { name: '', type: 'Quiz', course: '', session: '', semester: '', totalMarks: '', passingMarks: '', weightage: '', scheduledDate: '', deadline: '', instructions: '', status: 'Active' };

const TeacherAssessment = ({ initialCourseId = '' }) => {
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [filterCourse, setFilterCourse] = useState(initialCourseId);
    const [filterType, setFilterType] = useState('');
    const [activeTab, setActiveTab] = useState('list');
    const [analytics, setAnalytics] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load assigned courses
    useEffect(() => {
        axios.get(`${API}/teachers/courses`, { headers: hdrs })
            .then(r => setCourses(r.data || []))
            .catch(() => {});
    }, []);

    const loadAssessments = () => {
        setLoading(true);
        const params = {};
        if (filterCourse) params.course = filterCourse;
        axios.get(`${API}/assessments-def`, { headers: hdrs, params })
            .then(r => {
                let data = r.data || [];
                // Filter by teacher's courses
                const myCourseIds = new Set(courses.map(c => c.course?._id));
                data = data.filter(a => myCourseIds.has(a.course?._id || a.course));
                if (filterType) data = data.filter(a => a.type === filterType);
                setAssessments(data);
            })
            .catch(() => showToast('Failed to load assessments', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (courses.length > 0) loadAssessments(); }, [courses, filterCourse, filterType]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm, course: filterCourse || '' });
        setShowModal(true);
    };

    const openEdit = (a) => {
        setEditingId(a._id);
        setForm({
            name: a.name || '',
            type: a.type || 'Quiz',
            course: a.course?._id || a.course || '',
            session: a.session?._id || a.session || '',
            semester: a.semester?._id || a.semester || '',
            totalMarks: a.totalMarks || '',
            passingMarks: a.passingMarks || '',
            weightage: a.weightage || '',
            scheduledDate: a.scheduledDate ? a.scheduledDate.split('T')[0] : '',
            deadline: a.deadline ? a.deadline.split('T')[0] : '',
            instructions: a.instructions || '',
            status: a.status || 'Active'
        });
        setShowModal(true);
    };

    const handleFormChange = (field, val) => setForm(p => ({ ...p, [field]: val }));

    // Auto-fill session and semester from selected course
    useEffect(() => {
        if (!form.course) return;
        const offering = courses.find(c => c.course?._id === form.course || c.course === form.course);
        if (offering) {
            setForm(p => ({
                ...p,
                session: offering.session?._id || offering.session || p.session,
                semester: offering.semester?._id || offering.semester || p.semester
            }));
        }
    }, [form.course]);

    const submitForm = async () => {
        if (!form.name || !form.course || !form.totalMarks || !form.passingMarks || !form.weightage) {
            return showToast('Please fill all required fields', 'error');
        }
        setSubmitting(true);
        try {
            if (editingId) {
                await axios.put(`${API}/assessments-def/${editingId}`, form, { headers: hdrs });
                showToast('Assessment updated!');
            } else {
                await axios.post(`${API}/assessments-def`, form, { headers: hdrs });
                showToast('Assessment created!');
            }
            setShowModal(false);
            loadAssessments();
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to save assessment', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteAssessment = async (id) => {
        if (!window.confirm('Delete this assessment?')) return;
        try {
            await axios.delete(`${API}/assessments-def/${id}`, { headers: hdrs });
            showToast('Assessment deleted');
            loadAssessments();
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to delete', 'error');
        }
    };

    const toggleStatus = async (a) => {
        const newStatus = a.status === 'Active' ? 'Inactive' : 'Active';
        try {
            await axios.put(`${API}/assessments-def/${a._id}`, { ...a, status: newStatus }, { headers: hdrs });
            showToast(`Assessment ${newStatus}`);
            loadAssessments();
        } catch (e) {
            showToast('Failed to update status', 'error');
        }
    };

    const duplicate = async (a) => {
        const payload = { ...a, name: `${a.name} (Copy)`, course: a.course?._id || a.course, session: a.session?._id || a.session, semester: a.semester?._id || a.semester };
        delete payload._id; delete payload.__v; delete payload.createdAt; delete payload.updatedAt;
        try {
            await axios.post(`${API}/assessments-def`, payload, { headers: hdrs });
            showToast('Assessment duplicated!');
            loadAssessments();
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to duplicate', 'error');
        }
    };

    // Analytics
    useEffect(() => {
        if (activeTab !== 'analytics') return;
        const byType = {};
        ASSESSMENT_TYPES.forEach(t => { byType[t] = assessments.filter(a => a.type === t).length; });
        const active = assessments.filter(a => a.status === 'Active').length;
        const inactive = assessments.filter(a => a.status === 'Inactive').length;
        setAnalytics({ total: assessments.length, byType, active, inactive });
    }, [activeTab, assessments]);

    const tabs = [
        { id: 'list', label: 'Assessments', icon: <ClipboardList size={14} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} /> }
    ];

    return (
        <div style={{ padding: '0.5rem 0' }}>
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'error' ? 'rgba(255,27,107,0.9)' : 'rgba(16,185,129,0.9)', color: '#fff', fontWeight: '600', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {toast.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />} {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: '#bc13fe', margin: 0, fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ClipboardList size={24} /> Assessment Management
                </h2>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button onClick={loadAssessments} className="action-btn">
                        <RefreshCw size={14} />
                    </button>
                    <button onClick={openCreate} className="primary-btn">
                        <Plus size={16} /> Create Assessment
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: activeTab === t.id ? 'rgba(188,19,254,0.15)' : 'transparent', color: activeTab === t.id ? '#bc13fe' : 'rgba(255,255,255,0.4)', borderBottom: activeTab === t.id ? '2px solid #bc13fe' : '2px solid transparent', transition: 'all 0.2s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* LIST TAB */}
            {activeTab === 'list' && (
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                            <option value="">All Courses</option>
                            {courses.map(c => (
                                <option key={c._id} value={c.course?._id} style={{ background: '#1a1a2e' }}>
                                    {c.course?.code} – {c.course?.title}
                                </option>
                            ))}
                        </select>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: '160px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                            <option value="">All Types</option>
                            {ASSESSMENT_TYPES.map(t => <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t}</option>)}
                        </select>
                    </div>

                    {/* Summary pills */}
                    {assessments.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.25)', fontSize: '0.8rem', fontWeight: '700' }}>Total: {assessments.length}</span>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.8rem', fontWeight: '700' }}>Active: {assessments.filter(a => a.status === 'Active').length}</span>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.25)', fontSize: '0.8rem', fontWeight: '700' }}>Inactive: {assessments.filter(a => a.status === 'Inactive').length}</span>
                        </div>
                    )}

                    {/* Assessment Cards */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={36} color="#bc13fe" className="spinner-large" /></div>
                    ) : assessments.length === 0 ? (
                        <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '4rem', textAlign: 'center' }}>
                            <ClipboardList size={60} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                            <h3 style={{ color: 'rgba(255,255,255,0.3)' }}>No assessments yet</h3>
                            <p style={{ color: 'rgba(255,255,255,0.2)' }}>Click "Create Assessment" to get started</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem' }}>
                            {assessments.map(a => {
                                const typeColor = TYPE_COLORS[a.type] || '#fff';
                                const statusColor = STATUS_COLORS[a.status] || '#fff';
                                return (
                                    <div key={a._id} className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.4rem', border: `1px solid ${typeColor}25`, position: 'relative', overflow: 'hidden' }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,${typeColor},transparent)` }} />

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
                                            <div>
                                                <span style={{ padding: '2px 8px', borderRadius: '4px', background: `${typeColor}20`, color: typeColor, fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.05em', display: 'inline-block', marginBottom: '5px' }}>{a.type}</span>
                                                <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: '700' }}>{a.name}</h3>
                                            </div>
                                            <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>{a.status}</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                                            {[
                                                ['Course', a.course?.code || '—'],
                                                ['Total Marks', a.totalMarks],
                                                ['Passing Marks', a.passingMarks],
                                                ['Weightage', `${a.weightage}%`],
                                                ['Scheduled', a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'],
                                                ['Deadline', a.deadline ? new Date(a.deadline).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—']
                                            ].map(([label, val]) => (
                                                <div key={label} style={{ display: 'flex', gap: '5px', color: 'rgba(255,255,255,0.5)' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}:</span>
                                                    <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>{val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {a.instructions && (
                                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 10px', marginBottom: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', borderLeft: `3px solid ${typeColor}40` }}>
                                                {a.instructions.slice(0, 100)}{a.instructions.length > 100 ? '...' : ''}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button onClick={() => openEdit(a)} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: '600' }}>
                                                <Edit size={12} /> Edit
                                            </button>
                                            <button onClick={() => toggleStatus(a)} style={{ flex: 1, padding: '7px', borderRadius: '7px', border: `1px solid ${a.status === 'Active' ? 'rgba(255,27,107,0.3)' : 'rgba(16,185,129,0.3)'}`, background: 'transparent', color: a.status === 'Active' ? '#ff1b6b' : '#10B981', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: '600' }}>
                                                {a.status === 'Active' ? <><XCircle size={12} /> Deactivate</> : <><CheckCircle size={12} /> Activate</>}
                                            </button>
                                            <button onClick={() => duplicate(a)} style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Copy size={12} />
                                            </button>
                                            <button onClick={() => deleteAssessment(a._id)} style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid rgba(255,27,107,0.2)', background: 'rgba(255,27,107,0.05)', color: '#ff1b6b', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && analytics && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Assessments', val: analytics.total, color: '#0ff0fc' },
                            { label: 'Active', val: analytics.active, color: '#10B981' },
                            { label: 'Inactive', val: analytics.inactive, color: '#ff1b6b' }
                        ].map((s, i) => (
                            <div key={i} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem', textAlign: 'center', border: `1px solid ${s.color}25` }}>
                                <div style={{ color: s.color, fontSize: '2rem', fontWeight: '800' }}>{s.val}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '4px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#bc13fe', margin: '0 0 1.2rem', fontSize: '1rem', fontWeight: '700' }}>By Assessment Type</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            {Object.entries(analytics.byType).filter(([, v]) => v > 0).map(([type, count]) => {
                                const color = TYPE_COLORS[type] || '#fff';
                                const pct = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                                return (
                                    <div key={type}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{type}</span>
                                            <span style={{ color, fontWeight: '700' }}>{count}</span>
                                        </div>
                                        <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE/EDIT MODAL */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg,rgba(26,26,46,0.98),rgba(22,22,38,0.98))', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(188,19,254,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                            <h2 style={{ color: '#bc13fe', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>{editingId ? 'Edit Assessment' : 'Create Assessment'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '6px 12px', fontSize: '1rem' }}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gap: '1.1rem' }}>
                            {/* Name */}
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>ASSESSMENT NAME *</label>
                                <input value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="e.g. Quiz 1 – Arrays" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                            </div>

                            {/* Type + Course */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>TYPE *</label>
                                    <select value={form.type} onChange={e => handleFormChange('type', e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                                        {ASSESSMENT_TYPES.map(t => <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>COURSE *</label>
                                    <select value={form.course} onChange={e => handleFormChange('course', e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                                        <option value="">Select Course</option>
                                        {courses.map(c => <option key={c._id} value={c.course?._id} style={{ background: '#1a1a2e' }}>{c.course?.code} – {c.course?.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Marks Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                {[['TOTAL MARKS *', 'totalMarks', 'e.g. 50'], ['PASSING MARKS *', 'passingMarks', 'e.g. 25'], ['WEIGHTAGE (%) *', 'weightage', 'e.g. 20']].map(([label, field, ph]) => (
                                    <div key={field}>
                                        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>{label}</label>
                                        <input type="number" value={form[field]} onChange={e => handleFormChange(field, e.target.value)} placeholder={ph} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                            </div>

                            {/* Dates */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>SCHEDULED DATE</label>
                                    <input type="date" value={form.scheduledDate} onChange={e => handleFormChange('scheduledDate', e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>DEADLINE / DUE DATE</label>
                                    <input type="date" value={form.deadline} onChange={e => handleFormChange('deadline', e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>INSTRUCTIONS / NOTES</label>
                                <textarea value={form.instructions} onChange={e => handleFormChange('instructions', e.target.value)} rows={3} placeholder="Optional instructions for students..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            </div>

                            {/* Status */}
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>STATUS</label>
                                <select value={form.status} onChange={e => handleFormChange('status', e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', width: '180px' }}>
                                    <option value="Active" style={{ background: '#1a1a2e' }}>Active</option>
                                    <option value="Inactive" style={{ background: '#1a1a2e' }}>Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                                <button onClick={() => setShowModal(false)} style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                                <button onClick={submitForm} disabled={submitting} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: submitting ? 'rgba(188,19,254,0.3)' : 'linear-gradient(135deg,#bc13fe,#0ff0fc)', color: '#000', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {submitting ? <><Loader2 size={14} className="spinner-large" /> Saving...</> : <><Save size={14} /> {editingId ? 'Update' : 'Create'}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAssessment;
