import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchStudentGPA,
    fetchStudentCGPA,
    fetchStudentTranscript,
    clearAcademicRecord
} from '../store/academicRecordSlice';
import { fetchUsers } from '../store/userSlice';
import {
    GraduationCap, TrendingUp, FileText, BarChart2,
    Loader2, Printer, User, ChevronDown, Award
} from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

// GPA color helper
const getGPAColor = (gpa) => {
    const g = parseFloat(gpa);
    if (g >= 3.5) return '#50cc7f';
    if (g >= 3.0) return '#0ff0fc';
    if (g >= 2.5) return '#ffcc00';
    if (g >= 2.0) return '#ff8c00';
    return '#ff1b6b';
};

const getGPALabel = (gpa) => {
    const g = parseFloat(gpa);
    if (g >= 3.7) return 'Distinction';
    if (g >= 3.3) return 'High Merit';
    if (g >= 3.0) return 'Merit';
    if (g >= 2.5) return 'Satisfactory';
    if (g >= 2.0) return 'Pass';
    return 'Fail';
};

const GRADE_SCALE = [
    { grade: 'A+', points: '4.0', range: '95–100' },
    { grade: 'A',  points: '4.0', range: '90–94'  },
    { grade: 'A-', points: '3.7', range: '85–89'  },
    { grade: 'B+', points: '3.3', range: '80–84'  },
    { grade: 'B',  points: '3.0', range: '75–79'  },
    { grade: 'B-', points: '2.7', range: '70–74'  },
    { grade: 'C+', points: '2.3', range: '65–69'  },
    { grade: 'C',  points: '2.0', range: '60–64'  },
    { grade: 'C-', points: '1.7', range: '55–59'  },
    { grade: 'D',  points: '1.0', range: '50–54'  },
    { grade: 'F',  points: '0.0', range: '< 50'   },
];

const AcademicRecord = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(s => s.auth);
    const { gpaList, cgpa, totalCredits, transcript, loading, error } = useSelector(s => s.academicRecord);
    const { usersList } = useSelector(s => s.users);
    const students = usersList.filter(u => u.role === 'Student');

    const isAdmin = ['SuperAdmin', 'UniversityAdmin'].includes(user?.role);
    const [activeTab, setActiveTab] = useState('gpa');
    const [selectedStudent, setSelectedStudent] = useState(isAdmin ? '' : 'me');
    const printRef = useRef();

    useEffect(() => {
        if (isAdmin) dispatch(fetchUsers());
    }, [dispatch, isAdmin]);

    useEffect(() => {
        if (selectedStudent) {
            dispatch(clearAcademicRecord());
            dispatch(fetchStudentGPA(selectedStudent));
            dispatch(fetchStudentCGPA(selectedStudent));
            dispatch(fetchStudentTranscript(selectedStudent));
        }
    }, [selectedStudent, dispatch]);

    const handlePrint = () => {
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>Official Transcript - ${transcript?.profile?.name || ''}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; background: #fff; }
                    h1 { text-align: center; font-size: 1.6rem; margin-bottom: 0; }
                    h2 { text-align: center; font-size: 1rem; color: #555; margin-top: 4px; }
                    hr { border: 1px solid #000; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin: 12px 0; font-size: 0.9rem; }
                    .info-grid span { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.85rem; }
                    th { background: #e0e0e0; padding: 6px 8px; text-align: left; border: 1px solid #aaa; }
                    td { padding: 5px 8px; border: 1px solid #aaa; }
                    .term-header { background: #f5f5f5; font-weight: bold; font-size: 0.9rem; padding: 6px 8px; }
                    .cgpa-row { background: #e8f4e8; font-weight: bold; }
                    .footer { text-align: center; margin-top: 40px; font-size: 0.8rem; color: #888; }
                    .seal { text-align: center; margin-top: 16px; font-size: 0.85rem; }
                </style>
            </head>
            <body>
                <h1>Al-Kawthar University</h1>
                <h2>Official Academic Transcript</h2>
                <hr/>
                <div class="info-grid">
                    <div><span>Student Name:</span> ${transcript?.profile?.name || '—'}</div>
                    <div><span>Student ID:</span> ${transcript?.profile?.studentId || '—'}</div>
                    <div><span>Roll Number:</span> ${transcript?.profile?.rollNumber || '—'}</div>
                    <div><span>Program:</span> ${transcript?.profile?.program || '—'}</div>
                    <div><span>Department:</span> ${transcript?.profile?.department || '—'}</div>
                    <div><span>Batch:</span> ${transcript?.profile?.batch || '—'}</div>
                </div>
                <hr/>
                <table>
                    <thead>
                        <tr><th>Course Code</th><th>Course Title</th><th>Credit Hours</th><th>Grade</th><th>Grade Points</th></tr>
                    </thead>
                    <tbody>
                        ${(transcript?.terms || []).map(term => `
                            <tr><td colspan="5" class="term-header">${term.termName} &nbsp;|&nbsp; Term GPA: ${term.termGPA}</td></tr>
                            ${term.courses.map(c => `
                                <tr>
                                    <td>${c.code}</td>
                                    <td>${c.name}</td>
                                    <td>${c.credits}</td>
                                    <td>${c.grade}</td>
                                    <td>${c.points.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        `).join('')}
                        <tr class="cgpa-row">
                            <td colspan="2">Overall CGPA</td>
                            <td>${transcript?.totalCredits || 0} CH</td>
                            <td></td>
                            <td>${transcript?.overallCGPA || '0.00'}</td>
                        </tr>
                    </tbody>
                </table>
                <hr/>
                <div class="seal">
                    <p>This is an official transcript issued by Al-Kawthar University Examination Department.</p>
                    <p>____________________________ &nbsp;&nbsp;&nbsp;&nbsp; ____________________________</p>
                    <p>Controller of Examinations &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Registrar</p>
                </div>
                <div class="footer">Printed on ${new Date().toLocaleString()}</div>
            </body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    const tabs = [
        { id: 'gpa',        label: 'GPA',        icon: BarChart2,    color: '#50cc7f' },
        { id: 'cgpa',       label: 'CGPA',       icon: TrendingUp,   color: '#0ff0fc' },
        { id: 'transcript', label: 'Transcript',  icon: FileText,     color: '#bc13fe' },
    ];

    const maxGPA = Math.max(...gpaList.map(g => parseFloat(g.gpa)), 4.0);

    return (
        <div className="" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#ffcc00', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <GraduationCap size={24} /> Academic Record
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
                        View semester-wise GPA, CGPA, and official transcripts.
                    </p>
                </div>

                {/* Student Selector (Admin only) */}
                {isAdmin && (
                    <div className="form-group" style={{ margin: 0, minWidth: 280 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} /> Select Student
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                                <option value="">— Choose a student —</option>
                                {students.map(s => (
                                    <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* No student selected prompt */}
            {!selectedStudent && isAdmin && (
                <div className="glass-panel-dash" style={{ textAlign: 'center', padding: '3rem' }}>
                    <User size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Please select a student to view their academic record.</p>
                </div>
            )}

            {selectedStudent && (
                <>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s',
                                    background: isActive ? tab.color : 'rgba(255,255,255,0.06)',
                                    color: isActive ? '#020917' : 'rgba(255,255,255,0.7)',
                                    boxShadow: isActive ? `0 0 16px ${tab.color}66` : 'none',
                                }}>
                                    <Icon size={16} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <Loader2 size={32} className="spinner" color="#0ff0fc" />
                        </div>
                    )}

                    {/* ===== GPA TAB ===== */}
                    {!loading && activeTab === 'gpa' && (
                        <>
                            {gpaList.length === 0 ? (
                                <div className="glass-panel-dash" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                                    No completed courses found for GPA calculation.
                                </div>
                            ) : (
                                <>
                                    {/* Bar chart visual */}
                                    <div className="glass-panel-dash">
                                        <h3 style={{ color: '#50cc7f', marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <BarChart2 size={20} /> Semester-wise GPA
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', minHeight: 180, flexWrap: 'wrap' }}>
                                            {gpaList.map((item, idx) => {
                                                const gpaVal = parseFloat(item.gpa);
                                                const height = Math.max((gpaVal / 4.0) * 160, 20);
                                                const color = getGPAColor(gpaVal);
                                                return (
                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '1 1 80px', minWidth: 80 }}>
                                                        <span style={{ color, fontWeight: 700, fontSize: '1rem' }}>{gpaVal.toFixed(2)}</span>
                                                        <div style={{
                                                            width: '100%', height, borderRadius: '6px 6px 0 0',
                                                            background: `linear-gradient(180deg, ${color}cc, ${color}44)`,
                                                            border: `1px solid ${color}66`,
                                                            transition: 'height 0.6s ease',
                                                            boxShadow: `0 0 12px ${color}44`
                                                        }} />
                                                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                                                            {item.semester?.name}<br />
                                                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>Sem {item.semester?.number}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {GRADE_SCALE.slice(0, 6).map(g => (
                                                <div key={g.grade} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 4 }}>
                                                    <strong style={{ color: '#fff' }}>{g.grade}</strong> = {g.points} pts ({g.range})
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GPA table */}
                                    <div className="glass-panel-dash" style={{ padding: 0, overflow: 'hidden' }}>
                                        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>GPA Details</h3>
                                        </div>
                                        <div className="table-container">
                                            <table className="glass-table" style={{ width: '100%' }}>
                                                <thead>
                                                    <tr><th>Semester</th><th>Sem No.</th><th>Credit Hours</th><th>GPA</th><th>Standing</th></tr>
                                                </thead>
                                                <tbody>
                                                    {gpaList.map((item, idx) => {
                                                        const color = getGPAColor(item.gpa);
                                                        return (
                                                            <tr key={idx}>
                                                                <td><strong>{item.semester?.name}</strong></td>
                                                                <td>{item.semester?.number}</td>
                                                                <td>{item.totalCredits} CH</td>
                                                                <td><strong style={{ color, fontSize: '1.05rem' }}>{item.gpa}</strong></td>
                                                                <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}44` }}>{getGPALabel(item.gpa)}</span></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ===== CGPA TAB ===== */}
                    {!loading && activeTab === 'cgpa' && (
                        <div className="glass-panel-dash" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                            <TrendingUp size={36} color="#0ff0fc" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: '#fff', marginTop: 0 }}>Cumulative GPA (CGPA)</h3>

                            {/* Big CGPA display */}
                            <div style={{ margin: '2rem auto', position: 'relative', width: 180, height: 180 }}>
                                <svg viewBox="0 0 180 180" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                                    <circle cx="90" cy="90" r="76" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
                                    <circle cx="90" cy="90" r="76" fill="none"
                                        stroke={getGPAColor(cgpa || 0)} strokeWidth="12"
                                        strokeDasharray={`${(parseFloat(cgpa || 0) / 4.0) * 477} 477`}
                                        strokeLinecap="round"
                                        style={{ filter: `drop-shadow(0 0 8px ${getGPAColor(cgpa || 0)})`, transition: 'stroke-dasharray 1s ease' }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.4rem', fontWeight: 800, color: getGPAColor(cgpa || 0), lineHeight: 1 }}>
                                        {cgpa || '—'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>out of 4.00</div>
                                </div>
                            </div>

                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: getGPAColor(cgpa || 0), marginBottom: '0.5rem' }}>
                                {getGPALabel(cgpa || 0)}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                Total Credit Hours Completed: <strong style={{ color: '#fff' }}>{totalCredits} CH</strong>
                            </div>

                            {/* Grading Scale reference */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1.2rem', border: '1px solid rgba(255,255,255,0.06)', display: 'inline-block', textAlign: 'left', maxWidth: 500 }}>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Award size={14} /> Grading Scale Reference
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.4rem' }}>
                                    {GRADE_SCALE.map(g => (
                                        <div key={g.grade} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}>
                                            <strong style={{ color: '#fff' }}>{g.grade}</strong>
                                            <span>{g.points} pts</span>
                                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{g.range}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== TRANSCRIPT TAB ===== */}
                    {!loading && activeTab === 'transcript' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="page-btn primary-btn" onClick={handlePrint}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
                                    <Printer size={16} /> Print / Download PDF
                                </button>
                            </div>

                            {!transcript ? (
                                <div className="glass-panel-dash" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                                    No transcript data available. Complete some courses first.
                                </div>
                            ) : (
                                <div className="glass-panel-dash" ref={printRef}>
                                    {/* Transcript header */}
                                    <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffcc00', letterSpacing: 1 }}>AL-KAWTHAR UNIVERSITY</div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: 4 }}>Official Academic Transcript</div>
                                    </div>

                                    {/* Profile info */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem 2rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                                        {[
                                            ['Student Name', transcript.profile?.name],
                                            ['Student ID',   transcript.profile?.studentId],
                                            ['Roll Number',  transcript.profile?.rollNumber],
                                            ['Program',      transcript.profile?.program],
                                            ['Department',   transcript.profile?.department],
                                            ['Batch',        transcript.profile?.batch],
                                        ].map(([label, val]) => (
                                            <div key={label} style={{ fontSize: '0.88rem' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 6 }}>{label}:</span>
                                                <strong style={{ color: '#fff' }}>{val || '—'}</strong>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Terms */}
                                    {transcript.terms.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No completed courses on record.</p>
                                    ) : transcript.terms.map((term, ti) => (
                                        <div key={ti} style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,240,252,0.08)', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '8px 8px 0 0', padding: '0.7rem 1rem' }}>
                                                <strong style={{ color: '#0ff0fc', fontSize: '0.9rem' }}>{term.termName}</strong>
                                                <span style={{ color: '#0ff0fc', fontWeight: 700 }}>Term GPA: {term.termGPA}</span>
                                            </div>
                                            <div className="table-container" style={{ border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                                <table className="glass-table" style={{ width: '100%', margin: 0 }}>
                                                    <thead>
                                                        <tr><th>Code</th><th>Course Title</th><th>Credit Hrs</th><th>Grade</th><th>Grade Points</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        {term.courses.map((c, ci) => (
                                                            <tr key={ci}>
                                                                <td style={{ fontFamily: 'monospace', color: '#ffcc00', fontWeight: 600 }}>{c.code}</td>
                                                                <td>{c.name}</td>
                                                                <td>{c.credits}</td>
                                                                <td><strong style={{ color: getGPAColor(c.points / c.credits) }}>{c.grade}</strong></td>
                                                                <td>{c.points.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}

                                    {/* CGPA summary */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <div style={{ background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.25)', borderRadius: 12, padding: '1rem 2rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Overall CGPA</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color: getGPAColor(transcript.overallCGPA) }}>
                                                {transcript.overallCGPA}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                                                {transcript.totalCredits} Credit Hours
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AcademicRecord;
