import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemReports, logAiUsage } from '../../store/reportsSlice';
import { 
    Building2, Users, LogIn, HardDrive, 
    History, Activity, AlertTriangle, Cpu, Download, Loader2, RefreshCw
} from 'lucide-react';

const ReportsPanel = () => {
    const dispatch = useDispatch();
    const { data: reportsData, loading, error } = useSelector((state) => state.reports);

    useEffect(() => {
        dispatch(fetchSystemReports());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(fetchSystemReports());
    };

    const handleDownload = () => {
        alert('Generating report PDF...');
    };

    const handleSimulateAi = () => {
        dispatch(logAiUsage({ queryType: 'Simulated', prompt: 'Generating test AI query' }))
            .then(() => dispatch(fetchSystemReports()));
    };

    const reports = [
        { title: 'Total Universities', value: reportsData?.totalUniversities || 0, icon: Building2, color: '#ffcc00' },
        { title: 'Total Users', value: reportsData?.totalUsers || 0, icon: Users, color: '#0ff0fc' },
        { title: 'Total Logins', value: reportsData?.totalLogins || 0, desc: 'Current Active', icon: LogIn, color: '#50cc7f' },
        { title: 'Storage Usage', value: reportsData?.storageUsage || '0%', desc: `DB Size: ${reportsData?.dbSize || '0MB'}`, icon: HardDrive, color: '#bc13fe' },
        { title: 'Backup History', value: reportsData?.backupStatus || 'No Backup', icon: History, color: '#45caff' },
        { title: 'API Usage', value: reportsData?.apiUsage || 'Checking...', icon: Activity, color: '#ff9a9e' },
        { title: 'Error Report', value: reportsData?.errorReport || 0, desc: 'Logged Errors', icon: AlertTriangle, color: '#ff1b6b' },
        { title: 'AI Usage Report', value: reportsData?.aiUsageReport || 0, desc: 'Queries Processed', icon: Cpu, color: '#0ff0fc' }, 
    ];

    return (
        <div className="glass-panel-dash" style={{ padding: '2rem', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0ff0fc', fontSize: '1.6rem' }}>System Reports</h2>
                    <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        Comprehensive view of system analytics and usage statistics
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={handleSimulateAi}
                        className="cancel-btn" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(15, 240, 252, 0.1)', color: '#0ff0fc', border: '1px solid rgba(15, 240, 252, 0.3)' }}>
                        <Cpu size={16} /> Simulate AI Hit
                    </button>
                    <button 
                        onClick={handleRefresh}
                        className="cancel-btn" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                        <RefreshCw size={16} className={loading ? "spinner" : ""} /> Refresh
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="primary-btn" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Download size={16} /> Export Report
                    </button>
                </div>
            </div>

            {error && (
                <div className="um-alert error" style={{ marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {loading && !reportsData ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <Loader2 size={40} className="spinner-large" />
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {reports.map((report, idx) => {
                        const Icon = report.icon;
                        return (
                            <div key={idx} style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: '12px', 
                                padding: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.2rem',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ 
                                    background: `${report.color}15`, 
                                    padding: '15px', 
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <Icon size={28} color={report.color} style={{ filter: `drop-shadow(0 0 8px ${report.color}80)` }} />
                                </div>
                                <div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>
                                        {report.title}
                                    </div>
                                    <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold' }}>
                                        {report.value}
                                    </div>
                                    {report.desc && (
                                        <div style={{ color: report.color, fontSize: '0.8rem', marginTop: '6px', fontWeight: '500' }}>
                                            {report.desc}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReportsPanel;
