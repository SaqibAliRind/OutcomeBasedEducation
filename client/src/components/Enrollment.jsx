import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchEnrollments,
    fetchAvailableOfferings,
    enrollInCourse,
    dropCourse,
    clearEnrollmentMessages
} from '../store/enrollmentSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import {
    BookOpen, Users, CheckCircle, AlertCircle, Loader2,
    XCircle, Plus, BookMarked, RefreshCw, Search, Filter, X
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const STATUS_COLORS = {
    Enrolled:  { bg: 'rgba(80,204,127,0.12)',  color: '#50cc7f',  border: 'rgba(80,204,127,0.3)' },
    Dropped:   { bg: 'rgba(255,27,107,0.12)',   color: '#ff1b6b',  border: 'rgba(255,27,107,0.3)' },
    Completed: { bg: 'rgba(15,240,252,0.12)',   color: '#0ff0fc',  border: 'rgba(15,240,252,0.3)' },
};

const Enrollment = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(s => s.auth);
    const { enrollments, offerings, loading, error, successMessage } = useSelector(s => s.enrollment);
    const { records } = useSelector(s => s.academic);
    const { semesters = [], sessions = [] } = records || {};
    const { usersList } = useSelector(s => s.users);
    const students = usersList.filter(u => u.role === 'Student');

    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(user?.role);
    const [activeTab, setActiveTab] = useState('courseEnrollment');
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filterSemester, setFilterSemester] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Enroll form state
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollForm, setEnrollForm] = useState({
        studentId: '', semesterId: '', courseOfferingId: '', session: ''
    });

    useEffect(() => {
        dispatch(fetchEnrollments());
        dispatch(fetchAvailableOfferings());
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('sessions'));
        if (isAdmin) dispatch(fetchUsers());
    }, [dispatch, isAdmin]);

    useEffect(() => {
        if (filterSemester) dispatch(fetchAvailableOfferings(filterSemester));
        else dispatch(fetchAvailableOfferings());
    }, [filterSemester, dispatch]);

    useEffect(() => {
        if (successMessage) {
            setToast({ msg: successMessage, type: 'success' });
            setTimeout(() => setToast(null), 4000);
            dispatch(clearEnrollmentMessages());
            dispatch(fetchEnrollments({ semester: filterSemester, status: filterStatus }));
        }
        if (error) {
            setToast({ msg: error, type: 'error' });
            setTimeout(() => setToast(null), 4000);
            dispatch(clearEnrollmentMessages());
        }
    }, [successMessage, error, dispatch, filterSemester, filterStatus]);

    const handleEnroll = (e) => {
        e.preventDefault();
        const payload = { ...enrollForm };
        if (!isAdmin) delete payload.studentId;
        dispatch(enrollInCourse(payload));
        setEnrollForm({ studentId: '', semesterId: '', courseOfferingId: '', session: '' });
        setIsEnrollModalOpen(false);
    };

    const handleDrop = (id) => {
        if (window.confirm('Are you sure you want to drop this course?')) {
            dispatch(dropCourse(id));
        }
    };

    const filteredEnrollments = enrollments.filter(e => {
        const matchSearch = !search ||
            e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
            e.courseOffering?.course?.toLowerCase().includes(search.toLowerCase());
        const matchSem = !filterSemester || e.semester?._id === filterSemester;
        const matchStatus = !filterStatus || e.status === filterStatus;
        return matchSearch && matchSem && matchStatus;
    });

    const tabs = [
        { id: 'courseEnrollment', label: 'Course Enrollment', icon: BookOpen },
        { id: 'semesterEnrollment', label: 'Semester Enrollment', icon: BookMarked },
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
                    <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BookOpen size={24} /> Enrollment Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                        Manage course and semester enrollments for students.
                    </p>
                </div>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
                                background: isActive ? 'linear-gradient(135deg,#0ff0fc,#bc13fe)' : 'rgba(255,255,255,0.06)',
                                color: isActive ? '#020917' : 'rgba(255,255,255,0.7)',
                                boxShadow: isActive ? '0 0 16px rgba(15,240,252,0.4)' : 'none',
                            }}>
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ===== COURSE ENROLLMENT TAB ===== */}
            {activeTab === 'courseEnrollment' && (
                <>
                    {/* Enroll Form Modal */}
                    {isEnrollModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content glass-panel" style={{ maxWidth: 650, padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Plus size={18} /> Enroll in Course
                                    </h3>
                                    <button type="button" onClick={() => setIsEnrollModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <form className="modal-form" onSubmit={handleEnroll}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                                        {isAdmin && (
                                            <div className="form-group">
                                                <label>Student *</label>
                                                <select required value={enrollForm.studentId} onChange={e => setEnrollForm({ ...enrollForm, studentId: e.target.value })}>
                                                    <option value="">Select Student</option>
                                                    {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                                                </select>
                                            </div>
                                        )}
                                        <div className="form-group">
                                            <label>Semester *</label>
                                            <select required value={enrollForm.semesterId} onChange={e => {
                                                setEnrollForm({ ...enrollForm, semesterId: e.target.value });
                                                setFilterSemester(e.target.value);
                                            }}>
                                                <option value="">Select Semester</option>
                                                {semesters.map(s => <option key={s._id} value={s._id}>{s.name} (Sem {s.number}) — {s.status}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Course Offering *</label>
                                            <select required value={enrollForm.courseOfferingId} onChange={e => setEnrollForm({ ...enrollForm, courseOfferingId: e.target.value })}>
                                                <option value="">Select Course Offering</option>
                                                {offerings.map(o => (
                                                    <option key={o._id} value={o._id}>
                                                        {o.course?.name || o.course?.title || o.course} — {o.teacher?.name || o.teacher} | Sec: {o.section?.name || o.section} [{o.status}]
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Session *</label>
                                            <select required value={enrollForm.session} onChange={e => setEnrollForm({ ...enrollForm, session: e.target.value })}>
                                                <option value="">Select Session</option>
                                                {sessions.map(s => <option key={s._id} value={s.name + ' ' + s.year}>{s.name} {s.year}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                        <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="page-btn">Cancel</button>
                                        <button type="submit" className="page-btn primary-btn" disabled={loading}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}>
                                            {loading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                                            Enroll Student
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Filters & Actions */}
                    <div className="glass-panel-dash" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input className="search-input" style={{ paddingLeft: 38 }} placeholder="Search student or course..."
                                    value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="">All Statuses</option>
                                <option value="Enrolled">Enrolled</option>
                                <option value="Dropped">Dropped</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <button className="page-btn" onClick={() => dispatch(fetchEnrollments({ semester: filterSemester, status: filterStatus }))}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>
                        <button className="page-btn primary-btn" onClick={() => setIsEnrollModalOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Plus size={16} /> Enroll Student
                        </button>
                    </div>

                    {/* Enrollments Table */}
                    <div className="glass-panel-dash" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>
                                Course Enrollments <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginLeft: 8 }}>({filteredEnrollments.length} records)</span>
                            </h3>
                        </div>
                        {loading && enrollments.length === 0 ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                <Loader2 size={32} className="spinner" color="#0ff0fc" />
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="glass-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Course</th>
                                            <th>Teacher</th>
                                            <th>Section</th>
                                            <th>Semester</th>
                                            <th>Session</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEnrollments.length === 0 ? (
                                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)' }}>
                                                No enrollments found.
                                            </td></tr>
                                        ) : filteredEnrollments.map(enr => {
                                            const sc = STATUS_COLORS[enr.status] || {};
                                            return (
                                                <tr key={enr._id}>
                                                    <td><strong>{enr.student?.name || '—'}</strong><br /><span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{enr.student?.email}</span></td>
                                                    <td>{enr.courseOffering?.course?.name || '—'}</td>
                                                    <td>{enr.courseOffering?.teacher?.name || '—'}</td>
                                                    <td>{enr.courseOffering?.section?.name || '—'}</td>
                                                    <td>{enr.semester?.name || '—'}</td>
                                                    <td>{enr.session}</td>
                                                    <td>
                                                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                            {enr.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {enr.status === 'Enrolled' && (
                                                            <button onClick={() => handleDrop(enr._id)} className="action-btn delete" title="Drop Course">
                                                                <XCircle size={16} />
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
                </>
            )}

            {/* ===== SEMESTER ENROLLMENT TAB ===== */}
            {activeTab === 'semesterEnrollment' && (
                <div className="glass-panel-dash">
                    <h3 style={{ color: '#bc13fe', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookMarked size={20} /> Semester-wise Enrollment Summary
                    </h3>
                    {semesters.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.4)' }}>No semesters found. Please add semesters first.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                            {semesters.map(sem => {
                                const semEnrollments = enrollments.filter(e => e.semester?._id === sem._id && e.status === 'Enrolled');
                                return (
                                    <div key={sem._id} style={{
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 12, padding: '1.2rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{sem.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Semester {sem.number}</div>
                                            </div>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                                                background: sem.status === 'Open' ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.12)',
                                                color: sem.status === 'Open' ? '#50cc7f' : '#ff1b6b',
                                                border: `1px solid ${sem.status === 'Open' ? 'rgba(80,204,127,0.3)' : 'rgba(255,27,107,0.3)'}`
                                            }}>{sem.status}</span>
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0ff0fc', margin: '0.5rem 0' }}>
                                            {semEnrollments.length}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>Active Enrollments</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Enrollment;
