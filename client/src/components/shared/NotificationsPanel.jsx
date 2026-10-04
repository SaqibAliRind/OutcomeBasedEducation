import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, sendNotification, markNotificationRead } from '../../store/notificationSlice';
import { Loader2, Bell, Check, Plus, BellRing, Mail, BookOpen, Clock, X, GraduationCap, DollarSign, CalendarCheck } from 'lucide-react';

const NotificationsPanel = () => {
    const dispatch = useDispatch();
    const { list, loading, error, successMessage } = useSelector(state => state.notifications);
    const { user } = useSelector(state => state.auth);
    
    const [showSendModal, setShowSendModal] = useState(false);
    const [formData, setFormData] = useState({
        recipientRole: 'Student', // 'Student', 'Teacher', 'All'
        type: 'Academic Announcement',
        title: '',
        message: ''
    });

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleSend = (e) => {
        e.preventDefault();
        const payload = { ...formData };
        if (payload.recipientRole === 'All') {
            delete payload.recipientRole; // Backend handles broadcast
        }
        dispatch(sendNotification(payload)).then((res) => {
            if (res.meta.requestStatus === 'fulfilled') {
                setShowSendModal(false);
                setFormData({ recipientRole: 'Student', type: 'Academic Announcement', title: '', message: '' });
                dispatch(fetchNotifications());
            }
        });
    };

    const handleMarkAsRead = (id) => {
        dispatch(markNotificationRead(id));
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'Assignment Reminder': return <Clock size={20} color="#ffcc00" />;
            case 'Attendance Alert': return <BellRing size={20} color="#ff1b6b" />;
            case 'Result Notification': return <GraduationCap size={20} color="#50cc7f" />;
            case 'Academic Announcement': return <BookOpen size={20} color="#0ff0fc" />;
            case 'Workflow': return <Bell size={20} color="#bc13fe" />;
            case 'Admission Confirmation': return <Check size={20} color="#50cc7f" />;
            case 'Registration Reminder': return <BellRing size={20} color="#ffcc00" />;
            case 'Fee Reminder': return <DollarSign size={20} color="#ff1b6b" />;
            case 'Semester Registration Alert': return <CalendarCheck size={20} color="#0ff0fc" />;
            default: return <Mail size={20} color="#aaaaaa" />;
        }
    };

    return (
        <div className="notifications-container glass-panel-dash">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0ff0fc', margin: 0 }}>
                    <Bell size={24} /> Notifications Center
                </h2>
                
                {/* Only Admins can broadcast notifications here */}
                {['UniversityAdmin', 'SuperAdmin', 'ProgramCoordinator', 'HOD', 'Dean'].includes(user?.role) && (
                    <button className="primary-btn" onClick={() => setShowSendModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Plus size={18} /> Send Alert
                    </button>
                )}
            </div>

            {loading && list.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="spinner" size={24} /></div>
            ) : (
                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {list.length === 0 && <div style={{ color: 'var(--uni-text-muted)', textAlign: 'center', padding: '2rem' }}>No notifications found.</div>}
                    
                    {list.map(notif => (
                        <div key={notif._id} style={{ 
                            background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(15, 240, 252, 0.05)',
                            border: `1px solid ${notif.isRead ? 'rgba(255,255,255,0.05)' : 'rgba(15, 240, 252, 0.2)'}`,
                            padding: '15px', 
                            borderRadius: '12px',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-start',
                            transition: 'all 0.3s'
                        }}>
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                                {getIconForType(notif.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <strong style={{ fontSize: '1.1rem', color: notif.isRead ? '#ccc' : '#fff' }}>{notif.title}</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--uni-text-muted)' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                                </div>
                                <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: notif.isRead ? '#aaa' : '#ddd', lineHeight: '1.5' }}>{notif.message}</p>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                    Type: <span style={{ color: '#0ff0fc' }}>{notif.type}</span> 
                                    {notif.sender && ` • From: ${notif.sender.name} (${notif.sender.role})`}
                                </div>
                            </div>
                            {!notif.isRead && (
                                <button 
                                    className="action-btn" 
                                    style={{ background: 'rgba(80, 204, 127, 0.1)', color: '#50cc7f', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                    onClick={() => handleMarkAsRead(notif._id)}
                                    title="Mark as Read"
                                >
                                    <Check size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* SEND NOTIFICATION MODAL */}
            {showSendModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash">
                        <div className="modal-header">
                            <h3>Broadcast Notification</h3>
                            <button className="close-btn" onClick={() => setShowSendModal(false)}><X size={20} /></button>
                        </div>
                        <form className="modal-form" onSubmit={handleSend} className="modal-form">
                            <div className="form-group">
                                <label>Recipient Audience</label>
                                <select required value={formData.recipientRole} onChange={e => setFormData({...formData, recipientRole: e.target.value})}>
                                    <option value="Student">All Students</option>
                                    <option value="Teacher">All Teachers</option>
                                    <option value="ProgramCoordinator">All Program Coordinators</option>
                                    <option value="HOD">All HODs</option>
                                    <option value="All">Everyone (Broadcast)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Notification Type</label>
                                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="Academic Announcement">Academic Announcement</option>
                                    <option value="Assignment Reminder">Assignment Reminder</option>
                                    <option value="Attendance Alert">Attendance Alert</option>
                                    <option value="Result Notification">Result Notification</option>
                                    <option value="System">System Alert</option>
                                    <option value="Admission Confirmation">Admission Confirmation</option>
                                    <option value="Registration Reminder">Registration Reminder</option>
                                    <option value="Fee Reminder">Fee Reminder</option>
                                    <option value="Semester Registration Alert">Semester Registration Alert</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" required placeholder="e.g., Midterm Exam Schedule" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea required rows="4" placeholder="Enter notification message..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setShowSendModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={loading}>
                                    {loading ? <Loader2 size={16} className="spinner" /> : 'Send Broadcast'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsPanel;
