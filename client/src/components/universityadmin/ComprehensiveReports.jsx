import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicReports, fetchObeReports, fetchAttendanceReports, fetchMarksReports, fetchAccreditationReports } from '../../store/reportsSlice';
import { Loader2, Download, BarChart2, BookOpen, Target, Calendar, CheckSquare, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../../style/Dashboard.css';


const ComprehensiveReports = () => {
    const dispatch = useDispatch();
    const { academic, obe, attendance, marks, accreditation, loading } = useSelector((state) => state.reports);
    
    const [activeTab, setActiveTab] = useState('academic');
    const [activeAcademicSubTab, setActiveAcademicSubTab] = useState('students');

    useEffect(() => {
        dispatch(fetchAcademicReports());
        dispatch(fetchObeReports());
        dispatch(fetchAttendanceReports());
        dispatch(fetchMarksReports());
        dispatch(fetchAccreditationReports());
    }, [dispatch]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Comprehensive Report - ${activeTab.toUpperCase()}`, 14, 15);
        
        let head = [];
        let body = [];
        
        if (activeTab === 'academic') {
            if (activeAcademicSubTab === 'students' && academic?.students) {
                head = [['Name', 'Email', 'Status', 'Join Date']];
                body = academic.students.map(s => [s.name, s.email, s.status, new Date(s.joinDate).toLocaleDateString()]);
            } else if (activeAcademicSubTab === 'teachers' && academic?.teachers) {
                head = [['Name', 'Email', 'Status', 'Join Date']];
                body = academic.teachers.map(t => [t.name, t.email, t.status, new Date(t.joinDate).toLocaleDateString()]);
            } else if (activeAcademicSubTab === 'courses' && academic?.courses) {
                head = [['Code', 'Name', 'Credits', 'Department']];
                body = academic.courses.map(c => [c.code, c.name, c.credits, c.department]);
            }
        } else if (activeTab === 'attendance' && attendance) {
            head = [['Name', 'Email', 'Present', 'Absent', 'Percentage']];
            body = attendance.map(a => [a.name, a.email, a.present, a.absent, a.percentage]);
        } else if (activeTab === 'marks' && marks) {
            head = [['Student Name', 'Course Name', 'Session', 'Grade']];
            body = marks.map(m => [m.studentName, m.courseName, m.session, m.grade]);
        }
        
        if (head.length > 0) {
            doc.autoTable({ startY: 25, head, body, theme: 'grid', styles: { fontSize: 8 } });
            doc.save(`${activeTab}_report.pdf`);
        } else {
            alert('No data available to export for this view.');
        }
    };

    const handleExportExcel = () => {
        let data = [];
        if (activeTab === 'academic') {
            if (activeAcademicSubTab === 'students' && academic?.students) data = academic.students;
            else if (activeAcademicSubTab === 'teachers' && academic?.teachers) data = academic.teachers;
            else if (activeAcademicSubTab === 'courses' && academic?.courses) data = academic.courses;
        } else if (activeTab === 'attendance') {
            data = attendance || [];
        } else if (activeTab === 'marks') {
            data = marks || [];
        } else if (activeTab === 'obe') {
            data = obe?.targetVsAchieved || [];
        }
        
        if (data.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
            XLSX.writeFile(workbook, `${activeTab}_report.xlsx`);
        } else {
            alert('No data available to export for this view.');
        }
    };

    if (loading && !academic) {
        return (
            <div className="table-loading">
                <Loader2 className="spinner-large" />
                <h3 style={{marginTop: '1rem', color: '#0ff0fc'}}>Compiling Reports...</h3>
            </div>
        );
    }

    return (
        <div className="reports-container glass-panel-dash">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart2 size={24} /> Comprehensive Reports
                    </h2>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--uni-text-muted)' }}>Analyze dynamic academic, OBE, and administrative data.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="secondary-btn" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                    <button className="danger-btn" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="reports-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', overflowX: 'auto' }}>
                {[
                    { id: 'academic', label: 'Academic', icon: BookOpen },
                    { id: 'obe', label: 'OBE Analytics', icon: Target },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
                    { id: 'marks', label: 'Marks', icon: CheckSquare },
                    { id: 'accreditation', label: 'Accreditation', icon: ShieldCheck }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'rgba(15, 240, 252, 0.1)' : 'transparent',
                            color: activeTab === tab.id ? '#0ff0fc' : 'var(--uni-text-muted)',
                            border: 'none',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                        }}
                    >
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="reports-content">
                
                {/* ACADEMIC REPORTS */}
                {activeTab === 'academic' && (
                    <div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            {['students', 'teachers', 'courses', 'departments', 'programs'].map(sub => (
                                <button 
                                    key={sub}
                                    onClick={() => setActiveAcademicSubTab(sub)}
                                    className={activeAcademicSubTab === sub ? 'primary-btn' : 'secondary-btn'}
                                    style={{ padding: '5px 12px', fontSize: '0.9rem' }}
                                >
                                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                </button>
                            ))}
                        </div>
                        
                        <div className="table-container">
                            <table className="uni-table">
                                <thead>
                                    {activeAcademicSubTab === 'students' && <tr><th>Name</th><th>Email</th><th>Status</th><th>Join Date</th></tr>}
                                    {activeAcademicSubTab === 'teachers' && <tr><th>Name</th><th>Email</th><th>Status</th><th>Join Date</th></tr>}
                                    {activeAcademicSubTab === 'courses' && <tr><th>Code</th><th>Name</th><th>Credits</th><th>Department</th></tr>}
                                    {activeAcademicSubTab === 'departments' && <tr><th>Name</th><th>Faculty</th></tr>}
                                    {activeAcademicSubTab === 'programs' && <tr><th>Name</th><th>Degree Level</th><th>Department</th></tr>}
                                </thead>
                                <tbody>
                                    {academic && academic[activeAcademicSubTab] && academic[activeAcademicSubTab].map((item, idx) => (
                                        <tr key={idx}>
                                            {activeAcademicSubTab === 'students' && <><td style={{fontWeight:'bold'}}>{item.name}</td><td>{item.email}</td><td><span className={`status-badge ${item.status === 'Active'?'active':'inactive'}`}>{item.status}</span></td><td>{new Date(item.joinDate).toLocaleDateString()}</td></>}
                                            {activeAcademicSubTab === 'teachers' && <><td style={{fontWeight:'bold'}}>{item.name}</td><td>{item.email}</td><td><span className={`status-badge ${item.status === 'Active'?'active':'inactive'}`}>{item.status}</span></td><td>{new Date(item.joinDate).toLocaleDateString()}</td></>}
                                            {activeAcademicSubTab === 'courses' && <><td style={{color:'#0ff0fc'}}>{item.code}</td><td><strong>{item.name}</strong></td><td>{item.credits}</td><td>{item.department}</td></>}
                                            {activeAcademicSubTab === 'departments' && <><td><strong>{item.name}</strong></td><td>{item.faculty}</td></>}
                                            {activeAcademicSubTab === 'programs' && <><td><strong>{item.name}</strong></td><td>{item.degreeLevel}</td><td>{item.department}</td></>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* OBE REPORTS */}
                {activeTab === 'obe' && obe && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="detailed-card glass-panel-dash" style={{ padding: '20px' }}>
                            <h3 style={{ color: '#bc13fe', marginBottom: '15px' }}>Target vs Achieved</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={obe.targetVsAchieved} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="#fff" />
                                    <YAxis stroke="#fff" />
                                    <Tooltip contentStyle={{ backgroundColor: '#002147', border: '1px solid rgba(255,255,255,0.2)' }} />
                                    <Legend />
                                    <Bar dataKey="target" fill="#0ff0fc" />
                                    <Bar dataKey="achieved" fill="#bc13fe" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="detailed-card glass-panel-dash" style={{ padding: '20px' }}>
                            <h3 style={{ color: '#ff1b6b', marginBottom: '15px' }}>Gap Analysis</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={obe.gapAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis type="number" stroke="#fff" />
                                    <YAxis dataKey="name" type="category" stroke="#fff" />
                                    <Tooltip contentStyle={{ backgroundColor: '#002147', border: '1px solid rgba(255,255,255,0.2)' }} />
                                    <Legend />
                                    <Bar dataKey="gap" fill="#ff1b6b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* ATTENDANCE REPORTS */}
                {activeTab === 'attendance' && (
                    <div className="table-container">
                        <table className="uni-table">
                            <thead>
                                <tr><th>Student Name</th><th>Email</th><th>Present</th><th>Absent</th><th>Late</th><th>Percentage</th></tr>
                            </thead>
                            <tbody>
                                {attendance?.map((row, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{row.name}</strong></td>
                                        <td>{row.email}</td>
                                        <td style={{color: '#50cc7f'}}>{row.present}</td>
                                        <td style={{color: '#ff1b6b'}}>{row.absent}</td>
                                        <td style={{color: '#ffcc00'}}>{row.late}</td>
                                        <td><div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', height: '8px', width: '100px', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }}><div style={{ height: '100%', width: row.percentage, background: parseInt(row.percentage) > 75 ? '#50cc7f' : '#ffcc00' }}></div></div>{row.percentage}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* MARKS REPORTS */}
                {activeTab === 'marks' && (
                    <div className="table-container">
                        <table className="uni-table">
                            <thead>
                                <tr><th>Student Name</th><th>Course</th><th>Code</th><th>Session</th><th>Grade</th></tr>
                            </thead>
                            <tbody>
                                {marks?.map((row, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{row.studentName}</strong></td>
                                        <td>{row.courseName}</td>
                                        <td style={{color:'#0ff0fc'}}>{row.courseCode}</td>
                                        <td>{row.session}</td>
                                        <td><strong style={{ fontSize: '1.1rem', color: ['A','A-'].includes(row.grade) ? '#50cc7f' : '#ffcc00' }}>{row.grade}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ACCREDITATION REPORTS */}
                {activeTab === 'accreditation' && accreditation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass-panel-dash" style={{ padding: '20px', borderLeft: '4px solid #0ff0fc' }}>
                            <h3 style={{ marginBottom: '15px' }}>Institutional Overview</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Total Students</p><h2>{accreditation.overview.totalStudents}</h2></div>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Total Teachers</p><h2>{accreditation.overview.totalTeachers}</h2></div>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Student:Teacher Ratio</p><h2 style={{color: '#bc13fe'}}>{accreditation.overview.studentTeacherRatio}</h2></div>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Programs Offered</p><h2>{accreditation.overview.totalPrograms}</h2></div>
                            </div>
                        </div>
                        <div className="glass-panel-dash" style={{ padding: '20px', borderLeft: '4px solid #50cc7f' }}>
                            <h3 style={{ marginBottom: '15px' }}>OBE Implementation Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Active CLOs</p><h2>{accreditation.obeStatus.totalCLOs}</h2></div>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Active PLOs</p><h2>{accreditation.obeStatus.totalPLOs}</h2></div>
                                <div><p style={{color:'var(--uni-text-muted)'}}>Mapping Integrity</p><h2 style={{color: '#50cc7f'}}>{accreditation.obeStatus.mappingComplete ? '100% Compliant' : 'Review Needed'}</h2></div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ComprehensiveReports;
