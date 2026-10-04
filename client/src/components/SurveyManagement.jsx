import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    ClipboardList, Plus, Eye, BarChart2, Send, Clock, CheckCircle2,
    XCircle, Users, TrendingUp, Star, AlertTriangle, Download, X, Check, ChevronRight,
    Trash2, Copy, Calendar
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchSurveys, createSurvey, updateSurveyStatus, deleteSurvey, updateSurvey } from '../store/surveySlice';
import '../style/UniversityAdminDashboard.css';

// ── Types Configuration ────────────────────────────────────────────────────────
const SURVEY_TYPES = [
    // OBE
    { id: 'clo_survey', label: 'CLO Survey', icon: '🎯', color: '#0ff0fc', category: 'OBE Surveys' },
    { id: 'plo_survey', label: 'PLO Survey', icon: '📈', color: '#bc13fe', category: 'OBE Surveys' },
    { id: 'ga_survey', label: 'Graduate Attribute Survey', icon: '🎓', color: '#50cc7f', category: 'OBE Surveys' },
    // Accreditation
    { id: 'exit', label: 'Exit Survey', icon: '🚪', color: '#ff1b6b', category: 'Accreditation Surveys' },
    { id: 'alumni', label: 'Alumni Survey', icon: '👨‍🎓', color: '#ff9800', category: 'Accreditation Surveys' },
    { id: 'employer', label: 'Employer Survey', icon: '🏢', color: '#45caff', category: 'Accreditation Surveys' },
    { id: 'industry', label: 'Industry Survey', icon: '🏭', color: '#bc13fe', category: 'Accreditation Surveys' },
    // General
    { id: 'event', label: 'Event Feedback', icon: '🎉', color: '#ffcc00', category: 'General Surveys' },
    { id: 'workshop', label: 'Workshop Feedback', icon: '🛠', color: '#0ff0fc', category: 'General Surveys' },
    { id: 'seminar', label: 'Seminar Feedback', icon: '🎤', color: '#50cc7f', category: 'General Surveys' },
    { id: 'training', label: 'Training Feedback', icon: '📚', color: '#ff1b6b', category: 'General Surveys' }
];

const BLANK_FORM = { title: '', type: '', department: '', program: '', course: '', session: '', semester: '', startDate: '', endDate: '', anonymous: true, questions: [] };
const QUESTION_TYPES = ['Multiple Choice', 'Rating Scale (1–5)', 'Likert Scale', 'Yes / No', 'Short Answer', 'Long Answer'];

const statusColor  = s => s === 'Active' ? '#50cc7f' : s === 'Closed' ? '#ff1b6b' : '#ffcc00';
const statusBg     = s => s === 'Active' ? 'rgba(80,204,127,0.12)' : s === 'Closed' ? 'rgba(255,27,107,0.12)' : 'rgba(255,204,0,0.12)';

const Tip = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{ background: 'rgba(2,9,23,0.95)', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '10px', padding: '10px 16px' }}>
        <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ margin: 0, color: p.color || p.fill, fontWeight: '700', fontSize: '0.88rem' }}>{p.name}: {p.value}</p>)}
    </div>
) : null;

// ── Component ────────────────────────────────────────────────────────────────
const SurveyManagement = () => {
    const dispatch = useDispatch();
    const { surveys, loading } = useSelector(state => state.surveys);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [scheduleModal, setScheduleModal] = useState(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [newQuestion, setNewQuestion] = useState({ text: '', type: 'Rating Scale (1–5)' });
    const [editQuestionIdx, setEditQuestionIdx] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        dispatch(fetchSurveys());
    }, [dispatch]);

    const total      = surveys.length;
    const active     = surveys.filter(s => s.status === 'Active').length;
    const closed     = surveys.filter(s => s.status === 'Closed').length;
    const draft      = surveys.filter(s => s.status === 'Draft').length;
    
    // Aggregation for responses
    let totalResp = 0;
    let totalExpect = 0;
    surveys.forEach(s => {
        totalResp += (s.responses?.length || 0);
        totalExpect += (s.totalExpected || 100); // default to 100 if missing for visuals
    });
    const respRate = totalExpect ? Math.round((totalResp / totalExpect) * 100) : 0;

    const filtered = surveys.filter(s =>
        (filterStatus === 'All' || s.status === filterStatus) &&
        (filterType   === 'All' || s.type === filterType)
    );

    const addQuestion = () => {
        if (!newQuestion.text.trim()) return;
        if (editQuestionIdx !== null) {
            const updated = [...form.questions];
            updated[editQuestionIdx] = { ...newQuestion, id: updated[editQuestionIdx].id };
            setForm(prev => ({ ...prev, questions: updated }));
            setEditQuestionIdx(null);
        } else {
            setForm(prev => ({ ...prev, questions: [...prev.questions, { ...newQuestion, id: Date.now() }] }));
        }
        setNewQuestion({ text: '', type: 'Rating Scale (1–5)' });
    };
    const removeQuestion = (idx) => {
        const updated = [...form.questions];
        updated.splice(idx, 1);
        setForm(prev => ({ ...prev, questions: updated }));
    };
    const editQuestion = (idx) => {
        setNewQuestion({ text: form.questions[idx].text, type: form.questions[idx].type });
        setEditQuestionIdx(idx);
    };
    const moveQuestion = (idx, dir) => {
        if (idx + dir < 0 || idx + dir >= form.questions.length) return;
        const updated = [...form.questions];
        const temp = updated[idx];
        updated[idx] = updated[idx + dir];
        updated[idx + dir] = temp;
        setForm(prev => ({ ...prev, questions: updated }));
    };

    const handleCreate = () => {
        if (!form.title || !form.type) return alert('Title and Type are required.');
        dispatch(createSurvey({
            ...form,
            status: 'Draft'
        })).then(() => {
            setForm(BLANK_FORM);
            setActiveTab('surveys');
        });
    };

    const handleClone = (s) => {
        const { _id, createdAt, updatedAt, status, responses, ...clonedData } = s;
        clonedData.title = clonedData.title + ' (Copy)';
        dispatch(createSurvey({ ...clonedData, status: 'Draft' }));
    };

    const handleDelete = (id) => {
        if(window.confirm('Are you sure you want to delete this survey?')) {
            dispatch(deleteSurvey(id));
        }
    };

    const handleStatus = (id, newStatus) => {
        dispatch(updateSurveyStatus({ id, status: newStatus }));
    };

    // ── Mock Chart Data ──
    const TYPE_DIST = Object.entries(surveys.reduce((acc, s) => { acc[s.type] = (acc[s.type]||0)+1; return acc; }, {})).map(([name, value]) => ({ name, value, color: SURVEY_TYPES.find(t=>t.label===name)?.color || '#fff' }));
    const RESPONSE_TREND = [{ week: 'W1', responses: 5 }, { week: 'W2', responses: 12 }, { week: 'W3', responses: 25 }, { week: 'W4', responses: 48 }, { week: 'W5', responses: totalResp }];

    const kpiData = [
        { label: 'Total Surveys', value: total, color: '#0ff0fc', icon: <ClipboardList size={20}/> },
        { label: 'Active', value: active, color: '#50cc7f', icon: <CheckCircle2 size={20}/> },
        { label: 'Closed', value: closed, color: '#ff1b6b', icon: <XCircle size={20}/> },
        { label: 'Draft', value: draft, color: '#ffcc00', icon: <Clock size={20}/> },
        { label: 'Responses', value: totalResp, color: '#bc13fe', icon: <Users size={20}/> },
        { label: 'Avg Rate', value: respRate + '%', color: '#ff9800', icon: <TrendingUp size={20}/> },
    ];

    const tabs = [
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'surveys', label: '📋 All Surveys' },
        { id: 'create', label: '➕ Create Survey' },
        { id: 'types', label: '📂 Survey Types' },
        { id: 'analytics', label: '📈 Analytics' },
        { id: 'reports', label: '📑 Reports' },
    ];

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <ClipboardList size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> Survey Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Manage OBE, Accreditation, and General Surveys dynamically.</p>
                </div>
                <button onClick={() => { setActiveTab('create'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <Plus size={18}/> Create Survey
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs-wrapper" style={{ marginBottom: '1.5rem' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={'tab-btn ' + (activeTab === t.id ? 'active' : '')}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && <div style={{ color: '#0ff0fc', padding: '20px', textAlign: 'center' }}>Loading Surveys...</div>}

            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && !loading && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
                        {kpiData.map(k => (
                            <div key={k.label} style={{ background: k.color + '12', border: `1px solid ${k.color}30`, borderRadius: '14px', padding: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{k.label}</span>
                                    <span style={{ color: k.color }}>{k.icon}</span>
                                </div>
                                <div style={{ color: k.color, fontSize: '2rem', fontWeight: '800' }}>{k.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1rem' }}>📈 Response Trend</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={RESPONSE_TREND}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                                    <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="responses" name="Responses" fill="#0ff0fc" radius={[6,6,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1rem' }}>🍕 Surveys by Type</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={TYPE_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} labelLine={false}>
                                        {TYPE_DIST.map((e,i) => <Cell key={i} fill={e.color || '#fff'}/>)}
                                    </Pie>
                                    <Tooltip content={<Tip/>}/>
                                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ALL SURVEYS ── */}
            {activeTab === 'surveys' && !loading && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {['All','Active','Closed','Draft'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                style={{ padding: '7px 16px', borderRadius: '20px', border: `1px solid ${filterStatus === s ? '#0ff0fc' : 'rgba(255,255,255,0.1)'}`, background: filterStatus === s ? 'rgba(15,240,252,0.12)' : 'rgba(255,255,255,0.03)', color: filterStatus === s ? '#0ff0fc' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.15s' }}>
                                {s}
                            </button>
                        ))}
                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                            style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', outline: 'none', fontSize: '0.85rem' }}>
                            <option value="All">All Types</option>
                            {SURVEY_TYPES.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
                        </select>
                        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{filtered.length} surveys</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)' }}>No surveys found.</p>}
                        {filtered.map(s => {
                            const responsesCount = s.responses?.length || 0;
                            const totalExpected = s.totalExpected || 100;
                            const pct = Math.round((responsesCount / totalExpected) * 100);
                            return (
                                <div key={s._id} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '18px 20px', border: `1px solid ${statusColor(s.status)}22`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <span style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{s.title}</span>
                                            <span style={{ background: statusBg(s.status), color: statusColor(s.status), border: `1px solid ${statusColor(s.status)}40`, padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{s.status}</span>
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginBottom: '10px' }}>
                                            {s.type} {s.course ? `· ${s.course}` : ''} {s.endDate ? `· Ends: ${new Date(s.endDate).toLocaleDateString()}` : ''}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: Math.min(pct,100) + '%', height: '100%', background: `linear-gradient(90deg, ${statusColor(s.status)}, ${statusColor(s.status)}80)`, borderRadius: '10px' }}/>
                                            </div>
                                            <span style={{ color: statusColor(s.status), fontWeight: '700', fontSize: '0.82rem', minWidth: '70px' }}>{responsesCount}/{totalExpected} ({pct}%)</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', width: '220px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setSelectedSurvey(s)} title="View" style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer' }}><Eye size={14}/></button>
                                        <button onClick={() => handleClone(s)} title="Clone" style={{ background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer' }}><Copy size={14}/></button>
                                        <button onClick={() => setScheduleModal(s)} title="Schedule" style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.3)', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer' }}><Calendar size={14}/></button>
                                        
                                        {s.status === 'Draft' && <button onClick={() => handleStatus(s._id, 'Active')} title="Activate" style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer' }}><Send size={14}/></button>}
                                        {s.status === 'Active' && <button onClick={() => handleStatus(s._id, 'Closed')} title="Deactivate" style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: '1px solid rgba(255,27,107,0.3)', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer' }}><XCircle size={14}/></button>}
                                        <button onClick={() => handleDelete(s._id)} title="Delete" style={{ background: 'rgba(255,0,0,0.1)', color: 'red', border: '1px solid rgba(255,0,0,0.3)', padding: '7px 10px', borderRadius: '7px', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── CREATE SURVEY ── */}
            {activeTab === 'create' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, color: '#0ff0fc', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20}/> Form Details</h3>

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Survey Title *</label>
                            <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}/>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '6px' }}>Survey Type *</label>
                            <select value={form.type} onChange={e => {
                                const t = SURVEY_TYPES.find(x => x.label === e.target.value);
                                setForm(p => ({...p, type: e.target.value, category: t ? t.category.split(' ')[0] : 'General' }));
                            }} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                                <option value="">Select Type</option>
                                {SURVEY_TYPES.map(t => <option key={t.id} value={t.label}>{t.category} - {t.label}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { label: 'Department', key: 'department' },
                                { label: 'Program', key: 'program' },
                                { label: 'Course', key: 'course' },
                                { label: 'Session', key: 'session' },
                                { label: 'Semester', key: 'semester' }
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '6px' }}>{f.label}</label>
                                    <input type="text" value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}/>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '6px' }}>Start Date</label>
                                <input type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}/>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '6px' }}>End Date</label>
                                <input type="date" value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}/>
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            <div onClick={() => setForm(p => ({...p, anonymous: !p.anonymous}))} style={{ width: '22px', height: '22px', borderRadius: '5px', border: `2px solid ${form.anonymous ? '#0ff0fc' : 'rgba(255,255,255,0.2)'}`, background: form.anonymous ? '#0ff0fc' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {form.anonymous && <Check size={13} color="#000" strokeWidth={3}/>}
                            </div>
                            Anonymous Responses
                        </label>

                        <button onClick={handleCreate} className="primary-btn">
                            ✅ Create Survey
                        </button>
                    </div>

                    <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, color: '#bc13fe', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>❓ Question Builder</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" placeholder="Enter question..." value={newQuestion.text} onChange={e => setNewQuestion(p => ({...p, text: e.target.value}))} style={{ flex: 1, padding: '9px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#fff', outline: 'none' }}/>
                            <select value={newQuestion.type} onChange={e => setNewQuestion(p => ({...p, type: e.target.value}))} style={{ padding: '9px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#fff', outline: 'none' }}>
                                {QUESTION_TYPES.map(qt => <option key={qt} value={qt}>{qt}</option>)}
                            </select>
                            <button onClick={addQuestion} style={{ padding: '9px 14px', background: 'rgba(188,19,254,0.15)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {editQuestionIdx !== null ? 'Update' : <Plus size={16}/>}
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '440px', overflowY: 'auto' }}>
                            {form.questions.map((q, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button onClick={() => moveQuestion(idx, -1)} style={{ background: 'transparent', border: 'none', color: idx === 0 ? 'transparent' : 'rgba(255,255,255,0.5)', cursor: idx === 0 ? 'default' : 'pointer', padding: 0 }}>▲</button>
                                        <button onClick={() => moveQuestion(idx, 1)} style={{ background: 'transparent', border: 'none', color: idx === form.questions.length - 1 ? 'transparent' : 'rgba(255,255,255,0.5)', cursor: idx === form.questions.length - 1 ? 'default' : 'pointer', padding: 0 }}>▼</button>
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Q{idx+1}</span>
                                    <span style={{ flex: 1, color: '#fff', fontSize: '0.88rem' }}>{q.text}</span>
                                    <span style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem' }}>{q.type}</span>
                                    
                                    <button onClick={() => editQuestion(idx)} style={{ background: 'transparent', border: 'none', color: '#ffcc00', cursor: 'pointer' }}>✎</button>
                                    <button onClick={() => removeQuestion(idx)} style={{ background: 'transparent', border: 'none', color: '#ff1b6b', cursor: 'pointer' }}><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── ANALYTICS ── */}
            {activeTab === 'analytics' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
                        {[
                            { title: 'Response Rate', val: respRate + '%', col: '#0ff0fc' },
                            { title: 'Average Rating', val: '4.2 ⭐', col: '#ffcc00' },
                            { title: 'Teacher Rating', val: '4.5 ⭐', col: '#bc13fe' },
                            { title: 'Course Rating', val: '4.1 ⭐', col: '#50cc7f' },
                            { title: 'Department Rating', val: '4.3 ⭐', col: '#ff9800' },
                            { title: 'Program Rating', val: '4.4 ⭐', col: '#ff1b6b' },
                        ].map(k => (
                            <div key={k.title} style={{ background: k.col + '12', border: `1px solid ${k.col}30`, borderRadius: '14px', padding: '18px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '8px' }}>{k.title}</div>
                                <div style={{ color: k.col, fontSize: '1.8rem', fontWeight: '800' }}>{k.val}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── REPORTS ── */}
            {activeTab === 'reports' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {[
                        { title: 'Survey Summary', desc: 'Overview of all conducted surveys and their statuses.' },
                        { title: 'Survey Responses', desc: 'Detailed view of individual responses and metadata.' },
                        { title: 'Response Analysis', desc: 'Sentiment and trend analysis on response data.' },
                        { title: 'Comparative Survey Report', desc: 'Compare results across courses, teachers, and departments.' },
                    ].map(r => (
                        <div key={r.title} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{r.title}</h4>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', flex: 1 }}>{r.desc}</p>
                            <button style={{ padding: '10px', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Generate Report</button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── TYPES ── */}
            {activeTab === 'types' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {['OBE Surveys', 'Accreditation Surveys', 'General Surveys'].map(cat => (
                        <div key={cat}>
                            <h4 style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{cat}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '12px' }}>
                                {SURVEY_TYPES.filter(t => t.category === cat).map(t => (
                                    <div key={t.id} style={{ background: t.color + '0d', border: `1px solid ${t.color}25`, borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'transform 0.15s' }}
                                        onClick={() => { setActiveTab('create'); setForm(p => ({...p, type: t.label, category: cat.split(' ')[0]})); }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{t.icon}</div>
                                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{t.label}</div>
                                        <div style={{ color: t.color, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>Create <ChevronRight size={14}/></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Previews (Skipped details for brevity, standard glass panel) */}
            {scheduleModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel-dash" style={{ padding: '30px', borderRadius: '18px', width: '400px' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#fff' }}>Schedule: {scheduleModal.title}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Scheduling cron features will connect to backend scheduler.</p>
                        <button onClick={() => setScheduleModal(null)} style={{ padding: '10px 20px', background: '#bc13fe', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveyManagement;
