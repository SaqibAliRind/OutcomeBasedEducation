import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchTeachersForAssignment,
    fetchAssignmentSummary,
    fetchTeacherWorkload,
    assignTeacherToDepartment,
    assignTeacherToProgram,
    assignTeacherToSection,
    clearAssignmentMessages
} from '../store/assignmentSlice';
import {
    Search, Users, Building, GraduationCap, Layout, BookOpen, Clock,
    Loader2, CheckCircle, AlertCircle, X, ChevronDown, Activity
} from 'lucide-react';
import '../style/SuperAdminDashboard.css';

/* ─── helpers ─────────────────────────────────────── */
const statusColor = (s) =>
    s === 'Active'
        ? { bg: 'rgba(80,204,127,0.15)', color: '#50cc7f' }
        : { bg: 'rgba(255,27,107,0.15)', color: '#ff1b6b' };

const TeacherBadge = ({ name, onClick, type }) =>
    name && name !== 'Unassigned' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
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
            {onClick && <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
        </div>
    ) : (
        <span
            onClick={onClick}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, cursor: onClick ? 'pointer' : 'default',
                background: 'rgba(255,204,0,0.12)', color: '#ffcc00', border: onClick ? '1px dashed #ffcc00' : 'none',
                padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
            }}
        >
            <AlertCircle size={12} /> Assign {type}
        </span>
    );

/* ─── TeacherSelectModal ──────────────────────────── */
const TeacherSelectModal = ({ targetName, targetType, currentTeacher, teachers, onClose, onConfirm, loading }) => {
    const [selected, setSelected] = useState(!currentTeacher || currentTeacher === 'Unassigned' ? '' : (currentTeacher._id || currentTeacher));
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
                            {currentTeacher !== 'Unassigned' ? `🔄 Change ${targetType}` : `👤 Assign ${targetType}`}
                        </h3>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                            For <strong style={{ color: '#0ff0fc' }}>{targetName}</strong>
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
                    <div
                        onClick={() => setSelected('Unassigned')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '0.75rem 0.8rem', borderRadius: 10, cursor: 'pointer',
                            margin: '4px 0', transition: 'background 0.15s ease',
                            background: selected === 'Unassigned' || !selected ? 'rgba(255,204,0,0.12)' : 'rgba(255,255,255,0.03)',
                            border: selected === 'Unassigned' || !selected ? '1px solid rgba(255,204,0,0.35)' : '1px solid transparent'
                        }}
                    >
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%',
                            background: 'rgba(255,204,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ffcc00', flexShrink: 0
                        }}>
                            <AlertCircle size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#ffcc00', fontWeight: 600, fontSize: '0.9rem' }}>None / Unassign</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>Remove current assignment</div>
                        </div>
                        {(selected === 'Unassigned' || !selected) && <CheckCircle size={16} color="#ffcc00" style={{ flexShrink: 0 }} />}
                    </div>
                    {filtered.map(t => (
                        <div
                            key={t._id}
                            onClick={() => setSelected(t._id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '0.75rem 0.8rem', borderRadius: 10, cursor: 'pointer',
                                margin: '4px 0', transition: 'background 0.15s ease',
                                background: selected === t._id ? 'rgba(15,240,252,0.12)' : 'rgba(255,255,255,0.03)',
                                border: selected === t._id ? '1px solid rgba(15,240,252,0.35)' : '1px solid transparent'
                            }}
                        >
                            <div style={{
                                width: 38, height: 38, borderRadius: '50%',
                                background: selected === t._id ? 'rgba(15,240,252,0.2)' : 'rgba(255,255,255,0.07)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.85rem',
                                color: selected === t._id ? '#0ff0fc' : 'rgba(255,255,255,0.5)', flexShrink: 0
                            }}>
                                {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{t.name}</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                    {t.email}&nbsp;·&nbsp;<span style={{ color: '#bc13fe' }}>{t.role}</span>
                                </div>
                            </div>
                            {selected === t._id && <CheckCircle size={16} color="#0ff0fc" style={{ flexShrink: 0 }} />}
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
                        disabled={loading}
                        onClick={() => onConfirm(selected === 'Unassigned' ? '' : selected)}
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


/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const TeacherAssignment = () => {
    const dispatch = useDispatch();
    const {
        teachers, departments, programs, sections, workload,
        loading, successMessage, error
    } = useSelector(s => s.assignments);

    const [activeTab, setActiveTab] = useState('department');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null);

    const prevLoading = useRef(false);

    useEffect(() => {
        dispatch(fetchTeachersForAssignment());
        dispatch(fetchAssignmentSummary());
        dispatch(fetchTeacherWorkload());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            setToast({ msg: successMessage, type: 'success' });
            setTimeout(() => setToast(null), 3500);
            dispatch(clearAssignmentMessages());
        }
        if (error) {
            setToast({ msg: error, type: 'error' });
            setTimeout(() => setToast(null), 3500);
            dispatch(clearAssignmentMessages());
        }
    }, [successMessage, error, dispatch]);

    const handleAssign = async (teacherId) => {
        const { type, id } = modal;
        if (type === 'department') {
            await dispatch(assignTeacherToDepartment({ departmentId: id, teacherId }));
        } else if (type === 'program') {
            await dispatch(assignTeacherToProgram({ programId: id, teacherId }));
        } else if (type === 'section') {
            await dispatch(assignTeacherToSection({ sectionId: id, teacherId }));
        }
        setModal(null);
    };

    /* filtering */
    const filterData = (data, fields) => {
        if (!search) return data;
        const lowerSearch = search.toLowerCase();
        return data.filter(item =>
            fields.some(field => {
                const val = item[field];
                const str = val && typeof val === 'object' ? val.name : val;
                return (str || '').toString().toLowerCase().includes(lowerSearch);
            })
        );
    };

    const dispDepartments = filterData(departments, ['name', 'code', 'hod']);
    const dispPrograms = filterData(programs, ['name', 'code', 'coordinator', 'type']);
    const dispSections = filterData(sections, ['name', 'advisor']);
    const dispWorkload = filterData(workload, ['name', 'email', 'role']);

    const tabs = [
        { id: 'department', label: 'Department Assignment', icon: Building },
        { id: 'program', label: 'Program Assignment', icon: GraduationCap },
        { id: 'section', label: 'Section Assignment', icon: Layout },
        { id: 'workload', label: 'Workload & Stats', icon: Activity },
    ];

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? 'rgba(80,204,127,0.12)' : 'rgba(255,27,107,0.12)',
                    border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`,
                    color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b',
                    padding: '12px 20px', borderRadius: 12,
                    fontWeight: 600, backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff' }}>Teacher Assignments</h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                        Manage HODs, Coordinators, Section Advisors, and view overall teacher workload.
                    </p>
                </div>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', overflowX: 'auto' }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setActiveTab(t.id); setSearch(''); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                            background: activeTab === t.id ? 'rgba(15,240,252,0.15)' : 'rgba(255,255,255,0.05)',
                            border: activeTab === t.id ? '1px solid rgba(15,240,252,0.4)' : '1px solid rgba(255,255,255,0.1)',
                            color: activeTab === t.id ? '#0ff0fc' : 'rgba(255,255,255,0.6)'
                        }}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ position: 'relative', width: 300 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 38, width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Table Panels */}
            <div className="glass-panel-dash" style={{ borderRadius: 14, padding: '1.5rem' }}>
                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            {activeTab === 'department' && (
                                <tr>
                                    <th>Department</th>
                                    <th>Code</th>
                                    <th>Status</th>
                                    <th>Head of Department (HOD)</th>
                                </tr>
                            )}
                            {activeTab === 'program' && (
                                <tr>
                                    <th>Program</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Program Coordinator</th>
                                </tr>
                            )}
                            {activeTab === 'section' && (
                                <tr>
                                    <th>Section</th>
                                    <th>Capacity</th>
                                    <th>Status</th>
                                    <th>Section Advisor</th>
                                </tr>
                            )}
                            {activeTab === 'workload' && (
                                <tr>
                                    <th>Teacher</th>
                                    <th>Role</th>
                                    <th>Credit Hours</th>
                                    <th>Courses</th>
                                    <th>Sections</th>
                                    <th>Students</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {loading && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            )}
                            
                            {!loading && activeTab === 'department' && dispDepartments.map(d => {
                                const sc = statusColor(d.status || 'Active');
                                return (
                                    <tr key={d._id}>
                                        <td><div style={{ color: '#fff', fontWeight: 600 }}>{d.name}</div></td>
                                        <td style={{ color: 'rgba(255,255,255,0.7)' }}>{d.code}</td>
                                        <td>
                                            <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                                {d.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <TeacherBadge
                                                name={d.hod?.name || (typeof d.hod === 'string' ? d.hod : null)}
                                                type="HOD"
                                                onClick={() => setModal({ type: 'department', id: d._id, name: d.name, teacher: d.hod, title: 'HOD' })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && activeTab === 'department' && dispDepartments.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No departments found.</td></tr>
                            )}

                            {!loading && activeTab === 'program' && dispPrograms.map(p => {
                                const sc = statusColor(p.status || 'Active');
                                return (
                                    <tr key={p._id}>
                                        <td>
                                            <div style={{ color: '#fff', fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{p.code}</div>
                                        </td>
                                        <td><span style={{ background: 'rgba(188,19,254,0.15)', color: '#bc13fe', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem' }}>{p.type}</span></td>
                                        <td>
                                            <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                                {p.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <TeacherBadge
                                                name={p.coordinator?.name || (typeof p.coordinator === 'string' ? p.coordinator : null)}
                                                type="Coordinator"
                                                onClick={() => setModal({ type: 'program', id: p._id, name: p.name, teacher: p.coordinator, title: 'Coordinator' })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && activeTab === 'program' && dispPrograms.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No programs found.</td></tr>
                            )}

                            {!loading && activeTab === 'section' && dispSections.map(s => {
                                const sc = statusColor(s.status || 'Active');
                                return (
                                    <tr key={s._id}>
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,204,0,0.1)', color: '#ffcc00', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                                                <Layout size={14} /> {s.name}
                                            </div>
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.7)' }}>{s.capacity} students</td>
                                        <td>
                                            <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                                {s.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            <TeacherBadge
                                                name={s.advisor?.name || (typeof s.advisor === 'string' ? s.advisor : null)}
                                                type="Advisor"
                                                onClick={() => setModal({ type: 'section', id: s._id, name: s.name, teacher: s.advisor, title: 'Advisor' })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {!loading && activeTab === 'section' && dispSections.length === 0 && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No sections found.</td></tr>
                            )}

                            {!loading && activeTab === 'workload' && dispWorkload.map(w => (
                                <tr key={w._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: 'linear-gradient(135deg,#0ff0fc33,#bc13fe33)',
                                                border: '1px solid rgba(15,240,252,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '0.85rem', color: '#0ff0fc', flexShrink: 0
                                            }}>
                                                {w.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 600 }}>{w.name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{w.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span style={{ color: '#bc13fe', fontSize: '0.85rem' }}>{w.role}</span></td>
                                    <td>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(80,204,127,0.1)', color: '#50cc7f', padding: '3px 10px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                                            <Clock size={14} /> {w.creditHours} CH
                                        </div>
                                    </td>
                                    <td style={{ color: '#0ff0fc', fontWeight: 600 }}>{w.courses}</td>
                                    <td style={{ color: '#ffcc00', fontWeight: 600 }}>{w.sections}</td>
                                    <td style={{ color: 'rgba(255,255,255,0.8)' }}>{w.students} <Users size={12} style={{ opacity: 0.5, marginLeft: 2 }} /></td>
                                </tr>
                            ))}
                            {!loading && activeTab === 'workload' && dispWorkload.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No teachers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignment Modal */}
            {modal && (
                <TeacherSelectModal
                    targetName={modal.name}
                    targetType={modal.title}
                    currentTeacher={modal.teacher}
                    teachers={teachers}
                    loading={loading}
                    onClose={() => setModal(null)}
                    onConfirm={handleAssign}
                />
            )}
        </div>
    );
};

export default TeacherAssignment;
