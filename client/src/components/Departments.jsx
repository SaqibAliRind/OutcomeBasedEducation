import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, UserPlus, Search, X, Loader2 } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const Departments = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const { usersList, loading: usersLoading } = useSelector(state => state.users);
    
    const departments = records.departments || [];
    const faculties = records.faculties || [];
    const availableHods = usersList.filter(u => u.role === 'HOD' || u.role === 'Teacher' || u.role === 'UniversityAdmin' || u.role === 'SuperAdmin');

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [toast, setToast] = useState(null);
    const prevLoading = React.useRef(false);
    const pendingAction = React.useRef(null);
    
    // Modals state
    const [showModal, setShowModal] = useState(false);
    const [showHodModal, setShowHodModal] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', shortName: '', faculty: '', status: 'Active', phone: '', email: '', officeLocation: '', description: '' });
    const [hodData, setHodData] = useState({ id: null, newHod: '' });

    useEffect(() => {
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('faculties'));
        dispatch(fetchUsers());
    }, [dispatch]);

    // Show toast on success/error
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

    // Handle Search & Filter
    const filteredDepartments = departments.filter(d => {
        const matchesSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) || (d.code || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Handle Export
    const handleExport = () => {
        const headers = ['Department Code', 'Short Name', 'Department Name', 'HOD', 'Phone', 'Email', 'Office', 'Status', 'Description'];
        const csvData = filteredDepartments.map(d => `${d.code || ''},"${d.shortName || ''}","${d.name || ''}","${(d.hod?.name || d.hod) || ''}","${d.phone || ''}","${d.email || ''}","${d.officeLocation || ''}",${d.status || ''},"${(d.description || '').replace(/"/g, '""')}"`);
        const csvContent = [headers.join(','), ...csvData].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Departments_Export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setToast({ type: 'success', msg: 'Departments exported successfully!' });
        setTimeout(() => setToast(null), 3000);
    };

    // Handlers for Add/Edit
    const openAddModal = () => {
        setEditingId(null);
        setFormData({ name: '', code: '', shortName: '', faculty: '', status: 'Active', phone: '', email: '', officeLocation: '', description: '' });
        setShowModal(true);
    };

    const openEditModal = (dept) => {
        setEditingId(dept._id);
        setFormData({ 
            name: dept.name || '', 
            code: dept.code || '', 
            shortName: dept.shortName || '',
            faculty: dept.faculty || '',
            status: dept.status || 'Active',
            phone: dept.phone || '',
            email: dept.email || '',
            officeLocation: dept.officeLocation || '',
            description: dept.description || ''
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Department updated successfully!' : 'Department added successfully!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'departments', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'departments', payload: formData }));
        }
        setShowModal(false);
    };

    // Handlers for Delete
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            pendingAction.current = 'Department deleted.';
            dispatch(deleteAcademicData({ entity: 'departments', id }));
        }
    };

    // Handlers for Assign HOD
    const openHodModal = (dept) => {
        setHodData({ id: dept._id, newHod: (dept.hod?.name === 'Unassigned' || !dept.hod) ? '' : (dept.hod?._id || dept.hod) });
        setShowHodModal(true);
    };

    const handleAssignHod = (e) => {
        e.preventDefault();
        pendingAction.current = 'HOD assigned successfully!';
        dispatch(updateAcademicData({ entity: 'departments', id: hodData.id, payload: { hod: hodData.newHod || 'Unassigned' } }));
        setShowHodModal(false);
    };

    return (
        <div className="academic-setup-pane fade-in superadmin-theme">
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 9999, background: toast.type === 'success' ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.15)', border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`, color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, backdropFilter: 'blur(10px)' }}>
                    {toast.msg}
                </div>
            )}
            {/* Error Banner */}
            {academicError && (
                <div className="um-alert error" style={{ marginBottom: '1rem' }}>{academicError}</div>
            )}
            <div className="um-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Departments Management</h2>
                    <p>Manage university departments, assign HODs, and update status</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExport}>
                        <Search size={18} /> Export CSV
                    </button>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openAddModal}>
                        <Plus size={18} /> Add Department
                    </button>
                </div>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '1rem' }}>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '150px' }}
                    >
                        <option value="All" style={{ color: '#000' }}>All Status</option>
                        <option value="Active" style={{ color: '#000' }}>Active</option>
                        <option value="Inactive" style={{ color: '#000' }}>Inactive</option>
                    </select>

                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search departments..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '38px' }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Department Name</th>
                                <th>Assigned HOD</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && departments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Loader2 size={32} className="spinner" color="#0ff0fc" />
                                    </td>
                                </tr>
                            ) : filteredDepartments.map((dept) => (
                                <tr key={dept._id}>
                                    <td><strong>{dept.code || 'N/A'}</strong></td>
                                    <td>{dept.name}</td>
                                    <td>
                                        <span style={{ color: (!dept.hod || dept.hod === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {dept.hod?.name || dept.hod || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(dept.status || 'Active').toLowerCase()}`}>
                                            {dept.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn toggle" title="Assign HOD" onClick={() => openHodModal(dept)}>
                                            <UserPlus size={16} />
                                        </button>
                                        <button className="action-btn edit" title="Edit Department" onClick={() => openEditModal(dept)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="action-btn delete" title="Delete Department" onClick={() => handleDelete(dept._id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filteredDepartments.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                                        No departments found in the database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '450px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Department' : 'Add New Department'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Department Name</label>
                                <input required type="text" placeholder="e.g. Computer Science" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Department Code</label>
                                    <input required type="text" placeholder="e.g. CS101" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Short Name</label>
                                    <input type="text" placeholder="e.g. CS" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Faculty</label>
                                <select value={formData.faculty} onChange={(e) => setFormData({...formData, faculty: e.target.value})}>
                                    <option value="">-- Select Faculty --</option>
                                    {faculties.map(f => (
                                        <option key={f._id} value={f._id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input type="text" placeholder="Contact number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" placeholder="Contact email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Office Location</label>
                                <input type="text" placeholder="e.g. Room 204, Block C" value={formData.officeLocation} onChange={(e) => setFormData({...formData, officeLocation: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="2" placeholder="Department description..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
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

            {/* Assign HOD Modal */}
            {showHodModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>Assign Head of Department</h3>
                            <button className="close-btn" onClick={() => setShowHodModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleAssignHod}>
                            <div className="form-group">
                                <label>HOD Name</label>
                                <select 
                                    value={hodData.newHod} 
                                    onChange={(e) => setHodData({...hodData, newHod: e.target.value})}
                                    disabled={usersLoading}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {availableHods.map(user => (
                                        <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowHodModal(false)}>Cancel</button>
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

export default Departments;
