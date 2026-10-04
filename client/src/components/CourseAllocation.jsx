import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, updateAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import {
    Search, UserPlus, RefreshCw, UserX, BookOpen,
    Layout, X, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import '../style/SuperAdminDashboard.css';

/* ─── helpers ─────────────────────────────────────── */
const statusColor = (s) =>
    s === 'Open'
        ? { bg: 'rgba(80,204,127,0.15)', color: '#50cc7f' }
        : { bg: 'rgba(255,27,107,0.15)', color: '#ff1b6b' };

/* ─── TeacherBadge ────────────────────────────────── */
const TeacherBadge = ({ name }) =>
    name ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg,#0ff0fc33,#bc13fe33)',
                border: '1px solid rgba(15,240,252,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.78rem', color: '#0ff0fc', flexShrink: 0
            }}>
                {name.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#e0e0e0', fontSize: '0.88rem' }}>{name}</span>
        </div>
    ) : (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,204,0,0.12)', color: '#ffcc00',
            padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
        }}>
            <AlertCircle size={12} /> Unassigned
        </span>
    );

/* ─── ActionBtn ───────────────────────────────────── */
const ActionBtn = ({ icon: Icon, label, color, bg, border, onClick }) => (
    <button
        title={label}
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: bg, border: `1px solid ${border}`,
            color, borderRadius: 8, padding: '5px 12px',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s ease', whiteSpace: 'nowrap'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        <Icon size={13} /> {label}
    </button>
);

/* ─── TeacherSelectModal ──────────────────────────── */
const TeacherSelectModal = ({ offering, teachers, onClose, onConfirm, loading }) => {
    const [selectedId, setSelectedId] = useState(offering.teacher?._id || offering.teacher || '');
    const [search, setSearch] = useState('');

    const filtered = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="modal-overlay" style={{ zIndex: 9000 }}>
            <div className="modal-content" style={{
                width: 480, maxHeight: '85vh', display: 'flex',
                flexDirection: 'column', borderRadius: 16, overflow: 'hidden',
                background: 'linear-gradient(145deg,#0d1b2a,#0a1628)',
                border: '1px solid rgba(15,240,252,0.15)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)'
                }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>
                            {offering.teacher ? '🔄 Change Teacher' : '👤 Assign Teacher'}
                        </h3>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                            Course: <strong style={{ color: '#0ff0fc' }}>{offering.course?.name || offering.course?.code || offering.course}</strong>
                            &nbsp;·&nbsp;Section: <strong style={{ color: '#ffcc00' }}>{offering.section?.name || offering.section}</strong>
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff',
                        borderRadius: 8, padding: '6px 8px', cursor: 'pointer'
                    }}><X size={16} /></button>
                </div>

                {/* Search */}
                <div style={{ padding: '0.8rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
                        <input
                            type="text"
                            placeholder="Search teacher by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="search-input"
                            style={{ paddingLeft: 38, width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                {/* Teacher List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1rem' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '2rem', fontSize: '0.9rem' }}>
                            No teachers found.
                        </div>
                    ) : filtered.map(t => (
                        <div
                            key={t._id}
                            onClick={() => setSelectedId(t._id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '0.75rem 0.8rem', borderRadius: 10, cursor: 'pointer',
                                margin: '4px 0', transition: 'background 0.15s ease',
                                background: selectedId === t._id ? 'rgba(15,240,252,0.12)' : 'rgba(255,255,255,0.03)',
                                border: selectedId === t._id ? '1px solid rgba(15,240,252,0.35)' : '1px solid transparent'
                            }}
                        >
                            <div style={{
                                width: 38, height: 38, borderRadius: '50%',
                                background: selectedId === t._id ? 'rgba(15,240,252,0.2)' : 'rgba(255,255,255,0.07)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.85rem',
                                color: selectedId === t._id ? '#0ff0fc' : 'rgba(255,255,255,0.5)', flexShrink: 0
                            }}>
                                {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                    {t.email}&nbsp;·&nbsp;<span style={{ color: '#bc13fe' }}>{t.role}</span>
                                </div>
                            </div>
                            {selectedId === t._id && <CheckCircle size={16} color="#0ff0fc" style={{ flexShrink: 0 }} />}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: 10,
                    padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)'
                }}>
                    <button className="page-btn cancel-btn" onClick={onClose} style={{ padding: '8px 18px' }}>Cancel</button>
                    <button
                        className="page-btn primary-btn"
                        disabled={!selectedId || loading}
                        onClick={() => onConfirm(selectedId, teachers.find(t => t._id === selectedId)?.name)}
                        style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {loading ? <Loader2 size={14} className="spinner" /> : <CheckCircle size={14} />}
                        {loading ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── RemoveConfirmModal ──────────────────────────── */
const RemoveConfirmModal = ({ offering, onClose, onConfirm, loading }) => (
    <div className="modal-overlay" style={{ zIndex: 9000 }}>
        <div className="modal-content" style={{
            width: 420, borderRadius: 16, padding: '2rem',
            background: 'linear-gradient(145deg,#0d1b2a,#0a1628)',
            border: '1px solid rgba(255,27,107,0.2)', textAlign: 'center'
        }}>
            <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(255,27,107,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem'
            }}>
                <UserX size={28} color="#ff1b6b" />
            </div>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem' }}>Remove Teacher?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 0.4rem' }}>
                This will unassign <strong style={{ color: '#ff1b6b' }}>{offering.teacher?.name || offering.teacher}</strong> from:
            </p>
            <p style={{ color: '#0ff0fc', fontWeight: 600, margin: '0 0 1.8rem' }}>
                {offering.course?.name || offering.course?.code || offering.course} — {offering.section?.name || offering.section}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="page-btn cancel-btn" onClick={onClose} style={{ padding: '8px 20px' }}>Cancel</button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    style={{
                        padding: '8px 20px', background: 'rgba(255,27,107,0.2)',
                        border: '1px solid #ff1b6b', color: '#ff1b6b',
                        borderRadius: 8, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                    }}
                >
                    {loading ? <Loader2 size={14} className="spinner" /> : <UserX size={14} />}
                    {loading ? 'Removing...' : 'Remove'}
                </button>
            </div>
        </div>
    </div>
);

/* ─── FilterBar ───────────────────────────────────── */
const FilterBar = ({ filter, setFilter }) => {
    const filters = [
        { key: 'all',        label: 'All',        color: '#0ff0fc' },
        { key: 'assigned',   label: 'Assigned',   color: '#50cc7f' },
        { key: 'unassigned', label: 'Unassigned', color: '#ffcc00' },
    ];
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            {filters.map(f => (
                <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        border: filter === f.key ? `1px solid ${f.color}` : '1px solid rgba(255,255,255,0.1)',
                        background: filter === f.key ? `${f.color}22` : 'rgba(255,255,255,0.04)',
                        color: filter === f.key ? f.color : 'rgba(255,255,255,0.5)',
                        boxShadow: filter === f.key ? `0 0 12px ${f.color}33` : 'none'
                    }}
                >{f.label}</button>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const CourseAllocation = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading } = useSelector(s => s.academic);
    const { usersList } = useSelector(s => s.users);

    const offerings = records.courseofferings || [];
    const teachers  = usersList.filter(u => u.role === 'Teacher' || u.role === 'ProgramCoordinator');

    const [search, setSearch]   = useState('');
    const [filter, setFilter]   = useState('all');
    const [toast, setToast]     = useState(null);
    const [modal, setModal]     = useState(null);

    const pendingAction = useRef(null);
    const prevLoading   = useRef(false);

    useEffect(() => {
        dispatch(fetchAcademicData('courseofferings'));
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        if (prevLoading.current && !academicLoading) {
            if (pendingAction.current) {
                setToast({ msg: pendingAction.current });
                pendingAction.current = null;
                setTimeout(() => setToast(null), 3500);
            }
        }
        prevLoading.current = academicLoading;
    }, [academicLoading]);

    /* filtering */
    const displayed = offerings.filter(o => {
        const courseStr = o.course?.name || o.course?.code || o.course || '';
        const teacherStr = o.teacher?.name || o.teacher || '';
        const sectionStr = o.section?.name || o.section || '';
        const semesterStr = o.semester?.name || o.semester || '';

        const matchSearch =
            courseStr.toLowerCase().includes(search.toLowerCase()) ||
            teacherStr.toLowerCase().includes(search.toLowerCase()) ||
            sectionStr.toLowerCase().includes(search.toLowerCase()) ||
            semesterStr.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === 'all'        ? true :
            filter === 'assigned'   ? !!o.teacher :
            filter === 'unassigned' ? !o.teacher  : true;
        return matchSearch && matchFilter;
    });

    const totalOfferings  = offerings.length;
    const totalAssigned   = offerings.filter(o => o.teacher).length;
    const totalUnassigned = offerings.filter(o => !o.teacher).length;

    /* actions */
    const handleAssignOrChange = async (teacherId, teacherName) => {
        const { offering } = modal;
        pendingAction.current = offering.teacher
            ? `Teacher changed to ${teacherName || teacherId} for ${offering.course?.name || offering.course?.code || offering.course}`
            : `${teacherName || teacherId} assigned to ${offering.course?.name || offering.course?.code || offering.course}`;
        await dispatch(updateAcademicData({ entity: 'courseofferings', id: offering._id, payload: { teacher: teacherId } }));
        setModal(null);
    };

    const handleRemove = async () => {
        const { offering } = modal;
        pendingAction.current = `Teacher removed from ${offering.course?.name || offering.course?.code || offering.course}`;
        await dispatch(updateAcademicData({ entity: 'courseofferings', id: offering._id, payload: { teacher: null } }));
        setModal(null);
    };

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 24, zIndex: 9999,
                    background: 'rgba(80,204,127,0.12)', border: '1px solid #50cc7f',
                    color: '#50cc7f', padding: '12px 20px', borderRadius: 12,
                    fontWeight: 600, backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    <CheckCircle size={16} /> {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff' }}>Course Allocation</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                        Assign, change, or remove teachers for each course offering
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Offerings', value: totalOfferings,  color: '#0ff0fc', Icon: BookOpen     },
                    { label: 'Assigned',         value: totalAssigned,   color: '#50cc7f', Icon: CheckCircle  },
                    { label: 'Unassigned',        value: totalUnassigned, color: '#ffcc00', Icon: AlertCircle  },
                ].map((s, i) => (
                    <div key={i} className="glass-panel-dash" style={{ borderRadius: 12, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <s.Icon size={20} color={s.color} />
                        </div>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                            <div style={{ color: s.color, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Panel */}
            <div className="glass-panel-dash" style={{ borderRadius: 14, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <FilterBar filter={filter} setFilter={setFilter} />
                    <div style={{ position: 'relative', width: 280 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search course, teacher, section..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 38 }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Assigned Teacher</th>
                                <th>Section</th>
                                <th>Semester</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && offerings.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : displayed.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)' }}>No offerings found.</td></tr>
                            ) : displayed.map(o => {
                                const sc = statusColor(o.status || 'Open');
                                return (
                                    <tr key={o._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(188,19,254,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <BookOpen size={15} color="#bc13fe" />
                                                </div>
                                                <div>
                                                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{o.course?.name || o.course?.code || o.course}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.73rem' }}>Limit: {o.enrollmentLimit}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><TeacherBadge name={o.teacher?.name || o.teacher} /></td>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,204,0,0.1)', color: '#ffcc00', padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem' }}>
                                                <Layout size={11} /> {o.section?.name || o.section}
                                            </span>
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>{o.semester?.name || o.semester}</td>
                                        <td>
                                            <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                                {o.status || 'Open'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                {!o.teacher ? (
                                                    <ActionBtn
                                                        icon={UserPlus}
                                                        label="Assign Teacher"
                                                        color="#50cc7f"
                                                        bg="rgba(80,204,127,0.12)"
                                                        border="rgba(80,204,127,0.4)"
                                                        onClick={() => setModal({ mode: 'assign', offering: o })}
                                                    />
                                                ) : (
                                                    <>
                                                        <ActionBtn
                                                            icon={RefreshCw}
                                                            label="Change"
                                                            color="#0ff0fc"
                                                            bg="rgba(15,240,252,0.1)"
                                                            border="rgba(15,240,252,0.35)"
                                                            onClick={() => setModal({ mode: 'assign', offering: o })}
                                                        />
                                                        <ActionBtn
                                                            icon={UserX}
                                                            label="Remove"
                                                            color="#ff1b6b"
                                                            bg="rgba(255,27,107,0.1)"
                                                            border="rgba(255,27,107,0.35)"
                                                            onClick={() => setModal({ mode: 'remove', offering: o })}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {modal?.mode === 'assign' && (
                <TeacherSelectModal
                    offering={modal.offering}
                    teachers={teachers}
                    loading={academicLoading}
                    onClose={() => setModal(null)}
                    onConfirm={handleAssignOrChange}
                />
            )}
            {modal?.mode === 'remove' && (
                <RemoveConfirmModal
                    offering={modal.offering}
                    loading={academicLoading}
                    onClose={() => setModal(null)}
                    onConfirm={handleRemove}
                />
            )}
        </div>
    );
};

export default CourseAllocation;
