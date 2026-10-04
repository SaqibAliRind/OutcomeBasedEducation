import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchRegistrations,
    registerSemester,
    freezeRegistration,
    dropRegistration,
    clearSemRegMessages
} from '../store/semesterRegSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import {
    CalendarCheck, Snowflake, XCircle, Plus,
    CheckCircle, AlertCircle, Loader2, Lock, Trash2, RefreshCw
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const STATUS_STYLES = {
    Registered: { bg: 'rgba(80,204,127,0.12)',  color: '#50cc7f',  border: 'rgba(80,204,127,0.3)', label: 'Registered' },
    Frozen:     { bg: 'rgba(69,202,255,0.12)',   color: '#45caff',  border: 'rgba(69,202,255,0.3)',  label: 'Frozen' },
    Dropped:    { bg: 'rgba(255,27,107,0.12)',   color: '#ff1b6b',  border: 'rgba(255,27,107,0.3)',  label: 'Dropped' },
};

const SemesterRegistration = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(s => s.auth);
    const { registrations, loading, error, successMessage } = useSelector(s => s.semesterReg);
    const { records } = useSelector(s => s.academic);
    const { semesters = [], sessions = [] } = records || {};
    const { usersList } = useSelector(s => s.users);
    const students = usersList.filter(u => u.role === 'Student');

    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(user?.role);
    const [activeSection, setActiveSection] = useState('register');
    const [toast, setToast] = useState(null);

    const [regForm, setRegForm] = useState({ studentId: '', semesterId: '', session: '', remarks: '' });

    useEffect(() => {
        dispatch(fetchRegistrations());
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('sessions'));
        if (isAdmin) dispatch(fetchUsers());
    }, [dispatch, isAdmin]);

    useEffect(() => {
        if (successMessage) {
            setToast({ msg: successMessage, type: 'success' });
            setTimeout(() => setToast(null), 4000);
            dispatch(clearSemRegMessages());
            dispatch(fetchRegistrations());
        }
        if (error) {
            setToast({ msg: error, type: 'error' });
            setTimeout(() => setToast(null), 4000);
            dispatch(clearSemRegMessages());
        }
    }, [successMessage, error, dispatch]);

    const handleRegister = (e) => {
        e.preventDefault();
        const payload = { ...regForm };
        if (!isAdmin) delete payload.studentId;
        dispatch(registerSemester(payload));
        setRegForm({ studentId: '', semesterId: '', session: '', remarks: '' });
    };

    const activeRegs = registrations.filter(r => r.status === 'Registered');
    const sections = [
        { id: 'register', label: 'Register Semester', icon: CalendarCheck, color: '#0ff0fc' },
        { id: 'freeze',   label: 'Freeze Semester',   icon: Snowflake,     color: '#45caff' },
        { id: 'drop',     label: 'Drop Course',        icon: XCircle,       color: '#ff1b6b' },
    ];

    return (
        <div className="" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? 'rgba(80,204,127,0.12)' : 'rgba(255,27,107,0.12)',
                    border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`,
                    color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b',
                    padding: '12px 20px', borderRadius: 12, fontWeight: 600,
                    backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 8
                }}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#ffcc00', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CalendarCheck size={24} /> Semester Registration
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                        Register students for semesters, freeze registrations, and manage course drops.
                    </p>
                </div>
                <button className="page-btn" onClick={() => dispatch(fetchRegistrations())}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Section Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {sections.map(sec => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                        <button key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
                            background: isActive ? sec.color : 'rgba(255,255,255,0.06)',
                            color: isActive ? '#020917' : 'rgba(255,255,255,0.7)',
                            boxShadow: isActive ? `0 0 16px ${sec.color}66` : 'none',
                        }}>
                            <Icon size={16} /> {sec.label}
                        </button>
                    );
                })}
            </div>

            {/* ===== REGISTER SEMESTER ===== */}
            {activeSection === 'register' && (
                <>
                    <form className="modal-form" onSubmit={handleRegister} className="glass-panel-dash">
                        <h3 style={{ color: '#0ff0fc', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={18} /> New Semester Registration
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
                            {isAdmin && (
                                <div className="form-group">
                                    <label>Student *</label>
                                    <select required value={regForm.studentId} onChange={e => setRegForm({ ...regForm, studentId: e.target.value })}>
                                        <option value="">Select Student</option>
                                        {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Semester *</label>
                                <select required value={regForm.semesterId} onChange={e => setRegForm({ ...regForm, semesterId: e.target.value })}>
                                    <option value="">Select Semester</option>
                                    {semesters.filter(s => s.status === 'Open').map(s => (
                                        <option key={s._id} value={s._id}>{s.name} (Sem {s.number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Session *</label>
                                <select required value={regForm.session} onChange={e => setRegForm({ ...regForm, session: e.target.value })}>
                                    <option value="">Select Session</option>
                                    {sessions.map(s => <option key={s._id} value={s.name + ' ' + s.year}>{s.name} {s.year}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Remarks (optional)</label>
                                <input type="text" placeholder="Any notes about this registration..."
                                    value={regForm.remarks} onChange={e => setRegForm({ ...regForm, remarks: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="page-btn primary-btn" disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}>
                                {loading ? <Loader2 size={16} className="spinner" /> : <CalendarCheck size={16} />}
                                Register Semester
                            </button>
                        </div>
                    </form>

                    {/* All Registrations List */}
                    <div className="glass-panel-dash" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>
                                All Registrations <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginLeft: 8 }}>({registrations.length})</span>
                            </h3>
                        </div>
                        {loading && registrations.length === 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <Loader2 size={32} className="spinner" color="#0ff0fc" />
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="glass-table" style={{ width: '100%' }}>
                                    <thead><tr>
                                        <th>Student</th><th>Semester</th><th>Session</th>
                                        <th>Status</th><th>Registered At</th><th>Remarks</th>
                                    </tr></thead>
                                    <tbody>
                                        {registrations.length === 0 ? (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)' }}>No registrations yet.</td></tr>
                                        ) : registrations.map(r => {
                                            const sc = STATUS_STYLES[r.status] || {};
                                            return (
                                                <tr key={r._id}>
                                                    <td><strong>{r.student?.name || '—'}</strong><br /><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{r.student?.email}</span></td>
                                                    <td>{r.semester?.name} (Sem {r.semester?.number})</td>
                                                    <td>{r.session}</td>
                                                    <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{r.status}</span></td>
                                                    <td style={{ fontSize: '0.82rem' }}>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '—'}</td>
                                                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{r.remarks || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ===== FREEZE SEMESTER ===== */}
            {activeSection === 'freeze' && (
                <div className="glass-panel-dash" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Snowflake size={20} color="#45caff" />
                        <h3 style={{ margin: 0, color: '#45caff', fontSize: '1rem' }}>
                            Freeze Registrations <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginLeft: 8 }}>({activeRegs.length} active)</span>
                        </h3>
                    </div>
                    <div className="table-container">
                        <table className="glass-table" style={{ width: '100%' }}>
                            <thead><tr>
                                <th>Student</th><th>Semester</th><th>Session</th><th>Registered At</th><th>Action</th>
                            </tr></thead>
                            <tbody>
                                {activeRegs.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)' }}>No active registrations to freeze.</td></tr>
                                ) : activeRegs.map(r => (
                                    <tr key={r._id}>
                                        <td><strong>{r.student?.name || '—'}</strong><br /><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{r.student?.email}</span></td>
                                        <td>{r.semester?.name} (Sem {r.semester?.number})</td>
                                        <td>{r.session}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <button onClick={() => dispatch(freezeRegistration(r._id))} className="action-btn"
                                                disabled={loading}
                                                style={{ background: 'rgba(69,202,255,0.12)', color: '#45caff', border: '1px solid rgba(69,202,255,0.3)', width: 'auto', padding: '6px 14px', gap: 6, display: 'flex', alignItems: 'center' }}>
                                                <Lock size={14} /> Freeze
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== DROP COURSE ===== */}
            {activeSection === 'drop' && (
                <div className="glass-panel-dash" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <XCircle size={20} color="#ff1b6b" />
                        <h3 style={{ margin: 0, color: '#ff1b6b', fontSize: '1rem' }}>
                            Drop Registration <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginLeft: 8 }}>— drops all linked course enrollments</span>
                        </h3>
                    </div>
                    <div className="table-container">
                        <table className="glass-table" style={{ width: '100%' }}>
                            <thead><tr>
                                <th>Student</th><th>Semester</th><th>Session</th><th>Status</th><th>Action</th>
                            </tr></thead>
                            <tbody>
                                {registrations.filter(r => r.status !== 'Dropped').length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)' }}>No registrations available to drop.</td></tr>
                                ) : registrations.filter(r => r.status !== 'Dropped').map(r => {
                                    const sc = STATUS_STYLES[r.status] || {};
                                    return (
                                        <tr key={r._id}>
                                            <td><strong>{r.student?.name || '—'}</strong><br /><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{r.student?.email}</span></td>
                                            <td>{r.semester?.name} (Sem {r.semester?.number})</td>
                                            <td>{r.session}</td>
                                            <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{r.status}</span></td>
                                            <td>
                                                <button onClick={() => {
                                                    if (window.confirm('This will drop the registration AND all linked course enrollments. Continue?'))
                                                        dispatch(dropRegistration(r._id));
                                                }} className="action-btn delete" disabled={loading}
                                                    style={{ width: 'auto', padding: '6px 14px', gap: 6, display: 'flex', alignItems: 'center' }}>
                                                    <Trash2 size={14} /> Drop All
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SemesterRegistration;
