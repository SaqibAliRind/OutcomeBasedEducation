import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData, createAcademicData, updateAcademicData, deleteAcademicData } from '../store/academicSlice';
import { fetchUsers } from '../store/userSlice';
import { Plus, Edit2, Trash2, UserPlus, Search, X, Loader2 } from 'lucide-react';
import '../style/SuperAdminDashboard.css';

const Faculties = () => {
    const dispatch = useDispatch();
    const { records, loading: academicLoading, error: academicError } = useSelector(state => state.academic);
    const { usersList, loading: usersLoading } = useSelector(state => state.users);
    
    const faculties = records.faculties || [];
    const availableDeans = usersList.filter(u => u.role === 'Dean' || u.role === 'Teacher' || u.role === 'UniversityAdmin' || u.role === 'SuperAdmin');

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [toast, setToast] = useState(null);
    const prevLoading = React.useRef(false);
    const pendingAction = React.useRef(null);
    
    // Modals state
    const [showModal, setShowModal] = useState(false);
    const [showDeanModal, setShowDeanModal] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', status: 'Active', description: '' });
    const [deanData, setDeanData] = useState({ id: null, newDean: '' });
    const [useCustomName, setUseCustomName] = useState(false);

    const PRESET_FACULTIES = [
        { name: 'Faculty of Engineering & Technology',    code: 'FET'  },
        { name: 'Faculty of Computer Science & IT',       code: 'FCIT' },
        { name: 'Faculty of Science',                     code: 'FS'   },
        { name: 'Faculty of Arts & Social Sciences',      code: 'FASS' },
        { name: 'Faculty of Business Administration',     code: 'FBA'  },
        { name: 'Faculty of Medicine & Health Sciences',  code: 'FMHS' },
        { name: 'Faculty of Law',                         code: 'FL'   },
        { name: 'Faculty of Education',                   code: 'FE'   },
        { name: 'Faculty of Agriculture',                 code: 'FA'   },
        { name: 'Faculty of Islamic Studies',             code: 'FIS'  },
        { name: 'Faculty of Pharmacy',                    code: 'FP'   },
        { name: 'Faculty of Architecture & Design',       code: 'FAD'  },
        { name: 'Faculty of Economics',                   code: 'FEC'  },
        { name: 'Faculty of Management Sciences',         code: 'FMS'  },
        { name: 'Faculty of Natural Sciences',            code: 'FNS'  },
    ];

    useEffect(() => {
        dispatch(fetchAcademicData('faculties'));
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

    // Handle Search & Filter
    const filteredFaculties = faculties.filter(f => {
        const matchesSearch = (f.name || '').toLowerCase().includes(search.toLowerCase()) || (f.code || '').toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'All' || f.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleExport = () => {
        const headers = ['Faculty Code', 'Faculty Name', 'Dean', 'Status', 'Description'];
        const csvData = filteredFaculties.map(f => `${f.code || ''},"${f.name || ''}","${f.dean || ''}",${f.status || ''},"${(f.description || '').replace(/"/g, '""')}"`);
        const csvContent = [headers.join(','), ...csvData].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'Faculties_Export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setToast({ type: 'success', msg: 'Faculties exported successfully!' });
        setTimeout(() => setToast(null), 3000);
    };

    // Handlers for Add/Edit
    const openAddModal = () => {
        setEditingId(null);
        setFormData({ name: '', code: '', status: 'Active', description: '' });
        setUseCustomName(false);
        setShowModal(true);
    };

    const openEditModal = (faculty) => {
        setEditingId(faculty._id);
        const isPreset = PRESET_FACULTIES.some(p => p.name === faculty.name);
        setUseCustomName(!isPreset);
        setFormData({ 
            name: faculty.name || '', 
            code: faculty.code || '', 
            status: faculty.status || 'Active',
            description: faculty.description || ''
        });
        setShowModal(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        pendingAction.current = editingId ? 'Faculty updated successfully!' : 'Faculty added successfully!';
        if (editingId) {
            dispatch(updateAcademicData({ entity: 'faculties', id: editingId, payload: formData }));
        } else {
            dispatch(createAcademicData({ entity: 'faculties', payload: formData }));
        }
        setShowModal(false);
    };

    // Handlers for Delete
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this faculty?')) {
            pendingAction.current = 'Faculty deleted.';
            dispatch(deleteAcademicData({ entity: 'faculties', id }));
        }
    };

    // Handlers for Assign Dean
    const openDeanModal = (faculty) => {
        setDeanData({ id: faculty._id, newDean: faculty.dean === 'Unassigned' ? '' : (faculty.dean || '') });
        setShowDeanModal(true);
    };

    const handleAssignDean = (e) => {
        e.preventDefault();
        pendingAction.current = 'Dean assigned successfully!';
        dispatch(updateAcademicData({ entity: 'faculties', id: deanData.id, payload: { dean: deanData.newDean || 'Unassigned' } }));
        setShowDeanModal(false);
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
                    <h2>Faculties Management</h2>
                    <p>Manage university faculties, assign Deans, and update status</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExport}>
                        <Search size={18} /> Export CSV
                    </button>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={openAddModal}>
                        <Plus size={18} /> Add Faculty
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
                            placeholder="Search faculties..." 
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
                                <th>Faculty Name</th>
                                <th>Assigned Dean</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicLoading && faculties.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <Loader2 size={32} className="spinner" color="#0ff0fc" />
                                    </td>
                                </tr>
                            ) : filteredFaculties.map((faculty) => (
                                <tr key={faculty._id}>
                                    <td><strong>{faculty.code || 'N/A'}</strong></td>
                                    <td>{faculty.name}</td>
                                    <td>
                                        <span style={{ color: (!faculty.dean || faculty.dean === 'Unassigned') ? 'rgba(255,255,255,0.4)' : '#fff' }}>
                                            {faculty.dean || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${(faculty.status || 'Active').toLowerCase()}`}>
                                            {faculty.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="actions-col" style={{ justifyContent: 'center' }}>
                                        <button className="action-btn toggle" title="Assign Dean" onClick={() => openDeanModal(faculty)}>
                                            <UserPlus size={16} />
                                        </button>
                                        <button className="action-btn edit" title="Edit Faculty" onClick={() => openEditModal(faculty)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="action-btn delete" title="Delete Faculty" onClick={() => handleDelete(faculty._id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!academicLoading && filteredFaculties.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>
                                        No faculties found in the database.
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
                            <h3>{editingId ? 'Edit Faculty' : 'Add New Faculty'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSave}>
                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Faculty Name</span>
                                    <button type="button" onClick={() => { setUseCustomName(!useCustomName); setFormData({...formData, name: '', code: ''}); }} style={{ background: 'none', border: 'none', color: '#0ff0fc', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                        {useCustomName ? '← Choose from list' : '+ Custom name'}
                                    </button>
                                </label>
                                {useCustomName ? (
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Faculty of Fine Arts"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                ) : (
                                    <select
                                        required
                                        value={formData.name}
                                        onChange={(e) => {
                                            const selected = PRESET_FACULTIES.find(p => p.name === e.target.value);
                                            setFormData({...formData, name: e.target.value, code: selected ? selected.code : formData.code});
                                        }}
                                    >
                                        <option value="">-- Select Faculty --</option>
                                        {PRESET_FACULTIES.map(p => (
                                            <option key={p.code} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Faculty Code</label>
                                <input required type="text" placeholder="e.g. FCIT" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea rows="3" placeholder="Faculty description or notes..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}></textarea>
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

            {/* Assign Dean Modal */}
            {showDeanModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div className="modal-header">
                            <h3>Assign Dean of Faculty</h3>
                            <button className="close-btn" onClick={() => setShowDeanModal(false)}><X size={18} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleAssignDean}>
                            <div className="form-group">
                                <label>Dean Name</label>
                                <select 
                                    value={deanData.newDean} 
                                    onChange={(e) => setDeanData({...deanData, newDean: e.target.value})}
                                    disabled={usersLoading}
                                >
                                    <option value="">-- Unassigned --</option>
                                    {availableDeans.map(user => (
                                        <option key={user._id} value={user.name}>{user.name} ({user.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="page-btn cancel-btn" onClick={() => setShowDeanModal(false)}>Cancel</button>
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

export default Faculties;
