import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Target, Save, Building2, BookOpen, GraduationCap, Briefcase, RefreshCw, PlusCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchTargets, updateTargets } from '../store/obeSlice';
import '../style/UniversityAdminDashboard.css';

const TargetsManagement = () => {
    const dispatch = useDispatch();
    const { targets: reduxTargets, loading } = useSelector(state => state.obe);
    
    const [activeTab, setActiveTab] = useState('global');
    const [localTargets, setLocalTargets] = useState({
        cloTarget: 70,
        ploTarget: 70,
        gaTarget: 70,
        programTarget: 70,
        departmentTarget: 70
    });

    useEffect(() => {
        dispatch(fetchTargets());
    }, [dispatch]);

    useEffect(() => {
        if (reduxTargets) {
            setLocalTargets({
                cloTarget: reduxTargets.cloTarget || 70,
                ploTarget: reduxTargets.ploTarget || 70,
                gaTarget: reduxTargets.gaTarget || 70,
                programTarget: reduxTargets.programTarget || 70,
                departmentTarget: reduxTargets.departmentTarget || 70
            });
        }
    }, [reduxTargets]);
    
    const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' };

    const handleTargetChange = (key, newValue) => {
        setLocalTargets(prev => ({ ...prev, [key]: Number(newValue) }));
    };

    const handleSave = () => {
        dispatch(updateTargets(localTargets));
    };

    const renderTabButton = (id, label, icon) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{ padding: '10px 16px', background: activeTab === id ? 'rgba(255,152,0,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === id ? '#ff9800' : 'transparent'}`, borderRadius: '8px', color: activeTab === id ? '#ff9800' : 'rgba(255,255,255,0.6)', fontWeight: activeTab === id ? '600' : '400', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
        >
            {icon} {label}
        </button>
    );

    const targetFields = [
        { key: 'cloTarget', type: 'CLO Target', description: 'Minimum threshold for Course Learning Outcomes.' },
        { key: 'ploTarget', type: 'PLO Target', description: 'Minimum threshold for Program Learning Outcomes.' },
        { key: 'gaTarget', type: 'GA Target', description: 'Minimum threshold for Graduate Attributes.' },
        { key: 'programTarget', type: 'Program Target', description: 'Minimum threshold for Program performance.' },
        { key: 'departmentTarget', type: 'Department Target', description: 'Minimum threshold for Department performance.' }
    ];

    if (loading && !reduxTargets) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#ff9800' }}><Loader2 className="spin" size={32} /></div>;
    }

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <Target size={28} color="#ff9800" style={{ filter: 'drop-shadow(0 0 8px #ff9800)' }} /> Target Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Define and monitor outcome thresholds at every organizational level.</p>
                </div>
                <button className="primary-btn" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Save All Targets
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '8px' }}>
                {renderTabButton('global', 'Global/Base Targets', <Target size={18} />)}
                {renderTabButton('dept', 'Department Target', <Building2 size={18} />)}
                {renderTabButton('prog', 'Program Target', <GraduationCap size={18} />)}
                {renderTabButton('course', 'Course Target', <BookOpen size={18} />)}
            </div>

            {/* Global Targets Tab */}
            {activeTab === 'global' && (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#fff', fontSize: '1.2rem' }}>Global Outcome Thresholds</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {targetFields.map(t => (
                            <div key={t.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '12px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ff9800' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem' }}>{t.type}</div>
                                    <div style={{ background: 'rgba(255,152,0,0.1)', color: '#ff9800', padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>{localTargets[t.key]}%</div>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.5rem', minHeight: '40px' }}>{t.description}</p>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '500' }}>Adjust Target (%)</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="range" min="0" max="100" value={localTargets[t.key]} onChange={e => handleTargetChange(t.key, e.target.value)} style={{ flex: 1, accentColor: '#ff9800' }} />
                                        <input type="number" min="0" max="100" value={localTargets[t.key]} onChange={e => handleTargetChange(t.key, e.target.value)} style={{ ...inputStyle, width: '70px', padding: '6px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Other Override Tabs (Mock UI) */}
            {['dept', 'prog', 'course'].includes(activeTab) && (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Target Overrides</h3>
                        <button style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
                            <PlusCircle size={14} /> Add Override
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem' }}>
                        <select style={{ ...inputStyle, width: '250px' }}>
                            <option>Select {activeTab === 'dept' ? 'Department' : activeTab === 'prog' ? 'Program' : 'Course'}</option>
                        </select>
                        <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Load Existing Targets</button>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Outcome Type</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Base Target</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Overridden Target</th>
                                <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {targetFields.map(t => (
                                <tr key={t.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px', color: '#ff9800', fontWeight: '600' }}>{t.type}</td>
                                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>{localTargets[t.key]}%</td>
                                    <td style={{ padding: '12px' }}>
                                        <input type="number" defaultValue={localTargets[t.key]} style={{ ...inputStyle, width: '80px', padding: '6px' }} />
                                    </td>
                                    <td style={{ padding: '12px', color: 'rgba(255,255,255,0.5)' }}>Inherited</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TargetsManagement;
