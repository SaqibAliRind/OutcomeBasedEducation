import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TrendingDown, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import axios from 'axios';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const GapAnalysis = () => {
    const { token } = useSelector(s => s.auth);
    const [gaps, setGaps] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(false);

    const fetchGaps = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/reports/obe`, { headers: { Authorization: `Bearer ${token}` } });
            const gapData = (data.gapAnalysis || []).map(g => ({
                name: g.name,
                gap: parseFloat((-g.gap).toFixed(1)),   // gap = achieved - target
                expected: g.expected,
                actual: g.actual,
                severity: g.gap > 10 ? 'Critical' : g.gap > 0 ? 'Moderate' : 'Good'
            }));
            setGaps(gapData);
        } catch (err) {
            console.error('Gap fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchGaps(); }, [fetchGaps]);

    const filtered = filterType === 'all' ? gaps : gaps.filter(g => g.severity.toLowerCase() === filterType);

    const criticalCount = gaps.filter(g => g.severity === 'Critical').length;
    const moderateCount = gaps.filter(g => g.severity === 'Moderate').length;
    const goodCount = gaps.filter(g => g.severity === 'Good').length;

    const MetricCard = ({ title, value, icon, color }) => (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px', color }}>{icon}</div>
            <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>{title}</div>
                <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>{value}</div>
            </div>
        </div>
    );

    const chartData = filtered.map(g => ({ name: g.name, Gap: g.gap }));

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <TrendingDown size={28} color="#e91e63" style={{ filter: 'drop-shadow(0 0 8px #e91e63)' }} /> Gap Analysis
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>
                        Real-time gap between configured targets and actual PLO attainment.
                    </p>
                </div>
                <button onClick={fetchGaps} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <MetricCard title="Critical Gaps" value={criticalCount} icon={<AlertTriangle size={24} />} color="#ff1b6b" />
                <MetricCard title="Moderate Gaps" value={moderateCount} icon={<AlertCircle size={24} />} color="#ff9800" />
                <MetricCard title="Good / Met" value={goodCount} icon={<CheckCircle2 size={24} />} color="#50cc7f" />
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={36} className="spinner" color="#e91e63" />
                </div>
            ) : gaps.length === 0 ? (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    <TrendingDown size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.5)' }}>No Gap Data Yet</h3>
                    <p style={{ margin: 0 }}>Run the <strong style={{ color: '#0ff0fc' }}>Calculate OBE</strong> engine in Marks Management first.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Chart */}
                    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>PLO Gap Chart (Positive = Below Target)</h3>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.4)" 
                                        tick={{ fill: 'rgba(255,255,255,0.5)' }} 
                                        unit="%" 
                                        domain={[dataMin => Math.min(0, dataMin), dataMax => Math.max(0, dataMax)]} 
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => [`${v}%`, 'Gap']} />
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
                                    <Bar dataKey="Gap" radius={[0, 0, 4, 4]} fill="#e91e63" baseValue={0} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Detailed Outcome Gaps</h3>
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                                <option value="all">All Outcomes</option>
                                <option value="critical">Critical</option>
                                <option value="moderate">Moderate</option>
                                <option value="good">Good</option>
                            </select>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Outcome</th>
                                    <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Target</th>
                                    <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Achieved</th>
                                    <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Severity</th>
                                    <th style={{ padding: '12px', color: 'rgba(255,255,255,0.7)' }}>Gap</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '12px', color: '#0ff0fc', fontWeight: '700' }}>{row.name}</td>
                                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.6)' }}>{row.expected}%</td>
                                        <td style={{ padding: '12px', color: '#fff', fontWeight: '600' }}>{row.actual}%</td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                background: row.severity === 'Critical' ? 'rgba(255,27,107,0.1)' : row.severity === 'Moderate' ? 'rgba(255,152,0,0.1)' : 'rgba(80,204,127,0.1)',
                                                color: row.severity === 'Critical' ? '#ff1b6b' : row.severity === 'Moderate' ? '#ff9800' : '#50cc7f',
                                                padding: '4px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem'
                                            }}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: row.gap > 0 ? '#ff1b6b' : '#50cc7f', fontWeight: '700' }}>
                                            {row.gap > 0 ? '+' : ''}{row.gap}%
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

export default GapAnalysis;
