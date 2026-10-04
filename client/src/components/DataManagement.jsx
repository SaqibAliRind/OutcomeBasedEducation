import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../store/academicSlice';
import { Database, Trash2, Archive, RefreshCcw, Layers, Search, CheckSquare, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useSelector as useReduxSelector } from 'react-redux';
import '../style/Dashboard.css';

const DataManagement = () => {
    const dispatch = useDispatch();
    const { records, loading } = useSelector(state => state.academic);
    const { token } = useSelector(state => state.auth);

    const [selectedTab, setSelectedTab] = useState('bulk');
    const [selectedItems, setSelectedItems] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [dupLoading, setDupLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const allUsers = records.users || [];
    const allDepts = records.departments || [];
    const allCourses = records.courses || [];

    // Build a flat list of manageable records
    const allItems = [
        ...allUsers.map(u => ({ id: u._id, type: 'User', name: u.name, details: `${u.role} — ${u.email}`, status: u.isActive ? 'Active' : 'Inactive' })),
        ...allDepts.map(d => ({ id: d._id, type: 'Department', name: d.name, details: d.code || 'N/A', status: d.status || 'Active' })),
        ...allCourses.map(c => ({ id: c._id, type: 'Course', name: c.name, details: c.code || 'N/A', status: 'Active' })),
    ];

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('courses'));
    }, [dispatch]);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedItems(allItems.map(d => d.id));
        else setSelectedItems([]);
    };

    const handleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const findDuplicates = async () => {
        setDupLoading(true);
        try {
            // Detect duplicates by email for users
            const emailCount = {};
            allUsers.forEach(u => {
                emailCount[u.email] = emailCount[u.email] || [];
                emailCount[u.email].push(u);
            });
            const dups = [];
            Object.values(emailCount).forEach(group => {
                if (group.length > 1) {
                    for (let i = 1; i < group.length; i++) {
                        dups.push({ original: { id: group[0]._id, name: group[0].name, details: group[0].email }, duplicate: { id: group[i]._id, name: group[i].name, details: group[i].email } });
                    }
                }
            });
            // Detect duplicates by course code
            const codeCount = {};
            allCourses.forEach(c => {
                if (!c.code) return;
                codeCount[c.code] = codeCount[c.code] || [];
                codeCount[c.code].push(c);
            });
            Object.values(codeCount).forEach(group => {
                if (group.length > 1) {
                    for (let i = 1; i < group.length; i++) {
                        dups.push({ original: { id: group[0]._id, name: group[0].name, details: group[0].code }, duplicate: { id: group[i]._id, name: group[i].name, details: group[i].code } });
                    }
                }
            });
            setDuplicates(dups);
        } finally {
            setDupLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.15)', border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`, color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b', padding: '12px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', fontWeight: 600 }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Database size={28} color="#0ff0fc" />
                    Data Management
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Bulk actions, archiving, restoration, and duplicate record detection.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                <button onClick={() => setSelectedTab('bulk')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', background: selectedTab === 'bulk' ? 'rgba(15,240,252,0.15)' : 'transparent', color: selectedTab === 'bulk' ? '#0ff0fc' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                    <Layers size={16} /> Bulk Operations
                </button>
                <button onClick={() => { setSelectedTab('duplicates'); findDuplicates(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', background: selectedTab === 'duplicates' ? 'rgba(188,19,254,0.15)' : 'transparent', color: selectedTab === 'duplicates' ? '#bc13fe' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                    <Search size={16} /> Duplicate Detection
                </button>
            </div>

            {selectedTab === 'bulk' && (
                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button disabled={selectedItems.length === 0} onClick={() => showToast(`Bulk update for ${selectedItems.length} items would be done via individual update modals.`, 'success')} style={{ padding: '8px 16px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', color: selectedItems.length > 0 ? '#0ff0fc' : 'rgba(255,255,255,0.3)', borderRadius: '8px', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckSquare size={16} /> Bulk Update
                            </button>
                            <button disabled={selectedItems.length === 0} style={{ padding: '8px 16px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: selectedItems.length > 0 ? '#ff1b6b' : 'rgba(255,255,255,0.3)', borderRadius: '8px', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Trash2 size={16} /> Soft Delete
                            </button>
                            <button disabled={selectedItems.length === 0} style={{ padding: '8px 16px', background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', color: selectedItems.length > 0 ? '#ffcc00' : 'rgba(255,255,255,0.3)', borderRadius: '8px', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Archive size={16} /> Archive Data
                            </button>
                            <button disabled={selectedItems.length === 0} style={{ padding: '8px 16px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', color: selectedItems.length > 0 ? '#50cc7f' : 'rgba(255,255,255,0.3)', borderRadius: '8px', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <RefreshCcw size={16} /> Restore Data
                            </button>
                        </div>
                        {selectedItems.length > 0 && (
                            <span style={{ color: '#0ff0fc', fontSize: '0.85rem', fontWeight: 600 }}>{selectedItems.length} selected</span>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <Loader2 size={36} className="spinner" color="#0ff0fc" />
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '16px' }}><input type="checkbox" onChange={handleSelectAll} checked={allItems.length > 0 && selectedItems.length === allItems.length} /></th>
                                    <th style={{ padding: '16px' }}>Type</th>
                                    <th style={{ padding: '16px' }}>Name / Title</th>
                                    <th style={{ padding: '16px' }}>Details</th>
                                    <th style={{ padding: '16px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
                                            No records loaded. Add departments, courses, and users to manage them here.
                                        </td>
                                    </tr>
                                ) : allItems.map(d => (
                                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedItems.includes(d.id) ? 'rgba(15,240,252,0.05)' : 'transparent' }}>
                                        <td style={{ padding: '16px' }}><input type="checkbox" checked={selectedItems.includes(d.id)} onChange={() => handleSelect(d.id)} /></td>
                                        <td style={{ padding: '16px', color: '#0ff0fc', fontSize: '0.85rem' }}>{d.type}</td>
                                        <td style={{ padding: '16px', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{d.name}</td>
                                        <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{d.details}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: d.status === 'Active' ? 'rgba(80,204,127,0.2)' : 'rgba(255,204,0,0.2)', color: d.status === 'Active' ? '#50cc7f' : '#ffcc00' }}>
                                                {d.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {selectedTab === 'duplicates' && (
                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '24px' }}>
                    <h3 style={{ margin: '0 0 16px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={20} /> Possible Duplicate Records
                    </h3>
                    {dupLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <Loader2 size={36} className="spinner" color="#bc13fe" />
                        </div>
                    ) : duplicates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {duplicates.map((dup, i) => (
                                <div key={i} style={{ padding: '16px', background: 'rgba(255,27,107,0.05)', border: '1px solid rgba(255,27,107,0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Original Record</div>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>{dup.original.name}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{dup.original.details}</div>
                                        </div>
                                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#ff1b6b', marginBottom: '4px' }}>Suspected Duplicate</div>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>{dup.duplicate.name}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{dup.duplicate.details}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => showToast('Merge functionality: Navigate to the respective record to manually merge.', 'success')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Merge Records</button>
                                        <button onClick={() => { setDuplicates(prev => prev.filter((_, idx) => idx !== i)); showToast('Duplicate entry dismissed.'); }} style={{ padding: '8px 16px', background: 'rgba(255,27,107,0.2)', border: '1px solid #ff1b6b', color: '#ff1b6b', borderRadius: '8px', cursor: 'pointer' }}>Dismiss</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <AlertCircle size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                            <div>No duplicate records detected in users or courses.</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DataManagement;
