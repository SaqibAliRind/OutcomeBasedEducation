import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    clearAssessmentDefMessages
} from '../store/assessmentDefSlice';
import { fetchAcademicData } from '../store/academicSlice';
import {
    Plus, Edit2, Trash2, X, Loader2,
    ClipboardList, Activity, BookOpen, Archive,
    CalendarDays, Clock, MapPin, FileText, Bell, CheckCircle2
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const TYPES = ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Viva', 'Mid Exam', 'Final Exam'];

// Assessment types that have a "deadline" vs a "scheduled date"
const DEADLINE_TYPES = ['Assignment', 'Project'];

const TYPE_COLORS = {
    'Quiz':         { bg: 'rgba(15,240,252,0.12)',  color: '#0ff0fc',  border: 'rgba(15,240,252,0.3)'  },
    'Assignment':   { bg: 'rgba(80,204,127,0.12)',  color: '#50cc7f',  border: 'rgba(80,204,127,0.3)'  },
    'Lab':          { bg: 'rgba(69,202,255,0.12)',  color: '#45caff',  border: 'rgba(69,202,255,0.3)'  },
    'Presentation': { bg: 'rgba(255,204,0,0.12)',   color: '#ffcc00',  border: 'rgba(255,204,0,0.3)'   },
    'Project':      { bg: 'rgba(188,19,254,0.12)',  color: '#bc13fe',  border: 'rgba(188,19,254,0.3)'  },
    'Viva':         { bg: 'rgba(255,152,0,0.12)',   color: '#ff9800',  border: 'rgba(255,152,0,0.3)'   },
    'Mid Exam':     { bg: 'rgba(255,87,87,0.12)',   color: '#ff5757',  border: 'rgba(255,87,87,0.3)'   },
    'Final Exam':   { bg: 'rgba(255,27,107,0.12)',  color: '#ff1b6b',  border: 'rgba(255,27,107,0.3)'  },
};

const WeightageBar = ({ value }) => {
    const color = value > 40 ? '#ff1b6b' : value > 20 ? '#ff9800' : '#50cc7f';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(value, 100)}%`, background: color, height: '100%', borderRadius: 20, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color, minWidth: 34 }}>{value}%</span>
        </div>
    );
};

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
};

const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };

const AssessmentDefinition = () => {
    const dispatch = useDispatch();
    const { assessments, loading, error, successMessage } = useSelector(state => state.assessmentDef);
    const { records } = useSelector(state => state.academic);

    const sessions = records.sessions || [];
    const semesters = records.semesters || [];
    const courses = records.courses || [];

    const [mainTab, setMainTab] = useState('list');
    const [filterSession, setFilterSession] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const pendingAction = useRef(null);

    const initialForm = {
        name: '', type: 'Quiz', totalMarks: '', passingMarks: '', weightage: '',
        semester: '', session: '', course: '', status: 'Active',
        scheduledDate: '', deadline: '', venue: '', instructions: ''
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        dispatch(fetchAssessments());
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('courses'));
        return () => dispatch(clearAssessmentDefMessages());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            setToast({ msg: pendingAction.current || successMessage, type: 'success' });
            setTimeout(() => setToast(null), 4000);
            dispatch(clearAssessmentDefMessages());
            setFormData(initialForm);
            setShowModal(false);
            setEditingId(null);
        }
        if (error) {
            setToast({ msg: error, type: 'error' });
            setTimeout(() => setToast(null), 5000);
            dispatch(clearAssessmentDefMessages());
        }
    }, [successMessage, error]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Assessment updated!' : 'Assessment created!';
        const payload = { ...formData };
        // Strip empty date strings so MongoDB doesn't get invalid date
        if (!payload.scheduledDate) delete payload.scheduledDate;
        if (!payload.deadline) delete payload.deadline;
        if (editingId) dispatch(updateAssessment({ id: editingId, payload }));
        else dispatch(createAssessment(payload));
    };

    const handleEdit = (item) => {
        setEditingId(item._id);
        setFormData({
            name: item.name, type: item.type, totalMarks: item.totalMarks,
            passingMarks: item.passingMarks, weightage: item.weightage,
            semester: item.semester?._id || '', session: item.session?._id || '',
            course: item.course?._id || '', status: item.status,
            scheduledDate: item.scheduledDate ? item.scheduledDate.slice(0, 16) : '',
            deadline: item.deadline ? item.deadline.slice(0, 16) : '',
            venue: item.venue || '', instructions: item.instructions || ''
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this assessment?')) {
            pendingAction.current = 'Assessment deleted!';
            dispatch(deleteAssessment(id));
        }
    };

    const handleArchive = (item) => {
        if (window.confirm(`Archive "${item.name}"?`)) {
            dispatch(updateAssessment({ id: item._id, payload: { status: 'Archived' } }));
        }
    };

    const handleLoadFiltered = () => {
        const filters = {};
        if (filterSession) filters.session = filterSession;
        if (filterSemester) filters.semester = filterSemester;
        if (filterCourse) filters.course = filterCourse;
        dispatch(fetchAssessments(filters));
    };

    const filtered = useMemo(() => assessments.filter(a => {
        if (filterSession && a.session?._id !== filterSession) return false;
        if (filterSemester && a.semester?._id !== filterSemester) return false;
        if (filterCourse && a.course?._id !== filterCourse) return false;
        return true;
    }), [assessments, filterSession, filterSemester, filterCourse]);

    const totalWeightage = useMemo(() =>
        filtered.filter(a => a.status === 'Active').reduce((s, a) => s + a.weightage, 0)
    , [filtered]);

    // For schedule: all assessments that have a date, sorted ascending
    const scheduled = useMemo(() => {
        return filtered
            .filter(a => a.scheduledDate || a.deadline)
            .map(a => ({
                ...a,
                effectiveDate: a.scheduledDate || a.deadline,
                isDeadline: !a.scheduledDate && !!a.deadline
            }))
            .sort((a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate));
    }, [filtered]);

    const unscheduled = useMemo(() =>
        filtered.filter(a => !a.scheduledDate && !a.deadline)
    , [filtered]);

    const stats = [
        { label: 'Total', value: filtered.length, color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)', Icon: ClipboardList },
        { label: 'Active', value: filtered.filter(a => a.status === 'Active').length, color: '#50cc7f', bg: 'rgba(80,204,127,0.1)', Icon: Activity },
        { label: 'Scheduled', value: scheduled.length, color: '#ff9800', bg: 'rgba(255,152,0,0.1)', Icon: CalendarDays },
        { label: 'Total Weightage', value: `${totalWeightage}%`, color: totalWeightage === 100 ? '#50cc7f' : '#ff9800', bg: 'rgba(255,152,0,0.1)', Icon: BookOpen },
    ];

    const isDeadlineType = DEADLINE_TYPES.includes(formData.type);

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '10px', zIndex: 2000, color: '#fff', fontWeight: 600, background: toast.type === 'success' ? 'rgba(80,204,127,0.95)' : 'rgba(255,27,107,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <ClipboardList size={28} color="#ff5757" /> Course Assessments
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                        Define and schedule assessments per course — Quiz, Mid, Final, Assignment, etc.
                    </p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData(initialForm); setShowModal(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 1.5rem', background: 'linear-gradient(135deg, #ff5757, #d32f2f)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                    <Plus size={18} /> Add Assessment
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
                {stats.map(s => (
                    <div key={s.label} className="glass-panel-dash" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ background: s.bg, borderRadius: '50%', padding: '10px' }}><s.Icon size={20} color={s.color} /></div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{s.value}</h3>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel-dash" style={{ padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1', minWidth: '160px' }}>
                        <label style={labelStyle}>Session</label>
                        <select value={filterSession} onChange={e => setFilterSession(e.target.value)} style={inputStyle}>
                            <option value="">All Sessions</option>
                            {sessions.map(s => <option key={s._id} value={s._id}>{s.title || s.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1', minWidth: '160px' }}>
                        <label style={labelStyle}>Semester</label>
                        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} style={inputStyle}>
                            <option value="">All Semesters</option>
                            {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '2', minWidth: '200px' }}>
                        <label style={labelStyle}>Course</label>
                        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={inputStyle}>
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.code} – {c.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleLoadFiltered} style={{ padding: '10px 20px', background: 'rgba(15,240,252,0.15)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem', width: 'fit-content' }}>
                {[
                    { id: 'list', label: 'All Assessments', Icon: ClipboardList },
                    { id: 'schedule', label: 'Schedule', Icon: CalendarDays },
                ].map(t => (
                    <button key={t.id} onClick={() => setMainTab(t.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s',
                        background: mainTab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: mainTab === t.id ? '#ff5757' : 'rgba(255,255,255,0.5)',
                        borderBottom: mainTab === t.id ? '2px solid #ff5757' : '2px solid transparent',
                    }}>
                        <t.Icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: LIST ── */}
            {mainTab === 'list' && (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem', overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <Loader2 className="spin" size={32} color="#ff5757" />
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'rgba(255,255,255,0.9)' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    {['#', 'Name', 'Type', 'Course', 'Marks', 'Weightage', 'Date / Deadline', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item, i) => {
                                    const tc = TYPE_COLORS[item.type] || { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'rgba(255,255,255,0.2)' };
                                    const effDate = item.scheduledDate || item.deadline;
                                    const days = daysUntil(effDate);
                                    return (
                                        <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>{i + 1}</td>
                                            <td style={{ padding: '1rem', fontWeight: '600' }}>{item.name}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', border: `1px solid ${tc.border}` }}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#0ff0fc', fontSize: '0.85rem' }}>{item.course?.code || '—'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ color: '#ff9800', fontWeight: '600' }}>{item.passingMarks}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}> / </span>
                                                <span style={{ fontWeight: '700' }}>{item.totalMarks}</span>
                                            </td>
                                            <td style={{ padding: '1rem', minWidth: '110px' }}>
                                                <WeightageBar value={item.weightage} />
                                            </td>
                                            <td style={{ padding: '1rem', minWidth: '160px' }}>
                                                {effDate ? (
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: item.deadline && !item.scheduledDate ? '#ff9800' : '#0ff0fc', fontSize: '0.82rem', fontWeight: '600' }}>
                                                            <CalendarDays size={13} />
                                                            {formatDate(effDate)}
                                                        </div>
                                                        {days !== null && (
                                                            <span style={{ fontSize: '0.72rem', color: days < 0 ? '#ff1b6b' : days < 3 ? '#ff9800' : 'rgba(255,255,255,0.4)' }}>
                                                                {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'Today!' : `in ${days}d`}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>Not scheduled</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', background: item.status === 'Active' ? 'rgba(80,204,127,0.12)' : item.status === 'Archived' ? 'rgba(188,19,254,0.12)' : 'rgba(255,27,107,0.12)', color: item.status === 'Active' ? '#50cc7f' : item.status === 'Archived' ? '#bc13fe' : '#ff1b6b' }}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => handleEdit(item)} style={{ background: 'rgba(15,240,252,0.12)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                    <button onClick={() => handleArchive(item)} title="Archive" style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}><Archive size={14} /></button>
                                                    <button onClick={() => handleDelete(item._id)} style={{ background: 'rgba(255,27,107,0.12)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No assessments found. Apply filters or add an assessment.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── TAB: SCHEDULE ── */}
            {mainTab === 'schedule' && (
                <div>
                    {/* Timeline */}
                    {scheduled.length > 0 ? (
                        <div style={{ position: 'relative', paddingLeft: '30px' }}>
                            {/* Vertical line */}
                            <div style={{ position: 'absolute', left: '12px', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.08)' }} />

                            {scheduled.map((item, i) => {
                                const tc = TYPE_COLORS[item.type] || { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'rgba(255,255,255,0.2)' };
                                const days = daysUntil(item.effectiveDate);
                                const isPast = days !== null && days < 0;
                                const isToday = days === 0;
                                const isUrgent = days !== null && days >= 0 && days <= 2;

                                return (
                                    <div key={item._id} style={{ position: 'relative', marginBottom: '1.2rem' }}>
                                        {/* Dot */}
                                        <div style={{
                                            position: 'absolute', left: '-24px', top: '22px',
                                            width: '14px', height: '14px', borderRadius: '50%',
                                            background: isPast ? 'rgba(255,255,255,0.15)' : tc.color,
                                            border: `2px solid ${isPast ? 'rgba(255,255,255,0.1)' : tc.color}`,
                                            boxShadow: !isPast ? `0 0 8px ${tc.color}66` : 'none'
                                        }} />

                                        <div className="glass-panel-dash" style={{
                                            padding: '1.2rem 1.5rem', borderRadius: '12px',
                                            borderLeft: `3px solid ${isPast ? 'rgba(255,255,255,0.1)' : tc.color}`,
                                            opacity: isPast ? 0.5 : 1,
                                            transition: 'all 0.2s'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{ background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', border: `1px solid ${tc.border}` }}>
                                                        {item.type}
                                                    </span>
                                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{item.name}</h4>
                                                    {isToday && <span style={{ background: 'rgba(255,27,107,0.2)', color: '#ff1b6b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid rgba(255,27,107,0.4)' }}>TODAY</span>}
                                                    {isUrgent && !isToday && <span style={{ background: 'rgba(255,152,0,0.2)', color: '#ff9800', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid rgba(255,152,0,0.4)' }}>SOON</span>}
                                                    {isPast && <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>PAST</span>}
                                                    {item.status === 'Archived' && <span style={{ background: 'rgba(188,19,254,0.15)', color: '#bc13fe', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600' }}>ARCHIVED</span>}
                                                </div>
                                                <button onClick={() => handleEdit(item)} style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Edit2 size={13} /> Edit
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPast ? 'rgba(255,255,255,0.35)' : '#0ff0fc', fontSize: '0.85rem' }}>
                                                    <CalendarDays size={14} />
                                                    <span style={{ fontWeight: '600' }}>{formatDate(item.effectiveDate)}</span>
                                                    {item.isDeadline && <span style={{ color: '#ff9800', fontSize: '0.72rem' }}>(Deadline)</span>}
                                                </div>
                                                {formatTime(item.effectiveDate) !== '12:00 AM' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                        <Clock size={14} />
                                                        {formatTime(item.effectiveDate)}
                                                    </div>
                                                )}
                                                {item.course?.code && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                        <BookOpen size={14} />
                                                        {item.course.code}
                                                    </div>
                                                )}
                                                {item.venue && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffcc00', fontSize: '0.85rem' }}>
                                                        <MapPin size={14} />
                                                        {item.venue}
                                                    </div>
                                                )}
                                                {days !== null && !isPast && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isUrgent ? '#ff9800' : 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: '600' }}>
                                                        <Bell size={13} />
                                                        {days === 0 ? 'Today!' : `in ${days} day${days > 1 ? 's' : ''}`}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
                                                    <span style={{ color: '#ff9800' }}>{item.passingMarks}</span>/{item.totalMarks} marks · <span style={{ color: '#bc13fe' }}>{item.weightage}%</span>
                                                </div>
                                            </div>

                                            {item.instructions && (
                                                <div style={{ marginTop: '0.7rem', display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
                                                    <FileText size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                                                    {item.instructions}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', borderRadius: '12px', color: 'rgba(255,255,255,0.35)' }}>
                            <CalendarDays size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                            <p style={{ margin: 0 }}>No scheduled assessments yet. Edit any assessment to set a date or deadline.</p>
                        </div>
                    )}

                    {/* Unscheduled */}
                    {unscheduled.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h4 style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <CheckCircle2 size={14} /> Not Yet Scheduled ({unscheduled.length})
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                {unscheduled.map(item => {
                                    const tc = TYPE_COLORS[item.type] || { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'rgba(255,255,255,0.2)' };
                                    return (
                                        <div key={item._id} className="glass-panel-dash" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', opacity: 0.65 }}>
                                            <div>
                                                <span style={{ background: tc.bg, color: tc.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>{item.type}</span>
                                                <div style={{ color: '#fff', fontWeight: '600', marginTop: '4px', fontSize: '0.9rem' }}>{item.name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{item.course?.code}</div>
                                            </div>
                                            <button onClick={() => handleEdit(item)} style={{ background: 'rgba(255,152,0,0.12)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                                                <CalendarDays size={13} /> Schedule
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
                    <div className="glass-panel-dash" style={{ width: '600px', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#ff5757' }}>
                                {editingId ? '✏️ Edit Assessment' : '➕ Add Assessment'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Basic Details */}
                            <div style={{ gridColumn: '1 / -1', color: '#0ff0fc', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px' }}>
                                📋 Basic Details
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Assessment Name <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Quiz 1, Midterm Exam" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Type <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <select name="type" value={formData.type} onChange={handleChange} required style={inputStyle}>
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Weightage (%) <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <input type="number" name="weightage" value={formData.weightage} onChange={handleChange} required min="1" max="100" placeholder="e.g. 20" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Total Marks <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} required min="1" placeholder="e.g. 50" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Passing Marks <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <input type="number" name="passingMarks" value={formData.passingMarks} onChange={handleChange} required min="1" max={formData.totalMarks || undefined} placeholder="e.g. 25" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Session <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <select name="session" value={formData.session} onChange={handleChange} required style={inputStyle} disabled={!!editingId}>
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s._id} value={s._id}>{s.title || s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Semester <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <select name="semester" value={formData.semester} onChange={handleChange} required style={inputStyle} disabled={!!editingId}>
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Course <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <select name="course" value={formData.course} onChange={handleChange} required style={inputStyle} disabled={!!editingId}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.code} – {c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>

                            {/* Schedule Section */}
                            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', color: '#ff9800', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '-8px' }}>
                                📅 Schedule
                            </div>
                            {isDeadlineType ? (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Submission Deadline</label>
                                    <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} style={inputStyle} />
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px', display: 'block' }}>
                                        For {formData.type} – the final submission deadline for students
                                    </span>
                                </div>
                            ) : (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Scheduled Date &amp; Time</label>
                                    <input type="datetime-local" name="scheduledDate" value={formData.scheduledDate} onChange={handleChange} style={inputStyle} />
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px', display: 'block' }}>
                                        For {formData.type} – the date &amp; time it is conducted
                                    </span>
                                </div>
                            )}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Venue / Location</label>
                                <input name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. Room 101, Online (MS Teams)" style={inputStyle} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Instructions / Notes</label>
                                <textarea name="instructions" value={formData.instructions} onChange={handleChange} rows={3} placeholder="Any special instructions for students..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading} className="primary-btn">
                                    {loading ? <Loader2 className="spin" size={16} /> : (editingId ? '✔ Update Assessment' : '✔ Save Assessment')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentDefinition;
