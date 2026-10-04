import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchSettings, updateSettingsCategory } from '../store/settingsSlice';
import { Lock, Unlock, ShieldCheck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const DataLocking = () => {
    const dispatch = useDispatch();
    const { records, loading: acadLoading } = useSelector(state => state.academic);
    const { config, loading: settLoading } = useSelector(state => state.settings);
    const semesters = records.semesters || [];

    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockParams, setUnlockParams] = useState({ type: '', semId: '' });
    const [unlockReason, setUnlockReason] = useState('');
    const [authorizedBy, setAuthorizedBy] = useState('HOD');
    const [toast, setToast] = useState(null);

    // Locking state is stored in system settings (marks.lockAllMarks, attendance.freezeAttendance, etc.)
    const lockState = config?.locking || {};

    useEffect(() => {
        dispatch(fetchAcademicData('semesters'));
        dispatch(fetchSettings());
    }, [dispatch]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleLockToggle = (semId, type, currentLocked) => {
        if (!currentLocked) {
            // Lock immediately
            const key = `${type}_${semId}`;
            dispatch(updateSettingsCategory({ category: 'locking', data: { ...lockState, [key]: true } }))
                .then(() => showToast(`${type === 'attendance' ? 'Attendance' : type === 'marks' ? 'Marks' : 'Results'} locked successfully`));
        } else {
            // Unlock requires workflow justification
            setUnlockParams({ type, semId });
            setShowUnlockModal(true);
        }
    };

    const confirmUnlock = (e) => {
        e.preventDefault();
        if (!unlockReason.trim()) {
            alert('Please provide a reason for unlocking.');
            return;
        }
        const key = `${unlockParams.type}_${unlockParams.semId}`;
        dispatch(updateSettingsCategory({ category: 'locking', data: { ...lockState, [key]: false } }))
            .then(() => {
                showToast(`${unlockParams.type} unlocked. Reason logged.`);
                setShowUnlockModal(false);
                setUnlockReason('');
            });
    };

    const isLocked = (semId, type) => !!lockState[`${type}_${semId}`];

    const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };

    const LockBtn = ({ semId, type, label }) => {
        const locked = isLocked(semId, type);
        return (
            <button
                onClick={() => handleLockToggle(semId, type, locked)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', border: 'none', transition: 'all 0.2s',
                    background: locked ? 'rgba(255,27,107,0.15)' : 'rgba(80,204,127,0.15)',
                    color: locked ? '#ff1b6b' : '#50cc7f',
                    boxShadow: locked ? '0 0 8px rgba(255,27,107,0.3)' : '0 0 8px rgba(80,204,127,0.3)'
                }}
            >
                {locked ? <Lock size={14} /> : <Unlock size={14} />}
                {locked ? 'Locked' : 'Open'}
            </button>
        );
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.type === 'success' ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.15)', border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`, color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b', padding: '12px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                    <ShieldCheck size={28} color="#50cc7f" style={{ filter: 'drop-shadow(0 0 8px #50cc7f)' }} /> Data Integrity &amp; Locking
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Manage Attendance, Marks, and Result locks to ensure accreditation compliance.</p>
            </div>

            {/* Info Banner */}
            <div style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '10px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <AlertTriangle color="#ff9800" size={24} style={{ flexShrink: 0 }} />
                <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#ff9800', fontSize: '1rem' }}>Strict Accreditation Workflow</h4>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        Once a semester is completed and approved by HOD/QEC, its records must be locked. Unlocking requires an explicit, logged justification. This ensures data integrity for audits.
                    </p>
                </div>
            </div>

            {/* Semesters Table */}
            <div className="glass-panel-dash" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {(acadLoading || settLoading) ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        <Loader2 size={36} className="spinner" color="#0ff0fc" />
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>Semester</th>
                                <th style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Attendance Lock</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Marks Lock</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Result Lock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {semesters.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
                                        No semesters found. Add semesters first before managing locks.
                                    </td>
                                </tr>
                            ) : semesters.map(sem => (
                                <tr key={sem._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px', color: '#fff', fontWeight: '600' }}>{sem.name}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                            background: sem.status === 'Completed' ? 'rgba(80,204,127,0.1)' : 'rgba(15,240,252,0.1)',
                                            color: sem.status === 'Completed' ? '#50cc7f' : '#0ff0fc',
                                            border: `1px solid ${sem.status === 'Completed' ? 'rgba(80,204,127,0.3)' : 'rgba(15,240,252,0.3)'}`
                                        }}>{sem.status || 'Active'}</span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <LockBtn semId={sem._id} type="attendance" label="Attendance" />
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <LockBtn semId={sem._id} type="marks" label="Marks" />
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <LockBtn semId={sem._id} type="result" label="Result" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '440px', padding: '1.5rem', borderRadius: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ margin: 0, color: '#ff9800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Unlock size={18} /> Request Unlock
                            </h3>
                        </div>
                        <form className="modal-form" onSubmit={confirmUnlock}>
                            <div className="form-group">
                                <label style={labelStyle}>Type</label>
                                <input value={unlockParams.type.toUpperCase()} readOnly style={{ ...inputStyle, opacity: 0.6 }} />
                            </div>
                            <div className="form-group">
                                <label style={labelStyle}>Authorized By</label>
                                <select value={authorizedBy} onChange={e => setAuthorizedBy(e.target.value)} style={inputStyle}>
                                    <option>HOD</option>
                                    <option>QEC</option>
                                    <option>Dean</option>
                                    <option>UniversityAdmin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={labelStyle}>Justification / Reason <span style={{ color: '#ff1b6b' }}>*</span></label>
                                <textarea value={unlockReason} onChange={e => setUnlockReason(e.target.value)} required placeholder="Provide a detailed reason for this unlock request..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="cancel-btn" onClick={() => setShowUnlockModal(false)}>Cancel</button>
                                <button type="submit" className="warning-btn" style={{ border: '1px solid rgba(255,152,0,0.4)' }}>
                                    Confirm Unlock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataLocking;
