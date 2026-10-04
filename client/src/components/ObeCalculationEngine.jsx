import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPEOs, fetchPLOs, fetchCLOs, fetchGAs, fetchTargets, updateTargets } from '../store/obeSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { Target, BookOpen, Layers, Award, TrendingUp, CheckCircle, RefreshCw, AlertTriangle, Settings, Save, Play, Archive, XCircle, Loader2, ShieldCheck } from 'lucide-react';

const CARD = ({ label, value, sub, color = '#0ff0fc', icon: Icon }) => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '12px', borderRadius: '10px', background: `rgba(${color === '#0ff0fc' ? '15,240,252' : color === '#bc13fe' ? '188,19,254' : color === '#50cc7f' ? '80,204,127' : '255,152,0'},0.12)` }}>
            <Icon size={22} color={color} />
        </div>
        <div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>{label}</p>
            <h3 style={{ margin: '3px 0 2px', color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{value}</h3>
            {sub && <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{sub}</p>}
        </div>
    </div>
);

const PCT_BAR = ({ label, value, target = 60, color }) => {
    const pct = Math.min(100, Math.round(value));
    const isAbove = pct >= target;
    return (
        <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: isAbove ? '#50cc7f' : '#ff9800', fontWeight: 700, fontSize: '0.85rem' }}>{pct}%</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
                <div style={{ height: '100%', borderRadius: '4px', width: `${pct}%`, background: isAbove ? 'linear-gradient(90deg,#50cc7f,#0ff0fc)' : 'linear-gradient(90deg,#ff9800,#ff1b6b)', transition: 'width 0.6s ease' }} />
                <div style={{ position: 'absolute', left: `${target}%`, top: '-3px', bottom: '-3px', width: '2px', background: 'rgba(255,255,255,0.5)' }} title={`Target: ${target}%`} />
            </div>
        </div>
    );
};

const ObeCalculationEngine = () => {
    const dispatch = useDispatch();
    const { peos, plos, clos, gas, targets, loading: obeLoading } = useSelector(s => s.obe);
    const courseofferings = useSelector(s => s.academic.records.courseofferings || []);
    const { user, token } = useSelector(s => s.auth);

    const [refreshKey, setRefreshKey] = useState(0);
    const [targetForm, setTargetForm] = useState({ cloTarget: 70, ploTarget: 70, gaTarget: 70, programTarget: 70, directWeight: 0.8, indirectWeight: 0.2 });
    const [selectedCourse, setSelectedCourse] = useState('');
    const [engineStatus, setEngineStatus] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        dispatch(fetchPEOs());
        dispatch(fetchPLOs());
        dispatch(fetchCLOs());
        dispatch(fetchGAs());
        dispatch(fetchTargets());
        dispatch(fetchAcademicData('courseofferings'));
    }, [dispatch, refreshKey]);

    useEffect(() => {
        if (targets && !Array.isArray(targets)) {
            setTargetForm({
                cloTarget: targets.cloTarget || 70,
                ploTarget: targets.ploTarget || 70,
                gaTarget: targets.gaTarget || 70,
                programTarget: targets.programTarget || 70,
                directWeight: targets.directWeight || 0.8,
                indirectWeight: targets.indirectWeight || 0.2
            });
        }
    }, [targets]);

    const handleTargetChange = (e) => setTargetForm({ ...targetForm, [e.target.name]: parseFloat(e.target.value) || 0 });

    const saveTargets = (e) => {
        e.preventDefault();
        dispatch(updateTargets(targetForm));
        setEngineStatus({ type: 'success', msg: 'OBE Global Targets updated successfully.' });
        setTimeout(() => setEngineStatus(null), 4000);
    };

    const runEngine = async (endpoint, actionName) => {
        if (!selectedCourse) return setEngineStatus({ type: 'error', msg: 'Please select a course offering first.' });
        setProcessing(true);
        setEngineStatus(null);
        try {
            const res = await fetch(`/api/obe/${endpoint}/${selectedCourse}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                setEngineStatus({ type: 'success', msg: `${actionName} completed successfully.` });
                setRefreshKey(k => k + 1);
            } else {
                setEngineStatus({ type: 'error', msg: data.message || `${actionName} failed.` });
            }
        } catch (err) {
            setEngineStatus({ type: 'error', msg: err.message });
        }
        setProcessing(false);
    };

    const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'UniversityAdmin' || user?.role === 'Dean';

    // Compute attainments from available data
    const cloWithAttain = (clos || []).filter(c => c.attainment != null || c.achieved != null);
    const avgCLO = cloWithAttain.length > 0 ? (cloWithAttain.reduce((s, c) => s + (c.attainment ?? c.achieved ?? 0), 0) / cloWithAttain.length).toFixed(1) : null;
    const ploWithAttain = (plos || []).filter(p => p.attainment != null || p.achieved != null);
    const avgPLO = ploWithAttain.length > 0 ? (ploWithAttain.reduce((s, p) => s + (p.attainment ?? p.achieved ?? 0), 0) / ploWithAttain.length).toFixed(1) : null;
    const gaWithAttain = (gas || []).filter(g => g.attainment != null || g.achieved != null);
    
    const targetMetrics = targets ? [
        { name: 'CLO Threshold', target: targets.cloTarget || 70, achieved: avgCLO ? parseFloat(avgCLO) : null },
        { name: 'PLO Threshold', target: targets.ploTarget || 70, achieved: avgPLO ? parseFloat(avgPLO) : null },
    ].filter(t => t.achieved !== null) : [];
    
    const targetsMet = targetMetrics.filter(t => (t.achieved ?? 0) >= (t.target ?? 60)).length;
    const targetsMissed = targetMetrics.filter(t => (t.achieved ?? 0) < (t.target ?? 60)).length;

    return (
        <div style={{ padding: '1.5rem 0' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', margin: 0 }}>
                        <Target color="#0ff0fc" /> OBE Calculation Engine
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.55)', margin: '4px 0 0' }}>Configure thresholds, execute live evaluations, and monitor outcome metrics.</p>
                </div>
                <button onClick={() => setRefreshKey(k => k + 1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </header>

            {engineStatus && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: engineStatus.type === 'success' ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.15)', border: `1px solid ${engineStatus.type === 'success' ? 'rgba(80,204,127,0.4)' : 'rgba(255,27,107,0.4)'}`, borderRadius: '10px', padding: '12px 16px', color: engineStatus.type === 'success' ? '#50cc7f' : '#ff1b6b', marginBottom: '1.5rem' }}>
                    {engineStatus.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {engineStatus.msg}
                </div>
            )}

            {/* Top Control Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* Engine Execution Panel */}
                <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                    <h3 style={{ color: '#bc13fe', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                        <Play size={18} /> Course Execution & Archiving
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                        Run the live OBE calculation for a course or permanently freeze its results into a snapshot.
                    </p>
                    <div style={{ marginBottom: '1.2rem' }}>
                        <select 
                            value={selectedCourse} 
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.9rem' }}
                        >
                            <option value="">— Select Course Offering —</option>
                            {courseofferings.map(co => (
                                <option key={co._id} value={co._id}>
                                    {co.course?.name || co.courseName} - {co.section?.name || 'Section'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button onClick={() => runEngine('calculate', 'Live Calculation')} disabled={processing || !selectedCourse}
                            style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 800, cursor: (processing || !selectedCourse) ? 'not-allowed' : 'pointer', opacity: (processing || !selectedCourse) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {processing ? <Loader2 size={16} className="spinner" /> : <Play size={16} />} Run Engine
                        </button>
                        <button onClick={() => { if (window.confirm("Freeze OBE results permanently?")) runEngine('archive', 'Snapshot'); }} disabled={processing || !selectedCourse}
                            style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#ff9800,#ff1b6b)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 800, cursor: (processing || !selectedCourse) ? 'not-allowed' : 'pointer', opacity: (processing || !selectedCourse) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {processing ? <Loader2 size={16} className="spinner" /> : <Archive size={16} />} Finalize Snapshot
                        </button>
                    </div>
                </div>

                {/* Global Settings Panel */}
                <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem', opacity: isAdmin ? 1 : 0.6 }}>
                    <h3 style={{ color: '#0ff0fc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                        <ShieldCheck size={18} /> Global OBE Thresholds
                    </h3>
                    <form onSubmit={saveTargets}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>CLO (%)</label>
                                <input type="number" name="cloTarget" value={targetForm.cloTarget} onChange={handleTargetChange} disabled={!isAdmin} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>PLO (%)</label>
                                <input type="number" name="ploTarget" value={targetForm.ploTarget} onChange={handleTargetChange} disabled={!isAdmin} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>GA (%)</label>
                                <input type="number" name="gaTarget" value={targetForm.gaTarget} onChange={handleTargetChange} disabled={!isAdmin} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Prog (%)</label>
                                <input type="number" name="programTarget" value={targetForm.programTarget} onChange={handleTargetChange} disabled={!isAdmin} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                        {isAdmin && (
                            <button type="submit" style={{ width: '100%', padding: '10px', background: 'rgba(80,204,127,0.15)', border: '1px solid #50cc7f', borderRadius: '8px', color: '#50cc7f', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={16} /> Save Configurations
                            </button>
                        )}
                    </form>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <CARD label="Total PEOs" value={(peos || []).length} color="#0ff0fc" icon={Award} />
                <CARD label="Total PLOs" value={(plos || []).length} color="#bc13fe" icon={Layers} />
                <CARD label="Total CLOs" value={(clos || []).length} color="#50cc7f" icon={BookOpen} />
                <CARD label="Total GAs" value={(gas || []).length} color="#ff9800" icon={TrendingUp} />
                {avgCLO !== null && <CARD label="Avg CLO Attainment" value={`${avgCLO}%`} color="#0ff0fc" icon={TrendingUp} />}
                {avgPLO !== null && <CARD label="Avg PLO Attainment" value={`${avgPLO}%`} color="#bc13fe" icon={TrendingUp} />}
                {gaWithAttain.length > 0 && <CARD label="Avg GA Attainment" value={`${(gaWithAttain.reduce((s,g) => s + (g.attainment ?? g.achieved ?? 0), 0) / gaWithAttain.length).toFixed(1)}%`} color="#ff9800" icon={TrendingUp} />}
            </div>

            {/* Data Visualization / Achievement Graphs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* CLO Attainment */}
                {cloWithAttain.length > 0 && (
                    <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#0ff0fc', margin: '0 0 1rem', fontSize: '1rem' }}>📊 CLO Achievement Overview</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                            {cloWithAttain.map((c, i) => (
                                <PCT_BAR key={i} label={c.code || c.name || `CLO-${i + 1}`} value={c.attainment ?? c.achieved ?? 0} target={targetForm.cloTarget} />
                            ))}
                        </div>
                    </div>
                )}

                {/* PLO Attainment */}
                {ploWithAttain.length > 0 && (
                    <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#bc13fe', margin: '0 0 1rem', fontSize: '1rem' }}>📈 PLO Achievement Overview</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                            {ploWithAttain.map((p, i) => (
                                <PCT_BAR key={i} label={p.code || p.name || `PLO-${i + 1}`} value={p.attainment ?? p.achieved ?? 0} target={targetForm.ploTarget} color="#bc13fe" />
                            ))}
                        </div>
                    </div>
                )}

                {/* GA Attainment */}
                {gaWithAttain.length > 0 && (
                    <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#ff9800', margin: '0 0 1rem', fontSize: '1rem' }}>🏆 Graduate Attributes (GA)</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                            {gaWithAttain.map((g, i) => (
                                <PCT_BAR key={i} label={g.code || g.name || `GA-${i + 1}`} value={g.attainment ?? g.achieved ?? 0} target={targetForm.gaTarget} color="#ff9800" />
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Threshold Tracker */}
                {targetMetrics.length > 0 && (
                    <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                        <h3 style={{ color: '#50cc7f', margin: '0 0 1rem', fontSize: '1rem' }}>🎯 Threshold Analysis</h3>
                        {targetMetrics.map((t, i) => (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{t.name}</span>
                                    <span style={{ fontWeight: 700, color: (t.achieved ?? 0) >= (t.target ?? 60) ? '#50cc7f' : '#ff9800', fontSize: '0.85rem' }}>
                                        {t.achieved ?? '—'}% (Target: {t.target}%)
                                    </span>
                                </div>
                                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
                                    <div style={{ height: '100%', borderRadius: '3px', width: `${Math.min(100, t.achieved ?? 0)}%`, background: (t.achieved ?? 0) >= (t.target ?? 60) ? '#50cc7f' : '#ff9800' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ObeCalculationEngine;
