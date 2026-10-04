import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentProfile, resetStudentProfile } from '../store/studentProfileSlice';
import { User, BookOpen, Activity, Target, Search, ChevronDown, GraduationCap, Calendar } from 'lucide-react';

const CELL = { padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' };
const HEAD_CELL = { padding: '10px 14px', color: '#0ff0fc', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(15,240,252,0.2)' };
const INFO_PAIR = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <span style={{ color: '#fff', fontWeight: 500 }}>{value || '—'}</span>
    </div>
);

const TABS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'results', label: 'Results', icon: Target },
    { id: 'attendance', label: 'Attendance', icon: Activity },
];

const StudentProfile = () => {
    const dispatch = useDispatch();
    const { usersList } = useSelector(s => s.users);
    const { profile, loading, error } = useSelector(s => s.studentProfile);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    const students = (usersList || []).filter(u => u.role === 'Student');
    const filtered = students.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.rollNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (selectedId) dispatch(fetchStudentProfile(selectedId));
        else dispatch(resetStudentProfile());
    }, [selectedId, dispatch]);

    const p = profile;
    const gpaColor = (gpa) => gpa >= 3.0 ? '#50cc7f' : gpa >= 2.0 ? '#ff9800' : '#ff1b6b';

    return (
        <div style={{ padding: '1.5rem 0' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <GraduationCap color="#0ff0fc" /> Student Profile Viewer
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Search and view detailed academic profiles of students.</p>
            </header>

            {/* Search */}
            <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            placeholder="Search by name, roll number or email..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                        />
                    </div>
                    <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.9rem', minWidth: '220px' }}>
                        <option value="">— Select a Student —</option>
                        {filtered.map(s => (
                            <option key={s._id} value={s._id}>{s.name} ({s.rollNumber || s.email})</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>Loading profile...</div>}
            {error && <div style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '10px', padding: '12px', color: '#ff1b6b', marginBottom: '1rem' }}>{error}</div>}

            {!selectedId && !loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
                    <GraduationCap size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>Select a student from the dropdown to view their profile</p>
                </div>
            )}

            {p && !loading && (
                <>
                    {/* Profile Header */}
                    <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#0ff0fc,#bc13fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '2rem', color: '#000', fontWeight: 800 }}>{(p.name || 'S')[0]}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 4px', color: '#fff' }}>{p.name}</h2>
                            <p style={{ margin: '0 0 4px', color: '#0ff0fc', fontSize: '0.9rem' }}>{p.rollNumber || '—'} | {p.program?.name || '—'}</p>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{p.email}</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'center', background: 'rgba(15,240,252,0.08)', borderRadius: '10px', padding: '12px 20px' }}>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>CGPA</p>
                                <h3 style={{ margin: '2px 0 0', color: gpaColor(p.cgpa), fontSize: '1.8rem', fontWeight: 800 }}>{p.cgpa?.toFixed(2) || '—'}</h3>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(188,19,254,0.08)', borderRadius: '10px', padding: '12px 20px' }}>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Semester</p>
                                <h3 style={{ margin: '2px 0 0', color: '#bc13fe', fontSize: '1.8rem', fontWeight: 800 }}>{p.currentSemester || '—'}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: activeTab === tab.id ? 'linear-gradient(135deg,#0ff0fc,#bc13fe)' : 'rgba(255,255,255,0.06)', color: activeTab === tab.id ? '#000' : 'rgba(255,255,255,0.7)' }}>
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="glass-panel-dash" style={{ borderRadius: '16px', padding: '1.5rem' }}>
                        {activeTab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.2rem' }}>
                                <INFO_PAIR label="Father's Name" value={p.fatherName} />
                                <INFO_PAIR label="CNIC" value={p.cnic} />
                                <INFO_PAIR label="Phone" value={p.phone} />
                                <INFO_PAIR label="Gender" value={p.gender} />
                                <INFO_PAIR label="Blood Group" value={p.bloodGroup} />
                                <INFO_PAIR label="Nationality" value={p.nationality} />
                                <INFO_PAIR label="Department" value={p.department?.name} />
                                <INFO_PAIR label="Faculty" value={p.faculty?.name} />
                                <INFO_PAIR label="Section" value={p.section?.name} />
                                <INFO_PAIR label="Session" value={p.session?.name} />
                                <INFO_PAIR label="Batch" value={p.batch?.name} />
                                <INFO_PAIR label="Academic Status" value={p.academicStatus} />
                                <INFO_PAIR label="Admission Type" value={p.admissionType} />
                                <INFO_PAIR label="Completed Credits" value={p.completedCredits} />
                                <INFO_PAIR label="Remaining Credits" value={p.remainingCredits} />
                                <INFO_PAIR label="Guardian" value={p.guardianName} />
                                <INFO_PAIR label="Guardian Phone" value={p.guardianPhone} />
                                <INFO_PAIR label="Address" value={p.address} />
                            </div>
                        )}

                        {activeTab === 'academic' && (
                            <div>
                                <h4 style={{ color: '#0ff0fc', marginBottom: '1rem' }}>Enrolled Courses</h4>
                                {p.enrollments?.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr>{['Course', 'Code', 'Credits', 'Teacher', 'Section'].map(h => <th key={h} style={HEAD_CELL}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {p.enrollments.map((e, i) => (
                                                <tr key={i}>
                                                    <td style={CELL}>{e.course?.name || e.courseOffering?.course?.name || '—'}</td>
                                                    <td style={CELL}>{e.course?.code || e.courseOffering?.course?.code || '—'}</td>
                                                    <td style={CELL}>{e.course?.creditHours || '—'}</td>
                                                    <td style={CELL}>{e.teacher?.name || e.courseOffering?.teacher?.name || '—'}</td>
                                                    <td style={CELL}>{e.section?.name || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p style={{ color: 'rgba(255,255,255,0.4)' }}>No enrollment data found.</p>}
                            </div>
                        )}

                        {activeTab === 'results' && (
                            <div>
                                <h4 style={{ color: '#0ff0fc', marginBottom: '1rem' }}>Academic Results</h4>
                                {p.results?.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr>{['Course', 'Marks', 'Grade', 'GPA', 'Semester'].map(h => <th key={h} style={HEAD_CELL}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {p.results.map((r, i) => (
                                                <tr key={i}>
                                                    <td style={CELL}>{r.course?.name || r.courseName || '—'}</td>
                                                    <td style={CELL}>{r.marksObtained ?? '—'}/{r.totalMarks ?? '—'}</td>
                                                    <td style={CELL}><span style={{ color: r.grade === 'F' ? '#ff1b6b' : '#50cc7f', fontWeight: 700 }}>{r.grade || '—'}</span></td>
                                                    <td style={CELL}>{r.gpa?.toFixed(2) || '—'}</td>
                                                    <td style={CELL}>{r.semester || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p style={{ color: 'rgba(255,255,255,0.4)' }}>No result data found.</p>}
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div>
                                <h4 style={{ color: '#0ff0fc', marginBottom: '1rem' }}>Attendance Summary</h4>
                                {p.attendance?.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr>{['Course', 'Present', 'Absent', 'Percentage'].map(h => <th key={h} style={HEAD_CELL}>{h}</th>)}</tr></thead>
                                        <tbody>
                                            {p.attendance.map((a, i) => {
                                                const total = (a.present || 0) + (a.absent || 0);
                                                const pct = total > 0 ? ((a.present / total) * 100).toFixed(1) : '—';
                                                return (
                                                    <tr key={i}>
                                                        <td style={CELL}>{a.course?.name || a.courseName || '—'}</td>
                                                        <td style={CELL}>{a.present ?? '—'}</td>
                                                        <td style={CELL}>{a.absent ?? '—'}</td>
                                                        <td style={CELL}><span style={{ color: parseFloat(pct) >= 75 ? '#50cc7f' : '#ff1b6b', fontWeight: 600 }}>{pct}%</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : <p style={{ color: 'rgba(255,255,255,0.4)' }}>No attendance data found.</p>}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentProfile;
