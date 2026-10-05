import React, { useState } from 'react';
import { 
    User, Users, BookOpen, Settings, LayoutDashboard, Calendar, ClipboardList, 
    BookMarked, FileSpreadsheet, PieChart, Database, UserCheck, Calculator,
    Shield, BarChart2, Briefcase, GraduationCap, Award, FileBadge, FileText, 
    ShieldCheck, Building2, UserCog, LogOut, ChevronDown, ChevronRight, 
    Layers, Grid, Archive, Target, Brain, Clock, Activity, TrendingDown, RefreshCw,
    BrainCircuit, TrendingUp, FolderOpen, Bell, GitMerge, Image, Mail, Link2, Bot, CheckSquare, RefreshCcw,
    Table2, ClipboardCheck
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import '../style/Sidebar.css';

// Role-based nav configs
const NAV_CONFIG = {
    SuperAdmin: [
        { id: 'overview',      label: 'Dashboard',      icon: LayoutDashboard },
        { id: 'universities',  label: 'Universities',    icon: Building2 },
        { id: 'admins',        label: 'User Management', icon: UserCog },
        { id: 'roles',         label: 'Role Management', icon: Shield },
        { id: 'settings',      label: 'Settings',        icon: Settings },
        { id: 'logs',          label: 'System Logs',     icon: ClipboardList },
        { id: 'reports_management',       label: 'System Reports',  icon: BarChart2 },
    ],
    UniversityAdmin: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'executive_dashboard', label: 'Executive Dashboard', icon: BarChart2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'roles', label: 'Roles & Permissions', icon: Shield },
        { id: 'attendance_management', label: 'Attendance Management', icon: Clock },
        { id: 'marks_management', label: 'Marks Management', icon: ClipboardList },
        { id: 'grademanagement', label: 'Grade Management', icon: Award },
        { id: 'resultprocessing', label: 'Result Processing', icon: FileBadge },
        { id: 'transcriptmanagement', label: 'Transcript Management', icon: FileText },
        { id: 'datalocks', label: 'Data Locks & Workflows', icon: ShieldCheck },
        { id: 'workflow_approval', label: 'Workflow & Approvals', icon: GitMerge },
        { id: 'qec_management', label: 'QEC Management', icon: ShieldCheck },
        { id: 'archive_manage', label: 'Archive Management', icon: Archive },
        { id: 'comprehensive_reports', label: 'Comprehensive Reports', icon: FileText },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'profile', label: 'My Profile', icon: UserCheck },
        { id: 'university_settings', label: 'University Settings', icon: Settings },
        { id: 'role_assignment', label: 'Role Management', icon: ShieldCheck },
        { id: 'activity_logs', label: 'Activity Logs', icon: Activity },
        { id: 'audit_logs', label: 'Audit Logs', icon: ClipboardList },
        { id: 'import_export', label: 'Import/Export Center', icon: Database },
        { id: 'data_management', label: 'Data Management', icon: Layers },
        { id: 'branding_management', label: 'Branding', icon: Image },
        { id: 'email_templates', label: 'Email Templates', icon: Mail },
        { id: 'ai_management', label: 'AI Management', icon: Bot },
        { id: 'integrations', label: 'Integrations', icon: Link2 },
        { id: 'surveys', label: 'Survey Management', icon: ClipboardList },
        { id: 'notifications_manage', label: 'Notifications', icon: Bell },
        { id: 'coursefiles', label: 'Course File Management', icon: FolderOpen },
        {
            id: 'curriculummgmt', label: 'Curriculum Management', icon: BookMarked,
            subItems: [
                { id: 'curriculum', label: 'Curriculum Builder' },
                { id: 'assessmentdef', label: 'Assessment Types' },
                { id: 'rubrics', label: 'Rubrics Engine' },
                { id: 'obecalculation', label: 'OBE Calculation Engine', icon: Calculator },
                { id: 'curriculum_targets', label: 'Target Management', icon: Target },
                { id: 'targetvsachieved', label: 'Target vs Achieved', icon: Activity },
                { id: 'gapanalysis', label: 'Gap Analysis', icon: TrendingDown },
                { id: 'closingtheloop', label: 'Closing the Loop', icon: RefreshCw },
                { id: 'outcomesimulation', label: 'Outcome Simulation', icon: BrainCircuit },
                { id: 'obegraphs', label: 'Graphs & Trends', icon: TrendingUp },
                { id: 'obe_archive', label: 'OBE History', icon: Archive }
            ]
        },
        {
            id: 'academic', label: 'Academic Management', icon: BookOpen,
            subItems: [
                { id: 'faculties', label: 'Faculties' },
                { id: 'departments', label: 'Departments' },
                { id: 'teacherassignment', label: 'Teacher Assignments' },
                { id: 'programs', label: 'Programs' },
                { id: 'sessions', label: 'Sessions' },
                { id: 'semesters', label: 'Semesters' },
                { id: 'courses', label: 'Courses' },
                { id: 'courseofferings', label: 'Course Offerings' },
                { id: 'courseallocation', label: 'Course Allocation' },
                { id: 'calendar', label: 'Academic Calendar' },
                { id: 'timetables', label: 'Timetables' },
            ]
        },
        {
            id: 'students', label: 'Student Management', icon: Users,
            subItems: [
                { id: 'studentprofile', label: 'Students' },
                { id: 'semesterregistration', label: 'Semester Registration' },
                { id: 'enrollment', label: 'Enrollment' },
                { id: 'sections', label: 'Sections' },
                { id: 'batches', label: 'Batches' },
                { id: 'attendance', label: 'Attendance' },
                { id: 'marks', label: 'Marks / Results' },
                { id: 'academicrecord', label: 'Student Academic Record' },
            ]
        },
        {
            id: 'obe', label: 'OBE Management', icon: Target,
            subItems: [
                { id: 'gas', label: 'GAs (Graduate Attributes)' },
                { id: 'peos', label: 'PEOs (Program Ed. Objectives)' },
                { id: 'plos', label: 'PLOs (Program Learning Outcomes)' },
                { id: 'clos', label: 'CLOs (Course Learning Outcomes)' },
                { id: 'bloomstaxonomy', label: 'Bloom\'s Taxonomy' },
                { id: 'targets', label: 'Targets Management' },
                { id: 'obetemplates', label: 'OBE Templates' },
                { id: 'questionmapping', label: 'Question Mapping' },
                { id: 'blueprint', label: 'Table of Specification' },
                { id: 'archive', label: 'Archive' }
            ]
        },
        {
            id: 'assessment_management_folder', label: 'Assessment Management', icon: ClipboardList,
            subItems: [
                { id: 'assessments', label: 'Grading Policies (Program)' },
                { id: 'courseassessments', label: 'Assessment Definitions' },
                { id: 'questionbank', label: 'Question Bank' },
                { id: 'assessments_rubrics', label: 'Rubrics Management' }
            ]
        },
        {
            id: 'ai', label: '✨ AI Features', icon: Brain,
            subItems: [
                { id: 'aifeatures', label: 'AI Tools Suite' }
            ]
        },
        { id: 'reports_management', label: 'Reports Management', icon: FileText },
        { id: 'obereports', label: 'OBE Reports', icon: Target },
        {
            id: 'accreditation', label: 'Accreditation Management', icon: ShieldCheck,
            subItems: [
                { id: 'accreditation_dashboard', label: 'Accreditation Dashboard' }
            ]
        }
    ],
    Dean: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'departments', label: 'Department Management', icon: Building2 },
        { id: 'programs', label: 'Program Management', icon: BookOpen },
        { id: 'coursefiles', label: 'Course File Monitoring', icon: FileText },
        { id: 'workflow_approval', label: 'Approval Workflow', icon: CheckSquare },
        { id: 'obereports', label: 'OBE Monitoring', icon: Target },
        { id: 'targetvsachieved', label: 'Target vs Achieved', icon: BarChart2 },
        { id: 'gapanalysis', label: 'Gap Analysis', icon: TrendingDown },
        { id: 'closingtheloop', label: 'Closing the Loop', icon: RefreshCcw },
        { id: 'reports_management', label: 'Reports', icon: BarChart2 },
        { id: 'obe_archive', label: 'OBE History', icon: Archive },
        { id: 'aifeatures', label: 'AI Features', icon: Brain },
    ],
    HOD: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'workflow_approval', label: 'Approval Workflow', icon: CheckSquare },
        { id: 'programs', label: 'Programs', icon: BookOpen },
        { id: 'sections', label: 'Sections', icon: Layers },
        { id: 'courses', label: 'Courses', icon: Archive },
        { id: 'coursefiles', label: 'Course Files', icon: FileText },
        { id: 'obereports', label: 'OBE Monitoring', icon: Target },
        { id: 'targetvsachieved', label: 'Target vs Achieved', icon: BarChart2 },
        { id: 'gapanalysis', label: 'Gap Analysis', icon: TrendingDown },
        { id: 'closingtheloop', label: 'Closing the Loop', icon: RefreshCcw },
        { id: 'reports_management', label: 'Reports', icon: BarChart2 },
        { id: 'obe_archive', label: 'OBE History', icon: Archive },
        { id: 'aifeatures', label: 'AI Features', icon: Brain },
    ],
    ProgramCoordinator: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'sections', label: 'Sections', icon: Layers },
        { id: 'batches', label: 'Batches', icon: Grid },
        { id: 'courses', label: 'Courses', icon: Archive },
        { id: 'obereports', label: 'OBE Reports', icon: Target },
        { id: 'reports_management', label: 'Reports Management', icon: FileText },
    ],
    Teacher: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_courses', label: 'My Courses', icon: BookOpen },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'assessments', label: 'Assessments', icon: ClipboardList },
        { id: 'marks', label: 'Marks', icon: FileSpreadsheet },
        { id: 'qmapping', label: 'Question Mapping', icon: GitMerge },
        { id: 'blueprint', label: 'Blueprint', icon: Table2 },
        { id: 'rubrics', label: 'Rubrics', icon: ClipboardCheck },
        { id: 'questionbank', label: 'Question Bank', icon: Database },
        { id: 'coursefile', label: 'Course File', icon: FolderOpen },
        { id: 'workflow_approval', label: 'Workflow Approvals', icon: CheckSquare },
        { id: 'obereports', label: 'OBE Monitoring', icon: Target },
        { id: 'btcoverage', label: 'BT Coverage', icon: Layers },
        { id: 'reports_management', label: 'Reports Hub', icon: FileText },
        { id: 'academic_analytics', label: 'Reports & Analytics', icon: BarChart2 },
        { id: 'aifeatures', label: 'AI Assistant', icon: Brain },
    ],
    Student: [
        { id: 'overview', label: 'My Portal', icon: LayoutDashboard },
        { id: 'studentprofile', label: 'My Profile', icon: User },
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'results', label: 'Results', icon: GraduationCap },
    ],
    QEC: [
        { id: 'overview',          label: 'Dashboard',            icon: LayoutDashboard },
        { id: 'qec_monitoring',    label: 'Quality Monitoring',    icon: ShieldCheck },
        { id: 'workflow_approval', label: 'Workflow Approvals',    icon: CheckSquare },
        { id: 'coursefiles',       label: 'Course File Audit',     icon: FolderOpen },
        { id: 'surveys',           label: 'Survey Management',     icon: ClipboardList },
        { id: 'indirect_assessment', label: 'Indirect Assessment', icon: Activity },
        { id: 'targetvsachieved',  label: 'Target vs Achieved',    icon: BarChart2 },
        { id: 'gapanalysis',       label: 'Gap Analysis',          icon: TrendingDown },
        { id: 'closingtheloop',    label: 'Closing the Loop',      icon: RefreshCcw },
        { id: 'obe_archive',       label: 'OBE History',           icon: Archive },
        { id: 'obereports',        label: 'OBE Reports',           icon: Target },
        { id: 'accreditation_dashboard', label: 'Accreditation', icon: Award },
        { id: 'reports_management',           label: 'QEC Reports',           icon: FileText },
    ],
};

const Sidebar = ({ activeTab, setActiveTab }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const role = user?.role || 'Student';
    const navItems = NAV_CONFIG[role] || NAV_CONFIG.Student;

    const [expandedMenus, setExpandedMenus] = useState({});
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleMenu = (id) => {
        setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleNavClick = (id) => {
        setActiveTab(id);
        setMobileOpen(false); // Close drawer when nav item is clicked on mobile
    };

    return (
        <>
            {/* Mobile top bar (visible only on small screens) */}
            <div className="sidebar-mobile-bar">
                <div className="mobile-brand">
                    <LayoutDashboard size={22} style={{ color: '#0ff0fc' }} />
                    <span>Al-Kawthar</span>
                </div>
                <button className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                    <span /><span /><span />
                </button>
            </div>

            {/* Overlay backdrop */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <LayoutDashboard size={28} className="brand-icon" />
                    <h2>Al-Kawthar</h2>
                </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    if (item.subItems) {
                        const isExpanded = expandedMenus[item.id];
                        const hasActiveSubItem = item.subItems.some(sub => sub.id === activeTab);
                        
                        return (
                            <div key={item.id} className="nav-group">
                                <button
                                    className={`nav-item ${hasActiveSubItem ? 'active' : ''}`}
                                    onClick={() => toggleMenu(item.id)}
                                >
                                    <Icon size={18} />
                                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                {isExpanded && (
                                    <div className="nav-subitems" style={{ paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {item.subItems.map(subItem => (
                                            <button
                                                key={subItem.id}
                                                className={`nav-item ${activeTab === subItem.id ? 'active' : ''}`}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', opacity: activeTab === subItem.id ? 1 : 0.7 }}
                                                onClick={() => handleNavClick(subItem.id)}
                                            >
                                                {subItem.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                
                    return (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.id)}
                        >
                            <Icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                    <div className="user-info">
                        <h4>{user?.name}</h4>
                        <p>{user?.role}</p>
                    </div>
                </div>
                <button onClick={() => dispatch(logout())} className="logout-btn">
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
        </>
    );
};

export default Sidebar;
