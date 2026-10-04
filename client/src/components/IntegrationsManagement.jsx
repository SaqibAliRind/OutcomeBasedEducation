import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, testSmtp, testCloudinary } from '../store/settingsSlice';
import {
    Link2, CheckCircle, Clock, ToggleLeft, ToggleRight,
    Cloud, Mail, FileText, Table, MessageSquare, Video, BookOpen,
    Layers, Phone, ExternalLink, AlertCircle
} from 'lucide-react';
import '../style/Dashboard.css';

const FUTURE_INTEGRATIONS = [
    { id: 'gc', label: 'Google Classroom', icon: BookOpen, color: '#4285f4', desc: 'Sync courses, assignments and grades with Google Classroom.' },
    { id: 'teams', label: 'Microsoft Teams', icon: Video, color: '#5059c9', desc: 'Schedule and join class meetings directly from the ERP.' },
    { id: 'zoom', label: 'Zoom', icon: Video, color: '#2d8cff', desc: 'One-click Zoom meeting links for virtual lectures.' },
    { id: 'moodle', label: 'Moodle LMS', icon: Layers, color: '#f98012', desc: 'Bi-directional sync with Moodle for course content and grades.' },
    { id: 'lms', label: 'Generic LMS', icon: BookOpen, color: '#bc13fe', desc: 'Connect any SCORM-compatible LMS via standard API.' },
    { id: 'wa', label: 'WhatsApp', icon: MessageSquare, color: '#25d366', desc: 'Send attendance alerts, results, and announcements via WhatsApp.' },
    { id: 'sms', label: 'SMS Gateway', icon: Phone, color: '#ffcc00', desc: 'Send OTPs and emergency notifications via SMS.' },
];

const IntegrationsManagement = () => {
    const dispatch = useDispatch();
    const { config: settings, loading: settingsLoading, smtpTestResult, cloudinaryTestResult } = useSelector(s => s.settings);

    const [expandedId, setExpandedId] = useState(null);
    const [testing, setTesting] = useState(null);
    const [testResults, setTestResults] = useState({});

    useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

    const handleTestSmtp = async () => {
        if (!settings?.smtp) return;
        setTesting('smtp');
        const result = await dispatch(testSmtp(settings.smtp));
        setTesting(null);
        setTestResults(prev => ({ ...prev, smtp: result.error ? { success: false, msg: result.payload?.message || 'Test failed' } : { success: true, msg: result.payload } }));
    };

    const handleTestCloudinary = async () => {
        if (!settings?.cloudinary) return;
        setTesting('cloudinary');
        const result = await dispatch(testCloudinary(settings.cloudinary));
        setTesting(null);
        setTestResults(prev => ({ ...prev, cloudinary: result.error ? { success: false, msg: result.payload?.message || 'Test failed' } : { success: true, msg: result.payload } }));
    };

    const CURRENT_INTEGRATIONS = [
        {
            id: 'cloudinary', label: 'Cloudinary', desc: 'Cloud-based image & file storage for uploads.', icon: Cloud, color: '#3448c5',
            statusOk: !!settings?.cloudinary?.cloudName || settings?._envCloudinaryConfigured,
            fields: [
                { name: 'Cloud Name', value: settings?.cloudinary?.cloudName || (settings?._envCloudinaryConfigured ? 'Set via .env' : 'Not set') },
                { name: 'API Key', value: settings?.cloudinary?.apiKey ? '••••••••' + settings.cloudinary.apiKey.slice(-4) : (settings?._envCloudinaryConfigured ? '•••••••• (env)' : 'Not set') },
            ],
            onTest: handleTestCloudinary, testKey: 'cloudinary'
        },
        {
            id: 'smtp', label: 'Email (SMTP)', desc: 'Automated email delivery for notifications and alerts.', icon: Mail, color: '#0ff0fc',
            statusOk: !!settings?.smtp?.email || settings?._envSmtpConfigured,
            fields: [
                { name: 'SMTP Host', value: settings?.smtp?.host || (settings?._envSmtpConfigured ? 'Set via .env' : 'Not set') },
                { name: 'Port', value: settings?.smtp?.port || (settings?._envSmtpConfigured ? 'Set via .env' : '—') },
                { name: 'Sender Email', value: settings?.smtp?.email || (settings?._envSmtpConfigured ? 'Set via .env' : 'Not set') },
            ],
            onTest: handleTestSmtp, testKey: 'smtp'
        },
        {
            id: 'pdf', label: 'PDF Generator', desc: 'Server-side PDF generation via Puppeteer.', icon: FileText, color: '#ff1b6b',
            statusOk: true, fields: [{ name: 'Engine', value: 'Puppeteer' }, { name: 'Version', value: 'v21.0' }], onTest: null
        },
        {
            id: 'excel', label: 'Excel Export', desc: 'Export data in Excel format using SheetJS.', icon: Table, color: '#1d6f42',
            statusOk: true, fields: [{ name: 'Library', value: 'SheetJS (xlsx)' }, { name: 'Version', value: 'v0.18' }], onTest: null
        },
    ];

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link2 size={28} color="#0ff0fc" />
                    Integrations
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Manage active service connections. Configuration is done in Super Admin System Settings.
                </p>
            </div>

            <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>
                Active Integrations {settingsLoading && <span style={{ color: '#0ff0fc', fontSize: '0.75rem' }}> (loading...)</span>}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
                {CURRENT_INTEGRATIONS.map(intg => (
                    <div key={intg.id} className="glass-panel-dash" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === intg.id ? null : intg.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${intg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <intg.icon size={24} color={intg.color} />
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{intg.label}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '2px' }}>{intg.desc}</div>
                                </div>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0, background: intg.statusOk ? 'rgba(80,204,127,0.15)' : 'rgba(255,204,0,0.15)', color: intg.statusOk ? '#50cc7f' : '#ffcc00' }}>
                                {intg.statusOk ? 'Connected' : 'Not Configured'}
                            </span>
                        </div>

                        {expandedId === intg.id && (
                            <div className="fade-in" style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px', marginBottom: '16px' }}>
                                    {intg.fields.map(f => (
                                        <div key={f.name} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>{f.name}</div>
                                            <div style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.9rem' }}>{f.value}</div>
                                        </div>
                                    ))}
                                </div>
                                {intg.onTest && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button onClick={intg.onTest} disabled={testing === intg.testKey} style={{ padding: '8px 16px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', color: '#0ff0fc', borderRadius: '8px', cursor: testing === intg.testKey ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {testing === intg.testKey ? <><Clock size={14} /> Testing...</> : <>Test Connection</>}
                                        </button>
                                        {testResults[intg.testKey] && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: testResults[intg.testKey].success ? '#50cc7f' : '#ff1b6b', fontSize: '0.85rem' }}>
                                                {testResults[intg.testKey].success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                {testResults[intg.testKey].msg}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!intg.onTest && (
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>This integration runs server-side. No external connection test needed.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 16px' }}>Upcoming Integrations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {FUTURE_INTEGRATIONS.map(intg => (
                    <div key={intg.id} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.7, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', background: 'rgba(255,204,0,0.15)', color: '#ffcc00', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>COMING SOON</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${intg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <intg.icon size={22} color={intg.color} />
                            </div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{intg.label}</div>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0 0 16px' }}>{intg.desc}</p>
                        <button disabled style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <ExternalLink size={14} /> Request Early Access
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IntegrationsManagement;
