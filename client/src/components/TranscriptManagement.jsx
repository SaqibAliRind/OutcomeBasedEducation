import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentTranscript } from '../store/academicRecordSlice';
import { FileText, Search, Download, CheckCircle2, XCircle, Printer, BadgeCheck, GraduationCap, LayoutList, CheckSquare, ChevronRight, Hash, AlertTriangle, FileCheck } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const TranscriptManagement = () => {
    const dispatch = useDispatch();
    const { transcript, loading, error } = useSelector(state => state.academicRecord);

    const [activeTab, setActiveTab] = useState('transcript');
    const [searchTerm, setSearchTerm] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('Unverified');

    const handleAction = (action) => {
        if (action === 'Generate') {
            if (!searchTerm.trim()) return alert('Please enter a Roll Number or Student ID');
            dispatch(fetchStudentTranscript(searchTerm.trim()));
            setVerificationStatus('Unverified');
        }
        else if (action === 'Verify') setVerificationStatus('Verified');
        else alert(`${action} successful!`);
    };

    return (
        <div className="" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(80,204,127,0.1)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(80,204,127,0.2)' }}>
                        <FileText size={30} color="#50cc7f" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #50cc7f, #0ff0fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Transcript Management
                        </h1>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                            Generate, verify, and audit student academic transcripts
                        </p>
                    </div>
                </div>

                {/* Operations Toolbar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="search-bar" style={{ width: '250px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', marginRight: '5px' }}>
                        <Search size={16} color="rgba(255,255,255,0.4)" />
                        <input type="text" placeholder="Search Roll # or Reg #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ background: 'none', border: 'none', color: '#fff', padding: '0 10px', width: '100%', outline: 'none', fontSize: '0.85rem' }} />
                    </div>

                    <button onClick={() => handleAction('Generate')} disabled={loading}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <FileCheck size={14} /> {loading ? 'Loading...' : 'Generate'}
                    </button>
                    
                    <button onClick={() => handleAction('Print')} disabled={loading || !transcript}
                        style={{ background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', color: '#0ff0fc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                        <Printer size={14} /> Print
                    </button>

                    <button onClick={() => handleAction('Download PDF')} disabled={loading || !transcript}
                        style={{ background: 'rgba(188,19,254,0.1)', border: '1px solid rgba(188,19,254,0.3)', color: '#bc13fe', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                        <Download size={14} /> Export PDF
                    </button>

                    {verificationStatus === 'Unverified' ? (
                        <button onClick={() => handleAction('Verify')} disabled={loading || !transcript}
                            style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: '#ff1b6b', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            <BadgeCheck size={14} /> Verify Transcript
                        </button>
                    ) : (
                        <button disabled
                            style={{ background: 'rgba(80,204,127,0.15)', border: '1px solid rgba(80,204,127,0.3)', color: '#50cc7f', padding: '8px 14px', borderRadius: '8px', cursor: 'default', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            <BadgeCheck size={14} /> Verified Official
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-wrapper">
                <button className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>
                    <FileText size={16} /> Official Transcript
                </button>
                <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
                    <CheckSquare size={16} /> Degree Audit
                </button>
            </div>

            {/* ═══════════════════════════ TAB: TRANSCRIPT VIEW ═══════════════════════════ */}
            {activeTab === 'transcript' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#fff', padding: '50px' }}>Generating precise records...</div>
                    ) : error ? (
                        <div style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: '#ff1b6b', padding: '20px', borderRadius: '12px' }}>
                            {error}
                        </div>
                    ) : !transcript ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '50px' }}>
                            Search for a Roll Number or Student ID and click Generate.
                        </div>
                    ) : (
                        <>
                            {/* Student Information Block */}
                            <div style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <GraduationCap size={20} color="#0ff0fc" /> Student Information
                                    </h3>
                                    <span style={{ background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', color: '#50cc7f', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                                        Active
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    {[
                                        { label: 'Name', value: transcript.profile.name },
                                        { label: 'Roll Number', value: transcript.profile.rollNumber || 'N/A' },
                                        { label: 'Registration #', value: transcript.profile.studentId || 'N/A' },
                                        { label: 'Program', value: transcript.profile.program || 'N/A' },
                                        { label: 'Department', value: transcript.profile.department || 'N/A' },
                                        { label: 'Batch', value: transcript.profile.batch || 'N/A' },
                                    ].map((item, idx) => (
                                        <div key={idx}>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
                                            <p style={{ margin: '4px 0 0', color: '#fff', fontSize: '1rem', fontWeight: '600' }}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Academic Record Terms */}
                            {transcript.terms?.map((term, termIdx) => (
                                <div key={termIdx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <LayoutList size={20} color="#bc13fe" /> {term.termName}
                                        </h3>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    {['Course Code', 'Course Title', 'Cr. Hrs', 'Grade', 'Grade Points'].map(h => (
                                                        <th key={h} style={{ padding: '12px 24px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {term.courses?.map((course, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>{course.code}</td>
                                                        <td style={{ padding: '14px 24px', color: '#fff', fontWeight: '600' }}>{course.name}</td>
                                                        <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.7)' }}>{course.credits}</td>
                                                        <td style={{ padding: '14px 24px' }}>
                                                            <span style={{ color: course.grade?.includes('A') ? '#50cc7f' : course.grade?.includes('B') ? '#0ff0fc' : course.grade?.includes('F') ? '#ff1b6b' : '#ffcc00', fontWeight: '800' }}>{course.grade}</span>
                                                        </td>
                                                        <td style={{ padding: '14px 24px', color: 'rgba(255,255,255,0.7)' }}>{course.points?.toFixed(1)}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ background: 'rgba(15,240,252,0.03)' }}>
                                                    <td colSpan="4" style={{ padding: '14px 24px', textAlign: 'right', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>Term GPA:</td>
                                                    <td style={{ padding: '14px 24px', fontWeight: '800', color: '#0ff0fc', fontSize: '1.1rem' }}>{term.termGPA} SGPA</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}

                            {/* Final Information Block */}
                            <div style={{ background: 'linear-gradient(145deg, rgba(15,240,252,0.05), rgba(188,19,254,0.05))', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Earned Credits</p>
                                    <h2 style={{ margin: '5px 0 0', color: '#0ff0fc', fontSize: '2rem', fontWeight: '800' }}>{transcript.totalCredits}</h2>
                                </div>
                                <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Final CGPA</p>
                                    <h2 style={{ margin: '5px 0 0', color: '#bc13fe', fontSize: '2.5rem', fontWeight: '800' }}>{transcript.overallCGPA}</h2>
                                </div>
                                <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }}></div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Degree Status</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '5px' }}>
                                        <CheckCircle2 size={24} color="#50cc7f" />
                                        <h2 style={{ margin: 0, color: '#50cc7f', fontSize: '1.8rem', fontWeight: '800' }}>In Progress</h2>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════════════════ TAB: DEGREE AUDIT ═══════════════════════════ */}
            {activeTab === 'audit' && (
                <div className="fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Eligibility Banner */}
                    <div style={{ marginTop: '20px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <BadgeCheck size={32} color="#50cc7f" />
                        <div>
                            <h3 style={{ margin: 0, color: '#50cc7f', fontSize: '1.2rem', fontWeight: '800' }}>
                                Degree Audit Feature
                            </h3>
                            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>This feature is under development to match exact HEC curriculum rules.</p>
                        </div>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TranscriptManagement;
