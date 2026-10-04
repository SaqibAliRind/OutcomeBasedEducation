import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
    approveQuestion, rejectQuestion, importQuestions, clearQuestionMessages
} from '../store/questionSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { fetchCLOs } from '../store/obeSlice';
import {
    Plus, Edit2, Trash2, X, Loader2, CheckCircle2, XCircle,
    Archive, Download, Upload, BookOpen, Filter, Search,
    ThumbsUp, ThumbsDown, HelpCircle, Tag, Brain
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const TYPES = ['MCQs', 'Short Questions', 'Long Questions', 'Practical Questions', 'Coding Questions', 'Numerical Questions', 'Case Study', 'Viva Questions'];
const ASSESSMENT_TYPES = ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Mid Exam', 'Final Exam', 'Viva', 'General'];
const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const APPROVAL_COLORS = {
    Pending:  { bg: 'rgba(255,152,0,0.12)', color: '#ff9800', border: 'rgba(255,152,0,0.3)' },
    Approved: { bg: 'rgba(80,204,127,0.12)', color: '#50cc7f', border: 'rgba(80,204,127,0.3)' },
    Rejected: { bg: 'rgba(255,27,107,0.12)', color: '#ff1b6b', border: 'rgba(255,27,107,0.3)' },
};
const DIFFICULTY_COLORS = {
    Easy:   { bg: 'rgba(80,204,127,0.12)',  color: '#50cc7f' },
    Medium: { bg: 'rgba(255,152,0,0.12)',   color: '#ff9800' },
    Hard:   { bg: 'rgba(255,27,107,0.12)', color: '#ff1b6b' },
};
const BLOOMS_COLORS = {
    Remember:    '#0ff0fc', Understand: '#45caff', Apply:    '#50cc7f',
    Analyze:     '#ffcc00', Evaluate:   '#ff9800', Create:   '#bc13fe',
};

const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };

// CSV export helper
const exportToCSV = (questions) => {
    const headers = ['Text', 'Type', 'Assessment Type', 'Course', 'CLO', 'Marks', 'Difficulty', "Bloom's Level", 'Approval Status', 'Tags'];
    const rows = questions.map(q => [
        `"${(q.text || '').replace(/"/g, '""')}"`,
        q.type, q.assessmentType,
        q.course?.code || '', q.clo?.code || '',
        q.marks, q.difficulty, q.bloomsLevel,
        q.approvalStatus,
        (q.tags || []).join(';')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'question_bank.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const QuestionBank = () => {
    const dispatch = useDispatch();
    const { questions, loading, error, successMessage } = useSelector(s => s.questions);
    const { records } = useSelector(s => s.academic);
    const { users = [] } = useSelector(s => s.users);
    const { clos } = useSelector(s => s.obe);

    const { sessions = [], semesters = [], departments = [], programs = [], sections = [], courses = [] } = records;
    const teachers = users.filter(u => u.role === 'Teacher');

    // Filters
    const [search, setSearch] = useState('');
    const [fCourse, setFCourse] = useState('');
    const [fSession, setFSession] = useState('');
    const [fSemester, setFSemester] = useState('');
    const [fDepartment, setFDepartment] = useState('');
    const [fProgram, setFProgram] = useState('');
    const [fSection, setFSection] = useState('');
    const [fTeacher, setFTeacher] = useState('');
    const [fApproval, setFApproval] = useState('');
    const [fDifficulty, setFDifficulty] = useState('');
    const [fType, setFType] = useState('');
    const [fBlooms, setFBlooms] = useState('');
    const [fStatus, setFStatus] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [reviewModal, setReviewModal] = useState(null); // { id, action }
    const [reviewNote, setReviewNote] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [toast, setToast] = useState(null);
    const pendingAction = useRef(null);

    const initialForm = {
        title: '', text: '', type: 'Short Questions', assessmentType: 'General',
        session: '', semester: '', department: '', program: '', course: '', section: '', teacher: '', clo: '',
        marks: 1, difficulty: 'Medium', chapter: '', topic: '',
        bloomsLevel: 'Understand', tags: '', version: 1, status: 'Draft',
        explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
    };
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        dispatch(fetchQuestions());
        dispatch(fetchAcademicData('sessions'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchAcademicData('courses'));
        dispatch(fetchUsers());
        dispatch(fetchCLOs());
        return () => dispatch(clearQuestionMessages());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) { setToast({ msg: successMessage, type: 'success' }); setTimeout(() => setToast(null), 4000); dispatch(clearQuestionMessages()); setShowModal(false); setReviewModal(null); setForm(initialForm); setEditingId(null); }
        if (error) { setToast({ msg: error, type: 'error' }); setTimeout(() => setToast(null), 5000); dispatch(clearQuestionMessages()); }
    }, [successMessage, error]);

    const filtered = useMemo(() => questions.filter(q => {
        if (fCourse && q.course?._id !== fCourse) return false;
        if (fSession && q.session?._id !== fSession) return false;
        if (fSemester && q.semester?._id !== fSemester) return false;
        if (fDepartment && q.department?._id !== fDepartment) return false;
        if (fProgram && q.program?._id !== fProgram) return false;
        if (fSection && q.section?._id !== fSection) return false;
        if (fTeacher && q.teacher?._id !== fTeacher) return false;
        if (fApproval && q.approvalStatus !== fApproval) return false;
        if (fDifficulty && q.difficulty !== fDifficulty) return false;
        if (fType && q.type !== fType) return false;
        if (fBlooms && q.bloomsLevel !== fBlooms) return false;
        if (fStatus && q.status !== fStatus) return false;
        if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !(q.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
        return true;
    }), [questions, fCourse, fSession, fSemester, fDepartment, fProgram, fSection, fTeacher, fApproval, fDifficulty, fType, fBlooms, fStatus, search]);

    const stats = [
        { label: 'Total', value: questions.length, color: '#0ff0fc' },
        { label: 'Approved', value: questions.filter(q => q.approvalStatus === 'Approved').length, color: '#50cc7f' },
        { label: 'Pending', value: questions.filter(q => q.approvalStatus === 'Pending').length, color: '#ff9800' },
        { label: 'Rejected', value: questions.filter(q => q.approvalStatus === 'Rejected').length, color: '#ff1b6b' },
    ];

    const courseCLOs = useMemo(() => clos.filter(c => form.course && c.course === form.course), [clos, form.course]);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleOptionChange = (idx, field, value) => {
        const opts = [...form.options];
        opts[idx] = { ...opts[idx], [field]: value };
        setForm(f => ({ ...f, options: opts }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            options: form.type === 'MCQs' ? form.options : []
        };
        if (editingId) dispatch(updateQuestion({ id: editingId, payload }));
        else dispatch(createQuestion(payload));
    };

    const handleEdit = (q) => {
        setEditingId(q._id);
        setForm({
            title: q.title || '', text: q.text, type: q.type || 'Short Questions', assessmentType: q.assessmentType || 'General',
            session: q.session?._id || '', semester: q.semester?._id || '', department: q.department?._id || '',
            program: q.program?._id || '', course: q.course?._id || '', section: q.section?._id || '',
            teacher: q.teacher?._id || '', clo: q.clo?._id || '',
            marks: q.marks, difficulty: q.difficulty || 'Medium',
            chapter: q.chapter || '', topic: q.topic || '',
            bloomsLevel: q.bloomsLevel || 'Understand',
            tags: (q.tags || []).join(', '), version: q.version || 1, status: q.status || 'Draft',
            explanation: q.explanation || '',
            options: q.options?.length ? q.options : initialForm.options
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this question permanently?')) dispatch(deleteQuestion(id));
    };

    const handleArchive = (q) => {
        if (window.confirm(`Archive "${q.text.slice(0, 60)}..."?`)) dispatch(updateQuestion({ id: q._id, payload: { status: 'Archived' } }));
    };

    const handleReview = () => {
        if (!reviewModal) return;
        if (reviewModal.action === 'approve') dispatch(approveQuestion({ id: reviewModal.id, reviewNote }));
        else dispatch(rejectQuestion({ id: reviewModal.id, reviewNote }));
        setReviewNote('');
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importText);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            dispatch(importQuestions(arr));
            setShowImport(false);
            setImportText('');
        } catch {
            setToast({ msg: 'Invalid JSON. Please paste a valid JSON array of questions.', type: 'error' });
            setTimeout(() => setToast(null), 5000);
        }
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
                        <HelpCircle size={28} color="#bc13fe" /> Question Bank
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Manage, approve, and export all assessment questions.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.7rem 1.2rem', background: 'rgba(80,204,127,0.15)', border: '1px solid rgba(80,204,127,0.3)', borderRadius: '8px', color: '#50cc7f', cursor: 'pointer', fontWeight: '600' }}>
                        <Upload size={16} /> Import
                    </button>
                    <button onClick={() => exportToCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.7rem 1.2rem', background: 'rgba(15,240,252,0.15)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', fontWeight: '600' }}>
                        <Download size={16} /> Export CSV
                    </button>
                    <button onClick={() => { setEditingId(null); setForm(initialForm); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg, #bc13fe, #7c3aed)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                        <Plus size={16} /> Add Question
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
                {stats.map(s => (
                    <div key={s.label} className="glass-panel-dash" style={{ padding: '16px 20px', borderRadius: '12px', borderLeft: `3px solid ${s.color}` }}>
                        <h3 style={{ margin: 0, fontSize: '1.8rem', color: s.color }}>{s.value}</h3>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="glass-panel-dash" style={{ padding: '1rem 1.4rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 12px', flex: '2', minWidth: '200px' }}>
                        <Search size={16} color="rgba(255,255,255,0.4)" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions or tags..." style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', marginTop: '10px' }}>
                        {[
                            { val: fSession, set: setFSession, options: sessions, placeholder: 'All Sessions', getLabel: c => `${c.name}`, getId: c => c._id },
                            { val: fSemester, set: setFSemester, options: semesters, placeholder: 'All Semesters', getLabel: c => `${c.name} ${c.year}`, getId: c => c._id },
                            { val: fDepartment, set: setFDepartment, options: departments, placeholder: 'All Departments', getLabel: c => `${c.name}`, getId: c => c._id },
                            { val: fProgram, set: setFProgram, options: programs, placeholder: 'All Programs', getLabel: c => `${c.name}`, getId: c => c._id },
                            { val: fCourse, set: setFCourse, options: courses, placeholder: 'All Courses', getLabel: c => `${c.code}`, getId: c => c._id },
                            { val: fSection, set: setFSection, options: sections, placeholder: 'All Sections', getLabel: c => `${c.name}`, getId: c => c._id },
                            { val: fTeacher, set: setFTeacher, options: teachers, placeholder: 'All Teachers', getLabel: c => `${c.name}`, getId: c => c._id },
                            { val: fApproval, set: setFApproval, options: ['Pending', 'Approved', 'Rejected'].map(v => ({ _id: v, label: v })), placeholder: 'Approval', getLabel: c => c.label, getId: c => c._id },
                            { val: fStatus, set: setFStatus, options: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Archived'].map(v => ({ _id: v, label: v })), placeholder: 'Status', getLabel: c => c.label, getId: c => c._id },
                            { val: fType, set: setFType, options: TYPES.map(v => ({ _id: v, label: v })), placeholder: 'All Types', getLabel: c => c.label, getId: c => c._id },
                        ].map((f, i) => (
                            <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={{ ...inputStyle, flex: '1', minWidth: '120px', padding: '6px' }}>
                                <option value="">{f.placeholder}</option>
                                {f.options.map(o => <option key={f.getId(o)} value={f.getId(o)}>{f.getLabel(o)}</option>)}
                            </select>
                        ))}
                    </div>
                    <button onClick={() => { setSearch(''); setFCourse(''); setFSession(''); setFSemester(''); setFDepartment(''); setFProgram(''); setFSection(''); setFTeacher(''); setFApproval(''); setFDifficulty(''); setFType(''); setFBlooms(''); setFStatus(''); }} style={{ padding: '8px 14px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.2)', borderRadius: '8px', color: '#ff1b6b', cursor: 'pointer', fontSize: '0.82rem', marginTop: '10px' }}>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="spin" size={32} color="#bc13fe" /></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'rgba(255,255,255,0.9)' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {['ID/Title', 'Statement', 'Type', 'Academics', 'Course/Section', 'Marks', 'Difficulty', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((q, i) => {
                                const ac = APPROVAL_COLORS[q.approvalStatus] || APPROVAL_COLORS.Pending;
                                const dc = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.Medium;
                                return (
                                    <tr key={q._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '0.9rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', maxWidth: '150px' }}>
                                            <div style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>{q.title || q._id.toString().slice(-6)}</div>
                                        </td>
                                        <td style={{ padding: '0.9rem', maxWidth: '300px' }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={q.text}>{q.text}</div>
                                            {q.tags?.length > 0 && (
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                    {q.tags.slice(0, 3).map(t => <span key={t} style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px' }}>{t}</span>)}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.9rem' }}>
                                            <span style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', padding: '2px 8px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{q.type}</span>
                                        </td>
                                        <td style={{ padding: '0.9rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                                            <div>Sess: {q.session?.name || '—'}</div>
                                            <div>Sem: {q.semester?.name || '—'}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)' }}>{q.department?.name?.substring(0,10) || '—'}</div>
                                        </td>
                                        <td style={{ padding: '0.9rem', fontSize: '0.82rem' }}>
                                            <div style={{ color: '#0ff0fc' }}>{q.course?.code || '—'}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.7)' }}>Sec: {q.section?.name || '—'}</div>
                                            {q.teacher && <div style={{ color: '#bc13fe', fontSize: '0.75rem', marginTop: '2px' }}>{q.teacher.name}</div>}
                                            {q.chapter && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: '2px' }}>{q.chapter}</div>}
                                        </td>
                                        <td style={{ padding: '0.9rem', fontWeight: '700', color: '#fff' }}>{q.marks}</td>
                                        <td style={{ padding: '0.9rem' }}>
                                            <span style={{ background: dc.bg, color: dc.color, padding: '2px 8px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '600' }}>{q.difficulty}</span>
                                        </td>
                                        <td style={{ padding: '0.9rem' }}>
                                            <span style={{ background: ac.bg, color: ac.color, border: `1px solid ${ac.border}`, padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block', marginBottom: '4px' }}>{q.approvalStatus}</span>
                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{q.status}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>v{q.version || 1}</div>
                                        </td>
                                        <td style={{ padding: '0.9rem' }}>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => handleEdit(q)} title="Edit" style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.25)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}><Edit2 size={13} /></button>
                                                {q.approvalStatus === 'Pending' && <>
                                                    <button onClick={() => { setReviewModal({ id: q._id, action: 'approve' }); setReviewNote(''); }} title="Approve" style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.25)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}><ThumbsUp size={13} /></button>
                                                    <button onClick={() => { setReviewModal({ id: q._id, action: 'reject' }); setReviewNote(''); }} title="Reject" style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.25)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}><ThumbsDown size={13} /></button>
                                                </>}
                                                <button onClick={() => handleArchive(q)} title="Archive" style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.25)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}><Archive size={13} /></button>
                                                <button onClick={() => handleDelete(q._id)} title="Delete" style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.25)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan="10" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No questions found. Adjust filters or add a new question.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── Add/Edit Modal ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash" style={{ width: '650px', padding: '2rem', borderRadius: '16px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#bc13fe' }}>{editingId ? '✏️ Edit Question' : '➕ Add Question'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            {/* Title */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Question Title</label>
                                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Array Sort Algorithm" style={inputStyle} />
                            </div>
                            {/* Question text */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Question Statement <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <textarea name="text" value={form.text} onChange={handleChange} required rows={3} placeholder="Enter the question statement..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            {/* Type */}
                            <div>
                                <label style={labelStyle}>Question Type</label>
                                <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
                                    {TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            {/* Assessment Type */}
                            <div>
                                <label style={labelStyle}>Assessment Type</label>
                                <select name="assessmentType" value={form.assessmentType} onChange={handleChange} style={inputStyle}>
                                    {ASSESSMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            {/* Session */}
                            <div>
                                <label style={labelStyle}>Session</label>
                                <select name="session" value={form.session} onChange={handleChange} style={inputStyle}>
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            {/* Semester */}
                            <div>
                                <label style={labelStyle}>Semester</label>
                                <select name="semester" value={form.semester} onChange={handleChange} style={inputStyle}>
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s._id} value={s._id}>{s.name} {s.year}</option>)}
                                </select>
                            </div>
                            {/* Department */}
                            <div>
                                <label style={labelStyle}>Department</label>
                                <select name="department" value={form.department} onChange={handleChange} style={inputStyle}>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                            {/* Program */}
                            <div>
                                <label style={labelStyle}>Program</label>
                                <select name="program" value={form.program} onChange={handleChange} style={inputStyle}>
                                    <option value="">Select Program</option>
                                    {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                            {/* Course */}
                            <div>
                                <label style={labelStyle}>Course <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <select name="course" value={form.course} onChange={handleChange} required style={inputStyle}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c._id} value={c._id}>{c.code} – {c.name}</option>)}
                                </select>
                            </div>
                            {/* Section */}
                            <div>
                                <label style={labelStyle}>Section</label>
                                <select name="section" value={form.section} onChange={handleChange} style={inputStyle}>
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            {/* Teacher */}
                            <div>
                                <label style={labelStyle}>Teacher</label>
                                <select name="teacher" value={form.teacher} onChange={handleChange} style={inputStyle}>
                                    <option value="">Select Teacher</option>
                                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                                </select>
                            </div>
                            {/* CLO */}
                            <div>
                                <label style={labelStyle}>Mapped CLO</label>
                                <select name="clo" value={form.clo} onChange={handleChange} style={inputStyle}>
                                    <option value="">None</option>
                                    {clos.map(c => <option key={c._id} value={c._id}>{c.code} – {c.description?.slice(0, 40)}</option>)}
                                </select>
                            </div>
                            {/* Marks */}
                            <div>
                                <label style={labelStyle}>Marks</label>
                                <input type="number" name="marks" value={form.marks} onChange={handleChange} min="0" style={inputStyle} />
                            </div>
                            {/* Chapter */}
                            <div>
                                <label style={labelStyle}>Chapter</label>
                                <input name="chapter" value={form.chapter} onChange={handleChange} placeholder="e.g. Chapter 4" style={inputStyle} />
                            </div>
                            {/* Topic */}
                            <div>
                                <label style={labelStyle}>Topic</label>
                                <input name="topic" value={form.topic} onChange={handleChange} placeholder="e.g. Sorting" style={inputStyle} />
                            </div>
                            {/* Difficulty */}
                            <div>
                                <label style={labelStyle}>Difficulty</label>
                                <select name="difficulty" value={form.difficulty} onChange={handleChange} style={inputStyle}>
                                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            {/* Bloom's Level */}
                            <div>
                                <label style={labelStyle}>Bloom's Level</label>
                                <select name="bloomsLevel" value={form.bloomsLevel} onChange={handleChange} style={inputStyle}>
                                    {BLOOMS.map(b => <option key={b}>{b}</option>)}
                                </select>
                            </div>
                            {/* Version */}
                            <div>
                                <label style={labelStyle}>Version</label>
                                <input type="number" name="version" value={form.version} onChange={handleChange} min="1" style={inputStyle} />
                            </div>
                            {/* Status */}
                            <div>
                                <label style={labelStyle}>Status</label>
                                <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                                    <option>Draft</option><option>Submitted</option><option>Approved</option><option>Rejected</option><option>Archived</option>
                                </select>
                            </div>
                            {/* Tags */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Tags <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '400' }}>(comma-separated)</span></label>
                                <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. loops, functions, OOP" style={inputStyle} />
                            </div>
                            {/* MCQ Options */}
                            {form.type === 'MCQs' && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ ...labelStyle, color: '#0ff0fc' }}>MCQ Options (check correct answer)</label>
                                    {form.options.map((opt, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                            <input type="radio" name="correctOption" checked={opt.isCorrect} onChange={() => { const o = form.options.map((x, i) => ({ ...x, isCorrect: i === idx })); setForm(f => ({ ...f, options: o })); }} style={{ accentColor: '#50cc7f', cursor: 'pointer' }} />
                                            <input value={opt.text} onChange={e => handleOptionChange(idx, 'text', e.target.value)} placeholder={`Option ${idx + 1}`} style={{ ...inputStyle, flex: 1 }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Explanation */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Model Answer / Explanation</label>
                                <textarea name="explanation" value={form.explanation} onChange={handleChange} rows={2} placeholder="Model answer or explanation (optional)..." style={{ ...inputStyle, resize: 'vertical' }} />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" disabled={loading} className="primary-btn">
                                    {loading ? <Loader2 className="spin" size={16} /> : (editingId ? '✔ Update' : '✔ Save Question')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Review Modal (Approve/Reject) ── */}
            {reviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash" style={{ width: '440px', padding: '2rem', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                        <h3 style={{ margin: '0 0 1rem', color: reviewModal.action === 'approve' ? '#50cc7f' : '#ff1b6b' }}>
                            {reviewModal.action === 'approve' ? '✅ Approve Question' : '❌ Reject Question'}
                        </h3>
                        <label style={labelStyle}>Review Note (optional)</label>
                        <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} placeholder={reviewModal.action === 'approve' ? 'Approval note...' : 'Reason for rejection...'} style={{ ...inputStyle, resize: 'vertical', marginBottom: '1.5rem' }} />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setReviewModal(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleReview} disabled={loading} style={{ background: reviewModal.action === 'approve' ? 'linear-gradient(135deg,#50cc7f,#22863a)' : 'linear-gradient(135deg,#ff1b6b,#c0003c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {loading ? <Loader2 className="spin" size={16} /> : (reviewModal.action === 'approve' ? <><ThumbsUp size={15} /> Approve</> : <><ThumbsDown size={15} /> Reject</>)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Import Modal ── */}
            {showImport && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash" style={{ width: '560px', padding: '2rem', borderRadius: '16px', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ margin: 0, color: '#50cc7f' }}>📥 Import Questions (JSON)</h3>
                            <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Paste a JSON array of questions. Each question should have at minimum: <code style={{ color: '#0ff0fc' }}>text</code>, <code style={{ color: '#0ff0fc' }}>course</code> (ObjectId), <code style={{ color: '#0ff0fc' }}>assessmentType</code>.
                        </p>
                        <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={8} placeholder='[{"text": "What is OOP?", "course": "...", "assessmentType": "Quiz", "marks": 2, "difficulty": "Easy"}]' style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '1.2rem' }} />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowImport(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleImport} disabled={loading || !importText.trim()} className="primary-btn">
                                {loading ? <Loader2 className="spin" size={16} /> : <><Upload size={15} /> Import</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionBank;
