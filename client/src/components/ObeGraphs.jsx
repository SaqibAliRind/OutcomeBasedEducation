import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { TrendingUp, BarChart2, Download } from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine
} from 'recharts';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// ── Tooltip Style ─────────────────────────────────────────────────────────────
const tooltipStyle = { backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' };

// ── Reusable chart wrappers ───────────────────────────────────────────────────
const TrendCard = ({ title, data, color, target }) => (
    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#fff' }}>{title}</h4>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Download size={14} /></button>
        </div>
        <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} stroke="transparent" />
                    <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} stroke="transparent" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <ReferenceLine y={target} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                    <Line type="monotone" dataKey="achieved" stroke={color} strokeWidth={3} dot={{ r: 4, fill: '#111827', stroke: color, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
);

const ObeGraphs = () => {
    const [viewLevel, setViewLevel] = useState('Institution');
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [loading, setLoading] = useState(true);
    const [obeData, setObeData] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API}/reports/obe`, { headers: hdrs })
            .then(res => setObeData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#bc13fe' }}>Loading Charts...</div>;

    // Use fetched PLO/CLO data or default arrays if empty
    const cloData = obeData?.cloAttainment?.length ? obeData.cloAttainment : [{name:'CLO-1', achieved:0, target:70}];
    const ploData = obeData?.targetVsAchieved?.length ? obeData.targetVsAchieved : [{name:'PLO-1', achieved:0, target:70}];
    
    // Convert gapAnalysis format for Recharts
    const gapTrend = obeData?.gapAnalysis?.length ? obeData.gapAnalysis.map(g => ({
        name: g.name,
        PLO: -Math.abs(g.gap || 0)
    })) : [{name:'No Data', PLO:0}];

    const targetVsAchieved = [
        { name: 'CLO Avg', target: 70, achieved: obeData?.avgCloAchievement || 0 },
        { name: 'PLO Avg', target: 70, achieved: obeData?.avgPloAchievement || 0 }
    ];

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <TrendingUp size={28} color="#bc13fe" style={{ filter: 'drop-shadow(0 0 8px #bc13fe)' }} /> OBE Analytics & Trends
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Visualizations of outcome attainment over time based on actual assessment data.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={viewLevel} onChange={(e) => setViewLevel(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}>
                        <option>Institution Level</option>
                        <option>Program Level</option>
                        <option>Department Level</option>
                    </select>
                    <button className="primary-btn">
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Top Row: Core Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <TrendCard title="CLO Attainment vs Target" data={cloData} color="#0ff0fc" target={70} />
                <TrendCard title="PLO Attainment vs Target" data={ploData} color="#bc13fe" target={70} />
            </div>

            {/* Middle Row: Comparison & Gaps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Target vs Achieved Bar Chart */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: '#fff' }}>Overall Target vs Achieved (Averages)</h4>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={targetVsAchieved} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                                <Bar dataKey="target" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} name="Target Limit" />
                                <Bar dataKey="achieved" fill="#50cc7f" radius={[4, 4, 0, 0]} name="Actual Attainment" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gap Analysis Bar Chart (Negative) */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: '#fff' }}>Attainment Gaps (Negative)</h4>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gapTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <ReferenceLine y={0} stroke="#fff" />
                                <Bar dataKey="PLO" fill="#ff1b6b" radius={[0, 0, 4, 4]} name="PLO Gap" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ObeGraphs;
