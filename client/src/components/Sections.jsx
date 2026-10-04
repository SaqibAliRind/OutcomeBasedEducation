import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Users } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const Sections = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const { usersList } = useSelector(state => state.users);
    
    const sections = records.sections || [];
    const semesters = records.semesters || [];
    const programs = records.programs || [];
    const availableAdvisors = usersList.filter(u => u.role === 'Teacher' || u.role === 'ProgramCoordinator');

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAdvisorModal, setShowAdvisorModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    const [advisorData, setAdvisorData] = useState({ id: null, advisor: '' });
    
    // Safely extract string to prevent React "Objects are not valid as a React child" crashes
    const safeStr = (val) => {
        if (!val) return '';
        if (typeof val === 'object') return val.name || val.title || val.code || String(val._id || '');
        return String(val);
    };

    const emptyForm = { name: '', capacity: 50, semester: '', program: '', status: 'Active' };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchAcademicData('programs'));
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

    const filtered = sections.filter(s => 
        (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (s.advisor || '').toLowerCase().includes(search.toLowerCase())
    );

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (section) => {
        setEditingId(section._id);
        setFormData({
            name: safeStr(section.name),
            capacity: section.capacity || 50,
            semester: typeof section.semester === 'object' ? section.semester._id : (section.semester || ''),
            program: typeof section.program === 'object' ? section.program._id : (section.program || ''),
            status: section.status || 'Active'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Section updated!' : 'Section added!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'sections', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'sections', payload: formData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this section?')) {
            pendingAction.current = 'Section deleted.';
            dispatch(deleteAcademicData({ entity: 'sections', id }));
        }
    };

    const openAdvisorModal = (section) => {
        setAdvisorData({ id: section._id, advisor: section.advisor === 'Unassigned' ? '' : section.advisor });
        setShowAdvisorModal(true);
    };

    const handleAssignAdvisor = (e) => {
        e.preventDefault();
        pendingAction.current = 'Advisor assigned successfully!';
        dispatch(updateAcademicData({ 
            entity: 'sections', 
            id: advisorData.id, 
            payload: { advisor: advisorData.advisor || 'Unassigned' } 
        }));
        setShowAdvisorModal(false);
    };

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 9999, background: 'rgba(80,204,127,0.15)', border: '1px solid #50cc7f', color: '#50cc7f', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                    {toast.msg}
                </div>
            )}
            {academicError && (
                <div className="um-alert error" style={{ marginBottom: '1rem' }}>{academicError}</div>
            )}

            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Sections Management</h2>
                    <p>Manage class sections, capacity, and assign section advisors</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Add Section
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search sections..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Section Name</th>
                                <th>Semester</th>
                                <th>Program</th>
                                <th>Capacity</th>
                                <th>Advisor</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && sections.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(sec => (
                                <tr key={sec._id}>
                                    <td><strong>{safeStr(sec.name)}</strong></td>
                                    <td>
                                        <span style={{ color: (!sec.semester || sec.semester === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {typeof sec.semester === 'object' ? safeStr(sec.semester.name) : safeStr(semesters.find(s => s._id === sec.semester)?.name || 'Unassigned')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: (!sec.program || sec.program === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {typeof sec.program === 'object' ? safeStr(sec.program.name) : safeStr(programs.find(p => p._id === sec.program)?.name || 'Unassigned')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ background: 'rgba(15, 240, 252, 0.1)', color: '#0ff0fc', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                                            {sec.capacity} Students
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: (!sec.advisor || sec.advisor === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {safeStr(sec.advisor || 'Unassigned')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(sec.status || 'Active').toLowerCase()}`}>
                                            {safeStr(sec.status || 'Active')}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn toggle" title="Assign Advisor" onClick={() => openAdvisorModal(sec)}>
                                            <Users size={16} />
                                        </button>
                                        <button className="action-btn edit" title="Edit Section" onClick={() => openEdit(sec)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Section" onClick={() => handleDelete(sec._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No sections found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Section' : 'Add New Section'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Section Name</label>
                                <input required type="text" placeholder="e.g. Section A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input required type="number" min="1" max="200" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })} />
                                </div>
                                    <div className="form-group">
                                        <label>Semester</label>
                                        <select value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}>
                                            <option value="">-- Unassigned --</option>
                                            {semesters.map(s => <option key={s._id} value={s._id}>{safeStr(s.name)}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Program</label>
                                        <select value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })}>
                                            <option value="">-- Unassigned --</option>
                                            {programs.map(p => <option key={p._id} value={p._id}>{safeStr(p.name)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="page-btn primary-btn" style={{ padding: '8px 16px' }} disabled={academicLoading}>
                                    {academicLoading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Advisor Modal */}
            {showAdvisorModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>Assign Advisor</h3>
                            <button className="close-btn" onClick={() => setShowAdvisorModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleAssignAdvisor}>
                            <div className="form-group">
                                <label>Select Advisor</label>
                                <select value={advisorData.advisor} onChange={e => setAdvisorData({ ...advisorData, advisor: e.target.value })}>
                                    <option value="">-- Unassigned --</option>
                                    {availableAdvisors.map(u => (
                                        <option key={u._id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowAdvisorModal(false)}>Cancel</button>
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

export default Sections;
