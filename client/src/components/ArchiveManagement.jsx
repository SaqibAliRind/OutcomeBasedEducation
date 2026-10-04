import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArchives, restoreArchive, permanentDeleteArchive, clearArchiveMessages } from '../store/archiveSlice';
import { 
    Archive, RefreshCcw, Trash2, Search, Filter, 
    BookOpen, Users, FileText, Settings, ShieldAlert, AlertTriangle
} from 'lucide-react';
import '../style/Dashboard.css';

const ARCHIVE_TYPES = [
    'Students', 'Teachers', 'Courses', 'Assessments', 'Question Papers',
    'Blueprint', 'Question Mapping', 'Rubrics', 'Attendance', 'Marks',
    'Results', 'OBE Reports', 'Course Files', 'Surveys', 'Notifications'
];

const ArchiveManagement = () => {
    const dispatch = useDispatch();
    const { list, loading, error, successMessage } = useSelector(state => state.archive);
    const { user } = useSelector(state => state.auth);

    const [type, setType] = useState('Courses');
    const [search, setSearch] = useState('');
    const [sessionFilter, setSessionFilter] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    
    // Warn modal state for permanent delete
    const [deleteModal, setDeleteModal] = useState(null);

    useEffect(() => {
        dispatch(fetchArchives({ type, search, session: sessionFilter, semester: semesterFilter }));
    }, [dispatch, type, search, sessionFilter, semesterFilter]);

    useEffect(() => {
        if (successMessage) {
            alert(successMessage);
            dispatch(clearArchiveMessages());
            setDeleteModal(null);
        }
        if (error) {
            alert(error);
            dispatch(clearArchiveMessages());
        }
    }, [successMessage, error, dispatch]);

    const handleRestore = (id) => {
        if(window.confirm('Are you sure you want to restore this item?')) {
            dispatch(restoreArchive({ id, type }));
        }
    };

    const handlePermanentDelete = () => {
        if (!deleteModal) return;
        dispatch(permanentDeleteArchive({ id: deleteModal._id, type }));
    };

    const renderItemName = (item) => {
        return item.name || item.title || item.code || `Item ID: ${item._id}`;
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <Archive size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> Archive Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Manage and restore archived records across semesters.</p>
                </div>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '20px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Archive Category</label>
                    <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}>
                        {ARCHIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Search Archive</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '10px', top: '12px' }}/>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, title..." style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                    </div>
                </div>

                <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Session Filter</label>
                    <input type="text" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} placeholder="e.g. Fall 2024" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                </div>

                <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Semester Filter</label>
                    <input type="text" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} placeholder="e.g. 1st, 2nd" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                </div>
            </div>

            <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Archive size={18}/> Archived {type}
                </h3>
                
                {loading ? (
                    <div style={{ color: '#0ff0fc', padding: '20px', textAlign: 'center' }}>Searching Archive...</div>
                ) : list.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        <Archive size={48} style={{ opacity: 0.2, marginBottom: '10px' }}/>
                        <p>No archived records found for {type}.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {list.map(item => (
                            <div key={item._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', wordBreak: 'break-word' }}>{renderItemName(item)}</h4>
                                    <span style={{ fontSize: '0.7rem', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', padding: '2px 6px', borderRadius: '4px' }}>Archived</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span>ID: {item._id}</span>
                                    <span>Deleted At: {new Date(item.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleRestore(item._id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(80,204,127,0.1)', border: '1px solid #50cc7f30', color: '#50cc7f', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <RefreshCcw size={14}/> Restore
                                    </button>
                                    {user?.role === 'SuperAdmin' && (
                                        <button onClick={() => setDeleteModal(item)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,27,107,0.1)', border: '1px solid #ff1b6b30', color: '#ff1b6b', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }} title="Permanent Delete">
                                            <Trash2 size={14}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Permanent Delete Modal */}
            {deleteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-panel-dash fade-in" style={{ width: '400px', padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #ff1b6b50' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff1b6b' }}>
                            <AlertTriangle size={24}/>
                            <h3 style={{ margin: 0 }}>Permanent Delete</h3>
                        </div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            Are you absolutely sure you want to permanently delete <strong>{renderItemName(deleteModal)}</strong>? This action cannot be undone and will remove the record from the database entirely.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={handlePermanentDelete} style={{ flex: 1, padding: '10px', background: '#ff1b6b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Yes, Delete Forever</button>
                            <button onClick={() => setDeleteModal(null)} style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ArchiveManagement;
