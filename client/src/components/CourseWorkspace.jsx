import React, { useState } from 'react';
import { ArrowLeft, BookOpen, LayoutDashboard, Clock, ClipboardList, Target, BookMarked, BarChart2, Database, GitMerge, Table2, ClipboardCheck } from 'lucide-react';
import TeacherAttendance from './TeacherAttendance';
import TeacherAssessment from './TeacherAssessment';
import TeacherQuestionBank from './TeacherQuestionBank';
import TeacherMarks from './TeacherMarks';
import TeacherQuestionMapping from './TeacherQuestionMapping';
import TeacherBlueprint from './TeacherBlueprint';
import TeacherRubrics from './TeacherRubrics';
import TeacherOBE from './TeacherOBE';
import CourseFileManagement from './CourseFileManagement';
import TeacherReports from './TeacherReports';

const CourseWorkspace = ({ offering, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const c = offering.course || {};
    const s = offering.section || {};
    const sem = offering.semester || {};

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'attendance', label: 'Attendance', icon: <Clock size={16} /> },
        { id: 'assessments', label: 'Assessments', icon: <ClipboardList size={16} /> },
        { id: 'marks', label: 'Marks', icon: <BarChart2 size={16} /> },
        { id: 'qmapping', label: 'Question Mapping', icon: <GitMerge size={16} /> },
        { id: 'blueprint', label: 'Blueprint', icon: <Table2 size={16} /> },
        { id: 'rubrics', label: 'Rubrics', icon: <ClipboardCheck size={16} /> },
        { id: 'questionbank', label: 'Question Bank', icon: <Database size={16} /> },
        { id: 'obe', label: 'OBE Monitoring', icon: <Target size={16} /> },
        { id: 'coursefile', label: 'Course File', icon: <BookMarked size={16} /> },
        { id: 'reports', label: 'Reports', icon: <BarChart2 size={16} /> },
    ];

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={onBack} style={{ background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', padding: '8px', color: '#0ff0fc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookOpen size={20} color="#bc13fe" /> {c.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '4px' }}>
                        <span>Code: <span style={{ color: '#0ff0fc' }}>{c.code}</span></span>
                        <span>Section: <span style={{ color: '#0ff0fc' }}>{s.name}</span></span>
                        <span>Semester: <span style={{ color: '#0ff0fc' }}>{sem.name}</span></span>
                        <span>Students: <span style={{ color: '#0ff0fc' }}>{offering.totalStudents ?? '—'}</span></span>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', background: activeTab === t.id ? 'linear-gradient(135deg,#0ff0fc,#bc13fe)' : 'rgba(255,255,255,0.05)', color: activeTab === t.id ? '#000' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="glass-panel-dash" style={{ borderRadius: '14px', padding: '1.5rem', minHeight: '60vh' }}>
                {activeTab === 'dashboard' && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)' }}>
                        <LayoutDashboard size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3>Course Dashboard</h3>
                        <p>Summary of {c.code} will appear here.</p>
                    </div>
                )}
                {activeTab === 'attendance' && <TeacherAttendance initialOfferingId={offering._id} />}
                {activeTab === 'assessments' && <TeacherAssessment initialCourseId={c._id} />}
                {activeTab === 'marks' && <TeacherMarks initialOfferingId={offering._id} />}
                {activeTab === 'qmapping' && <TeacherQuestionMapping initialCourseId={c._id} />}
                {activeTab === 'blueprint' && <TeacherBlueprint initialCourseId={c._id} />}
                {activeTab === 'rubrics' && <TeacherRubrics initialCourseId={c._id} />}
                {activeTab === 'questionbank' && <TeacherQuestionBank initialCourseId={c._id} />}
                {activeTab === 'obe' && <TeacherOBE initialCourseId={c._id} />}
                {activeTab === 'coursefile' && <CourseFileManagement initialOfferingId={offering._id} />}
                {activeTab === 'reports' && <TeacherReports initialOfferingId={offering._id} initialCourseId={c._id} />}
            </div>
        </div>
    );
};

export default CourseWorkspace;
