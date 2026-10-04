import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQECDashboard } from '../store/qecSlice';
import { 
    ShieldCheck, CheckCircle, FileText, BarChart2, Activity, Target, AlertTriangle, List, 
    BookOpen, Award, FileBadge, PieChart, Users, Star, RefreshCw 
} from 'lucide-react';
import IndirectAssessment from './IndirectAssessment';
import '../style/Dashboard.css';

const QECManagement = () => {
    const dispatch = useDispatch();
    const { dashboardData, loading } = useSelector(state => state.qec);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        dispatch(fetchQECDashboard());
    }, [dispatch]);

    // Use actual data if available, fallback to 0/empty
    const kpis = dashboardData?.kpis || { pendingReviews: 0, approvedReviews: 0, accreditationProgress: '0%', programReviews: 0 };
    const compData = dashboardData?.compliance || [];
    const alerts = dashboardData?.alerts || [];

    const kpiData = [
        { label: 'Pending Reviews', value: kpis.pendingReviews, color: '#ffcc00', icon: <Activity size={20}/> },
        { label: 'Approved Reviews', value: kpis.approvedReviews, color: '#50cc7f', icon: <CheckCircle size={20}/> },
        { label: 'Accreditation Progress', value: kpis.accreditationProgress, color: '#0ff0fc', icon: <Award size={20}/> },
        { label: 'Program Reviews', value: kpis.programReviews, color: '#bc13fe', icon: <FileText size={20}/> },
    ];

    const complianceData = compData;

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <ShieldCheck size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> QEC Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Quality Enhancement Cell - Self Assessment & Compliance</p>
                </div>
            </div>

            <div className="tabs-wrapper" style={{ marginBottom: '1.5rem' }}>
                {[
                    { id: 'dashboard', label: '📊 Dashboard' },
                    { id: 'self_assessment', label: '📝 Self Assessment' },
                    { id: 'monitoring', label: '🔍 Quality Monitoring' },
                    { id: 'indirect_assessment', label: '📊 Indirect Assessment' },
                    { id: 'reports', label: '📈 QEC Reports' }
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={'tab-btn ' + (activeTab === t.id ? 'active' : '')}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading && activeTab === 'dashboard' ? <div style={{ color: '#0ff0fc', textAlign: 'center' }}>Loading Data...</div> : 
             activeTab === 'dashboard' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
                        {kpiData.map(k => (
                            <div key={k.label} style={{ background: k.color + '12', border: `1px solid ${k.color}30`, borderRadius: '14px', padding: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{k.label}</span>
                                    <span style={{ color: k.color }}>{k.icon}</span>
                                </div>
                                <div style={{ color: k.color, fontSize: '2rem', fontWeight: '800' }}>{k.value}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '14px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={18}/> Compliance Overview</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {complianceData.map(c => (
                                    <div key={c.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#fff' }}>{c.name}</span>
                                            <span style={{ color: c.color, fontWeight: 'bold' }}>{c.score}% ({c.status})</span>
                                        </div>
                                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${c.score}%`, background: c.color, height: '100%', borderRadius: '4px' }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel-dash" style={{ padding: '20px', borderRadius: '14px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={18}/> Pending Actions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {alerts.map((a, i) => (
                                    <div key={i} style={{ background: a.type === 'critical' ? 'rgba(255,27,107,0.1)' : 'rgba(255,204,0,0.1)', border: `1px solid ${a.type === 'critical' ? '#ff1b6b' : '#ffcc00'}30`, padding: '12px', borderRadius: '8px', color: a.type === 'critical' ? '#ff1b6b' : '#ffcc00', fontSize: '0.85rem' }}>
                                        <strong>{a.title}</strong><br/>{a.desc}
                                    </div>
                                ))}
                                {alerts.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>No critical alerts.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'self_assessment' && (
                <div className="fade-in glass-panel-dash" style={{ padding: '24px', borderRadius: '14px' }}>
                    <h3 style={{ margin: '0 0 20px', color: '#0ff0fc' }}>Self Assessment Reports (SAR)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '16px' }}>
                        {[
                            { title: 'SAR Forms Configuration', desc: 'Manage templates for Self Assessment.', icon: <List size={24} color="#bc13fe"/> },
                            { title: 'Program Review', desc: 'Conduct internal review of degree programs.', icon: <BookOpen size={24} color="#0ff0fc"/> },
                            { title: 'Department Review', desc: 'Assess department-level performance metrics.', icon: <Users size={24} color="#ffcc00"/> },
                            { title: 'Continuous Quality Improvement', desc: 'CQI tracking and loop closure records.', icon: <RefreshCw size={24} color="#50cc7f"/> }
                        ].map((card, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-lift">
                                <div style={{ marginBottom: '12px' }}>{card.icon}</div>
                                <h4 style={{ margin: '0 0 8px', color: '#fff' }}>{card.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'monitoring' && (
                <div className="fade-in glass-panel-dash" style={{ padding: '24px', borderRadius: '14px' }}>
                    <h3 style={{ margin: '0 0 20px', color: '#50cc7f' }}>Quality Monitoring Checks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {complianceData.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No monitoring data yet. Data will appear as course files, surveys and OBE records are populated.</p>}
                        {complianceData.map((m, i) => {
                            const badge = m.score >= 80 ? 'Passed' : m.score >= 60 ? 'Action Required' : 'Failed';
                            const badgeColor = m.score >= 80 ? '#50cc7f' : m.score >= 60 ? '#ff9800' : '#ff1b6b';
                            return (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: `1px solid ${badgeColor}30` }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 6px', color: '#fff' }}>{m.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Score: {m.score}% — {m.status}</p>
                                    </div>
                                    <span style={{ background: badgeColor + '15', color: badgeColor, padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{badge}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="fade-in glass-panel-dash" style={{ padding: '24px', borderRadius: '14px' }}>
                    <h3 style={{ margin: '0 0 20px', color: '#ffcc00' }}>QEC Reports Engine</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '16px' }}>
                        {[
                            { title: 'Quality Report', icon: <Star size={20}/> },
                            { title: 'Final SAR Report', icon: <FileText size={20}/> },
                            { title: 'Accreditation Readiness', icon: <FileBadge size={20}/> },
                            { title: 'University Compliance Report', icon: <ShieldCheck size={20}/> }
                        ].map((rep, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '10px', cursor: 'pointer' }} className="hover-lift">
                                <div style={{ color: '#0ff0fc' }}>{rep.icon}</div>
                                <span style={{ color: '#fff', fontSize: '0.95rem' }}>{rep.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'indirect_assessment' && (
                <IndirectAssessment />
            )}
        </div>
    );
};

export default QECManagement;
