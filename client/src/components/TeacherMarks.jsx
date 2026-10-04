import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Save, Search, CheckCircle, FileSpreadsheet, Lock, AlertTriangle, UserCheck, BarChart2, Calculator } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TeacherMarks = ({ initialOfferingId = '' }) => {
    const { token } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(initialOfferingId);
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState('');
    
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({});
    const [markRecord, setMarkRecord] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load assigned courses
    useEffect(() => {
        axios.get(`${API}/teachers/courses`, { headers: hdrs })
            .then(r => setCourses(r.data || []))
            .catch(console.error);
    }, []);

    // Load Assessments & Students when offering changes
    useEffect(() => {
        if (!selectedOffering) return;
        setLoading(true);
        const fetchDetails = async () => {
            try {
                // 1. Get Assessments for this offering
                const offering = courses.find(c => c._id === selectedOffering);
                let aRes = { data: [] };
                if (offering?.course?._id) {
                    aRes = await axios.get(`${API}/assessments-def?course=${offering.course._id}`, { headers: hdrs });
                }
                setAssessments(aRes.data);
                
                if (aRes.data.length > 0) {
                    setSelectedAssessment(aRes.data[0]._id);
                }

                // 2. Get students in this offering
                const sectionId = offering?.section?._id;
                if (sectionId) {
                    const stuRes = await axios.get(`${API}/enrollments?courseOffering=${selectedOffering}`, { headers: hdrs });
                    let stuList = (stuRes.data || []).map(e => e.student).filter(Boolean);
                    
                    // Fallback if no formal enrollments exist
                    if (stuList.length === 0) {
                        try {
                            const fallbackRes = await axios.get(`${API}/users?role=Student&section=${sectionId}`, { headers: hdrs });
                            stuList = fallbackRes.data || [];
                        } catch(e) {
                            console.error("Fallback fetch failed", e);
                        }
                    }
                    setStudents(stuList);
                }
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [selectedOffering, courses]);

    // Load existing Marks when Assessment changes
    useEffect(() => {
        if (!selectedAssessment || !selectedOffering) return;
        setLoading(true);
        axios.get(`${API}/marks?courseOffering=${selectedOffering}&assessment=${selectedAssessment}`, { headers: hdrs })
            .then(r => {
                const record = r.data[0];
                if (record) {
                    setMarkRecord(record);
                    const map = {};
                    record.students.forEach(s => {
                        map[s.student._id || s.student] = s.obtainedMarks;
                    });
                    setMarksData(map);
                } else {
                    setMarkRecord(null);
                    setMarksData({});
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedAssessment, selectedOffering]);

    const handleMarkChange = (studentId, val) => {
        setMarksData(prev => ({ ...prev, [studentId]: val }));
    };

    const handleSave = async (status) => {
        try {
            const payload = {
                assessmentId: selectedAssessment,
                courseOfferingId: selectedOffering,
                status,
                students: students.map(s => ({
                    student: s._id,
                    obtainedMarks: Number(marksData[s._id] || 0)
                }))
            };
            
            await axios.post(`${API}/marks/submit`, payload, { headers: hdrs });
            showToast(`Marks ${status === 'Draft' ? 'saved as Draft' : 'Submitted'}`);
            
            // Reload
            const r = await axios.get(`${API}/marks?courseOffering=${selectedOffering}&assessment=${selectedAssessment}`, { headers: hdrs });
            setMarkRecord(r.data[0]);
        } catch (error) {
            showToast(error.response?.data?.message || 'Error saving marks', 'error');
        }
    };

    const handleCalculateObe = async () => {
        if (!selectedOffering) return showToast('Please select a course offering first.', 'error');
        setLoading(true);
        try {
            const r = await axios.post(`${API}/obe/calculate/${selectedOffering}`, {}, { headers: hdrs });
            showToast(r.data.message || 'OBE Attainment Calculated Successfully!');
        } catch (error) {
            showToast(error.response?.data?.message || 'Error calculating OBE', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isLocked = markRecord && ['Verified', 'Locked'].includes(markRecord.status);
    const currAssessment = assessments.find(a => a._id === selectedAssessment) || {};
    
    // Auto Grade calculation helper
    const getGrade = (obtained, total) => {
        if (!total) return { g: '-', p: 0, gpa: 0.0 };
        const p = (obtained / total) * 100;
        if (p >= 90) return { g: 'A+', p, gpa: 4.00 };
        if (p >= 85) return { g: 'A', p, gpa: 4.00 };
        if (p >= 80) return { g: 'A-', p, gpa: 3.70 };
        if (p >= 75) return { g: 'B+', p, gpa: 3.30 };
        if (p >= 70) return { g: 'B', p, gpa: 3.00 };
        if (p >= 65) return { g: 'B-', p, gpa: 2.70 };
        if (p >= 60) return { g: 'C+', p, gpa: 2.30 };
        if (p >= 55) return { g: 'C', p, gpa: 2.00 };
        if (p >= 50) return { g: 'D', p, gpa: 1.00 };
        return { g: 'F', p, gpa: 0.00 };
    };

    const totalStudents = students.length;
    const entered = Object.values(marksData).filter(v => v !== '').length;
    const pending = totalStudents - entered;

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <BarChart2 size={22} color="#ff6b35" /> Marks Management
                </h3>
                {selectedOffering && (
                    <button onClick={handleCalculateObe} className="primary-btn">
                        <Calculator size={16} /> Calculate OBE
                    </button>
                )}
            </div>

            {/* Selection Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Select Course Offering</label>
                    <select value={selectedOffering} onChange={e => setSelectedOffering(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        <option value="">-- Choose Course --</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.course?.code} – {c.course?.name} | {c.section?.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Select Assessment</label>
                    <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)} disabled={!selectedOffering} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        {assessments.length === 0 ? (
                            <option value="">No Assessments Found</option>
                        ) : (
                            assessments.map(a => (
                                <option key={a._id} value={a._id}>{a.name} ({a.type}) - Max {a.totalMarks}</option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#ff6b35' }}>Loading...</div>
            ) : !selectedOffering || !selectedAssessment ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Please select a course and assessment.</div>
            ) : (
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { label: 'Total Students', val: totalStudents, color: '#0ff0fc' },
                            { label: 'Marks Entered', val: entered, color: '#10B981' },
                            { label: 'Pending', val: pending, color: '#F59E0B' },
                            { label: 'Draft Status', val: markRecord?.status === 'Draft' ? 'Yes' : 'No', color: '#ff6b35' },
                            { label: 'Submitted', val: markRecord?.status === 'Submitted' || isLocked ? 'Yes' : 'No', color: '#bc13fe' }
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: s.color }}>{s.val}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <div>
                            <h4 style={{ margin: 0, color: '#0ff0fc' }}>{currAssessment.name} <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 'normal' }}>({currAssessment.type})</span></h4>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>Max Marks: {currAssessment.totalMarks} | Weightage: {currAssessment.weightage}%</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {markRecord && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: isLocked ? 'rgba(245,158,11,0.1)' : 'rgba(15,240,252,0.1)', color: isLocked ? '#F59E0B' : '#0ff0fc' }}>
                                    {isLocked ? <Lock size={14} /> : <CheckCircle size={14} />} {markRecord.status}
                                </span>
                            )}
                            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                                <FileSpreadsheet size={16} color="#10B981" /> Import CSV
                            </button>
                            {!isLocked && (
                                <>
                                    <button onClick={() => handleSave('Draft')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', color: '#0ff0fc', cursor: 'pointer' }}>
                                        <Save size={16} /> Save Draft
                                    </button>
                                    <button onClick={() => handleSave('Submitted')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg, #0ff0fc, #bc13fe)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                                        <UserCheck size={16} /> Submit Marks
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>Roll No</th>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>Student Name</th>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>Marks Obtained</th>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>Percentage</th>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>Grade</th>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>GPA</th>
                                    <th style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.5)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, i) => {
                                    const val = marksData[s._id] || '';
                                    const { g, p, gpa } = getGrade(Number(val) || 0, currAssessment.totalMarks);
                                    const isInvalid = val !== '' && (Number(val) > currAssessment.totalMarks || Number(val) < 0);

                                    return (
                                        <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                            <td style={{ padding: '12px 10px' }}>{s.rollNo || `STD-00${i+1}`}</td>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{s.name}</td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <input 
                                                    type="number" 
                                                    max={currAssessment.totalMarks}
                                                    min={0}
                                                    value={val}
                                                    onChange={e => handleMarkChange(s._id, e.target.value)}
                                                    disabled={isLocked}
                                                    style={{ 
                                                        width: '80px', padding: '6px', borderRadius: '4px', 
                                                        background: isLocked ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)', 
                                                        border: `1px solid ${isInvalid ? '#ff1b6b' : 'rgba(255,255,255,0.2)'}`, 
                                                        color: '#fff', textAlign: 'center', outline: 'none'
                                                    }} 
                                                />
                                            </td>
                                            <td style={{ padding: '12px 10px', color: val !== '' ? '#0ff0fc' : 'rgba(255,255,255,0.2)' }}>
                                                {val !== '' ? `${p.toFixed(1)}%` : '-'}
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', background: val !== '' ? (g === 'F' ? 'rgba(255,27,107,0.1)' : 'rgba(16,185,129,0.1)') : 'rgba(255,255,255,0.05)', color: val !== '' ? (g === 'F' ? '#ff1b6b' : '#10B981') : 'rgba(255,255,255,0.3)' }}>
                                                    {val !== '' ? g : '-'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 10px', color: val !== '' ? (gpa >= 3.0 ? '#10B981' : gpa >= 2.0 ? '#F59E0B' : '#ff1b6b') : 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}>
                                                {val !== '' ? gpa.toFixed(2) : '-'}
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>
                                                {isInvalid ? (
                                                    <span style={{ color: '#ff1b6b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={14} /> Invalid</span>
                                                ) : val === '' ? (
                                                    <span style={{ color: '#F59E0B', fontSize: '0.8rem' }}>Pending</span>
                                                ) : (
                                                    <span style={{ color: '#10B981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Entered</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>No students found in this section.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherMarks;
