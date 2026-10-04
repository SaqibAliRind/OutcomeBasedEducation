import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    FolderOpen, FileText, CheckCircle, Clock, AlertTriangle, Archive,
    Plus, Eye, Download, Upload, Lock, XCircle, BarChart2, Target,
    BookOpen, BookMarked, Layers, Save, RefreshCw, ChevronDown, ChevronRight,
    ClipboardList, Activity, TrendingDown, Users, Trash2, X
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const statusColor = { Draft: '#0ff0fc', Submitted: '#bc13fe', 'Under Review': '#F59E0B', Approved: '#10B981', Returned: '#ff1b6b', Archived: 'rgba(255,255,255,0.4)' };

const SectionCard = ({ icon, title, color = '#0ff0fc', open, onToggle, count = null, children }) => (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20`, borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
        <button onClick={onToggle} className="action-btn">
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: '0.95rem' }}>
                {React.cloneElement(icon, { size: 18, color })} {title}
                {count !== null && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', background: `${color}20`, color }}>{count}</span>}
            </span>
            {open ? <ChevronDown size={16} color="rgba(255,255,255,0.4)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.4)" />}
        </button>
        {open && <div style={{ padding: '0 1.2rem 1.2rem' }}>{children}</div>}
    </div>
);

const DocRow = ({ doc, onDelete, locked }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} color="#0ff0fc" />
            <span style={{ fontSize: '0.85rem', color: '#fff' }}>{doc.name}</span>
            <span style={{ fontSize: '0.72rem', color: '#0ff0fc', background: 'rgba(15,240,252,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{doc.version || 'v1.0'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            {doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" download
                   style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                   title="Download file">
                    <Download size={14} />
                </a>
            ) : (
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', fontStyle: 'italic' }}>No file</span>
            )}
            {!locked && <button onClick={() => onDelete(doc._id)} style={{ background: 'none', border: 'none', color: '#ff1b6b', cursor: 'pointer' }}><Trash2 size={14} /></button>}
        </div>
    </div>
);


const AddDocForm = ({ section, onAdd, onUpload, courseFileId, loading }) => {
    const [name, setName] = useState('');
    const [version, setVersion] = useState('v1.0');
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState('name'); // 'name' or 'file'

    const submitName = (e) => {
        e.preventDefault();
        if (!name) return;
        onAdd(section, { name, version });
        setName('');
    };

    const submitFile = async (e) => {
        e.preventDefault();
        if (!file || !courseFileId) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', section);
        formData.append('version', version);
        await onUpload(courseFileId, formData);
        setFile(null);
        e.target.reset();
    };

    return (
        <div style={{ marginTop: '0.8rem' }}>
            {/* Toggle */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {[['name', 'Add by Name'], ['file', '📁 Upload File']].map(([m, label]) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                        style={{ padding: '4px 12px', borderRadius: '20px', border: `1px solid ${mode === m ? '#0ff0fc' : 'rgba(255,255,255,0.1)'}`, background: mode === m ? 'rgba(15,240,252,0.15)' : 'transparent', color: mode === m ? '#0ff0fc' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>
                        {label}
                    </button>
                ))}
            </div>

            {mode === 'name' ? (
                <form className="modal-form" onSubmit={submitName} style={{ display: 'flex', gap: 8 }}>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Document name..." style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }} />
                    <input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0" style={{ width: 60, padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }} />
                    <button type="submit" disabled={loading} style={{ padding: '7px 14px', background: 'rgba(15,240,252,0.15)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '6px', color: '#0ff0fc', cursor: 'pointer' }}>
                        <Plus size={14} />
                    </button>
                </form>
            ) : (
                <form className="modal-form" onSubmit={submitFile} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(15,240,252,0.3)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Upload size={14} color="#0ff0fc" />
                        {file ? file.name : 'Click to choose file (PDF, DOC, DOCX, PPT, XLSX)'}
                        <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg" style={{ display: 'none' }}
                            onChange={e => setFile(e.target.files[0])} />
                    </label>
                    <input value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0" style={{ width: 60, padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }} />
                    <button type="submit" disabled={loading || !file} style={{ padding: '7px 14px', background: file ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${file ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', color: file ? '#10B981' : 'rgba(255,255,255,0.3)', cursor: file ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 5, fontWeight: '600', fontSize: '0.82rem' }}>
                        <Upload size={14} /> {loading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            )}
        </div>
    );
};

const TeacherCourseFile = ({ initialOfferingId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [allCourseFiles, setAllCourseFiles] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(initialOfferingId);
    const [fileData, setFileData] = useState(null);   // { courseFile, liveStats }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [openSections, setOpenSections] = useState({ outline: true });
    const [clos, setClos] = useState([]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    useEffect(() => {
        if (user.role === 'Teacher') {
            axios.get(`${API}/teachers/courses`, { headers: hdrs }).then(r => setCourses(r.data || [])).catch(console.error);
        } else {
            axios.get(`${API}/academic/courseofferings`, { headers: hdrs }).then(r => setCourses(r.data || [])).catch(console.error);
        }
        axios.get(`${API}/clos`, { headers: hdrs }).then(r => setClos(r.data || [])).catch(console.error);
        axios.get(`${API}/course-files`, { headers: hdrs }).then(r => setAllCourseFiles(r.data || [])).catch(console.error);
    }, []);

    const loadFile = (offeringId = selectedOffering) => {
        // Guard: only call API with valid MongoDB ObjectId (24 hex chars)
        if (!offeringId || !/^[a-f\d]{24}$/i.test(offeringId)) return;
        setLoading(true);
        axios.get(`${API}/course-files/offering/${offeringId}`, { headers: hdrs })
            .then(r => {
                setFileData(r.data);
                // Refresh all course files to update dashboard stats
                axios.get(`${API}/course-files`, { headers: hdrs }).then(res => setAllCourseFiles(res.data || []));
            })
            .catch(e => showToast(e.response?.data?.message || 'Error loading file', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (selectedOffering) loadFile(selectedOffering); }, [selectedOffering]);

    const cf = fileData?.courseFile;
    const stats = fileData?.liveStats;
    const isLocked = cf && ['Approved', 'Archived'].includes(cf.status);

    const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

    // Add doc to a section
    const handleAddDoc = async (section, doc) => {
        if (!cf) return;
        setSaving(true);
        const newList = [...(cf[section] || []), { ...doc, uploadedBy: user._id, uploadedAt: new Date().toISOString() }];
        try {
            await axios.patch(`${API}/course-files/${cf._id}/section`, { section, data: newList }, { headers: hdrs });
            loadFile();
            showToast('Document added');
        } catch (e) { showToast(e.response?.data?.message || 'Error', 'error'); }
        finally { setSaving(false); }
    };

    // Upload a real file to a section
    const handleUploadDoc = async (courseFileId, formData) => {
        setSaving(true);
        try {
            const res = await axios.post(`${API}/course-files/${courseFileId}/upload`, formData, {
                headers: { ...hdrs, 'Content-Type': 'multipart/form-data' }
            });
            setFileData(prev => ({ ...prev, courseFile: res.data }));
            showToast('File uploaded successfully!');
        } catch (e) {
            showToast(e.response?.data?.message || 'Upload failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Remove doc from a section
    const handleRemoveDoc = async (section, docId) => {
        if (!cf) return;
        const newList = (cf[section] || []).filter(d => d._id !== docId);
        setSaving(true);
        try {
            await axios.patch(`${API}/course-files/${cf._id}/section`, { section, data: newList }, { headers: hdrs });
            loadFile();
            showToast('Document removed');
        } catch (e) { showToast('Error', 'error'); }
        finally { setSaving(false); }
    };

    // Lesson Plan
    const [lpRow, setLpRow] = useState({ week: '', topic: '', clo: '', btLevel: 'Remember', teachingMethod: '', assessmentMethod: '' });
    const handleAddLpRow = async () => {
        if (!lpRow.topic || !lpRow.week) return showToast('Week and Topic required', 'error');
        const newList = [...(cf.lessonPlan || []), lpRow];
        setSaving(true);
        try {
            await axios.patch(`${API}/course-files/${cf._id}/section`, { section: 'lessonPlan', data: newList }, { headers: hdrs });
            loadFile();
            setLpRow({ week: '', topic: '', clo: '', btLevel: 'Remember', teachingMethod: '', assessmentMethod: '' });
        } catch (e) { showToast('Error', 'error'); }
        finally { setSaving(false); }
    };

    // Closing the Loop
    const [ctlRow, setCtlRow] = useState({ weakCLO: '', rootCause: '', correctiveAction: '', improvementPlan: '', resourcesRequired: '', responsiblePerson: '', targetDate: '', followUpStatus: 'Pending' });
    const handleAddCtl = async () => {
        const newList = [...(cf.closingLoop || []), ctlRow];
        setSaving(true);
        try {
            await axios.patch(`${API}/course-files/${cf._id}/section`, { section: 'closingLoop', data: newList }, { headers: hdrs });
            loadFile();
            setCtlRow({ weakCLO: '', rootCause: '', correctiveAction: '', improvementPlan: '', resourcesRequired: '', responsiblePerson: '', targetDate: '', followUpStatus: 'Pending' });
        } catch (e) { showToast('Error', 'error'); }
        finally { setSaving(false); }
    };

    const handleSubmit = async () => {
        if (!cf) return;
        setSaving(true);
        try {
            await axios.patch(`${API}/course-files/${cf._id}/status`, { status: 'Submitted', remarks: 'Submitted by teacher' }, { headers: hdrs });
            loadFile();
            showToast('Course File submitted for review!');
        } catch (e) { showToast('Error submitting', 'error'); }
        finally { setSaving(false); }
    };

    // Grade distribution from liveStats
    const grades = stats?.marks?.gradeDistribution || {};
    const gradeKeys = Object.keys(grades);

    // Dashboard Stats
    const dashboardStats = {
        total: allCourseFiles.length || courses.length,
        completed: allCourseFiles.filter(f => f.completeness === 100).length,
        pending: allCourseFiles.filter(f => ['Draft', 'Submitted', 'Under Review'].includes(f.status)).length,
        approved: allCourseFiles.filter(f => f.status === 'Approved').length,
        returned: allCourseFiles.filter(f => f.status === 'Returned').length,
        archived: allCourseFiles.filter(f => f.status === 'Archived').length,
    };

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' }}>{toast.msg}</div>}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <FolderOpen size={22} color="#0ff0fc" /> Course File Management
                </h3>
                {cf && !isLocked && (
                    <button onClick={handleSubmit} disabled={saving} className="primary-btn">
                        <CheckCircle size={16} /> Submit for Review
                    </button>
                )}
            </div>

            {/* Course File Dashboard Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Files', value: dashboardStats.total, color: '#0ff0fc', icon: <FolderOpen size={18} /> },
                    { label: 'Completed (100%)', value: dashboardStats.completed, color: '#10B981', icon: <CheckCircle size={18} /> },
                    { label: 'Pending/Draft', value: dashboardStats.pending, color: '#F59E0B', icon: <Clock size={18} /> },
                    { label: 'Approved', value: dashboardStats.approved, color: '#10B981', icon: <CheckCircle size={18} /> },
                    { label: 'Returned', value: dashboardStats.returned, color: '#ff1b6b', icon: <AlertTriangle size={18} /> },
                    { label: 'Archived', value: dashboardStats.archived, color: 'rgba(255,255,255,0.4)', icon: <Archive size={18} /> },
                ].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}30`, borderRadius: '12px', padding: '1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.color }} />
                        <div style={{ color: s.color, opacity: 0.5, marginBottom: 4 }}>{s.icon}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Course Selector */}
            <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#0ff0fc', fontWeight: 'bold' }}>Select Course Offering to Manage File</label>
                <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={{ width: '100%', maxWidth: 500, padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <option value="">-- Choose Course --</option>
                    {user.role === 'Teacher'
                        ? courses.filter(c => c._id).map(c => <option key={c._id} value={c._id}>{c.course?.code} — {c.course?.name} | {c.section?.name} | {c.semester?.name}</option>)
                        : courses.filter(c => c._id).map(c => <option key={c._id} value={c._id}>{c.course?.code} — {c.course?.name} | Section: {c.section?.name} | Teacher: {c.teacher?.name}</option>)
                    }
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#0ff0fc' }}>Loading Course File...</div>
            ) : !selectedOffering ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Please select a course offering.</div>
            ) : !cf ? null : (
                <>
                    {/* Status Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2rem', padding: '1rem 1.2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#0ff0fc', fontWeight: 'bold', fontSize: '1rem' }}>{cf.courseOffering?.course?.code} — {cf.courseOffering?.course?.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: 3 }}>
                                {cf.courseOffering?.semester?.name} | {cf.courseOffering?.program?.name} | Section {cf.courseOffering?.section?.name} | v{cf.version}.0
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {[['Completeness', cf.completeness + '%', '#10B981'], ['Status', cf.status, statusColor[cf.status] || '#fff']].map(([l, v, c]) => (
                                <div key={l} style={{ textAlign: 'center' }}>
                                    <div style={{ color: c, fontWeight: 'bold', fontSize: '1.1rem' }}>{v}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Stats Cards */}
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            {[
                                { label: 'Total Students', val: stats.marks.totalStudents, color: '#0ff0fc' },
                                { label: 'Pass', val: stats.marks.passCount, color: '#10B981' },
                                { label: 'Fail', val: stats.marks.failCount, color: '#ff1b6b' },
                                { label: 'Avg %', val: stats.marks.avgPercentage + '%', color: '#F59E0B' },
                                { label: 'Mappings', val: stats.mappings, color: '#bc13fe' },
                                { label: 'Blueprints', val: stats.blueprints, color: '#ff6b35' },
                                { label: 'Rubrics', val: stats.rubrics, color: '#8B5CF6' },
                            ].map((s, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}25`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: s.color }}>{s.val}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Grade Distribution */}
                    {gradeKeys.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={16} color="#F59E0B" /> Grade Distribution (Auto)</div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {gradeKeys.map(g => (
                                    <div key={g} style={{ textAlign: 'center', minWidth: 50 }}>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: g === 'F' ? '#ff1b6b' : '#10B981' }}>{grades[g]}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{g}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Course Outline ── */}
                    <SectionCard icon={<FileText />} title="Course Outline" color="#0ff0fc" count={(cf.courseOutline||[]).length} open={openSections.outline} onToggle={() => toggleSection('outline')}>
                        {(cf.courseOutline || []).map(d => <DocRow key={d._id} doc={d} onDelete={id => handleRemoveDoc('courseOutline', id)} locked={isLocked} />)}
                        {!isLocked && <AddDocForm section="courseOutline" onAdd={handleAddDoc} onUpload={handleUploadDoc} courseFileId={cf._id} loading={saving} />}
                    </SectionCard>

                    {/* ── Lesson Plan ── */}
                    <SectionCard icon={<BookOpen />} title="Lesson Plan" color="#10B981" count={(cf.lessonPlan||[]).length} open={openSections.lp} onToggle={() => toggleSection('lp')}>
                        {(cf.lessonPlan || []).length > 0 && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem', color: '#fff', marginBottom: '1rem' }}>
                                    <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {['Week', 'Topic', 'CLO', 'BT', 'Teaching', 'Assessment', 'Status'].map(h => <th key={h} style={{ padding: '8px', color: 'rgba(255,255,255,0.5)' }}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                        {cf.lessonPlan.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '8px' }}>{r.week}</td>
                                                <td style={{ padding: '8px', fontWeight: '600' }}>{r.topic}</td>
                                                <td style={{ padding: '8px', color: '#0ff0fc' }}>{r.clo?.code || '—'}</td>
                                                <td style={{ padding: '8px', color: '#bc13fe' }}>{r.btLevel}</td>
                                                <td style={{ padding: '8px' }}>{r.teachingMethod}</td>
                                                <td style={{ padding: '8px' }}>{r.assessmentMethod}</td>
                                                <td style={{ padding: '8px' }}><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', background: r.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: r.status === 'Completed' ? '#10B981' : 'rgba(255,255,255,0.5)' }}>{r.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {!isLocked && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {[
                                    <input type="number" placeholder="Week#" value={lpRow.week} onChange={e => setLpRow(p => ({ ...p, week: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />,
                                    <input placeholder="Topic" value={lpRow.topic} onChange={e => setLpRow(p => ({ ...p, topic: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />,
                                    <select value={lpRow.clo} onChange={e => setLpRow(p => ({ ...p, clo: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        <option value="">CLO</option>
                                        {clos.map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                                    </select>,
                                    <select value={lpRow.btLevel} onChange={e => setLpRow(p => ({ ...p, btLevel: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                        {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map(b => <option key={b}>{b}</option>)}
                                    </select>,
                                    <input placeholder="Teaching Method" value={lpRow.teachingMethod} onChange={e => setLpRow(p => ({ ...p, teachingMethod: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />,
                                    <input placeholder="Assessment Method" value={lpRow.assessmentMethod} onChange={e => setLpRow(p => ({ ...p, assessmentMethod: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />,
                                ].map((el, i) => <div key={i}>{el}</div>)}
                                <button onClick={handleAddLpRow} disabled={saving} style={{ padding: '7px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Plus size={14} /> Add Week
                                </button>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Teaching Material ── */}
                    <SectionCard icon={<Layers />} title="Teaching Material" color="#bc13fe" count={(cf.teachingMaterial||[]).length} open={openSections.material} onToggle={() => toggleSection('material')}>
                        {(cf.teachingMaterial || []).map(d => <DocRow key={d._id} doc={d} onDelete={id => handleRemoveDoc('teachingMaterial', id)} locked={isLocked} />)}
                        {!isLocked && <AddDocForm section="teachingMaterial" onAdd={handleAddDoc} onUpload={handleUploadDoc} courseFileId={cf._id} loading={saving} />}
                    </SectionCard>

                    {/* ── Assessment Papers ── */}
                    <SectionCard icon={<ClipboardList />} title="Assessment Papers (Quiz/Mid/Final)" color="#F59E0B" count={(cf.assessmentPapers||[]).length} open={openSections.papers} onToggle={() => toggleSection('papers')}>
                        {(cf.assessmentPapers || []).map(d => <DocRow key={d._id} doc={d} onDelete={id => handleRemoveDoc('assessmentPapers', id)} locked={isLocked} />)}
                        {!isLocked && <AddDocForm section="assessmentPapers" onAdd={handleAddDoc} onUpload={handleUploadDoc} courseFileId={cf._id} loading={saving} />}
                    </SectionCard>

                    {/* ── Sample Student Work ── */}
                    <SectionCard icon={<Users />} title="Sample Student Work (Evidence)" color="#ff6b35" count={(cf.sampleStudentWork||[]).length} open={openSections.sample} onToggle={() => toggleSection('sample')}>
                        {(cf.sampleStudentWork || []).map(d => <DocRow key={d._id} doc={d} onDelete={id => handleRemoveDoc('sampleStudentWork', id)} locked={isLocked} />)}
                        {!isLocked && <AddDocForm section="sampleStudentWork" onAdd={handleAddDoc} onUpload={handleUploadDoc} courseFileId={cf._id} loading={saving} />}
                    </SectionCard>

                    {/* ── Closing the Loop ── */}
                    <SectionCard icon={<RefreshCw />} title="Closing the Loop" color="#10B981" count={(cf.closingLoop||[]).length} open={openSections.ctl} onToggle={() => toggleSection('ctl')}>
                        {(cf.closingLoop || []).map((r, i) => (
                            <div key={i} style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '1rem', marginBottom: '0.8rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Weak CLO:</span> {r.weakCLO?.code || r.weakCLO}</div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Status:</span> <span style={{ color: r.followUpStatus === 'Completed' ? '#10B981' : '#F59E0B' }}>{r.followUpStatus}</span></div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Root Cause:</span> {r.rootCause}</div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Corrective Action:</span> {r.correctiveAction}</div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Improvement Plan:</span> {r.improvementPlan}</div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Target Date:</span> {r.targetDate?.split('T')[0]}</div>
                                </div>
                            </div>
                        ))}
                        {!isLocked && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <select value={ctlRow.weakCLO} onChange={e => setCtlRow(p => ({ ...p, weakCLO: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                    <option value="">Weak CLO</option>
                                    {clos.map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                                </select>
                                {[['rootCause', 'Root Cause'], ['correctiveAction', 'Corrective Action'], ['improvementPlan', 'Improvement Plan'], ['resourcesRequired', 'Resources Required'], ['responsiblePerson', 'Responsible Person']].map(([f, ph]) => (
                                    <input key={f} placeholder={ph} value={ctlRow[f]} onChange={e => setCtlRow(p => ({ ...p, [f]: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                ))}
                                <input type="date" value={ctlRow.targetDate} onChange={e => setCtlRow(p => ({ ...p, targetDate: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                                <select value={ctlRow.followUpStatus} onChange={e => setCtlRow(p => ({ ...p, followUpStatus: e.target.value }))} style={{ padding: '7px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                    {['Pending', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
                                </select>
                                <button onClick={handleAddCtl} disabled={saving} style={{ padding: '7px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Plus size={14} /> Add Entry
                                </button>
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Supporting Evidence ── */}
                    <SectionCard icon={<BookMarked />} title="Supporting Evidence & Additional Docs" color="#8B5CF6" count={(cf.supportingEvidence||[]).length + (cf.additionalDocs||[]).length} open={openSections.evidence} onToggle={() => toggleSection('evidence')}>
                        {(cf.supportingEvidence || []).map(d => <DocRow key={d._id} doc={d} onDelete={id => handleRemoveDoc('supportingEvidence', id)} locked={isLocked} />)}
                        {!isLocked && <AddDocForm section="supportingEvidence" onAdd={handleAddDoc} onUpload={handleUploadDoc} courseFileId={cf._id} loading={saving} />}
                    </SectionCard>

                    {/* Workflow History */}
                    {(cf.workflowHistory || []).length > 0 && (
                        <SectionCard icon={<Activity />} title="Workflow History" color="#bc13fe" open={openSections.workflow} onToggle={() => toggleSection('workflow')}>
                            {cf.workflowHistory.map((h, i) => (
                                <div key={i} style={{ fontSize: '0.82rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>
                                    <span style={{ color: statusColor[h.fromStatus] }}>{h.fromStatus}</span> → <span style={{ color: statusColor[h.toStatus] }}>{h.toStatus}</span>
                                    {h.remarks && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 10 }}>"{h.remarks}"</span>}
                                </div>
                            ))}
                        </SectionCard>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherCourseFile;
