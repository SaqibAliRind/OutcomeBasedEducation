import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Users, BookOpen, Layers, GraduationCap, Building2, Map, Calendar, FolderOpen, Tag, Loader2, Target, TrendingUp, BarChart2, UserPlus, Bell, Clock, CalendarPlus, UserCheck, UserX, FlaskConical, BookMarked, CreditCard, GalleryVerticalEnd, School, HelpCircle, Network, LayoutList, PenTool, Award, FileWarning, ClipboardX, UserCog, AlertTriangle, Zap, CalendarCheck, FileText, CheckCircle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import Sidebar from '../../components/Sidebar';
import UserManagement from '../../components/shared/users/UserManagementRoot';
import RoleManagement from '../../components/shared/users/RoleManagement';
import Departments from '../../components/Departments';
import Programs from '../../components/Programs';
import Faculties from '../../components/Faculties';
import ComprehensiveReports from '../../components/universityadmin/ComprehensiveReports.jsx';
import Sessions from '../../components/Sessions';
import Semesters from '../../components/Semesters';
import Sections from '../../components/Sections';
import Batches from '../../components/Batches';
import Courses from '../../components/Courses';
import CourseOfferings from '../../components/CourseOfferings';
import CourseAllocation from '../../components/CourseAllocation';
import StudentProfile from '../../components/StudentProfile';
import Admission from '../../components/Admission';
import TeacherAssignment from '../../components/TeacherAssignment';
import AcademicCalendar from '../../components/AcademicCalendar';
import Timetables from '../../components/Timetables';
import Enrollment from '../../components/Enrollment';
import SemesterRegistration from '../../components/SemesterRegistration';
import AcademicRecord from '../../components/AcademicRecord';
import Curriculum from '../../components/Curriculum';
import PEOManagement from '../../components/PEOManagement';
import PLOManagement from '../../components/PLOManagement';
import CLOManagement from '../../components/CLOManagement';
import GAManagement from '../../components/GAManagement';
import AssessmentManagement from '../../components/AssessmentManagement';
import BloomsTaxonomy from '../../components/BloomsTaxonomy';

import ObeTemplates from '../../components/ObeTemplates';
import AssessmentDefinition from '../../components/AssessmentDefinition';
import QuestionBank from '../../components/QuestionBank';
import QuestionMapping from '../../components/QuestionMapping';
import BlueprintManagement from '../../components/BlueprintManagement';
import RubricsManagement from '../../components/RubricsManagement';
import ObeCalculationEngine from '../../components/ObeCalculationEngine';
import TargetsManagement from '../../components/TargetsManagement';
import TargetVsAchieved from '../../components/TargetVsAchieved';
import GapAnalysis from '../../components/GapAnalysis';
import ClosingTheLoop from '../../components/ClosingTheLoop';
import OutcomeSimulation from '../../components/OutcomeSimulation';
import ObeGraphs from '../../components/ObeGraphs';
import AIFeatures from '../../components/AIFeatures';
import ObeReports from '../../components/ObeReports';
import ObeHistory from '../../components/ObeHistory';
import CourseFileManagement from '../../components/CourseFileManagement';
import AccreditationManagement from '../../components/AccreditationManagement';
import AttendanceManagement from '../../components/AttendanceManagement';
import MarksManagement from '../../components/MarksManagement';
import GradeManagement from '../../components/GradeManagement';
import ResultProcessing from '../../components/ResultProcessing';
import TranscriptManagement from '../../components/TranscriptManagement';
import DataLocking from '../../components/DataLocking';
import ReportsManagement from '../../components/ReportsManagement';
import ExecutiveDashboard from '../../components/ExecutiveDashboard';
import AnalyticsManagement from '../../components/AnalyticsManagement';
import SurveyManagement from '../../components/SurveyManagement';
import NotificationManagement from '../../components/NotificationManagement';
import WorkflowManagement from '../../components/WorkflowManagement';
import QECManagement from '../../components/QECManagement';
import ArchiveManagement from '../../components/ArchiveManagement';
import ProfileManagement from '../../components/ProfileManagement';
import UniversitySettings from '../../components/UniversitySettings';
import UserRoleAssignment from '../../components/UserRoleAssignment';
import ActivityLogs from '../../components/ActivityLogs';
import AuditLogs from '../../components/AuditLogs';
import ImportExportCenter from '../../components/ImportExportCenter';
import DataManagement from '../../components/DataManagement';
import BrandingManagement from '../../components/BrandingManagement';
import EmailTemplates from '../../components/EmailTemplates';
import AIManagement from '../../components/AIManagement';
import IntegrationsManagement from '../../components/IntegrationsManagement';
import { fetchDashboardMetrics } from '../../store/dashboardSlice';
import '../../style/Dashboard.css';
import '../../style/UniversityAdminDashboard.css';

const UniversityAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { data: dashboardData, loading } = useSelector((state) => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardMetrics());
    }, [dispatch]);

    const stats = dashboardData?.academicStats || {};
    const academicSummary = dashboardData?.academicSummary || {};
    const obeSummary = dashboardData?.obeSummary || {};
    const achievementSummary = dashboardData?.achievementSummary || {};
    const teacherSummary = dashboardData?.teacherSummary || {};
    const studentSummary = dashboardData?.studentSummary || {};
    const chartData = dashboardData?.chartData || {};
    const notificationsPanel = dashboardData?.notificationsPanel || [];
    const calendarEvents = dashboardData?.calendarEvents || {};
    const obeStats = dashboardData?.obeStats || {};
    const activityFeed = dashboardData?.recentActivityFeed || {};
    const [activeActivityTab, setActiveActivityTab] = useState('teachers');

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const quickActions = [
        { title: 'Add Teacher', icon: GraduationCap, color: '#0ff0fc', bg: 'rgba(15, 240, 252, 0.15)', shadow: 'rgba(15, 240, 252, 0.2)', action: () => setActiveTab('users') },
        { title: 'Add Student', icon: UserPlus, color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.15)', shadow: 'rgba(255, 204, 0, 0.2)', action: () => setActiveTab('users') },
        { title: 'Create Course', icon: BookOpen, color: '#bc13fe', bg: 'rgba(188, 19, 254, 0.15)', shadow: 'rgba(188, 19, 254, 0.2)', action: () => setActiveTab('courses') },
        { title: 'Create Semester', icon: CalendarPlus, color: '#45caff', bg: 'rgba(69, 202, 255, 0.15)', shadow: 'rgba(69, 202, 255, 0.2)', action: () => setActiveTab('semesters') },
        { title: 'Send Notification', icon: Bell, color: '#ff1b6b', bg: 'rgba(255, 27, 107, 0.15)', shadow: 'rgba(255, 27, 107, 0.2)', action: () => setActiveTab('notifications_manage') },
    ];

    const statCards = [
        { label: 'Total Students', value: stats.totalStudents || 0, icon: <Users size={26} color="var(--uni-primary)" />, bgColor: 'var(--uni-primary)' },
        { label: 'Total Teachers', value: stats.totalTeachers || 0, icon: <GraduationCap size={26} color="var(--uni-gold)" />, bgColor: 'var(--uni-gold)' },
        { label: 'Total Departments', value: stats.totalDepartments || 0, icon: <Building2 size={26} color="#10B981" />, bgColor: '#10B981' },
        { label: 'Total Programs', value: stats.totalPrograms || 0, icon: <Map size={26} color="#8B5CF6" />, bgColor: '#8B5CF6' },
        { label: 'Total Courses', value: stats.totalCourses || 0, icon: <BookOpen size={26} color="#F59E0B" />, bgColor: '#F59E0B' },
        { label: 'Total Sessions', value: stats.totalActiveSessions || 0, icon: <Calendar size={26} color="#EC4899" />, bgColor: '#EC4899' },
        { label: 'Total Semesters', value: stats.totalSemesters || 0, icon: <FolderOpen size={26} color="#06B6D4" />, bgColor: '#06B6D4' },
        { label: 'Total Sections', value: stats.totalSections || 0, icon: <Layers size={26} color="#3B82F6" />, bgColor: '#3B82F6' },
        { label: 'Total Batches', value: stats.totalBatches || 0, icon: <Tag size={26} color="#14B8A6" />, bgColor: '#14B8A6' },
        { label: 'Total Active Users', value: stats.totalActiveUsers ?? 0, icon: <UserCheck size={26} color="#22C55E" />, bgColor: '#22C55E' },
        { label: 'Total Inactive Users', value: stats.totalInactiveUsers ?? 0, icon: <UserX size={26} color="#EF4444" />, bgColor: '#EF4444' },
    ];

    return (
        <div className="dashboard-wrapper">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="main-content">
                {activeTab === 'overview' && (
                    <div className="fade-in">
                        <header className="top-header">
                            <div className="header-title">
                                <h1>University Admin Dashboard</h1>
                                <p>Welcome back, <span style={{color: 'var(--uni-primary)', fontWeight: '600'}}>{user?.name}</span>. Here is the overview of your university statistics.</p>
                            </div>
                        </header>
                        
                        {loading ? (
                            <div className="dashboard-loading">
                                <Loader2 size={48} className="spinner-large" color="var(--uni-primary)" />
                            </div>
                        ) : (
                            <>
                                {/* ===== QUICK ACTIONS ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                    <h3 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1.1rem', fontWeight: '600' }}>Quick Actions</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                        {quickActions.map((action, index) => (
                                            <div 
                                                key={index} 
                                                className="stat-card" 
                                                style={{ 
                                                    padding: '1.2rem', 
                                                    borderRadius: '12px', 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    gap: '0.8rem',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onClick={action.action}
                                            >
                                                <div style={{ 
                                                    background: action.bg, 
                                                    padding: '0.8rem', 
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: action.color,
                                                    boxShadow: `0 0 15px ${action.shadow}`
                                                }}>
                                                    <action.icon size={26} />
                                                </div>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500', color: '#fff', textAlign: 'center' }}>
                                                    {action.title}
                                                </h4>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ===== ACADEMIC SUMMARY ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                        <School size={22} color="var(--uni-primary)" />
                                        <h3 style={{ color: 'var(--uni-primary)', margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.02em' }}>Academic Summary</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
                                        {[
                                            {
                                                label: 'Current Session',
                                                value: academicSummary.currentSession || 'Not Set',
                                                icon: <Calendar size={20} color="#EC4899" />,
                                                color: '#EC4899',
                                                isText: true
                                            },
                                            {
                                                label: 'Current Semester',
                                                value: academicSummary.currentSemester || 'Not Set',
                                                icon: <FolderOpen size={20} color="#06B6D4" />,
                                                color: '#06B6D4',
                                                isText: true
                                            },
                                            {
                                                label: 'Total Offered Courses',
                                                value: academicSummary.totalOfferedCourses ?? 0,
                                                icon: <GalleryVerticalEnd size={20} color="#8B5CF6" />,
                                                color: '#8B5CF6'
                                            },
                                            {
                                                label: 'Registered Students',
                                                value: academicSummary.totalRegisteredStudents ?? 0,
                                                icon: <BookMarked size={20} color="#0ff0fc" />,
                                                color: '#0ff0fc'
                                            },
                                            {
                                                label: 'Total Credit Hours',
                                                value: academicSummary.totalCreditHours ?? 0,
                                                icon: <CreditCard size={20} color="#F59E0B" />,
                                                color: '#F59E0B'
                                            },
                                            {
                                                label: 'Theory Courses',
                                                value: academicSummary.totalTheoryCourses ?? 0,
                                                icon: <BookOpen size={20} color="#22C55E" />,
                                                color: '#22C55E'
                                            },
                                            {
                                                label: 'Lab Courses',
                                                value: academicSummary.totalLabCourses ?? 0,
                                                icon: <FlaskConical size={20} color="#ff1b6b" />,
                                                color: '#ff1b6b'
                                            },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{
                                                background: `${item.color}08`,
                                                border: `1px solid ${item.color}28`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.4rem',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <div style={{ background: `${item.color}18`, borderRadius: '8px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {item.icon}
                                                    </div>
                                                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                                                </div>
                                                <div style={{ color: item.color, fontSize: item.isText ? '1rem' : '1.6rem', fontWeight: item.isText ? '600' : '700', paddingLeft: '2px', lineHeight: 1.2 }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ===== OBE MAPPING MATRIX STATUS ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '14px', padding: '1.5rem', marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                        <Network size={22} color="#0ff0fc" />
                                        <h3 style={{ color: '#0ff0fc', margin: 0, fontSize: '1.05rem', fontWeight: '700', letterSpacing: '0.02em' }}>OBE Mapping Matrix Status</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {[
                                            { label: 'PEO → PLO Mapping', mapped: obeSummary?.mappingStatus?.peoToPlo, color: '#bc13fe' },
                                            { label: 'PLO → GA Mapping', mapped: obeSummary?.mappingStatus?.ploToGa, color: '#ff9800' },
                                            { label: 'CLO → PLO Mapping', mapped: obeSummary?.mappingStatus?.cloToPlo, color: '#50cc7f' },
                                            { label: 'CLO → GA Mapping', mapped: obeSummary?.mappingStatus?.cloToGa, color: '#ff1b6b' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{
                                                background: `${item.color}08`,
                                                border: `1px solid ${item.color}28`,
                                                borderRadius: '12px',
                                                padding: '1.2rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            }}>
                                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: '600' }}>{item.label}</span>
                                                {item.mapped ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#50cc7f', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        <CheckCircle size={16} /> ✅ Active
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                                                        <X size={16} /> ❌ Pending
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="stats-grid fade-in" style={{ marginTop: '2rem' }}>
                                    {statCards.map((s, i) => (
                                        <div className="stat-card glass-panel-dash" key={i}>
                                            <div className="stat-content">
                                                <h3>{s.label}</h3>
                                                <h2>{s.value}</h2>
                                            </div>
                                            <div className="stat-iconBox" style={{ background: `${s.bgColor}15` }}>
                                                {s.icon}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ===== WIDGETS GRID: Quick Actions & Calendar ===== */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                                    
                                    {/* Calendar Widget */}
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <CalendarCheck size={24} color="#0ff0fc" />
                                            <h3 style={{ color: '#0ff0fc', margin: 0 }}>Calendar Overview</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                            {[
                                                { label: "Today's Classes", value: calendarEvents.todaysClasses || 0, color: '#bc13fe' },
                                                { label: "Upcoming Exams", value: calendarEvents.upcomingExams || 0, color: '#ffcc00' },
                                                { label: "Holidays", value: calendarEvents.holidays || 0, color: '#ff1b6b' },
                                                { label: "Events & Meetings", value: (calendarEvents.events || 0) + (calendarEvents.meetings || 0), color: '#50cc7f' }
                                            ].map((item, idx) => (
                                                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: `1px solid ${item.color}30`, textAlign: 'center' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>{item.label}</div>
                                                    <div style={{ color: item.color, fontSize: '1.5rem', fontWeight: 'bold' }}>{item.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <h4 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '1rem' }}>Today's Schedule</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {(calendarEvents.schedule || []).map((ev, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `4px solid ${ev.color}` }}>
                                                    <div style={{ minWidth: '70px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>{ev.time}</div>
                                                    <div style={{ flex: 1, fontSize: '0.95rem', color: '#fff' }}>{ev.title}</div>
                                                    <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: `${ev.color}15`, color: ev.color, textTransform: 'uppercase', fontWeight: 'bold' }}>{ev.type}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                            <Zap size={24} color="#ffcc00" />
                                            <h3 style={{ color: '#ffcc00', margin: 0 }}>Quick Actions</h3>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                                            {[
                                                { label: 'Add Teacher', icon: <UserPlus size={18} />, color: '#50cc7f', action: () => setActiveTab('users') },
                                                { label: 'Add Student', icon: <GraduationCap size={18} />, color: '#0ff0fc', action: () => setActiveTab('users') },
                                                { label: 'Add Department', icon: <Building2 size={18} />, color: '#bc13fe', action: () => setActiveTab('departments') },
                                                { label: 'Add Program', icon: <Layers size={18} />, color: '#ffcc00', action: () => setActiveTab('programs') },
                                                { label: 'Add Course', icon: <BookOpen size={18} />, color: '#ff1b6b', action: () => setActiveTab('courses') },
                                                { label: 'Create Session', icon: <Calendar size={18} />, color: '#0ff0fc', action: () => setActiveTab('sessions') },
                                                { label: 'Create Semester', icon: <CalendarPlus size={18} />, color: '#50cc7f', action: () => setActiveTab('semesters') },
                                                { label: 'Offer Course', icon: <Tag size={18} />, color: '#ffcc00', action: () => setActiveTab('courses') },
                                                { label: 'Notify Users', icon: <Bell size={18} />, color: '#bc13fe', action: () => console.log('Notify') },
                                                { label: 'Generate Report', icon: <FileText size={18} />, color: '#ff1b6b', action: () => setActiveTab('reports_management') }
                                            ].map((btn, idx) => (
                                                <button key={idx} onClick={btn.action} style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: `1px solid ${btn.color}30`,
                                                    borderRadius: '10px',
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '0.8rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    color: 'rgba(255,255,255,0.8)'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = `${btn.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                >
                                                    <div style={{ color: btn.color }}>{btn.icon}</div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: '500', textAlign: 'center' }}>{btn.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* ===== TEACHER SUMMARY ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <UserCog size={24} color="#ffcc00" />
                                        <h3 style={{ color: '#ffcc00', margin: 0 }}>Teacher Summary</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
                                        {[
                                            { label: 'Total Teachers', value: teacherSummary.totalTeachers ?? 0, icon: <GraduationCap size={20} color="#ffcc00" />, color: '#ffcc00' },
                                            { label: 'Active Teachers', value: teacherSummary.activeTeachers ?? 0, icon: <UserCheck size={20} color="#50cc7f" />, color: '#50cc7f' },
                                            { label: 'Permanent Teachers', value: teacherSummary.permanentTeachers ?? 0, icon: <Building2 size={20} color="#0ff0fc" />, color: '#0ff0fc' },
                                            { label: 'Visiting Teachers', value: teacherSummary.visitingTeachers ?? 0, icon: <Map size={20} color="#bc13fe" />, color: '#bc13fe' },
                                            { label: 'Pending Course Files', value: teacherSummary.pendingCourseFiles ?? 0, icon: <FileWarning size={20} color="#ff1b6b" />, color: '#ff1b6b' },
                                            { label: 'Pending Marks', value: teacherSummary.pendingMarks ?? 0, icon: <ClipboardX size={20} color="#EC4899" />, color: '#EC4899' },
                                            { label: 'Pending Attendance', value: teacherSummary.pendingAttendance ?? 0, icon: <Clock size={20} color="#F59E0B" />, color: '#F59E0B' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{
                                                background: `${item.color}08`,
                                                border: `1px solid ${item.color}28`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.4rem',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <div style={{ background: `${item.color}18`, borderRadius: '8px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {item.icon}
                                                    </div>
                                                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                                                </div>
                                                <div style={{ color: item.color, fontSize: '1.6rem', fontWeight: '700', paddingLeft: '2px', lineHeight: 1.2 }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* ===== STUDENT SUMMARY ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <Users size={24} color="#0ff0fc" />
                                        <h3 style={{ color: '#0ff0fc', margin: 0 }}>Student Summary</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '1rem' }}>
                                        {[
                                            { label: 'Total Students', value: studentSummary.totalStudents ?? 0, icon: <Users size={20} color="#0ff0fc" />, color: '#0ff0fc' },
                                            { label: 'New Admissions', value: studentSummary.newAdmissions ?? 0, icon: <UserPlus size={20} color="#50cc7f" />, color: '#50cc7f' },
                                            { label: 'Active Students', value: studentSummary.activeStudents ?? 0, icon: <UserCheck size={20} color="#ffcc00" />, color: '#ffcc00' },
                                            { label: 'Graduated', value: studentSummary.graduatedStudents ?? 0, icon: <Award size={20} color="#bc13fe" />, color: '#bc13fe' },
                                            { label: 'Suspended', value: studentSummary.suspendedStudents ?? 0, icon: <UserX size={20} color="#ff1b6b" />, color: '#ff1b6b' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{
                                                background: `${item.color}08`,
                                                border: `1px solid ${item.color}28`,
                                                borderRadius: '12px',
                                                padding: '1rem 1.1rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.4rem',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <div style={{ background: `${item.color}18`, borderRadius: '8px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {item.icon}
                                                    </div>
                                                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                                                </div>
                                                <div style={{ color: item.color, fontSize: '1.6rem', fontWeight: '700', paddingLeft: '2px', lineHeight: 1.2 }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ===== VISUAL ANALYTICS & CHARTS ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <BarChart2 size={24} color="#bc13fe" />
                                        <h3 style={{ color: '#bc13fe', margin: 0 }}>Visual Analytics & Charts</h3>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                                        
                                        {/* 1. Student Enrollment Trend */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Student Enrollment Trend</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                {(chartData.studentEnrollmentTrend || []).length >= 2 ? (
                                                    <ResponsiveContainer>
                                                        <AreaChart data={chartData.studentEnrollmentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                            <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                            <Area type="monotone" dataKey="students" stroke="#0ff0fc" fill="rgba(15, 240, 252, 0.2)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : (chartData.studentEnrollmentTrend || []).length === 1 ? (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                                        <span style={{ fontSize: '2rem' }}>📈</span>
                                                        <p style={{ margin: 0, fontWeight: 700, color: '#0ff0fc' }}>{chartData.studentEnrollmentTrend[0].month}: {chartData.studentEnrollmentTrend[0].students} students</p>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>More months needed to draw trend line</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '2rem' }}>📈</span>
                                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No enrollment data yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Teacher Distribution */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Teacher Distribution</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie data={chartData.teacherDistribution || []} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label>
                                                            {(chartData.teacherDistribution || []).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#ffcc00', '#50cc7f', '#0ff0fc', '#ff1b6b'][index % 4]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* 3. Department-wise Students */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Department-wise Students</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={chartData.departmentWiseStudents || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                        <Bar dataKey="count" fill="#bc13fe" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* 4. Program-wise Students */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Program-wise Students</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={chartData.programWiseStudents || []} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} width={80} />
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                        <Bar dataKey="count" fill="#ffcc00" radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* 5. Semester-wise GPA */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Semester-wise Avg GPA</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                {(chartData.semesterGpa || []).length >= 2 ? (
                                                    <ResponsiveContainer>
                                                        <LineChart data={chartData.semesterGpa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis dataKey="semester" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} domain={[0, 4]} />
                                                            <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                            <Line type="monotone" dataKey="gpa" stroke="#50cc7f" strokeWidth={3} dot={{ r: 4, fill: '#50cc7f' }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (chartData.semesterGpa || []).length === 1 ? (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                                        <span style={{ fontSize: '2rem' }}>🎓</span>
                                                        <p style={{ margin: 0, fontWeight: 700, color: '#50cc7f' }}>{chartData.semesterGpa[0].semester}: GPA {chartData.semesterGpa[0].gpa}</p>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>More semesters needed to draw GPA trend</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '2rem' }}>🎓</span>
                                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No GPA data yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 6. Attendance Trend */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Attendance Trend (Weekly)</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                {(chartData.attendanceTrend || []).length >= 2 ? (
                                                    <ResponsiveContainer>
                                                        <LineChart data={chartData.attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                            <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                            <Legend />
                                                            <Line type="monotone" dataKey="present" stroke="#0ff0fc" strokeWidth={2} />
                                                            <Line type="monotone" dataKey="absent" stroke="#ff1b6b" strokeWidth={2} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (chartData.attendanceTrend || []).length === 1 ? (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                                        <span style={{ fontSize: '2rem' }}>📅</span>
                                                        <p style={{ margin: 0, fontWeight: 700, color: '#0ff0fc' }}>{chartData.attendanceTrend[0].week} — Present: {chartData.attendanceTrend[0].present}, Absent: {chartData.attendanceTrend[0].absent}</p>
                                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>More weeks needed to draw attendance trend</p>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '2rem' }}>📅</span>
                                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No attendance records yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 7. Pass/Fail Ratio */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Pass/Fail Ratio</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                {chartData.passFailRatio && chartData.passFailRatio.length > 0 && (chartData.passFailRatio[0].value > 0 || chartData.passFailRatio[1]?.value > 0) ? (
                                                    <ResponsiveContainer>
                                                        <PieChart>
                                                            <Pie data={chartData.passFailRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, value }) => `${name}: ${value}%`}>
                                                                {chartData.passFailRatio.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(val) => `${val}%`} />
                                                            <Legend />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '2.5rem' }}>📊</span>
                                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No graded assessments yet</p>
                                                        <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.6 }}>Submit marks to see pass/fail breakdown</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 8. CLO Achievement Graph */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>CLO Achievement</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={chartData.cloAchievementGraph || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis dataKey="clo" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} domain={[0, 100]} />
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                        <Bar dataKey="achievement" fill="#ffcc00" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* 9. PLO Achievement Graph */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>PLO Achievement</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={chartData.ploAchievementGraph || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis dataKey="plo" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} domain={[0, 100]} />
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                        <Bar dataKey="achievement" fill="#0ff0fc" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* 10. GA Achievement Graph */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0' }}>GA Achievement</h4>
                                            <div style={{ width: '100%', height: 300 }}>
                                                {(chartData.gaAchievementGraph || []).length >= 3 ? (
                                                    <ResponsiveContainer>
                                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData.gaAchievementGraph}>
                                                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                                            <PolarAngleAxis dataKey="ga" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                                                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" />
                                                            <Radar name="Achievement" dataKey="achievement" stroke="#ff1b6b" fill="#ff1b6b" fillOpacity={0.5} />
                                                            <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                ) : (chartData.gaAchievementGraph || []).length > 0 ? (
                                                    <ResponsiveContainer>
                                                        <BarChart data={chartData.gaAchievementGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                            <XAxis dataKey="ga" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} domain={[0, 100]} />
                                                            <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => `${v}%`} />
                                                            <Bar dataKey="achievement" fill="#ff1b6b" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '2rem' }}>🎯</span>
                                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>No GA attainment data</p>
                                                        <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.6 }}>Map CLOs → PLOs → GAs and run OBE calculation</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* ===== NOTIFICATIONS PANEL ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                        <Bell size={24} color="#ff1b6b" />
                                        <h3 style={{ color: '#ff1b6b', margin: 0 }}>Notifications Panel</h3>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {notificationsPanel.map((notif, idx) => {
                                            const Icon = notif.iconName === 'UserPlus' ? UserPlus :
                                                         notif.iconName === 'UserCheck' ? UserCheck :
                                                         notif.iconName === 'BookOpen' ? BookOpen :
                                                         notif.iconName === 'Clock' ? Clock :
                                                         notif.iconName === 'FileWarning' ? FileWarning :
                                                         AlertTriangle;

                                            return (
                                                <div key={idx} style={{ 
                                                    display: 'flex', 
                                                    gap: '1rem', 
                                                    padding: '1rem', 
                                                    background: 'rgba(255,255,255,0.02)', 
                                                    borderRadius: '10px',
                                                    border: `1px solid ${notif.color}30`,
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <div style={{ background: `${notif.color}15`, padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Icon size={20} color={notif.color} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                            <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{notif.title}</h4>
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                                                {new Date(notif.time).toLocaleDateString()} {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!notificationsPanel || notificationsPanel.length === 0) && (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No recent notifications</div>
                                        )}
                                    </div>
                                </div>

                                {/* ===== RECENT ACTIVITIES SECTION ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                        <Bell size={22} color="#0ff0fc" />
                                        <h3 style={{ color: '#0ff0fc', margin: 0 }}>Recent Activities</h3>
                                    </div>

                                    {/* Tab Pills */}
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                        {[
                                            { key: 'teachers', label: 'New Teachers', icon: <GraduationCap size={14} />, color: '#ffcc00' },
                                            { key: 'students', label: 'New Students', icon: <UserPlus size={14} />, color: '#0ff0fc' },
                                            { key: 'courses', label: 'Course Allocations', icon: <BookOpen size={14} />, color: '#bc13fe' },
                                            { key: 'notifications', label: 'Notifications', icon: <Bell size={14} />, color: '#ff1b6b' },
                                        ].map(tab => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveActivityTab(tab.key)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
                                                    background: activeActivityTab === tab.key ? tab.color : 'rgba(255,255,255,0.06)',
                                                    color: activeActivityTab === tab.key ? '#020917' : 'rgba(255,255,255,0.6)',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: activeActivityTab === tab.key ? `0 0 14px ${tab.color}55` : 'none'
                                                }}
                                            >{tab.icon} {tab.label}</button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {activeActivityTab === 'teachers' && (
                                            (activityFeed.newTeachers?.length > 0) ? activityFeed.newTeachers.map((t, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'rgba(255,204,0,0.04)', borderRadius: '10px', border: '1px solid rgba(255,204,0,0.1)' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,204,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <GraduationCap size={18} color="#ffcc00" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.92rem' }}>{t.name}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{t.email}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                                                        <Clock size={12} /> {timeAgo(t.createdAt)}
                                                    </div>
                                                </div>
                                            )) : <div style={{ color: 'rgba(255,255,255,0.3)', padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>No new teachers found.</div>
                                        )}
                                        {activeActivityTab === 'students' && (
                                            (activityFeed.newStudents?.length > 0) ? activityFeed.newStudents.map((s, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'rgba(15,240,252,0.04)', borderRadius: '10px', border: '1px solid rgba(15,240,252,0.1)' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(15,240,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <UserPlus size={18} color="#0ff0fc" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.92rem' }}>{s.name}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.email}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                                                        <Clock size={12} /> {timeAgo(s.createdAt)}
                                                    </div>
                                                </div>
                                            )) : <div style={{ color: 'rgba(255,255,255,0.3)', padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>No new students found.</div>
                                        )}
                                        {activeActivityTab === 'courses' && (
                                            (activityFeed.latestCourses?.length > 0) ? activityFeed.latestCourses.map((c, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'rgba(188,19,254,0.04)', borderRadius: '10px', border: '1px solid rgba(188,19,254,0.1)' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(188,19,254,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <BookOpen size={18} color="#bc13fe" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.92rem' }}>{c.name}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{c.description || 'Course added to catalog'}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                                                        <Clock size={12} /> {timeAgo(c.createdAt)}
                                                    </div>
                                                </div>
                                            )) : <div style={{ color: 'rgba(255,255,255,0.3)', padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>No recent course allocations found.</div>
                                        )}
                                        {activeActivityTab === 'notifications' && (
                                            (activityFeed.latestNotifications?.length > 0) ? activityFeed.latestNotifications.map((n, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'rgba(255,27,107,0.04)', borderRadius: '10px', border: '1px solid rgba(255,27,107,0.1)' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,27,107,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Bell size={18} color="#ff1b6b" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.92rem' }}>{n.action}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>By: {n.performedBy}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                                                        <Clock size={12} /> {timeAgo(n.createdAt)}
                                                    </div>
                                                </div>
                                            )) : <div style={{ color: 'rgba(255,255,255,0.3)', padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>No recent notifications found.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <Target size={24} color="#ffcc00" />
                                        <h3 style={{ color: '#ffcc00', margin: 0 }}>OBE Statistics & Analytics</h3>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                        {[
                                            { label: 'Total PEOs', value: obeSummary.totalPEOs ?? 0, icon: <Target size={18} color="#ffcc00" />, color: '#ffcc00' },
                                            { label: 'Total PLOs', value: obeSummary.totalPLOs ?? 0, icon: <Award size={18} color="#0ff0fc" />, color: '#0ff0fc' },
                                            { label: 'Total CLOs', value: obeSummary.totalCLOs ?? 0, icon: <BookOpen size={18} color="#bc13fe" />, color: '#bc13fe' },
                                            { label: 'Graduate Attributes', value: obeSummary.totalGAs ?? 0, icon: <GraduationCap size={18} color="#ff1b6b" />, color: '#ff1b6b' },
                                            { label: 'Total Assessments', value: obeSummary.totalAssessments ?? 0, icon: <LayoutList size={18} color="#45caff" />, color: '#45caff' },
                                            { label: 'Total Questions', value: obeSummary.totalQuestions ?? 0, icon: <HelpCircle size={18} color="#50cc7f" />, color: '#50cc7f' },
                                            { label: 'Question Mappings', value: obeSummary.totalQuestionMappings ?? 0, icon: <Network size={18} color="#F59E0B" />, color: '#F59E0B' },
                                            { label: 'Blueprints (ToS)', value: obeSummary.totalBlueprints ?? 0, icon: <PenTool size={18} color="#8B5CF6" />, color: '#8B5CF6' },
                                            { label: 'Total Rubrics', value: obeSummary.totalRubrics ?? 0, icon: <LayoutList size={18} color="#EC4899" />, color: '#EC4899' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{
                                                background: `${item.color}08`,
                                                border: `1px solid ${item.color}30`,
                                                borderRadius: '10px',
                                                padding: '1rem',
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                <div style={{ background: `${item.color}18`, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.icon}
                                                </div>
                                                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '500' }}>{item.label}</div>
                                                <div style={{ color: item.color, fontSize: '1.6rem', fontWeight: '700', lineHeight: 1 }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                </div>

                                {/* ===== ACHIEVEMENT SUMMARY ===== */}
                                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '1.5rem', marginTop: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                        <TrendingUp size={24} color="#50cc7f" />
                                        <h3 style={{ color: '#50cc7f', margin: 0 }}>Achievement Summary</h3>
                                    </div>

                                    {/* Averages Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                        {[
                                            { label: 'Avg CLO Achievement', value: `${achievementSummary.avgCloAchievement ?? 0}%`, color: '#45caff' },
                                            { label: 'Avg PLO Achievement', value: `${achievementSummary.avgPloAchievement ?? 0}%`, color: '#0ff0fc' },
                                            { label: 'Avg GA Achievement', value: `${achievementSummary.avgGaAchievement ?? 0}%`, color: '#ff1b6b' },
                                            { label: 'University Achievement', value: `${achievementSummary.universityAchievement ?? 0}%`, color: '#50cc7f' },
                                        ].map((item, idx) => (
                                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: `1px solid ${item.color}30`, textAlign: 'center' }}>
                                                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>{item.label}</div>
                                                <div style={{ color: item.color, fontSize: '1.8rem', fontWeight: 'bold' }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Program & Department Achievements */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Program Achievements</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                {achievementSummary.programAchievements?.map((prog, i) => (
                                                    <div key={i}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                                                            <span>{prog.name}</span>
                                                            <span style={{ color: prog.achievement >= prog.target ? '#50cc7f' : '#ffcc00' }}>{prog.achievement}% / {prog.target}%</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${prog.achievement}%`, height: '100%', background: prog.achievement >= prog.target ? '#50cc7f' : '#ffcc00', borderRadius: '3px' }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!achievementSummary.programAchievements || achievementSummary.programAchievements.length === 0) && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>No data available</div>}
                                            </div>
                                        </div>
                                        
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ color: '#fff', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Department Achievements</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                {achievementSummary.departmentAchievements?.map((dept, i) => (
                                                    <div key={i}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                                                            <span>{dept.name}</span>
                                                            <span style={{ color: dept.achievement >= dept.target ? '#45caff' : '#ffcc00' }}>{dept.achievement}% / {dept.target}%</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${dept.achievement}%`, height: '100%', background: dept.achievement >= dept.target ? '#45caff' : '#ffcc00', borderRadius: '3px' }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!achievementSummary.departmentAchievements || achievementSummary.departmentAchievements.length === 0) && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>No data available</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                        {/* Target vs Achieved Chart */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                                <BarChart2 size={18} color="#0ff0fc" />
                                                <h4 style={{ color: '#fff', margin: 0 }}>Target vs Achieved (PLOs)</h4>
                                            </div>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={achievementSummary.targetVsAchieved || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                        <Legend />
                                                        <Bar dataKey="target" name="Target (%)" fill="rgba(255, 204, 0, 0.7)" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="achieved" name="Achieved (%)" fill="#0ff0fc" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Gap Analysis Chart */}
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                                <TrendingUp size={18} color="#ff1b6b" />
                                                <h4 style={{ color: '#fff', margin: 0 }}>Gap Analysis (GAs)</h4>
                                            </div>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={achievementSummary.gapAnalysis || []}>
                                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                                        <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                                                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" />
                                                        <Radar name="Expected" dataKey="expected" stroke="#ffcc00" fill="#ffcc00" fillOpacity={0.3} />
                                                        <Radar name="Actual" dataKey="actual" stroke="#ff1b6b" fill="#ff1b6b" fillOpacity={0.5} />
                                                        <Legend />
                                                        <RechartsTooltip contentStyle={{ background: '#020917', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Closing the Loop Status */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem' }}>
                                            <BookOpen size={18} color="#bc13fe" />
                                            <h4 style={{ color: '#fff', margin: 0 }}>Closing the Loop Status</h4>
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                                        <th style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600' }}>PLO Code</th>
                                                        <th style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600' }}>Status</th>
                                                        <th style={{ padding: '0.8rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600' }}>Action Taken</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {achievementSummary.closingTheLoopStatus?.map((item, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '0.8rem 1rem' }}>{item.ploCode}</td>
                                                            <td style={{ padding: '0.8rem 1rem' }}>
                                                                <span style={{ 
                                                                    padding: '4px 10px', 
                                                                    borderRadius: '20px', 
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600',
                                                                    background: item.status === 'Met' ? 'rgba(80,204,127,0.15)' : item.status === 'Partially Met' ? 'rgba(255,204,0,0.15)' : 'rgba(255,27,107,0.15)',
                                                                    color: item.status === 'Met' ? '#50cc7f' : item.status === 'Partially Met' ? '#ffcc00' : '#ff1b6b'
                                                                }}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.8rem 1rem', color: 'rgba(255,255,255,0.6)' }}>{item.actionTaken || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    {(!achievementSummary.closingTheLoopStatus || achievementSummary.closingTheLoopStatus.length === 0) && (
                                                        <tr>
                                                            <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No records found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'comprehensive_reports' && (
                    <ComprehensiveReports />
                )}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'roles' && <RoleManagement />}
                {activeTab === 'faculties' && <Faculties />}
                {activeTab === 'departments' && <Departments />}
                {activeTab === 'teacherassignment' && <TeacherAssignment />}
                {activeTab === 'programs' && <Programs />}
                {activeTab === 'sessions' && <Sessions />}
                {activeTab === 'semesters' && <Semesters />}
                {activeTab === 'sections' && <Sections />}
                {activeTab === 'batches' && <Batches />}
                {activeTab === 'courses' && <Courses />}
                {activeTab === 'curriculum' && <Curriculum />}
                {activeTab === 'courseofferings' && <CourseOfferings />}
                {activeTab === 'studentprofile' && <StudentProfile />}
                {activeTab === 'admission' && <Admission />}
                {activeTab === 'enrollment' && <Enrollment />}
                {activeTab === 'semesterregistration' && <SemesterRegistration />}
                {activeTab === 'academicrecord' && <AcademicRecord />}
                {activeTab === 'courseallocation' && <CourseAllocation activeTab={activeTab} />}
                {activeTab === 'calendar' && <AcademicCalendar />}
                {activeTab === 'timetables' && <Timetables />}
                {activeTab === 'assessments' && <AssessmentManagement />}
                {activeTab === 'gas' && <GAManagement />}
                {activeTab === 'peos' && <PEOManagement />}
                {activeTab === 'plos' && <PLOManagement />}
                {activeTab === 'clos' && <CLOManagement />}
                {activeTab === 'bloomstaxonomy' && <BloomsTaxonomy />}
                { (activeTab === 'targets' || activeTab === 'curriculum_targets') && <TargetsManagement /> }
                {activeTab === 'obetemplates' && <ObeTemplates />}
                {activeTab === 'questionmapping' && <QuestionMapping />}
                {activeTab === 'blueprint' && <BlueprintManagement />}
                {activeTab === 'archive' && <ArchiveManagement />}
                {activeTab === 'courseassessments' && <AssessmentDefinition />}
                {activeTab === 'assessmentdef' && <AssessmentDefinition />}
                { (activeTab === 'rubrics' || activeTab === 'assessments_rubrics') && <RubricsManagement /> }
                { activeTab === 'obecalculation' && <ObeCalculationEngine /> }
                { activeTab === 'targetvsachieved' && <TargetVsAchieved /> }
                { activeTab === 'gapanalysis' && <GapAnalysis /> }
                { activeTab === 'closingtheloop' && <ClosingTheLoop /> }
                { activeTab === 'outcomesimulation' && <OutcomeSimulation /> }
                { activeTab === 'obegraphs' && <ObeGraphs /> }
                { activeTab === 'obe_archive' && <ObeHistory /> }
                { activeTab === 'obereports' && <ObeReports /> }
                {activeTab === 'executive_dashboard' && <ExecutiveDashboard />}
                {activeTab === 'questionbank' && <QuestionBank />}
                {activeTab === 'aifeatures' && <AIFeatures />}
                { activeTab === 'coursefiles' && <CourseFileManagement /> }
                { activeTab === 'accreditation_dashboard' && <AccreditationManagement /> }
                { (activeTab === 'attendance' || activeTab === 'attendance_management') && <AttendanceManagement /> }
                { (activeTab === 'marks' || activeTab === 'marks_management') && <MarksManagement /> }
                { activeTab === 'grademanagement' && <GradeManagement /> }
                { activeTab === 'resultprocessing' && <ResultProcessing /> }
                { activeTab === 'transcriptmanagement' && <TranscriptManagement /> }
                { activeTab === 'datalocks' && <DataLocking /> }
                { activeTab === 'reports_management' && <ReportsManagement /> }
                { activeTab === 'analytics' && <AnalyticsManagement /> }
                { activeTab === 'surveys' && <SurveyManagement /> }
                { activeTab === 'notifications_manage' && <NotificationManagement /> }
                { activeTab === 'workflow_approval' && <WorkflowManagement /> }
                { activeTab === 'qec_management' && <QECManagement /> }
                { activeTab === 'archive_manage' && <ArchiveManagement /> }
                { activeTab === 'profile' && <ProfileManagement /> }
                { activeTab === 'university_settings' && <UniversitySettings /> }
                { activeTab === 'role_assignment' && <UserRoleAssignment /> }
                { activeTab === 'activity_logs' && <ActivityLogs /> }
                { activeTab === 'audit_logs' && <AuditLogs /> }
                { activeTab === 'import_export' && <ImportExportCenter /> }
                { activeTab === 'data_management' && <DataManagement /> }
                { activeTab === 'branding_management' && <BrandingManagement /> }
                { activeTab === 'email_templates' && <EmailTemplates /> }
                { activeTab === 'ai_management' && <AIManagement /> }
                { activeTab === 'integrations' && <IntegrationsManagement /> }
            </main>
        </div>
    );
};

export default UniversityAdminDashboard;
