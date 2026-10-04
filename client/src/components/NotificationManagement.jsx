import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchAdminNotifications, 
    sendNotification, 
    cancelNotification, 
    resendNotification,
    clearNotificationMessages 
} from '../store/notificationSlice';
import { 
    Bell, Send, Clock, XCircle, CheckCircle2, AlertTriangle, 
    Mail, Smartphone, MessageSquare, Plus, Trash2, Calendar
} from 'lucide-react';

const NOTIFICATION_TYPES = [
    'Assignment Deadline', 'Quiz Reminder', 'Mid Reminder', 'Final Reminder', 
    'Attendance Warning', 'Result Published', 'Registration Reminder', 
    'Course Registration', 'Semester Registration', 'Academic Calendar Updates', 
    'Holiday Notice', 'Event Announcement', 'Workshop Announcement', 
    'Survey Reminder', 'Accreditation Notice'
];

const AUDIENCES = [
    'All Users', 'Students', 'Teachers', 'HODs', 'Program Coordinators', 
    'Departments', 'Programs', 'Sections', 'Individual User'
];

const CHANNELS = [
    { id: 'In-App', icon: <Bell size={14}/>, color: '#0ff0fc' },
    { id: 'Email', icon: <Mail size={14}/>, color: '#bc13fe' },
    { id: 'SMS', icon: <Smartphone size={14}/>, color: '#ff9800' },
    { id: 'WhatsApp', icon: <MessageSquare size={14}/>, color: '#50cc7f' },
    { id: 'Push', icon: <Bell size={14}/>, color: '#ff1b6b' }
];

const statusColor = s => s === 'Sent' ? '#50cc7f' : s === 'Pending' ? '#ffcc00' : s === 'Failed' ? '#ff1b6b' : '#ff9800';

const NotificationManagement = () => {
    const dispatch = useDispatch();
    const { adminList, loading, successMessage, error } = useSelector(state => state.notifications);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [form, setForm] = useState({
        title: '', message: '', type: '', targetAudience: 'All Users', 
        targetGroup: '', recipient: '', channels: ['In-App'], scheduledFor: ''
    });

    useEffect(() => {
        dispatch(fetchAdminNotifications());
    }, [dispatch]);

    useEffect(() => {
        if(successMessage) {
            alert(successMessage);
            dispatch(clearNotificationMessages());
            setForm({ title: '', message: '', type: '', targetAudience: 'All Users', targetGroup: '', recipient: '', channels: ['In-App'], scheduledFor: ''});
            setActiveTab('dashboard');
        }
        if(error) {
            alert(error);
            dispatch(clearNotificationMessages());
        }
    }, [successMessage, error, dispatch]);

    const total = adminList.length;
    const sent = adminList.filter(n => n.status === 'Sent').length;
    const scheduled = adminList.filter(n => n.status === 'Pending').length;
    const failed = adminList.filter(n => n.status === 'Failed').length;

    const kpiData = [
        { label: 'Total Notifications', value: total, color: '#0ff0fc', icon: <Bell size={20}/> },
        { label: 'Sent', value: sent, color: '#50cc7f', icon: <CheckCircle2 size={20}/> },
        { label: 'Scheduled', value: scheduled, color: '#ffcc00', icon: <Clock size={20}/> },
        { label: 'Failed/Cancelled', value: failed + adminList.filter(n=>n.status==='Cancelled').length, color: '#ff1b6b', icon: <XCircle size={20}/> },
    ];

    const toggleChannel = (c) => {
        setForm(prev => {
            const has = prev.channels.includes(c);
            return { ...prev, channels: has ? prev.channels.filter(x => x !== c) : [...prev.channels, c] };
        });
    };

    const handleSend = () => {
        if (!form.title || !form.message || !form.type) return alert('Title, Message, and Type are required');
        if (form.targetAudience === 'Individual User' && !form.recipient) return alert('Recipient ID is required for Individual User');
        dispatch(sendNotification(form));
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                        <Bell size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> Notification Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Broadcast announcements, reminders, and alerts.</p>
                </div>
                <button onClick={() => setActiveTab('compose')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <Plus size={18}/> Compose Alert
                </button>
            </div>

            <div className="tabs-wrapper" style={{ marginBottom: '1.5rem' }}>
                {['dashboard', 'compose'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={'tab-btn ' + (activeTab === t ? 'active' : '')} style={{ textTransform: 'capitalize' }}>
                        {t === 'dashboard' ? '📊 Dashboard & History' : '📨 Compose Message'}
                    </button>
                ))}
            </div>

            {loading && <div style={{ color: '#0ff0fc', padding: '20px', textAlign: 'center' }}>Processing...</div>}

            {activeTab === 'dashboard' && !loading && (
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

                    <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#bc13fe', fontSize: '1.1rem' }}>📜 Notification History</h3>
                        {adminList.length === 0 && <p style={{ color: 'rgba(255,255,255,0.5)' }}>No notifications sent yet.</p>}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {adminList.map(n => (
                                <div key={n._id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: `1px solid ${statusColor(n.status)}30` }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{n.title}</span>
                                            <span style={{ background: statusColor(n.status) + '15', color: statusColor(n.status), padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{n.status}</span>
                                            <span style={{ color: '#0ff0fc', fontSize: '0.75rem', background: 'rgba(15,240,252,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{n.type}</span>
                                        </div>
                                        <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{n.message}</p>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                            <span>Target: <strong>{n.targetAudience}</strong> {n.targetGroup ? `(${n.targetGroup})` : ''}</span>
                                            <span>Channels: {n.channels.join(', ')}</span>
                                            <span>Sent: {new Date(n.createdAt).toLocaleString()}</span>
                                            {n.scheduledFor && <span style={{ color: '#ffcc00' }}>Scheduled: {new Date(n.scheduledFor).toLocaleString()}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => dispatch(resendNotification(n._id))} style={{ background: 'rgba(15,240,252,0.1)', border: '1px solid #0ff0fc30', color: '#0ff0fc', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Resend</button>
                                        {n.status === 'Pending' && <button onClick={() => dispatch(cancelNotification(n._id))} style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid #ff1b6b30', color: '#ff1b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'compose' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, color: '#0ff0fc' }}>📝 Compose Message</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Target Audience</label>
                                <select value={form.targetAudience} onChange={e => setForm({...form, targetAudience: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}>
                                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Notification Type</label>
                                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}>
                                    <option value="">Select Type</option>
                                    {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {['Departments', 'Programs', 'Sections'].includes(form.targetAudience) && (
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Target Group ID / Name</label>
                                <input type="text" value={form.targetGroup} onChange={e => setForm({...form, targetGroup: e.target.value})} placeholder="e.g. BSCS-FA24" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                            </div>
                        )}

                        {form.targetAudience === 'Individual User' && (
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Recipient User ID</label>
                                <input type="text" value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})} placeholder="User Object ID" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Title</label>
                            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Notification Title" style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '6px' }}>Message Body</label>
                            <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Write your message here..." rows={4} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}/>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#bc13fe', fontSize: '1rem' }}>📡 Delivery Channels</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {CHANNELS.map(c => {
                                    const active = form.channels.includes(c.id);
                                    return (
                                        <div key={c.id} onClick={() => toggleChannel(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: active ? c.color+'15' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? c.color : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${active ? c.color : 'rgba(255,255,255,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? c.color : 'transparent' }}>
                                                {active && <CheckCircle2 size={12} color="#000" />}
                                            </div>
                                            <span style={{ color: active ? c.color : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {c.icon} {c.id} {(c.id !== 'In-App' && c.id !== 'Email') ? '(Future)' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '24px' }}>
                            <h3 style={{ margin: '0 0 16px', color: '#ffcc00', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18}/> Schedule</h3>
                            <input type="datetime-local" value={form.scheduledFor} onChange={e => setForm({...form, scheduledFor: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', marginBottom: '16px' }}/>
                            
                            <button onClick={handleSend} className="primary-btn">
                                <Send size={18}/> {form.scheduledFor ? 'Schedule Notification' : 'Send Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationManagement;
