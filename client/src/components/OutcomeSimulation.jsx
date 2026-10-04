import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { BrainCircuit, ArrowRight, TrendingUp, Sparkles, Calculator, RefreshCw } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const OutcomeSimulation = () => {
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [scenario, setScenario] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [obeData, setObeData] = useState(null);
    const [selectedClo, setSelectedClo] = useState('');

    useEffect(() => {
        axios.get(`${API}/reports/obe`, { headers: hdrs })
            .then(res => setObeData(res.data))
            .catch(console.error);
    }, [token]);

    const inputStyle = { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' };

    const runSimulation = () => {
        setIsSimulating(true);
        // Log AI usage to backend
        axios.post(`${API}/reports/ai-usage`, { queryType: 'Simulation', prompt: scenario }, { headers: hdrs })
            .then(() => {
                const targetObj = obeData?.cloAttainment?.find(c => c.name === selectedClo) || { achieved: 60 };
                const current = targetObj.achieved;
                
                // Deterministic mock improvement based on text length instead of Math.random
                let improvement = 0;
                const lowerScenario = scenario.toLowerCase();
                if (lowerScenario.includes('increase') || lowerScenario.includes('improve') || lowerScenario.includes('better')) {
                    improvement = (scenario.length % 8) + 2; // 2 to 9 percent
                } else if (lowerScenario.includes('decrease') || lowerScenario.includes('drop')) {
                    improvement = -((scenario.length % 5) + 1);
                } else {
                    improvement = (scenario.length % 3);
                }

                const expected = Math.min(100, Math.max(0, current + improvement));
                
                const simResult = {
                    id: Date.now(),
                    current,
                    expected,
                    improvement,
                    target: selectedClo || 'CLO-1',
                    scenario
                };
                
                setResult(simResult);
                setHistory([simResult, ...history].slice(0, 5));
            })
            .catch(console.error)
            .finally(() => setIsSimulating(false));
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <BrainCircuit size={28} color="#bc13fe" style={{ filter: 'drop-shadow(0 0 8px #bc13fe)' }} /> AI Outcome Simulation (Mock)
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Run predictive AI models to see how assessment changes impact outcome achievements.</p>
                </div>
            </div>
            
            <div style={{ padding: '12px 16px', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '8px', marginBottom: '1.5rem', color: '#ff9800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <strong>Note:</strong> This is a non-official mock simulation. Official OBE results always use real database-backed attainment calculations.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Simulator Engine */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', background: 'radial-gradient(circle, rgba(188,19,254,0.1) 0%, transparent 70%)', width: '200px', height: '200px', borderRadius: '50%' }}></div>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} color="#bc13fe" /> Scenario Input</h3>
                    
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem' }}>
                        <select style={{...inputStyle, width: '300px'}} value={selectedClo} onChange={e => setSelectedClo(e.target.value)}>
                            <option value="">Select Target CLO</option>
                            {obeData?.cloAttainment?.map(c => (
                                <option key={c.name} value={c.name}>{c.name} ({c.achieved}%)</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <textarea 
                            value={scenario}
                            onChange={e => setScenario(e.target.value)}
                            placeholder="e.g. Agar Mid exam me 5 marks average increase ho jaye to CLO kitna improve hoga?"
                            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                        ></textarea>
                    </div>

                    <button onClick={runSimulation} disabled={isSimulating || !scenario || !selectedClo} className="primary-btn">
                        {isSimulating ? <RefreshCw size={18} className="spin" /> : <Calculator size={18} />}
                        {isSimulating ? 'Running AI Model...' : 'Simulate Outcome Impact'}
                    </button>

                    {result && !isSimulating && (
                        <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(80,204,127,0.3)', borderRadius: '12px', padding: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#50cc7f', fontSize: '1.1rem' }}>Simulation Results for {result.target}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '8px' }}>Current Achievement</div>
                                    <div style={{ color: '#fff', fontSize: '2rem', fontWeight: '700' }}>{result.current}%</div>
                                </div>
                                <ArrowRight size={32} color="rgba(255,255,255,0.2)" />
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '8px' }}>Expected Achievement</div>
                                    <div style={{ color: '#0ff0fc', fontSize: '2rem', fontWeight: '700' }}>{result.expected}%</div>
                                </div>
                                <ArrowRight size={32} color="rgba(255,255,255,0.2)" />
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '8px' }}>Improvement</div>
                                    <div style={{ color: '#50cc7f', fontSize: '2rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><TrendingUp size={24} /> +{result.improvement}%</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* History */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>Recent Simulations</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                        {history.length === 0 ? (
                            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem 0' }}>No recent simulations</div>
                        ) : history.map(sim => (
                            <div key={sim.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: '8px', fontStyle: 'italic' }}>"{sim.scenario}"</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#bc13fe', fontWeight: '600', fontSize: '0.8rem' }}>{sim.target}</span>
                                    <span style={{ color: '#50cc7f', fontWeight: '600', fontSize: '0.9rem' }}>+{sim.improvement}% Imp.</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default OutcomeSimulation;
