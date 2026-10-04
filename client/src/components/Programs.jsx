import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Link2, UserPlus } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const PROGRAM_TYPES = ['BS', 'MS', 'MPhil', 'PhD', 'Associate', 'Diploma', 'Certificate'];

const PRESET_PROGRAMS = {
    BS: [
        'BS Computer Science', 'BS Software Engineering', 'BS Information Technology',
        'BS Electrical Engineering', 'BS Mechanical Engineering', 'BS Civil Engineering',
        'BS Artificial Intelligence', 'BS Data Science', 'BS Business Administration',
        'BS Accounting & Finance', 'BS Mathematics', 'BS Physics', 'BS Chemistry',
        'BS Biotechnology', 'BS Environmental Science', 'BS Psychology', 'BS Economics',
        'BS English Literature', 'BS Urdu', 'BS Islamic Studies', 'BS Education',
        'BS Architecture', 'BS Pharmacy', 'BS Nursing', 'BS Law (LLB)',
    ],
    MS: [
        'MS Computer Science', 'MS Software Engineering', 'MS Data Science',
        'MS Electrical Engineering', 'MS Mechanical Engineering', 'MS Business Administration (MBA)',
        'MS Artificial Intelligence', 'MS Cybersecurity', 'MS Biotechnology',
        'MS Mathematics', 'MS Physics', 'MS Education', 'MS Islamic Studies',
    ],
    MPhil: [
        'MPhil Education', 'MPhil Islamic Studies', 'MPhil English Literature',
        'MPhil Psychology', 'MPhil Sociology', 'MPhil Mathematics',
    ],
    PhD: [
        'PhD Computer Science', 'PhD Software Engineering', 'PhD Electrical Engineering',
        'PhD Mathematics', 'PhD Physics', 'PhD Management Sciences', 'PhD Education',
        'PhD Islamic Studies', 'PhD Biotechnology',
    ],
    Associate: ['Associate Degree in Computer Science', 'Associate Degree in Business'],
    Diploma: ['Diploma in IT', 'Diploma in Business Management', 'Diploma in Education'],
    Certificate: ['Certificate in Web Development', 'Certificate in Data Analysis', 'Certificate in Digital Marketing'],
};

const DEFAULT_CREDITS = { BS: 130, MS: 30, MPhil: 30, PhD: 18, Associate: 66, Diploma: 0, Certificate: 0 };
const DEFAULT_DURATION = { BS: '4 Years', MS: '2 Years', MPhil: '2 Years', PhD: '3-5 Years', Associate: '2 Years', Diploma: '1 Year', Certificate: '6 Months' };

const Programs = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const { usersList, loading: usersLoading } = useSelector(state => state.users);

    const programs   = records.programs    || [];
    const departments = records.departments || [];
    const availableCoordinators = usersList?.filter(u => u.role === 'Teacher' || u.role === 'HOD' || u.role === 'Dean') || [];

    const [search, setSearch]   = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [toast, setToast]     = useState(null);
    const [showModal, setShowModal]   = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [deptData, setDeptData]     = useState({ id: null, department: '' });
    const [useCustomName, setUseCustomName] = useState(false);

    const emptyForm = { name: '', code: '', type: 'BS', creditHours: 130, duration: '4 Years', department: '', totalSemesters: 8, coordinator: '', accreditationStatus: 'Not Accredited', status: 'Active' };
    const [formData, setFormData] = useState(emptyForm);

    const safeStr = (val) => {
        if (!val) return '';
        if (typeof val === 'object') return val.name || val.title || val.code || String(val._id || '');
        return String(val);
    };

    const prevLoading = React.useRef(false);
    const pendingAction = React.useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        if (prevLoading.current && !academicLoading) {
            if (pendingAction.current) {
                setToast({ type: 'success', msg: pendingAction.current });
                pendingAction.current = null;
                setTimeout(() => setToast(null), 3000);
            }
        }
        prevLoading.current = academicLoading;
    }, [academicLoading]);

    const filtered = programs.filter(p => {
        const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                            (p.code || '').toLowerCase().includes(search.toLowerCase());
        const matchType   = typeFilter === 'All' || p.type === typeFilter;
        return matchSearch && matchType;
    });

    // ── Handlers ────────────────────────────────
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setUseCustomName(false);
        setShowModal(true);
    };

    const openEdit = (prog) => {
        setEditingId(prog._id);
        const isPreset = (PRESET_PROGRAMS[prog.type] || []).includes(prog.name);
        setUseCustomName(!isPreset);
        setFormData({
            name: prog.name || '',
            code: prog.code || '',
            type: prog.type || 'BS',
            creditHours: prog.creditHours ?? 130,
            duration: prog.duration || '4 Years',
            department: typeof prog.department === 'object' && prog.department ? prog.department._id : (prog.department || ''),
            totalSemesters: prog.totalSemesters ?? 8,
            coordinator: prog.coordinator?._id || (typeof prog.coordinator === 'string' ? prog.coordinator : ''),
            accreditationStatus: prog.accreditationStatus || 'Not Accredited',
            status: prog.status || 'Active',
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Program updated!' : 'Program added!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'programs', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'programs', payload: formData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this program?')) {
            pendingAction.current = 'Program deleted.';
            dispatch(deleteAcademicData({ entity: 'programs', id }));
        }
    };

    const openDeptModal = (prog) => {
        setDeptData({ id: prog._id, department: prog.department || '' });
        setShowDeptModal(true);
    };

    const handleAssignDept = (e) => {
        e.preventDefault();
        pendingAction.current = 'Department assigned!';
        dispatch(updateAcademicData({ entity: 'programs', id: deptData.id, payload: { department: deptData.department } }));
        setShowDeptModal(false);
    };

    const handleTypeChange = (type) => {
        setFormData(prev => ({
            ...prev, type,
            name: '',
            creditHours: DEFAULT_CREDITS[type] ?? 0,
            duration: DEFAULT_DURATION[type] ?? '',
        }));
        setUseCustomName(false);
    };

    const typeColors = { BS: '#0ff0fc', MS: '#bc13fe', MPhil: '#ffcc00', PhD: '#ff1b6b', Associate: '#50cc7f', Diploma: '#ff9a9e', Certificate: '#45caff' };

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 9999, background: 'rgba(80,204,127,0.15)', border: '1px solid #50cc7f', color: '#50cc7f', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                    {toast.msg}
                </div>
            )}
            {academicError && (
                <div className="um-alert error" style={{ marginBottom: '1rem' }}>{academicError}</div>
            )}

            {/* Header */}
            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Programs Management</h2>
                    <p>Manage degree programs, assign departments, and configure credit hours</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Add Program
                </button>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {['All', ...PROGRAM_TYPES].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)} style={{
                        padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                        background: typeFilter === t ? (typeColors[t] || '#0ff0fc') : 'rgba(255,255,255,0.06)',
                        color: typeFilter === t ? '#020917' : 'rgba(255,255,255,0.6)',
                        transition: 'all 0.2s ease',
                        boxShadow: typeFilter === t ? `0 0 12px ${typeColors[t] || '#0ff0fc'}55` : 'none',
                    }}>
                        {t} {t !== 'All' && `(${programs.filter(p => p.type === t).length})`}
                    </button>
                ))}
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                {/* Search */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                {/* Table */}
                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Program Name</th>
                                <th>Type</th>
                                <th>Credits</th>
                                <th>Duration</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && programs.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(prog => (
                                <tr key={prog._id}>
                                    <td><strong>{typeof prog.code === 'object' ? prog.code?.name || JSON.stringify(prog.code) : prog.code || 'N/A'}</strong></td>
                                    <td>{typeof prog.name === 'object' ? prog.name?.name || JSON.stringify(prog.name) : prog.name}</td>
                                    <td>
                                        <span style={{ background: `${typeColors[prog.type] || '#fff'}18`, color: typeColors[prog.type] || '#fff', border: `1px solid ${typeColors[prog.type] || '#fff'}44`, padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                                            {prog.type || 'BS'}
                                        </span>
                                    </td>
                                    <td>{prog.creditHours ?? '—'} Cr</td>
                                    <td>{prog.duration || '—'}</td>
                                    <td>
                                        <span style={{ color: (!prog.department || prog.department === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {typeof prog.department === 'object' && prog.department !== null ? (prog.department.name || prog.department.code || JSON.stringify(prog.department)) : prog.department || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(prog.status || 'Active').toLowerCase()}`}>
                                            {prog.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn toggle" title="Assign Department" onClick={() => openDeptModal(prog)}><Link2 size={16} /></button>
                                        <button className="action-btn edit"   title="Edit Program"       onClick={() => openEdit(prog)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Program"     onClick={() => handleDelete(prog._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No programs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add/Edit Modal ─────────────────── */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '520px', padding: '1.5rem', borderRadius: '14px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Program' : 'Add New Program'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>

                            {/* Program Type */}
                            <div className="form-group">
                                <label>Program Type</label>
                                <select value={formData.type} onChange={e => handleTypeChange(e.target.value)}>
                                    {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Program Name */}
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Program Name</span>
                                    <button type="button" onClick={() => { setUseCustomName(!useCustomName); setFormData(p => ({ ...p, name: '' })); }}
                                        style={{ background: 'none', border: 'none', color: '#0ff0fc', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                        {useCustomName ? '← Choose from list' : '+ Custom name'}
                                    </button>
                                </label>
                                {useCustomName ? (
                                    <input required type="text" placeholder="e.g. BS Cybersecurity" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                ) : (
                                    <select required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}>
                                        <option value="">-- Select Program --</option>
                                        {(PRESET_PROGRAMS[formData.type] || []).map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Code */}
                            <div className="form-group">
                                <label>Program Code</label>
                                <input required type="text" placeholder="e.g. BSCS-2024" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
                            </div>

                            {/* Credit Hours + Duration (2 col) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Credit Hours</label>
                                    <input type="number" min="0" max="300" value={formData.creditHours} onChange={e => setFormData({ ...formData, creditHours: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Duration</label>
                                    <select value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}>
                                        {['6 Months','1 Year','1.5 Years','2 Years','2.5 Years','3 Years','3.5 Years','4 Years','5 Years','5-7 Years'].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Total Semesters</label>
                                    <input type="number" min="1" max="16" value={formData.totalSemesters} onChange={e => setFormData({ ...formData, totalSemesters: +e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Assign Department</label>
                                    <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {departments.filter(d => d).map(d => <option key={d._id} value={d._id}>{safeStr(d.name)} ({safeStr(d.code) || ''})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Program Coordinator</label>
                                    <select value={formData.coordinator} onChange={e => setFormData({ ...formData, coordinator: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {availableCoordinators.filter(u => u).map(u => <option key={u._id} value={u._id}>{safeStr(u.name)}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Accreditation Status</label>
                                    <select value={formData.accreditationStatus} onChange={e => setFormData({ ...formData, accreditationStatus: e.target.value })}>
                                        <option value="Not Accredited">Not Accredited</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Accredited">Accredited</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="form-group">
                                <label>Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="page-btn primary-btn" style={{ padding: '8px 16px' }} disabled={academicLoading}>
                                    {academicLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Assign Department Modal ─────────── */}
            {showDeptModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>Assign Department</h3>
                            <button className="close-btn" onClick={() => setShowDeptModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleAssignDept}>
                            <div className="form-group">
                                <label>Select Department</label>
                                <select value={deptData.department} onChange={e => setDeptData({ ...deptData, department: e.target.value })}>
                                    <option value="">-- Unassigned --</option>
                                    {departments.filter(d => d).map(d => <option key={d._id} value={d._id}>{safeStr(d.name)} ({safeStr(d.code) || ''})</option>)}
                                </select>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowDeptModal(false)}>Cancel</button>
                                <button type="submit" className="page-btn primary-btn" style={{ padding: '8px 16px' }} disabled={academicLoading}>
                                    {academicLoading ? 'Assigning...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Programs;
