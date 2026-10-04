import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Calendar } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const Batches = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const batches = records.batches || [];
    const programs = records.programs || [];

    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const currentYear = new Date().getFullYear();
    const emptyForm = { name: '', admissionYear: currentYear, graduationYear: currentYear + 4, program: '', status: 'Active' };
    const [formData, setFormData] = useState(emptyForm);

    const prevLoading = useRef(false);
    const pendingAction = useRef(null);

    useEffect(() => {
        dispatch(fetchAcademicData('batches'));
        dispatch(fetchAcademicData('programs'));
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

    const filtered = batches.filter(b => 
        (b.name || '').toLowerCase().includes(search.toLowerCase()) || 
        String(b.admissionYear).includes(search) ||
        String(b.graduationYear).includes(search)
    );

    // Handlers
    const openAdd = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (batch) => {
        setEditingId(batch._id);
        setFormData({
            name: batch.name || '',
            admissionYear: batch.admissionYear || currentYear,
            graduationYear: batch.graduationYear || currentYear + 4,
            program: batch.program || '',
            status: batch.status || 'Active'
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Batch updated!' : 'Batch added!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'batches', id: editingId, payload: formData }));
        } else {
            // Auto-generate name if blank (e.g., "Batch 2024")
            const finalData = { ...formData, name: formData.name || `Batch ${formData.admissionYear}` };
            dispatch(createAcademicData({ entity: 'batches', payload: finalData }));
        }
        setShowModal(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this batch?')) {
            pendingAction.current = 'Batch deleted.';
            dispatch(deleteAcademicData({ entity: 'batches', id }));
        }
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
                    <h2>Batches Management</h2>
                    <p>Manage student batches, admission years, and graduation tracking</p>
                </div>
                <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '8px' }} onClick={openAdd}>
                    <Plus size={18} /> Add Batch
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" className="search-input" placeholder="Search batches..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Batch Name</th>
                                <th>Admission Year</th>
                                <th>Graduation Year</th>
                                <th>Program</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && batches.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 size={32} className="spinner" color="#0ff0fc" /></td></tr>
                            ) : filtered.map(b => (
                                <tr key={b._id}>
                                    <td><strong>{b.name}</strong></td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} color="#0ff0fc" /> {b.admissionYear}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Calendar size={14} color="#ffcc00" /> {b.graduationYear}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: (!b.program || b.program === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {typeof b.program === 'object' ? b.program.name : (programs.find(p => p._id === b.program)?.name || 'Unassigned')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(b.status || 'Active').toLowerCase()}`} style={{
                                            background: b.status === 'Graduated' ? 'rgba(80, 204, 127, 0.15)' : '',
                                            color: b.status === 'Graduated' ? '#50cc7f' : ''
                                        }}>
                                            {b.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn edit" title="Edit Batch" onClick={() => openEdit(b)}><Edit2 size={16} /></button>
                                        <button className="action-btn delete" title="Delete Batch" onClick={() => handleDelete(b._id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filtered.length === 0 && (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No batches found.</td></tr>
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
                            <h3>{editingId ? 'Edit Batch' : 'Add New Batch'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            
                            <div className="form-group">
                                <label>Batch Name (Optional)</label>
                                <input type="text" placeholder={`e.g. Batch ${formData.admissionYear}`} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <small style={{ color: 'rgba(255,255,255,0.4)', marginTop: '4px', display: 'block' }}>Leave blank to auto-generate from admission year</small>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Admission Year</label>
                                    <input required type="number" min="1900" max="2100" value={formData.admissionYear} onChange={e => setFormData({ ...formData, admissionYear: parseInt(e.target.value) || currentYear })} />
                                </div>
                                <div className="form-group">
                                    <label>Graduation Year</label>
                                    <input required type="number" min="1900" max="2100" value={formData.graduationYear} onChange={e => setFormData({ ...formData, graduationYear: parseInt(e.target.value) || (currentYear + 4) })} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Program</label>
                                    <select value={formData.program} onChange={e => setFormData({ ...formData, program: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Active">Active</option>
                                        <option value="Graduated">Graduated</option>
                                    </select>
                                </div>
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
        </div>
    );
};

export default Batches;
