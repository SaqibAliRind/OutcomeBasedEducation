import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchMarks, submitMarks, fetchMarksStats, 
    fetchMarksReports, updateMarkStatus, clearMarkMessages 
} from '../store/markSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { fetchAssessments } from '../store/assessmentDefSlice';
import { fetchSettings, updateSettingsCategory } from '../store/settingsSlice';
import { 
    ClipboardList, CheckCircle, Lock, AlertCircle, 
    FileText, Download, TrendingUp, BarChart2, Loader2, Save 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import '../style/MarksManagement.css';

const MarksManagement = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { records, stats, reports, loading, error, successMessage } = useSelector(state => state.marks);
    const offerings = useSelector(state => state.academic?.records?.courseofferings || []);
    const { assessments } = useSelector(state => state.assessmentDef);
    const settingsConfig = useSelector(state => state.settings.config);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState('');
    const [marksData, setMarksData] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [filterType, setFilterType] = useState('');
    
    // Admin Settings State
    const [marksSettings, setMarksSettings] = useState({
        lockAllMarks: false,
        gradeScales: []
    });

    const isTeacher = user?.role === 'Teacher';
    const isAdmin = ['UniversityAdmin', 'SuperAdmin'].includes(user?.role);

    useEffect(() => {
        dispatch(fetchAcademicData('courseofferings'));
        dispatch(fetchAssessments());
        if (isAdmin) {
            dispatch(fetchMarksStats());
            dispatch(fetchMarksReports('course'));
            dispatch(fetchSettings());
            dispatch(fetchMarks({}));
        } else if (isTeacher) {
            dispatch(fetchMarks({}));
            setActiveTab('entry');
        }
    }, [dispatch, isAdmin, isTeacher]);

    useEffect(() => {
        if (settingsConfig?.marks) {
            setMarksSettings({
                lockAllMarks: settingsConfig.marks.lockAllMarks || false,
                gradeScales: settingsConfig.marks.gradeScales || []
            });
        }
    }, [settingsConfig]);

    useEffect(() => {
        if (error || successMessage) {
            const timer = setTimeout(() => dispatch(clearMarkMessages()), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, successMessage, dispatch]);

    // Handle course and assessment selection
    useEffect(() => {
        if (selectedCourse && selectedAssessment) {
            const existingRecord = records.find(r => 
                r.courseOffering?._id === selectedCourse && 
                r.assessment?._id === selectedAssessment
            );

            if (existingRecord) {
                setMarksData(existingRecord.students.map(s => ({
                    student: s.student?._id || s.student,
                    name: s.student?.name || 'Unknown',
                    rollNo: s.student?.rollNo || 'N/A',
                    obtainedMarks: s.obtainedMarks,
                    remarks: s.remarks || ''
                })));
                setIsEditing(existingRecord.status === 'Draft');
            } else {
                // Pre-fill with enrolled students from course offering
                const offering = offerings.find(o => o._id === selectedCourse);
                if (offering && offering.enrolledStudents) {
                    setMarksData(offering.enrolledStudents.map(s => ({
                        student: s._id,
                        name: s.name,
                        rollNo: s.rollNo,
                        obtainedMarks: 0,
                        remarks: ''
                    })));
                }
                setIsEditing(true);
            }
        }
    }, [selectedCourse, selectedAssessment, records, offerings]);

    const handleMarksChange = (studentId, field, value) => {
        setMarksData(prev => prev.map(m => 
            m.student === studentId ? { ...m, [field]: value } : m
        ));
    };

    const handleSaveMarks = (status) => {
        if (!selectedCourse || !selectedAssessment) {
            alert('Please select course and assessment');
            return;
        }
        dispatch(submitMarks({
            courseOfferingId: selectedCourse,
            assessmentId: selectedAssessment,
            status,
            students: marksData
        }));
    };

    const handleUpdateStatus = (id, status) => {
        if (window.confirm(`Are you sure you want to change status to ${status}?`)) {
            dispatch(updateMarkStatus({ id, status }));
        }
    };

    const handleSaveSettings = () => {
        dispatch(updateSettingsCategory({ category: 'marks', data: marksSettings }));
    };

    const exportToExcel = () => {
        if (!records.length) return alert('No records to export');
        const data = records.map(r => ({
            Course: r.courseOffering?.course?.name || 'N/A',
            Assessment: r.assessment?.name || 'N/A',
            Teacher: r.teacher?.name || 'N/A',
            Status: r.status,
            'Total Students': r.students?.length || 0,
            Date: new Date(r.createdAt).toLocaleDateString()
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Marks Records");
        XLSX.writeFile(wb, "Marks_Records.xlsx");
    };

    const exportToPDF = () => {
        if (!records.length) return alert('No records to export');
        const doc = new jsPDF();
        doc.text("Marks Submission Report", 14, 15);
        const tableColumn = ["Course", "Assessment", "Teacher", "Status", "Date"];
        const tableRows = records.map(r => [
            r.courseOffering?.course?.name || 'N/A',
            r.assessment?.name || 'N/A',
            r.teacher?.name || 'N/A',
            r.status,
            new Date(r.createdAt).toLocaleDateString()
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("Marks_Report.pdf");
    };

    const exportTemplate = () => {
        if (!marksData.length) return alert('No students found to export.');
        const data = marksData.map(s => ({
            'Roll No': s.rollNo,
            'Name': s.name,
            'Obtained Marks': s.obtainedMarks || 0,
            'Remarks': s.remarks || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Marks Template");
        XLSX.writeFile(wb, "Marks_Entry_Template.xlsx");
    };

    const importExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            setMarksData(prev => prev.map(student => {
                const importedRow = data.find(row => String(row['Roll No']) === String(student.rollNo));
                if (importedRow) {
                    return {
                        ...student,
                        obtainedMarks: Number(importedRow['Obtained Marks']) || 0,
                        remarks: importedRow['Remarks'] || ''
                    };
                }
                return student;
            }));
            e.target.value = null; // reset input
        };
        reader.readAsBinaryString(file);
    };

    // Filter offerings for Teacher
    const myOfferings = isTeacher 
        ? offerings.filter(o => o.teacher?._id === user._id || o.teacher === user._id)
        : offerings;

    return (
        <div className="marks-container fade-in" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="icon-wrapper primary"><ClipboardList size={28} /></div>
                    <div>
                        <h1>Marks Management</h1>
                        <p>{isAdmin ? 'Monitor and manage university-wide marks' : 'Enter and submit student marks'}</p>
                    </div>
                </div>
            </header>

            {(error || successMessage) && (
                <div className={`alert ${error ? 'alert-danger' : 'alert-success'} fade-in`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {error ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    {error || successMessage}
                </div>
            )}

            <div className="tabs-wrapper">
                {isAdmin && (
                    <>
                        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                        <button className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>Marks Monitoring</button>
                        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Marks Settings</button>
                        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports & Exports</button>
                    </>
                )}
                {isTeacher && (
                    <>
                        <button className={`tab-btn ${activeTab === 'entry' ? 'active' : ''}`} onClick={() => setActiveTab('entry')}>Marks Entry</button>
                        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Submission History</button>
                    </>
                )}
            </div>

            <div className="tab-content" style={{ width: '100%', boxSizing: 'border-box' }}>
                
                {/* --- DASHBOARD TAB (ADMIN) --- */}
                {activeTab === 'dashboard' && isAdmin && (
                    <div className="fade-in">
                        <h3 className="section-title mb-4">Marks Submission Overview</h3>

                        {/* KPI CARDS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            {[
                                { label: 'Total', value: stats?.Total || 0, color: '#0ff0fc' },
                                { label: 'Draft', value: stats?.Draft || 0, color: '#ffcc00' },
                                { label: 'Pending', value: stats?.Submitted || 0, color: '#bc13fe' },
                                { label: 'Verified', value: stats?.Verified || 0, color: '#50cc7f' },
                                { label: 'Locked', value: stats?.Locked || 0, color: '#ff1b6b' },
                            ].map((card, i) => (
                                <div key={i} style={{ background: `${card.color}10`, border: `1px solid ${card.color}30`, borderRadius: '14px', padding: '1.2rem', textAlign: 'center' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{card.label}</div>
                                    <div style={{ color: card.color, fontSize: '2.2rem', fontWeight: '800', lineHeight: 1 }}>{card.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* CHARTS ROW */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

                            {/* DONUT — Status Breakdown */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
                                <h4 style={{ color: '#fff', margin: '0 0 1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📊 Submission Status Distribution
                                </h4>
                                {(() => {
                                    const donutData = [
                                        { name: 'Draft', value: stats?.Draft || 0, fill: '#ffcc00' },
                                        { name: 'Submitted', value: stats?.Submitted || 0, fill: '#bc13fe' },
                                        { name: 'Verified', value: stats?.Verified || 0, fill: '#50cc7f' },
                                        { name: 'Locked', value: stats?.Locked || 0, fill: '#ff1b6b' },
                                    ].filter(d => d.value > 0);
                                    const total = donutData.reduce((sum, d) => sum + d.value, 0);
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <ResponsiveContainer width={170} height={170}>
                                                <RechartsPieChart>
                                                    <Pie data={donutData.length ? donutData : [{ name: 'No Data', value: 1, fill: 'rgba(255,255,255,0.08)' }]}
                                                        cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={donutData.length ? 3 : 0} dataKey="value" strokeWidth={0}>
                                                        {donutData.length ? donutData.map((e, i) => <Cell key={i} fill={e.fill} />) : <Cell fill="rgba(255,255,255,0.08)" />}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>TOTAL</div>
                                                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>{total}</div>
                                                {donutData.map((d, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.fill, flexShrink: 0 }} />
                                                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', flex: 1 }}>{d.name}</span>
                                                        <span style={{ color: d.fill, fontWeight: '700', fontSize: '0.9rem' }}>{d.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* BAR — Course-wise Average Marks */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
                                <h4 style={{ color: '#fff', margin: '0 0 1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    📈 Course Average Marks
                                </h4>
                                {reports.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={170}>
                                        <BarChart data={reports.slice(0, 6)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                                            <RechartsTooltip contentStyle={{ background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                            <Bar dataKey="avgMarks" name="Avg Marks" radius={[6, 6, 0, 0]}>
                                                {reports.slice(0, 6).map((_, i) => (
                                                    <Cell key={i} fill={['#0ff0fc', '#bc13fe', '#50cc7f', '#ffcc00', '#ff1b6b', '#45caff'][i % 6]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                                        No submissions yet — data will appear here once marks are submitted.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SUBMISSION ACTIVITY — Radial / Progress style bars */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem' }}>
                            <h4 style={{ color: '#fff', margin: '0 0 1.2rem', fontSize: '1rem' }}>🎯 Marks Workflow Progress</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Draft', value: stats?.Draft || 0, total: stats?.Total || 1, color: '#ffcc00' },
                                    { label: 'Submitted (Pending Verification)', value: stats?.Submitted || 0, total: stats?.Total || 1, color: '#bc13fe' },
                                    { label: 'Verified', value: stats?.Verified || 0, total: stats?.Total || 1, color: '#50cc7f' },
                                    { label: 'Locked (Finalized)', value: stats?.Locked || 0, total: stats?.Total || 1, color: '#ff1b6b' },
                                ].map((item, i) => {
                                    const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem' }}>{item.label}</span>
                                                <span style={{ color: item.color, fontWeight: '700', fontSize: '0.85rem' }}>{item.value} ({pct}%)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}


                {/* --- SETTINGS TAB (ADMIN) --- */}
                {activeTab === 'settings' && isAdmin && (
                    <div className="fade-in">
                        <h3 className="section-title mb-4">Marks Configuration</h3>
                        
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#ff1b6b', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <Lock size={20} /> Security Settings
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={marksSettings.lockAllMarks}
                                        onChange={(e) => setMarksSettings({...marksSettings, lockAllMarks: e.target.checked})}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>Lock all marks submission globally (Teachers will not be able to submit or edit)</span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <BarChart2 size={20} /> Grade Scales Configuration
                            </h4>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Define grading criteria (A, B, C, F) based on percentage. This will be used in transcript generation.</p>
                            
                            <table className="glass-table" style={{ marginBottom: '1rem', width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Grade</th>
                                        <th>Min %</th>
                                        <th>Max %</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marksSettings.gradeScales.map((scale, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input type="text" className="form-control" value={scale.grade} onChange={e => {
                                                    const newScales = [...marksSettings.gradeScales];
                                                    newScales[index].grade = e.target.value;
                                                    setMarksSettings({...marksSettings, gradeScales: newScales});
                                                }} placeholder="e.g. A+" />
                                            </td>
                                            <td>
                                                <input type="number" className="form-control" value={scale.min} onChange={e => {
                                                    const newScales = [...marksSettings.gradeScales];
                                                    newScales[index].min = Number(e.target.value);
                                                    setMarksSettings({...marksSettings, gradeScales: newScales});
                                                }} />
                                            </td>
                                            <td>
                                                <input type="number" className="form-control" value={scale.max} onChange={e => {
                                                    const newScales = [...marksSettings.gradeScales];
                                                    newScales[index].max = Number(e.target.value);
                                                    setMarksSettings({...marksSettings, gradeScales: newScales});
                                                }} />
                                            </td>
                                            <td>
                                                <button className="action-btn delete" onClick={() => {
                                                    const newScales = marksSettings.gradeScales.filter((_, i) => i !== index);
                                                    setMarksSettings({...marksSettings, gradeScales: newScales});
                                                }}>Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button className="secondary-btn" onClick={() => setMarksSettings({...marksSettings, gradeScales: [...marksSettings.gradeScales, { grade: '', min: 0, max: 100 }]})}>
                                + Add Grade Rule
                            </button>
                        </div>

                        <button className="primary-btn" onClick={handleSaveSettings} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> Save Settings
                        </button>
                    </div>
                )}


                {/* --- MONITORING TAB (ADMIN) --- */}
                {activeTab === 'monitoring' && isAdmin && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className="section-title m-0">Verify & Lock Marks</h3>
                            <div>
                                <select 
                                    className="form-control" 
                                    style={{ width: '200px' }}
                                    value={filterType}
                                    onChange={e => setFilterType(e.target.value)}
                                >
                                    <option value="">All Assessment Types</option>
                                    <option value="Quiz">Quiz</option>
                                    <option value="Assignment">Assignment</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Presentation">Presentation</option>
                                    <option value="Project">Project</option>
                                    <option value="Mid">Mid</option>
                                    <option value="Final">Final</option>
                                    <option value="Viva">Viva</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="table-responsive">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Assessment</th>
                                        <th>Teacher</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records
                                        .filter(r => filterType ? r.assessment?.type === filterType : true)
                                        .map(record => (
                                        <tr key={record._id}>
                                            <td>{record.courseOffering?.course?.name}</td>
                                            <td>{record.assessment?.name} ({record.assessment?.type})</td>
                                            <td>{record.teacher?.name}</td>
                                            <td>
                                                <span className={`badge badge-${record.status.toLowerCase()}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td>
                                                {record.status === 'Submitted' && (
                                                    <button className="action-btn verify-btn" onClick={() => handleUpdateStatus(record._id, 'Verified')} title="Verify Marks">
                                                        <CheckCircle size={16} color="#50cc7f" />
                                                    </button>
                                                )}
                                                {record.status === 'Verified' && (
                                                    <button className="action-btn lock-btn" onClick={() => handleUpdateStatus(record._id, 'Locked')} title="Lock Marks">
                                                        <Lock size={16} color="#ff1b6b" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {records.filter(r => filterType ? r.assessment?.type === filterType : true).length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No submissions found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- REPORTS TAB (ADMIN) --- */}
                {activeTab === 'reports' && isAdmin && (() => {
                    // ── Computed aggregates from records ──────────────────────────
                    const totalStudents = records.reduce((a, r) => a + (r.students?.length || 0), 0);
                    const totalVerified = records.filter(r => r.status === 'Verified' || r.status === 'Locked').length;

                    // Department aggregation
                    const deptMap = {};
                    records.forEach(r => {
                        const dept = r.courseOffering?.course?.department?.name || r.courseOffering?.department?.name || 'Unknown';
                        if (!deptMap[dept]) deptMap[dept] = { dept, total: 0, submitted: 0, verified: 0, locked: 0 };
                        deptMap[dept].total++;
                        if (r.status === 'Submitted') deptMap[dept].submitted++;
                        if (r.status === 'Verified')  deptMap[dept].verified++;
                        if (r.status === 'Locked')    deptMap[dept].locked++;
                    });
                    const deptRows = Object.values(deptMap);

                    // Course aggregation
                    const courseMap = {};
                    records.forEach(r => {
                        const key = r.courseOffering?.course?._id || 'unk';
                        const name = r.courseOffering?.course?.name || 'Unknown';
                        const code = r.courseOffering?.course?.code || '';
                        if (!courseMap[key]) courseMap[key] = { name, code, submissions: 0, verified: 0, locked: 0, students: 0 };
                        courseMap[key].submissions++;
                        if (r.status === 'Verified') courseMap[key].verified++;
                        if (r.status === 'Locked')   courseMap[key].locked++;
                        courseMap[key].students += r.students?.length || 0;
                    });
                    const courseRows = Object.values(courseMap);

                    // Teacher aggregation (for Teacher Submission Status)
                    const teacherMap = {};
                    records.forEach(r => {
                        const key = r.teacher?._id || 'unk';
                        const name = r.teacher?.name || 'Unknown';
                        const email = r.teacher?.email || '';
                        if (!teacherMap[key]) teacherMap[key] = { name, email, draft: 0, submitted: 0, verified: 0, locked: 0, total: 0 };
                        teacherMap[key].total++;
                        if (r.status === 'Draft')     teacherMap[key].draft++;
                        if (r.status === 'Submitted') teacherMap[key].submitted++;
                        if (r.status === 'Verified')  teacherMap[key].verified++;
                        if (r.status === 'Locked')    teacherMap[key].locked++;
                    });
                    const teacherRows = Object.values(teacherMap);

                    const exportSection = (dataArr, cols, filename) => {
                        const ws = XLSX.utils.json_to_sheet(dataArr.map(row => {
                            const obj = {};
                            cols.forEach(c => { obj[c.label] = row[c.key] ?? ''; });
                            return obj;
                        }));
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Report');
                        XLSX.writeFile(wb, `${filename}.xlsx`);
                    };

                    return (
                        <div className="fade-in">
                            {/* ── Header with Global Export ── */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 className="section-title m-0">Reports</h3>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="outline-btn" onClick={exportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={18} /> Export Excel
                                    </button>
                                    <button className="outline-btn" onClick={exportToPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Download size={18} /> Export PDF
                                    </button>
                                </div>
                            </div>

                            {/* ═══════════════════════════════════════════
                                 1. MARKS SUMMARY
                            ═══════════════════════════════════════════ */}
                            <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#0ff0fc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📋 Marks Summary
                                    </h4>
                                    <button className="outline-btn" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                                        onClick={() => exportSection([{
                                            'Total Submissions': records.length,
                                            'Draft': stats?.Draft || 0,
                                            'Submitted': stats?.Submitted || 0,
                                            'Verified': stats?.Verified || 0,
                                            'Locked': stats?.Locked || 0,
                                            'Total Students Graded': totalStudents
                                        }], [], 'Marks_Summary')}>
                                        <Download size={14} /> Export
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                    {[
                                        { label: 'Total Submissions', val: records.length, color: '#0ff0fc' },
                                        { label: 'Draft', val: stats?.Draft || 0, color: '#ffcc00' },
                                        { label: 'Submitted', val: stats?.Submitted || 0, color: '#bc13fe' },
                                        { label: 'Verified', val: stats?.Verified || 0, color: '#50cc7f' },
                                        { label: 'Locked', val: stats?.Locked || 0, color: '#ff1b6b' },
                                        { label: 'Students Graded', val: totalStudents, color: '#45caff' },
                                    ].map((c, i) => (
                                        <div key={i} style={{ background: `${c.color}10`, border: `1px solid ${c.color}25`, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{c.label}</div>
                                            <div style={{ color: c.color, fontSize: '2rem', fontWeight: '800' }}>{c.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ═══════════════════════════════════════════
                                 2. DEPARTMENT MARKS
                            ═══════════════════════════════════════════ */}
                            <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#bc13fe', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        🏛️ Department Marks
                                    </h4>
                                    <button className="outline-btn" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                                        onClick={() => exportSection(deptRows, [
                                            { label: 'Department', key: 'dept' },
                                            { label: 'Total Submissions', key: 'total' },
                                            { label: 'Submitted', key: 'submitted' },
                                            { label: 'Verified', key: 'verified' },
                                            { label: 'Locked', key: 'locked' },
                                        ], 'Department_Marks')}>
                                        <Download size={14} /> Export
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Department</th>
                                                <th style={{ textAlign: 'center' }}>Total</th>
                                                <th style={{ textAlign: 'center' }}>Submitted</th>
                                                <th style={{ textAlign: 'center' }}>Verified</th>
                                                <th style={{ textAlign: 'center' }}>Locked</th>
                                                <th style={{ textAlign: 'center' }}>Completion</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deptRows.length === 0 && (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No data available</td></tr>
                                            )}
                                            {deptRows.map((row, i) => {
                                                const pct = row.total > 0 ? Math.round(((row.verified + row.locked) / row.total) * 100) : 0;
                                                return (
                                                    <tr key={i}>
                                                        <td style={{ fontWeight: '600', color: '#fff' }}>{row.dept}</td>
                                                        <td style={{ textAlign: 'center' }}>{row.total}</td>
                                                        <td style={{ textAlign: 'center' }}><span className="badge badge-submitted">{row.submitted}</span></td>
                                                        <td style={{ textAlign: 'center' }}><span className="badge badge-verified">{row.verified}</span></td>
                                                        <td style={{ textAlign: 'center' }}><span className="badge badge-locked">{row.locked}</span></td>
                                                        <td style={{ textAlign: 'center', minWidth: '120px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? '#50cc7f' : '#ffcc00', transition: 'width 0.6s ease' }} />
                                                                </div>
                                                                <span style={{ color: pct >= 75 ? '#50cc7f' : '#ffcc00', fontSize: '0.8rem', fontWeight: '700', minWidth: '32px' }}>{pct}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* ═══════════════════════════════════════════
                                 3. COURSE MARKS
                            ═══════════════════════════════════════════ */}
                            <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#ffcc00', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        📚 Course Marks
                                    </h4>
                                    <button className="outline-btn" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                                        onClick={() => exportSection(courseRows, [
                                            { label: 'Code', key: 'code' },
                                            { label: 'Course', key: 'name' },
                                            { label: 'Total Submissions', key: 'submissions' },
                                            { label: 'Verified', key: 'verified' },
                                            { label: 'Locked', key: 'locked' },
                                            { label: 'Students Graded', key: 'students' },
                                        ], 'Course_Marks')}>
                                        <Download size={14} /> Export
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Course Name</th>
                                                <th style={{ textAlign: 'center' }}>Submissions</th>
                                                <th style={{ textAlign: 'center' }}>Verified</th>
                                                <th style={{ textAlign: 'center' }}>Locked</th>
                                                <th style={{ textAlign: 'center' }}>Students</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courseRows.length === 0 && (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No data available</td></tr>
                                            )}
                                            {courseRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td><span style={{ color: '#0ff0fc', fontWeight: '700', fontFamily: 'monospace' }}>{row.code}</span></td>
                                                    <td style={{ color: '#fff' }}>{row.name}</td>
                                                    <td style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)' }}>{row.submissions}</td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge badge-verified">{row.verified}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge badge-locked">{row.locked}</span></td>
                                                    <td style={{ textAlign: 'center', color: '#45caff', fontWeight: '600' }}>{row.students}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* ═══════════════════════════════════════════
                                 4. TEACHER SUBMISSION STATUS
                            ═══════════════════════════════════════════ */}
                            <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h4 style={{ color: '#50cc7f', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        👩‍🏫 Teacher Submission Status
                                    </h4>
                                    <button className="outline-btn" style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                                        onClick={() => exportSection(teacherRows, [
                                            { label: 'Teacher', key: 'name' },
                                            { label: 'Email', key: 'email' },
                                            { label: 'Total', key: 'total' },
                                            { label: 'Draft', key: 'draft' },
                                            { label: 'Submitted', key: 'submitted' },
                                            { label: 'Verified', key: 'verified' },
                                            { label: 'Locked', key: 'locked' },
                                        ], 'Teacher_Submission_Status')}>
                                        <Download size={14} /> Export
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Teacher</th>
                                                <th>Email</th>
                                                <th style={{ textAlign: 'center' }}>Total</th>
                                                <th style={{ textAlign: 'center' }}>Draft</th>
                                                <th style={{ textAlign: 'center' }}>Submitted</th>
                                                <th style={{ textAlign: 'center' }}>Verified</th>
                                                <th style={{ textAlign: 'center' }}>Locked</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacherRows.length === 0 && (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No data available</td></tr>
                                            )}
                                            {teacherRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: '600', color: '#fff' }}>{row.name}</td>
                                                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{row.email}</td>
                                                    <td style={{ textAlign: 'center', color: '#0ff0fc', fontWeight: '700' }}>{row.total}</td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge badge-draft">{row.draft}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge badge-submitted">{row.submitted}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge badge-verified">{row.verified}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="badge badge-locked">{row.locked}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    );
                })()}


                {/* --- MARKS ENTRY TAB (TEACHER) --- */}
                {activeTab === 'entry' && isTeacher && (
                    <div className="fade-in">
                        {settingsConfig?.marks?.lockAllMarks ? (
                            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Lock size={20} /> Marks submission is currently locked by Administration.
                            </div>
                        ) : (
                            <>
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div className="form-group">
                                        <label>Select Course</label>
                                        <select 
                                            value={selectedCourse} 
                                            onChange={(e) => { setSelectedCourse(e.target.value); setMarksData([]); }}
                                            className="form-control"
                                        >
                                            <option value="">-- Select Course --</option>
                                            {myOfferings.map(o => (
                                                <option key={o._id} value={o._id}>{o.course?.name} ({o.section?.name})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Select Assessment</label>
                                        <select 
                                            value={selectedAssessment} 
                                            onChange={(e) => setSelectedAssessment(e.target.value)}
                                            className="form-control"
                                        >
                                            <option value="">-- Select Assessment --</option>
                                            {assessments.map(a => (
                                                <option key={a._id} value={a._id}>{a.name} ({a.type} - {a.totalMarks} marks)</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {selectedCourse && selectedAssessment && (
                                    <div className="marks-entry-section fade-in">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                                            <h4 style={{ color: 'var(--uni-primary)', margin: 0 }}>Student List</h4>
                                            
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                {/* Import / Export Tools */}
                                                <button 
                                                    className="outline-btn" 
                                                    onClick={exportTemplate}
                                                    title="Download Excel Template"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                                >
                                                    <Download size={16} /> Template
                                                </button>
                                                <label className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', margin: 0 }}>
                                                    <FileText size={16} /> Import
                                                    <input type="file" accept=".xlsx, .xls" onChange={importExcel} style={{ display: 'none' }} disabled={!isEditing} />
                                                </label>
                                                
                                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' }}></div>
                                                
                                                <button 
                                                    className="outline-btn" 
                                                    onClick={() => handleSaveMarks('Draft')}
                                                    disabled={!isEditing || loading}
                                                >
                                                    Save as Draft
                                                </button>
                                                <button 
                                                    className="primary-btn" 
                                                    onClick={() => handleSaveMarks('Submitted')}
                                                    disabled={!isEditing || loading}
                                                >
                                                    {loading ? <Loader2 size={18} className="spin" /> : 'Final Submit'}
                                                </button>
                                            </div>
                                        </div>

                                        {!isEditing && (
                                            <div className="alert alert-warning mb-3">
                                                These marks have been submitted and are locked from editing. Contact Admin to unlock.
                                            </div>
                                        )}

                                        <div className="table-responsive">
                                            <table className="glass-table">
                                                <thead>
                                                    <tr>
                                                        <th>Roll No</th>
                                                        <th>Name</th>
                                                        <th>Obtained Marks</th>
                                                        <th>Remarks (Optional)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {marksData.length > 0 ? marksData.map((student) => (
                                                        <tr key={student.student}>
                                                            <td>{student.rollNo}</td>
                                                            <td>{student.name}</td>
                                                            <td>
                                                                <input 
                                                                    type="number" 
                                                                    min="0"
                                                                    className="form-control" 
                                                                    style={{ maxWidth: '120px', padding: '0.4rem' }}
                                                                    value={student.obtainedMarks}
                                                                    onChange={(e) => handleMarksChange(student.student, 'obtainedMarks', Number(e.target.value))}
                                                                    disabled={!isEditing}
                                                                />
                                                            </td>
                                                            <td>
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control" 
                                                                    style={{ padding: '0.4rem' }}
                                                                    value={student.remarks}
                                                                    onChange={(e) => handleMarksChange(student.student, 'remarks', e.target.value)}
                                                                    disabled={!isEditing}
                                                                    placeholder="e.g. Absent, Late"
                                                                />
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No students found in this course</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* --- HISTORY TAB (TEACHER) --- */}
                {activeTab === 'history' && isTeacher && (
                    <div className="fade-in">
                        <h3 className="section-title mb-4">My Submissions</h3>
                        <div className="table-responsive">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Assessment</th>
                                        <th>Status</th>
                                        <th>Date Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(record => (
                                        <tr key={record._id}>
                                            <td>{record.courseOffering?.course?.name}</td>
                                            <td>{record.assessment?.name}</td>
                                            <td>
                                                <span className={`badge badge-${record.status.toLowerCase()}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {records.length === 0 && (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No submission history found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MarksManagement;
