import React, { useState, useEffect } from 'react';
import { Archive, Search, Activity, Users, ArrowRight, Eye, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';
import '../style/Dashboard.css';

const ObeHistory = () => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSnapshots, setSelectedSnapshots] = useState([]);
    const [compareData, setCompareData] = useState(null);
    const [viewData, setViewData] = useState(null);
    
    // Auth token (simulate from Redux or local storage in real app, here we grab from localStorage)
    const token = localStorage.getItem('token') || '';

    useEffect(() => {
        fetchSnapshots();
    }, []);

    const fetchSnapshots = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/obe/archive', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSnapshots(data);
            } else {
                setError(data.message || 'Failed to fetch snapshots');
            }
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleCompare = async () => {
        if (selectedSnapshots.length !== 2) return;
        try {
            const res = await fetch(`/api/obe/archive/compare/${selectedSnapshots[0]}/${selectedSnapshots[1]}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCompareData(data);
            } else {
                alert(data.message || 'Comparison failed');
            }
        } catch (err) {
            alert('Comparison failed: ' + err.message);
        }
    };

    const handleView = async (id) => {
        try {
            const res = await fetch(`/api/obe/archive/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setViewData(data);
            } else {
                alert(data.message || 'Failed to load snapshot details');
            }
        } catch (err) {
            alert('Error loading snapshot: ' + err.message);
        }
    };

    const toggleSelection = (id) => {
        setSelectedSnapshots(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 2) return [prev[1], id];
            return [...prev, id];
        });
    };

    const filtered = snapshots.filter(s => 
        (s.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.snapshotLabel || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <Archive size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> OBE History & Archive
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Immutable snapshots of finalized OBE calculations.</p>
                </div>
                {selectedSnapshots.length === 2 && (
                    <button onClick={handleCompare} style={{ background: '#bc13fe', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                        <BarChart2 size={18} /> Compare Selected ({selectedSnapshots.length})
                    </button>
                )}
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '12px', top: '12px' }}/>
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search snapshots by course name, code, or label..." 
                        style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#0ff0fc', padding: '20px', textAlign: 'center' }}>Loading historical snapshots...</div>
            ) : error ? (
                <div style={{ color: '#ff1b6b', padding: '20px', textAlign: 'center', background: 'rgba(255,27,107,0.1)', borderRadius: '10px' }}>{error}</div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                    <Archive size={48} style={{ opacity: 0.2, marginBottom: '10px' }}/>
                    <p>No historical OBE snapshots found.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map(snap => (
                        <div key={snap._id} className="glass-panel-dash" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '10px', border: selectedSnapshots.includes(snap._id) ? '1px solid #bc13fe' : '1px solid rgba(255,255,255,0.05)', background: selectedSnapshots.includes(snap._id) ? 'rgba(188, 19, 254, 0.05)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedSnapshots.includes(snap._id)} 
                                    onChange={() => toggleSelection(snap._id)} 
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#bc13fe' }}
                                />
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {snap.courseCode} — {snap.courseName}
                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(15, 240, 252, 0.1)', color: '#0ff0fc', borderRadius: '4px' }}>v{snap.version}</span>
                                    </h4>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', gap: '16px' }}>
                                        <span>{snap.snapshotLabel}</span>
                                        <span>•</span>
                                        <span>Archived: {new Date(snap.archivedAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>By: {snap.archivedByName}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>CLO Avg</div>
                                        <div style={{ fontWeight: 'bold' }}>{snap.avgCloAchievement}%</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>PLO Avg</div>
                                        <div style={{ fontWeight: 'bold' }}>{snap.avgPloAchievement}%</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Pass Rate</div>
                                        <div style={{ fontWeight: 'bold' }}>{snap.passRate}%</div>
                                    </div>
                                </div>
                                <button onClick={() => handleView(snap._id)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Eye size={16} /> View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Snapshot Modal */}
            {viewData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div className="glass-panel-dash fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#fff' }}>Snapshot: {viewData.snapshotLabel}</h2>
                                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Immutable Record v{viewData.version} — Archived {new Date(viewData.archivedAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setViewData(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#0ff0fc' }}>Course Context</h4>
                                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div><strong>Course:</strong> {viewData.courseCode} - {viewData.courseName}</div>
                                    <div><strong>Program:</strong> {viewData.programName}</div>
                                    <div><strong>Teacher:</strong> {viewData.teacherName || 'N/A'}</div>
                                    <div><strong>Semester:</strong> {viewData.semesterName}</div>
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#bc13fe' }}>Aggregated Attainment</h4>
                                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div><strong>Total Students:</strong> {viewData.totalStudents}</div>
                                    <div><strong>CLO Average:</strong> {viewData.avgCloAchievement}% (Target: {viewData.cloTargetUsed}%)</div>
                                    <div><strong>PLO Average:</strong> {viewData.avgPloAchievement}% (Target: {viewData.ploTargetUsed}%)</div>
                                    <div><strong>Class Pass Rate:</strong> {viewData.passRate}%</div>
                                </div>
                            </div>
                        </div>

                        <h4 style={{ color: '#fff', marginBottom: '10px' }}>CLO Breakdown (Embedded Immutable Values)</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>CLO</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Target</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Achieved</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Gap</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewData.clos.map(c => (
                                    <tr key={c.cloId} style={{ color: '#fff', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '10px' }}>{c.code} - {c.name || 'Unnamed'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{c.target}%</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{c.achieved}%</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{c.gap}%</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', background: c.status === 'Met' ? 'rgba(80,204,127,0.1)' : 'rgba(255,27,107,0.1)', color: c.status === 'Met' ? '#50cc7f' : '#ff1b6b' }}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Compare Modal */}
            {compareData && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div className="glass-panel-dash fade-in" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, color: '#bc13fe' }}>Snapshot Comparison</h2>
                                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Comparing two historical records directly</p>
                            </div>
                            <button onClick={() => setCompareData(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', color: 'rgba(255,255,255,0.5)' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>v{compareData.snapshot1.version}: {compareData.snapshot1.label}</h4>
                                <div>CLO Avg: <span style={{color: '#fff', fontWeight: 'bold'}}>{compareData.summary.s1_avgClo}%</span></div>
                                <div>Pass Rate: <span style={{color: '#fff', fontWeight: 'bold'}}>{compareData.summary.s1_passRate}%</span></div>
                            </div>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <RefreshCw size={24} color="#0ff0fc" style={{ marginBottom: '10px' }} />
                                <div style={{ color: compareData.summary.diff_avgClo >= 0 ? '#50cc7f' : '#ff1b6b', fontWeight: 'bold' }}>
                                    CLO Diff: {compareData.summary.diff_avgClo >= 0 ? '+' : ''}{compareData.summary.diff_avgClo}%
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', color: 'rgba(255,255,255,0.5)' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>v{compareData.snapshot2.version}: {compareData.snapshot2.label}</h4>
                                <div>CLO Avg: <span style={{color: '#fff', fontWeight: 'bold'}}>{compareData.summary.s2_avgClo}%</span></div>
                                <div>Pass Rate: <span style={{color: '#fff', fontWeight: 'bold'}}>{compareData.summary.s2_passRate}%</span></div>
                            </div>
                        </div>

                        <h4 style={{ color: '#fff', marginBottom: '10px' }}>CLO Delta Analysis</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>CLO</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>S1 Achieved</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>S2 Achieved</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {compareData.cloComparison.map((c, i) => (
                                    <tr key={i} style={{ color: '#fff', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '10px' }}>{c.code}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{c.s1_achieved}%</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{c.s2_achieved}%</td>
                                        <td style={{ padding: '10px', textAlign: 'center', color: c.diff_achieved >= 0 ? '#50cc7f' : '#ff1b6b', fontWeight: 'bold' }}>
                                            {c.diff_achieved >= 0 ? '+' : ''}{c.diff_achieved}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObeHistory;
