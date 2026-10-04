import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Trash2, UserPlus, Edit, Archive, AlertTriangle } from 'lucide-react';

const UniversityList = ({ onEdit, onDelete, onAddAdmin }) => {
    const { list } = useSelector((state) => state.university);
    const [confirmDelete, setConfirmDelete] = useState(null); // { id, name } or null

    const handleDeleteChoice = (id, permanent) => {
        onDelete(id, permanent);
        setConfirmDelete(null);
    };

    return (
        <div style={{ position: 'relative' }}>
            <table className="glass-table">
                <thead>
                    <tr>
                        <th>University Name</th>
                        <th>Code</th>
                        <th>City / Province</th>
                        <th>Email & Phone</th>
                        <th>HEC Status</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(list) && list.length > 0 ? (
                        list.map((uni) => (
                            <tr key={uni._id}>
                                <td>
                                    <div style={{ fontWeight: '600', color: '#fff' }}>{uni.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--uni-text-muted)' }}>{uni.shortName}</div>
                                </td>
                                <td>
                                    <span className="badge-code" style={{ background: 'rgba(15, 240, 252, 0.1)', color: '#0ff0fc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.855rem' }}>{uni.code}</span>
                                </td>
                                <td>{uni.city}, {uni.province}</td>
                                <td>
                                    <div>{uni.email}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--uni-text-muted)' }}>{uni.phone}</div>
                                </td>
                                <td>
                                    <span style={{
                                        color: uni.nceacStatus === 'Accredited' ? '#50cc7f' : uni.nceacStatus === 'Pending' ? '#ffcc00' : '#ff1b6b',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}>
                                        {uni.nceacStatus || 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-pill ${uni.status === 'Active' ? 'active' : 'inactive'}`} style={{
                                        background: uni.status === 'Active' ? 'rgba(80, 204, 127, 0.15)' : 'rgba(255, 27, 107, 0.15)',
                                        color: uni.status === 'Active' ? '#50cc7f' : '#ff1b6b',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600'
                                    }}>
                                        {uni.status || 'Active'}
                                    </span>
                                </td>
                                <td className="table-actions">
                                    <button className="action-btn" title="Add Administrator" onClick={() => onAddAdmin(uni._id)} style={{ color: '#45caff' }}>
                                        <UserPlus size={16} />
                                    </button>
                                    <button className="action-btn" title="Edit University" onClick={() => onEdit(uni)} style={{ color: '#bc13fe' }}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="delete-btn" title="Delete Options" onClick={() => setConfirmDelete({ id: uni._id, name: uni.name })} style={{ color: '#ff1b6b' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '25px', color: 'var(--uni-text-muted)' }}>
                                {list === null ? "Loading..." : "No universities found."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* In-table Confirmation overlay for Soft vs Permanent delete */}
            {confirmDelete && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.85)' }}>
                    <div className="modal-content glass-panel-dash" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="#ff1b6b" style={{ margin: '0 auto 15px auto', display: 'block' }} />
                        <h3 style={{ color: '#ff1b6b', fontSize: '1.2rem', marginBottom: '10px' }}>Delete {confirmDelete.name}?</h3>
                        <p style={{ fontSize: '0.9rem', color: '#ddd', marginBottom: '20px' }}>
                            Choose soft delete to disable the portal and make it inactive, or permanent delete to wipe its records.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="primary-btn" 
                                onClick={() => handleDeleteChoice(confirmDelete.id, false)} 
                                style={{ background: 'rgba(255,204,0,0.2)', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.4)', width: '100%', justifyContent: 'center' }}>
                                <Archive size={16} /> Soft Delete (Archive)
                            </button>
                            <button className="danger-btn" onClick={() => handleDeleteChoice(confirmDelete.id, true)} style={{ width: '100%', justifyContent: 'center' }}>
                                <Trash2 size={16} /> Permanent Delete
                            </button>
                            <button className="cancel-btn" onClick={() => setConfirmDelete(null)} style={{ width: '100%' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversityList;
