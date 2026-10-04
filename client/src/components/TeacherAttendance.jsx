import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import {
    Clock, Users, CheckCircle, XCircle, AlertCircle, Loader2,
    Calendar, BarChart2, RefreshCw, Save, Trash2, Edit, AlertTriangle,
    ChevronDown, Download, User
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const STATUS_COLORS = {
    Present: '#10B981',
    Absent: '#ff1b6b',
    Late: '#F59E0B',
    Leave: '#8B5CF6',
    Excused: '#0ff0fc'
};

const TeacherAttendance = ({ initialOfferingId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(initialOfferingId);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [remarksMap, setRemarksMap] = useState({});
    const [existingRecord, setExistingRecord] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [view, setView] = useState('mark'); // mark | history | analytics
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('mark');

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

    // When offering or date changes, load students + existing attendance
    useEffect(() => {
        if (!selectedOffering) return;
        setLoading(true);

        const offering = courses.find(c => c._id === selectedOffering);
        const sectionId = offering?.section?._id;

        Promise.all([
            axios.get(`${API}/enrollments?courseOffering=${selectedOffering}`, { headers: hdrs }),
            axios.get(`${API}/attendance?courseOffering=${selectedOffering}&date=${selectedDate}`, { headers: hdrs })
        ]).then(async ([stuRes, attRes]) => {
            let stuList = (stuRes.data || []).map(e => e.student).filter(Boolean);

            // Fallback for dummy data: if no formal enrollments exist, fetch students assigned to the section
            if (stuList.length === 0 && sectionId) {
                try {
                    const fallbackRes = await axios.get(`${API}/users?role=Student&section=${sectionId}`, { headers: hdrs });
                    stuList = fallbackRes.data || [];
                } catch (err) {
                    console.error("Fallback fetch failed", err);
                }
            }

            setStudents(stuList);

            const records = attRes.data || [];
            const todayRecord = records.find(r => {
                const d = new Date(r.date).toISOString().split('T')[0];
                return d === selectedDate && (r.courseOffering === selectedOffering || r.courseOffering?._id === selectedOffering);
            });

            if (todayRecord) {
                setExistingRecord(todayRecord);
                const newMap = {};
                const newRemarks = {};
                todayRecord.students?.forEach(s => {
                    const sid = s.student?._id || s.student;
                    newMap[sid] = s.status;
                    newRemarks[sid] = s.remarks || '';
                });
                setAttendanceMap(newMap);
                setRemarksMap(newRemarks);
            } else {
                setExistingRecord(null);
                const defaultMap = {};
                stuList.forEach(s => { defaultMap[s._id] = 'Present'; });
                setAttendanceMap(defaultMap);
                setRemarksMap({});
            }
        }).catch(() => {
            showToast('Failed to load students or attendance', 'error');
        }).finally(() => setLoading(false));
    }, [selectedOffering, selectedDate]);

    // Load history
    useEffect(() => {
        if (activeTab !== 'history' || !selectedOffering) return;
        axios.get(`${API}/attendance?courseOffering=${selectedOffering}`, { headers: hdrs })
            .then(r => setHistory(r.data || []))
            .catch(() => {});
    }, [activeTab, selectedOffering]);

    // Load stats
    useEffect(() => {
        if (activeTab !== 'analytics') return;
        axios.get(`${API}/attendance/stats`, { headers: hdrs })
            .then(r => setStats(r.data))
            .catch(() => {});
    }, [activeTab]);

    const setAll = (status) => {
        const m = {};
        students.forEach(s => { m[s._id] = status; });
        setAttendanceMap(m);
    };

    const submitAttendance = async () => {
        if (!selectedOffering) return showToast('Please select a course', 'error');
        setSubmitting(true);
        try {
            const payload = {
                courseOffering: selectedOffering,
                date: selectedDate,
                students: students.map(s => ({
                    student: s._id,
                    status: attendanceMap[s._id] || 'Present',
                    remarks: remarksMap[s._id] || ''
                }))
            };
            const res = await axios.post(`${API}/attendance`, payload, { headers: hdrs });
            setExistingRecord(res.data);
            showToast('Attendance saved successfully!');
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to save attendance', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteRecord = async (id) => {
        if (!window.confirm('Delete this attendance record?')) return;
        try {
            await axios.delete(`${API}/attendance/${id}`, { headers: hdrs });
            setHistory(h => h.filter(r => r._id !== id));
            showToast('Record deleted');
        } catch (e) {
            showToast(e.response?.data?.message || 'Cannot delete', 'error');
        }
    };

    const counts = {
        Present: students.filter(s => attendanceMap[s._id] === 'Present').length,
        Absent: students.filter(s => attendanceMap[s._id] === 'Absent').length,
        Late: students.filter(s => attendanceMap[s._id] === 'Late').length,
        Leave: students.filter(s => attendanceMap[s._id] === 'Leave').length,
    };

    const tabs = [
        { id: 'mark', label: 'Mark Attendance', icon: <Edit size={14} /> },
        { id: 'history', label: 'History', icon: <Calendar size={14} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={14} /> }
    ];

    return (
        <div style={{ padding: '0.5rem 0' }}>
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toast.type === 'error' ? 'rgba(255,27,107,0.9)' : 'rgba(16,185,129,0.9)', color: '#fff', fontWeight: '600', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}>
                    {toast.type === 'error' ? <AlertTriangle size={14} style={{ marginRight: 6 }} /> : <CheckCircle size={14} style={{ marginRight: 6 }} />}
                    {toast.msg}
                </div>
            )}

            <h2 style={{ color: '#0ff0fc', margin: '0 0 1.5rem', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={24} /> Attendance Management
            </h2>

            {/* Course + Date Selectors */}
            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '220px' }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>SELECT COURSE</label>
                    <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
                        <option value="">— Select Course —</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id} style={{ background: '#1a1a2e' }}>
                                {c.course?.code} – {c.course?.name} | {c.section?.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{ minWidth: '180px' }}>
                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>DATE</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#fff', padding: '10px 12px', fontSize: '0.9rem', outline: 'none', width: '100%' }} />
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', background: activeTab === t.id ? 'rgba(15,240,252,0.15)' : 'transparent', color: activeTab === t.id ? '#0ff0fc' : 'rgba(255,255,255,0.4)', borderBottom: activeTab === t.id ? '2px solid #0ff0fc' : '2px solid transparent', transition: 'all 0.2s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* MARK TAB */}
            {activeTab === 'mark' && (
                <>
                    {/* Stats Row */}
                    {selectedOffering && students.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Total', val: students.length, color: '#0ff0fc' },
                                { label: 'Present', val: counts.Present, color: '#10B981' },
                                { label: 'Absent', val: counts.Absent, color: '#ff1b6b' },
                                { label: 'Late', val: counts.Late, color: '#F59E0B' },
                                { label: 'Leave', val: counts.Leave, color: '#8B5CF6' }
                            ].map((s, i) => (
                                <div key={i} className="glass-panel-dash" style={{ borderRadius: '10px', padding: '1rem', textAlign: 'center', border: `1px solid ${s.color}25` }}>
                                    <div style={{ color: s.color, fontSize: '1.8rem', fontWeight: '800' }}>{s.val}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '2px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {selectedOffering && students.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                            {['Present', 'Absent', 'Late', 'Leave'].map(st => (
                                <button key={st} onClick={() => setAll(st)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1px solid ${STATUS_COLORS[st]}40`, background: `${STATUS_COLORS[st]}15`, color: STATUS_COLORS[st], cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', transition: 'all 0.15s' }}
                                    onMouseOver={e => e.currentTarget.style.background = `${STATUS_COLORS[st]}30`}
                                    onMouseOut={e => e.currentTarget.style.background = `${STATUS_COLORS[st]}15`}>
                                    All {st}
                                </button>
                            ))}
                            {existingRecord && (
                                <span style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(255,204,0,0.12)', color: '#ffcc00', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(255,204,0,0.3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Edit size={12} /> Editing existing record
                                </span>
                            )}
                        </div>
                    )}

                    {/* Student Table */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={36} color="#0ff0fc" className="spinner-large" /></div>
                    ) : !selectedOffering ? (
                        <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                            <Calendar size={50} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Select a course above to mark attendance</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
                            <Users size={50} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                            <p style={{ color: 'rgba(255,255,255,0.3)' }}>No students found for this course section</p>
                        </div>
                    ) : (
                        <div className="glass-panel-dash" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                            {['#', 'Roll No', 'Student Name', 'Status', 'Remarks'].map(h => (
                                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((s, idx) => {
                                            const status = attendanceMap[s._id] || 'Present';
                                            const color = STATUS_COLORS[status] || '#fff';
                                            return (
                                                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{idx + 1}</td>
                                                    <td style={{ padding: '10px 16px', color: '#0ff0fc', fontWeight: '600', fontSize: '0.85rem' }}>{s.rollNumber || s.studentId || '—'}</td>
                                                    <td style={{ padding: '10px 16px', color: '#fff', fontWeight: '500', fontSize: '0.9rem' }}>{s.name}</td>
                                                    <td style={{ padding: '10px 16px' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                            {['Present', 'Absent', 'Late', 'Leave'].map(st => (
                                                                <button key={st} onClick={() => setAttendanceMap(p => ({ ...p, [s._id]: st }))} style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${STATUS_COLORS[st]}${status === st ? '80' : '30'}`, background: status === st ? `${STATUS_COLORS[st]}25` : 'transparent', color: status === st ? STATUS_COLORS[st] : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: status === st ? '700' : '400', fontSize: '0.75rem', transition: 'all 0.15s' }}>
                                                                    {st}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px 16px' }}>
                                                        <input value={remarksMap[s._id] || ''} onChange={e => setRemarksMap(p => ({ ...p, [s._id]: e.target.value }))} placeholder="Optional remark..." style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '6px 10px', fontSize: '0.8rem', outline: 'none', width: '160px' }} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: '1.2rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                {existingRecord && existingRecord.approvalStatus !== 'Approved' && (
                                    <button onClick={() => deleteRecord(existingRecord._id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,27,107,0.4)', background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                                        <Trash2 size={15} /> Delete
                                    </button>
                                )}
                                <button onClick={submitAttendance} disabled={submitting || !selectedOffering || students.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: '8px', border: 'none', background: submitting ? 'rgba(15,240,252,0.1)' : 'linear-gradient(135deg,#0ff0fc,#bc13fe)', color: '#000', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', opacity: submitting ? 0.7 : 1, transition: 'all 0.2s' }}>
                                    {submitting ? <><Loader2 size={15} className="spinner-large" /> Saving...</> : <><Save size={15} /> Save Attendance</>}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: '#0ff0fc', margin: 0, fontSize: '1rem', fontWeight: '700' }}>Attendance History</h3>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{history.length} records</span>
                    </div>
                    {!selectedOffering ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Select a course to view history</div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No attendance records yet</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                        {['Date', 'Total', 'Present', 'Absent', 'Late', 'Status', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(rec => {
                                        const total = rec.students?.length || 0;
                                        const present = rec.students?.filter(s => s.status === 'Present').length || 0;
                                        const absent = rec.students?.filter(s => s.status === 'Absent').length || 0;
                                        const late = rec.students?.filter(s => s.status === 'Late').length || 0;
                                        const isApproved = rec.approvalStatus === 'Approved';
                                        return (
                                            <tr key={rec._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '10px 16px', color: '#fff', fontWeight: '600' }}>{new Date(rec.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td style={{ padding: '10px 16px', color: '#0ff0fc', fontWeight: '700' }}>{total}</td>
                                                <td style={{ padding: '10px 16px', color: '#10B981', fontWeight: '700' }}>{present}</td>
                                                <td style={{ padding: '10px 16px', color: '#ff1b6b', fontWeight: '700' }}>{absent}</td>
                                                <td style={{ padding: '10px 16px', color: '#F59E0B', fontWeight: '700' }}>{late}</td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: isApproved ? 'rgba(16,185,129,0.15)' : 'rgba(255,204,0,0.12)', color: isApproved ? '#10B981' : '#ffcc00', border: `1px solid ${isApproved ? 'rgba(16,185,129,0.3)' : 'rgba(255,204,0,0.3)'}` }}>
                                                        {rec.approvalStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    {!isApproved && (
                                                        <button onClick={() => deleteRecord(rec._id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,27,107,0.3)', background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <div>
                    {!stats ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={36} color="#0ff0fc" className="spinner-large" /></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {[
                                { label: 'Total Records', val: stats.totalRecords ?? 0, color: '#0ff0fc' },
                                { label: "Today's Records", val: stats.todayRecords ?? 0, color: '#10B981' },
                                { label: 'Present %', val: `${stats.presentPercentage ?? 0}%`, color: '#50cc7f' },
                                { label: 'Absent %', val: `${stats.absentPercentage ?? 0}%`, color: '#ff1b6b' }
                            ].map((s, i) => (
                                <div key={i} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem', textAlign: 'center', border: `1px solid ${s.color}25` }}>
                                    <div style={{ color: s.color, fontSize: '2rem', fontWeight: '800' }}>{s.val}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '4px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherAttendance;
