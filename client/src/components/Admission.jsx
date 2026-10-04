import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { admitNewStudent, clearAdmissionMessages, resetAdmissionState } from '../store/admissionSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { UserPlus, Save, Loader2, CheckCircle, AlertCircle, RefreshCw, Key, Hash, GraduationCap, Copy } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const Admission = () => {
    const dispatch = useDispatch();
    const { loading, error, successMessage, lastAdmissionDetails } = useSelector(s => s.admission);
    const { records } = useSelector(s => s.academic);
    const { programs = [], departments = [], batches = [] } = records || {};
    const [toast, setToast] = useState(null);

    const [form, setForm] = useState({
        name: '', email: '', password: '', generatePassword: true,
        batch: '', program: '', department: '', currentSemester: 1,
        studentId: '', rollNumber: '', generateIds: true
    });

    useEffect(() => {
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('batches'));
        return () => { dispatch(resetAdmissionState()); };
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            setToast({ msg: successMessage, type: 'success' });
            setTimeout(() => setToast(null), 5000);
            dispatch(clearAdmissionMessages());
            // Reset form on success but keep generate flags
            setForm({
                name: '', email: '', password: '', generatePassword: form.generatePassword,
                batch: '', program: '', department: '', currentSemester: 1,
                studentId: '', rollNumber: '', generateIds: form.generateIds
            });
        }
        if (error) {
            setToast({ msg: error, type: 'error' });
            setTimeout(() => setToast(null), 5000);
            dispatch(clearAdmissionMessages());
        }
    }, [successMessage, error, dispatch, form.generateIds, form.generatePassword]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(admitNewStudent(form));
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setToast({ msg: 'Copied to clipboard!', type: 'success' });
        setTimeout(() => setToast(null), 2000);
    };

    return (
        <div className="" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 24, zIndex: 9999,
                    background: toast.type === 'success' ? 'rgba(80,204,127,0.12)' : 'rgba(255,27,107,0.12)',
                    border: `1px solid ${toast.type === 'success' ? '#50cc7f' : '#ff1b6b'}`,
                    color: toast.type === 'success' ? '#50cc7f' : '#ff1b6b',
                    padding: '12px 20px', borderRadius: 12,
                    fontWeight: 600, backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserPlus size={24} /> New Admission
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                        Register a new student, assign their batch/program, and generate their unique IDs.
                    </p>
                </div>
            </div>

            {lastAdmissionDetails && (
                <div className="glass-panel-dash fade-in" style={{ border: '1px solid rgba(80,204,127,0.3)', background: 'rgba(80,204,127,0.05)' }}>
                    <h3 style={{ color: '#50cc7f', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={20} /> Successfully Admitted!
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Please share the following credentials and identifiers with the student securely.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 8, position: 'relative' }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Student ID</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>{lastAdmissionDetails.studentId}</div>
                            <button onClick={() => copyToClipboard(lastAdmissionDetails.studentId)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#0ff0fc', cursor: 'pointer' }}><Copy size={16}/></button>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 8, position: 'relative' }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Roll Number</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>{lastAdmissionDetails.rollNumber}</div>
                            <button onClick={() => copyToClipboard(lastAdmissionDetails.rollNumber)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#0ff0fc', cursor: 'pointer' }}><Copy size={16}/></button>
                        </div>
                        {lastAdmissionDetails.generatedPassword && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 8, position: 'relative' }}>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Generated Password</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffcc00' }}>{lastAdmissionDetails.generatedPassword}</div>
                                <button onClick={() => copyToClipboard(lastAdmissionDetails.generatedPassword)} style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: '#ffcc00', cursor: 'pointer' }}><Copy size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <form className="modal-form" onSubmit={handleSubmit} className="glass-panel-dash">
                
                {/* ACCOUNT DETAILS */}
                <h3 style={{ color: '#0ff0fc', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>1. Account Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="form-group">
                        <label>Student Name *</label>
                        <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Doe" />
                    </div>
                    <div className="form-group">
                        <label>Email Address *</label>
                        <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="student@university.edu" />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                            <label style={{ margin: 0 }}>Password Configuration</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ffcc00', fontSize: '0.8rem' }}>
                                <input type="checkbox" checked={form.generatePassword} onChange={e => setForm({...form, generatePassword: e.target.checked})} />
                                Auto-Generate Password
                            </label>
                        </div>
                        {!form.generatePassword ? (
                            <div style={{ position: 'relative' }}>
                                <Key size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', zIndex: 1 }} />
                                <input type="text" required
                                    style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8, padding: '0.75rem 0.75rem 0.75rem 38px',
                                        color: '#fff', outline: 'none' }}
                                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Enter manual password" />
                            </div>
                        ) : (
                            <div style={{ padding: '0.75rem', background: 'rgba(255,204,0,0.1)', border: '1px dashed rgba(255,204,0,0.3)', borderRadius: 8, color: '#ffcc00', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <RefreshCw size={16} /> A secure 8-character password will be auto-generated.
                            </div>
                        )}
                    </div>
                </div>

                {/* ACADEMIC ALLOCATION */}
                <h3 style={{ color: '#bc13fe', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>2. Academic Allocation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="form-group">
                        <label>Batch *</label>
                        <select required value={form.batch} onChange={e => setForm({...form, batch: e.target.value})}>
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.admissionYear})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Program *</label>
                        <select required value={form.program} onChange={e => setForm({...form, program: e.target.value})}>
                            <option value="">Select Program</option>
                            {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Department *</label>
                        <select required value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                            <option value="">Select Department</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Current Semester *</label>
                        <input type="number" min="1" max="12" required value={form.currentSemester} onChange={e => setForm({...form, currentSemester: parseInt(e.target.value)})} />
                    </div>
                </div>

                {/* IDENTIFIERS */}
                <h3 style={{ color: '#50cc7f', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>3. Identifiers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#50cc7f', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={form.generateIds} onChange={e => setForm({...form, generateIds: e.target.checked})} />
                            Auto-Generate Student ID & Roll Number
                        </label>
                    </div>

                    {!form.generateIds && (
                        <>
                            <div className="form-group fade-in">
                                <label>Student ID *</label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', zIndex: 1 }} />
                                    <input type="text" required
                                        style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8, padding: '0.75rem 0.75rem 0.75rem 38px',
                                            color: '#fff', outline: 'none' }}
                                        value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} placeholder="e.g. SP23-BSE-045" />
                                </div>
                            </div>
                            <div className="form-group fade-in">
                                <label>Roll Number *</label>
                                <div style={{ position: 'relative' }}>
                                    <GraduationCap size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', zIndex: 1 }} />
                                    <input type="text" required
                                        style={{ paddingLeft: '38px', width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8, padding: '0.75rem 0.75rem 0.75rem 38px',
                                            color: '#fff', outline: 'none' }}
                                        value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} placeholder="e.g. 045" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <button type="submit" className="page-btn primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '1rem' }}>
                        {loading ? <Loader2 size={18} className="spinner"/> : <UserPlus size={18} />}
                        Admit Student
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Admission;