import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Target, Activity, Building2, BookOpen, GraduationCap, School, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from 'recharts';
import axios from 'axios';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const StatCard = ({ label, value, color, suffix = '%' }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`, borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color }}>{value}{suffix}</div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
    </div>
);

const TargetVsAchieved = () => {
    const { token } = useSelector(s => s.auth);
    const [activeTab, setActiveTab] = useState('plo');
    const [obeData, setObeData] = useState(null);
    const [loading, setLoading] = useState(false);

    const hdrs = { Authorization: `Bearer ${token}` };

    const fetchObeData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/reports/obe`, { headers: hdrs });
            setObeData(data);
        } catch (err) {
            console.error('OBE fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchObeData(); }, [fetchObeData]);

    const chartData = activeTab === 'plo'
        ? (obeData?.ploAttainment || []).map(p => ({ name: p.name, Achieved: p.achieved, Target: p.target }))
        : activeTab === 'ga'
            ? (obeData?.gaAttainment || []).map(g => ({ name: g.name, Achieved: g.achieved, Target: g.target }))
            : (obeData?.cloAttainment || []).map(c => ({ name: c.name, Achieved: c.achieved, Target: c.target }));

    const tableData = activeTab === 'plo' ? (obeData?.ploAttainment || []) : activeTab === 'ga' ? (obeData?.gaAttainment || []) : (obeData?.cloAttainment || []);

    const noData = !loading && (!obeData || tableData.length === 0);

    const renderTabButton = (id, label, icon) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '10px 16px',
                background: activeTab === id ? 'rgba(33,150,243,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeTab === id ? '#2196f3' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', color: activeTab === id ? '#2196f3' : 'rgba(255,255,255,0.6)',
                fontWeight: activeTab === id ? '600' : '400', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <Activity size={28} color="#2196f3" style={{ filter: 'drop-shadow(0 0 8px #2196f3)' }} /> Target vs Achieved
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>
                        Real OBE attainment compared against configured targets.
                    </p>
                </div>
                <button onClick={fetchObeData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Summary Stats */}
            {obeData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <StatCard label="Avg CLO Attainment" value={obeData.avgCloAchievement} color="#0ff0fc" />
                    <StatCard label="Avg PLO Attainment" value={obeData.avgPloAchievement} color="#bc13fe" />
                    <StatCard label="Avg GA Attainment" value={obeData.avgGaAchievement ?? 0} color="#f59e0b" />
                    <StatCard label="Students Assessed" value={obeData.totalStudentsAssessed} color="#50cc7f" suffix="" />
                    <StatCard label="PLOs Tracked" value={(obeData.ploAttainment || []).length} color="#f59e0b" suffix="" />
                    <StatCard label="CLOs Tracked" value={(obeData.cloAttainment || []).length} color="#2196f3" suffix="" />
                    <StatCard label="GAs Tracked" value={(obeData.gaAttainment || []).length} color="#50cc7f" suffix="" />
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                {renderTabButton('plo', 'PLO View', <GraduationCap size={16} />)}
                {renderTabButton('clo', 'CLO View', <BookOpen size={16} />)}
                {renderTabButton('ga', 'GA View', <School size={16} />)}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={36} className="spinner" color="#2196f3" />
                </div>
            ) : noData ? (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    <Target size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.5)' }}>No OBE Data Yet</h3>
                    <p style={{ margin: 0 }}>Submit marks in the Marks Management page and click <strong style={{ color: '#0ff0fc' }}>Calculate OBE</strong> to generate attainment data.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Chart */}
                    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>
                            {activeTab === 'plo' ? 'PLO' : activeTab === 'ga' ? 'GA' : 'CLO'} Attainment vs Target
                        </h3>
                        <div style={{ height: '340px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.5)' }} domain={[0, 100]} unit="%" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        formatter={(value) => [`${value}%`]}
                                    />
                                    <Legend />
                                    <Bar dataKey="Achieved" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.Achieved >= entry.Target ? '#50cc7f' : '#ff1b6b'} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="Target" fill="rgba(255,152,0,0.5)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>Detailed Breakdown</h3>
                        <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#0d1117' }}>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>Code</th>
                                        <th style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>Target</th>
                                        <th style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>Achieved</th>
                                        <th style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>Gap</th>
                                        <th style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'left' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row, i) => {
                                        const diff = parseFloat((row.achieved - row.target).toFixed(1));
                                        const met = diff >= 0;
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '10px', color: '#0ff0fc', fontWeight: '700' }}>{row.name}</td>
                                                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.6)' }}>{row.target}%</td>
                                                <td style={{ padding: '10px', color: '#fff', fontWeight: '600' }}>{row.achieved}%</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={{ background: met ? 'rgba(80,204,127,0.1)' : 'rgba(255,27,107,0.1)', color: met ? '#50cc7f' : '#ff1b6b', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem' }}>
                                                        {met ? '+' : ''}{diff}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: met ? '#50cc7f' : '#ff1b6b', fontSize: '0.8rem' }}>
                                                        {met ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                        {met ? 'Met' : 'Not Met'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TargetVsAchieved;
