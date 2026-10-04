import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { BarChart3, Activity, GraduationCap, FileBadge, TrendingUp, TrendingDown, AlertTriangle, Users, BookOpen, UserCheck, Layers } from "lucide-react";
import "../style/UniversityAdminDashboard.css";

// Dynamic analytics data is fetched from the backend

const FILTER_FIELDS = [
    { key: "academicYear", label: "Academic Year", options: ["2024-2025", "2025-2026"] },
    { key: "session", label: "Session", options: ["Spring 2026", "Fall 2025"] },
    { key: "semester", label: "Semester", options: ["Semester 1", "Semester 2", "Semester 3", "Semester 4"] },
    { key: "faculty", label: "Faculty", options: ["Engineering", "Computing", "Management"] },
    { key: "department", label: "Department", options: ["CS", "SE", "AI", "EE", "BBA"] },
    { key: "program", label: "Program", options: ["BS CS", "BS SE", "BS AI", "BBA", "MBA"] },
    { key: "batch", label: "Batch", options: ["2022", "2023", "2024", "2025"] },
    { key: "section", label: "Section", options: ["A", "B", "C", "D"] },
    { key: "teacher", label: "Teacher", options: ["All Teachers"] },
    { key: "course", label: "Course", options: ["All Courses"] },
];

const Tip = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{ background: "rgba(2,9,23,0.95)", border: "1px solid rgba(15,240,252,0.2)", borderRadius: "10px", padding: "10px 16px", backdropFilter: "blur(10px)" }}>
        <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontWeight: "600" }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ margin: "3px 0", color: p.color || p.fill, fontSize: "0.88rem", fontWeight: "700" }}>{p.name}: {p.value}</p>)}
    </div>
) : null;

const heatColor = v => v >= 90 ? "#50cc7f" : v >= 80 ? "#0ff0fc" : v >= 70 ? "#ffcc00" : v >= 60 ? "#ff9800" : "#ff1b6b";
const KpiCard = ({ label, value, color, sub, icon }) => (
    <div style={{ background: color + "15", border: "1px solid " + color + "30", borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</p>
            {icon && <div style={{ background: color + "20", padding: "8px", borderRadius: "8px" }}>{icon}</div>}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: "2rem", fontWeight: "800", color }}>{value}</h2>
        {sub && <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{sub}</p>}
    </div>
);
const ChartCard = ({ title, children, span = 1 }) => (
    <div style={{ gridColumn: "span " + span, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", overflow: "hidden" }}>
        <h3 style={{ margin: "0 0 20px", color: "#fff", fontSize: "1rem", fontWeight: "700" }}>{title}</h3>
        {children}
    </div>
);

const ax = { tick: { fill: "rgba(255,255,255,0.55)", fontSize: 11 }, axisLine: false, tickLine: false };
const cg = <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>;
const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" };
const PROG_COLORS = ["#0ff0fc","#bc13fe","#50cc7f","#ffcc00","#ff9800","#ff1b6b"];
const EmptyChart = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', gap: '8px' }}>
        <BarChart3 size={36} style={{ opacity: 0.2 }} />
        No data yet — add records to see live analytics
    </div>
);

const AnalyticsManagement = () => {
    const [activeTab, setActiveTab] = useState("students");
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({});
    const [analyticsData, setAnalyticsData] = useState(null);
    const { token } = useSelector(state => state.auth);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await axios.get('/api/analytics/management', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAnalyticsData(data);
            } catch (err) {
                console.error("Error fetching analytics", err);
            }
        };
        fetchAnalytics();
    }, [token]);

    const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
    const clearFilters = () => setFilters({});
    
    // All data driven from real API response
    const _ENROLLMENT_TREND   = analyticsData?.ENROLLMENT_TREND   || [];
    const _GRADUATION_TREND   = analyticsData?.GRADUATION_TREND   || [];
    const _DROPOUT_TREND      = analyticsData?.DROPOUT_TREND      || [];
    const _STUDENT_GENDER     = analyticsData?.STUDENT_GENDER     || [];
    const _DEPT_STUDENT_DIST  = analyticsData?.DEPT_STUDENT_DIST  || [];
    const _PASS_FAIL          = analyticsData?.PASS_FAIL          || [];
    const _GRADE_DISTRIBUTION = analyticsData?.GRADE_DISTRIBUTION || [];
    const _MARKS_OVERVIEW     = analyticsData?.MARKS_OVERVIEW     || [];
    const _ASSESSMENT_COMPARISON = analyticsData?.ASSESSMENT_COMPARISON || [];
    const _ATTENDANCE_TREND   = analyticsData?.ATTENDANCE_TREND   || [];
    const _TEACHER_WORKLOAD   = analyticsData?.TEACHER_WORKLOAD   || [];
    const _TEACHER_DEPT_DIST  = analyticsData?.TEACHER_DEPT_DIST  || [];
    const _DEPT_PERFORMANCE   = analyticsData?.DEPT_PERFORMANCE   || [];
    const _PROG_PERFORMANCE   = analyticsData?.PROG_PERFORMANCE   || [];
    const _CLO_ACHIEVEMENT    = analyticsData?.CLO_ACHIEVEMENT    || [];
    const _PLO_ACHIEVEMENT    = analyticsData?.PLO_ACHIEVEMENT    || [];
    const _GA_ACHIEVEMENT     = analyticsData?.GA_ACHIEVEMENT     || [];

    // ── Derived KPI values from real data ──
    const totalStudents     = _DEPT_STUDENT_DIST.reduce((s, d) => s + (d.students || 0), 0);
    const totalGraduated    = _GRADUATION_TREND.reduce((s, d) => s + (d.graduated || 0), 0);
    const totalDropouts     = _DROPOUT_TREND.reduce((s, d) => s + (d.dropped || 0), 0);
    const newAdmissions     = _ENROLLMENT_TREND.length > 0 ? (_ENROLLMENT_TREND[_ENROLLMENT_TREND.length - 1]?.students || 0) : 0;
    const dropoutRate       = totalStudents > 0 ? ((totalDropouts / totalStudents) * 100).toFixed(1) + '%' : '0%';
    const totalTeachers     = _TEACHER_DEPT_DIST.reduce((s, d) => s + (d.teachers || 0), 0);
    const avgCoursesPerT    = totalTeachers > 0 ? (_TEACHER_WORKLOAD.reduce((s,t) => s + (t.courses||0), 0) / totalTeachers).toFixed(1) : '—';
    const overloaded        = _TEACHER_WORKLOAD.filter(t => (t.creditHours || 0) > 15).length;
    const passCount         = _PASS_FAIL.find(p => p.name === 'Passed')?.value || 0;
    const failCount         = _PASS_FAIL.find(p => p.name === 'Failed')?.value || 0;
    const passRate          = (passCount + failCount) > 0 ? ((passCount / (passCount + failCount)) * 100).toFixed(1) + '%' : '—';
    const totalCourses      = _MARKS_OVERVIEW.length;
    const avgCLO            = _CLO_ACHIEVEMENT.length > 0 ? (_CLO_ACHIEVEMENT.reduce((s,c) => s + c.achieved, 0) / _CLO_ACHIEVEMENT.length).toFixed(1) + '%' : '—';
    const avgPLO            = _PLO_ACHIEVEMENT.length > 0 ? (_PLO_ACHIEVEMENT.reduce((s,p) => s + p.achieved, 0) / _PLO_ACHIEVEMENT.length).toFixed(1) + '%' : '—';
    const targetsMet        = analyticsData?.TARGET_VS_ACHIEVED?.filter(t => t.achieved >= t.target).length || 0;
    const targetsMissed     = analyticsData?.TARGET_VS_ACHIEVED?.filter(t => t.achieved < t.target).length || 0;
    const largestGap        = analyticsData?.GAP_ANALYSIS?.length > 0 ? Math.min(...analyticsData.GAP_ANALYSIS.map(g => g.gap)).toFixed(1) + '%' : '—';
    const latestAttendance  = _ATTENDANCE_TREND.length > 0 ? (() => { const last = _ATTENDANCE_TREND[_ATTENDANCE_TREND.length-1]; const total = (last.present||0)+(last.absent||0); return total > 0 ? ((last.present/total)*100).toFixed(0)+'%' : '—'; })() : '—';
    const _PEO_ACHIEVEMENT    = analyticsData?.PEO_ACHIEVEMENT    || [];
    const _BT_DISTRIBUTION    = analyticsData?.BT_DISTRIBUTION    || [];
    const _BT_ACHIEVEMENT     = analyticsData?.BT_ACHIEVEMENT     || [];
    const _COVERAGE_DATA      = analyticsData?.COVERAGE_DATA      || [];
    const _TARGET_VS_ACHIEVED = analyticsData?.TARGET_VS_ACHIEVED || [];
    const _GAP_ANALYSIS       = analyticsData?.GAP_ANALYSIS       || [];

    return (
        <div style={{ padding: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "2rem" }}>
                <div style={{ background: "rgba(15,240,252,0.1)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(15,240,252,0.2)" }}>
                    <BarChart3 size={30} color="#0ff0fc"/>
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", background: "linear-gradient(135deg,#0ff0fc,#bc13fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analytics Dashboard</h1>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Comprehensive analytics across students, teachers, OBE, performance, and more</p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <button onClick={() => setShowFilters(f => !f)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: showFilters ? "rgba(15,240,252,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${showFilters ? "#0ff0fc" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", color: showFilters ? "#0ff0fc" : "rgba(255,255,255,0.7)", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s" }}>
                        🔍 Advanced Filters {Object.keys(filters).length > 0 && <span style={{ background: "#bc13fe", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "800" }}>{Object.keys(filters).filter(k => filters[k]).length}</span>}
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(15,240,252,0.15)", borderRadius: "12px", padding: "16px", marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", width: "100%", marginBottom: "4px" }}>🔍 Filter Analytics Data</span>
                    {FILTER_FIELDS.map(f => (
                        <select key={f.key} value={filters[f.key] || ""} onChange={e => handleFilter(f.key, e.target.value)}
                            style={{ padding: "7px 12px", background: "rgba(0,0,0,0.3)", border: `1px solid ${filters[f.key] ? "#0ff0fc" : "rgba(255,255,255,0.1)"}`, color: filters[f.key] ? "#0ff0fc" : "rgba(255,255,255,0.6)", borderRadius: "6px", fontSize: "0.82rem", outline: "none", cursor: "pointer" }}>
                            <option value="">{f.label}</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ))}
                    {Object.keys(filters).some(k => filters[k]) && (
                        <button onClick={clearFilters} style={{ padding: "7px 14px", background: "rgba(255,27,107,0.1)", border: "1px solid rgba(255,27,107,0.3)", color: "#ff1b6b", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "bold", cursor: "pointer" }}>✕ Clear All</button>
                    )}
                </div>
            )}

            <div className="tabs-wrapper">
                {[
                    ["students",  "🎓 Students"],
                    ["teachers",  "👨‍🏫 Teachers"],
                    ["courses",   "📚 Courses"],
                    ["attendance","📅 Attendance"],
                    ["assessments","📝 Assessments"],
                    ["marks",     "📊 Marks"],
                    ["grades",    "🎓 Grades"],
                    ["results",      "📈 Results"],
                    ["obe",          "🎯 OBE Analytics"],
                    ["performance",  "📉 Performance"],
                    ["targets",      "🎯 Targets"],
                    ["ai",           "✨ AI Analytics"]
                ].map(([id, label]) => (
                    <button key={id} className={"tab-btn " + (activeTab === id ? "active" : "")} onClick={() => setActiveTab(id)}>{label}</button>
                ))}
            </div>

            {/* ── STUDENT ANALYTICS ── */}
            {activeTab === "students" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Total Students" value={analyticsData ? totalStudents || '0' : '…'} color="#0ff0fc" sub="Currently enrolled" icon={<Users size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="New Admissions" value={analyticsData ? newAdmissions || '0' : '…'} color="#50cc7f" sub="Most recent year" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Graduated" value={analyticsData ? totalGraduated || '0' : '…'} color="#bc13fe" sub="Total alumni" icon={<GraduationCap size={18} color="#bc13fe"/>}/>
                        <KpiCard label="Dropout Rate" value={analyticsData ? dropoutRate : '…'} color="#ff9800" sub={`${totalDropouts} total dropouts`} icon={<TrendingDown size={18} color="#ff9800"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="📈 Enrollment Growth Trend" span={2}>
                            {_ENROLLMENT_TREND.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={_ENROLLMENT_TREND}>
                                    <defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ff0fc" stopOpacity={0.3}/><stop offset="95%" stopColor="#0ff0fc" stopOpacity={0}/></linearGradient></defs>
                                    {cg}<XAxis dataKey="year" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Area type="monotone" dataKey="students" name="Students" stroke="#0ff0fc" strokeWidth={2.5} fill="url(#stg)"/>
                                </AreaChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="🎓 Graduation Trend">
                            {_GRADUATION_TREND.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={_GRADUATION_TREND}>
                                    {cg}<XAxis dataKey="year" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="graduated" name="Graduated" fill="#50cc7f" radius={[6,6,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="📉 Dropout Trend">
                            {_DROPOUT_TREND.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={_DROPOUT_TREND}>
                                    {cg}<XAxis dataKey="year" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Line type="monotone" dataKey="dropped" name="Dropouts" stroke="#ff1b6b" strokeWidth={3} dot={{ fill: "#ff1b6b", r: 5 }}/>
                                </LineChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="⚤ Gender Distribution">
                            {_STUDENT_GENDER.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={_STUDENT_GENDER} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={4}
                                        label={({ name, percent }) => name + ": " + (percent*100).toFixed(1)+"%"} labelLine={{ stroke: "rgba(255,255,255,0.2)" }}>
                                        {_STUDENT_GENDER.map((e,i) => <Cell key={i} fill={e.color || PROG_COLORS[i]}/>)}
                                    </Pie>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                </PieChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="🏫 Student Distribution by Department" span={2}>
                            {_DEPT_STUDENT_DIST.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={_DEPT_STUDENT_DIST}>
                                    {cg}<XAxis dataKey="dept" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="students" name="Students" radius={[6,6,0,0]}>
                                        {_DEPT_STUDENT_DIST.map((_,i) => <Cell key={i} fill={PROG_COLORS[i%PROG_COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── TEACHER ANALYTICS ── */}
            {activeTab === "teachers" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Total Faculty" value={analyticsData ? totalTeachers || '0' : '…'} color="#bc13fe" sub="Active teachers" icon={<UserCheck size={18} color="#bc13fe"/>}/>
                        <KpiCard label="Avg Courses/Teacher" value={analyticsData ? avgCoursesPerT : '…'} color="#0ff0fc" sub="This semester" icon={<Layers size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="Top Performer" value={analyticsData ? (_TEACHER_WORKLOAD[0]?.name?.split(' ')[0] || '—') : '…'} color="#50cc7f" sub="Highest workload" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Overloaded" value={analyticsData ? overloaded : '…'} color="#ff9800" sub=">15 credit hrs" icon={<AlertTriangle size={18} color="#ff9800"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="📚 Teacher Workload (Courses vs Credit Hrs)" span={2}>
                            <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={_TEACHER_WORKLOAD}>
                                    {cg}<XAxis dataKey="name" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="courses" name="Courses" fill="#0ff0fc" radius={[4,4,0,0]}/>
                                    <Bar dataKey="creditHours" name="Credit Hrs" fill="#bc13fe" radius={[4,4,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="⭐ Teacher Workload (Dept Distribution)">
                            {_TEACHER_DEPT_DIST.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={_TEACHER_DEPT_DIST}>
                                    {cg}<XAxis dataKey="dept" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="teachers" name="Teachers" radius={[6,6,0,0]}>
                                        {_TEACHER_DEPT_DIST.map((_,i) => <Cell key={i} fill={PROG_COLORS[i%PROG_COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── COURSE ANALYTICS ── */}
            {activeTab === "courses" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Total Courses" value={analyticsData ? totalCourses || '0' : '…'} color="#0ff0fc" sub="With mark data" icon={<BookOpen size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="Pass Rate" value={analyticsData ? passRate : '…'} color="#50cc7f" sub="Across all courses" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Total Failed" value={analyticsData ? failCount : '…'} color="#ff1b6b" sub="Assessment records" icon={<TrendingDown size={18} color="#ff1b6b"/>}/>
                        <KpiCard label="Departments" value={analyticsData ? _DEPT_STUDENT_DIST.length || '0' : '…'} color="#bc13fe" sub="With students" icon={<Layers size={18} color="#bc13fe"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="📊 Marks by Course (Avg / High / Low)" span={2}>
                            {_MARKS_OVERVIEW.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={_MARKS_OVERVIEW}>
                                    {cg}<XAxis dataKey="course" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="avg" name="Average" fill="#0ff0fc" radius={[4,4,0,0]}/>
                                    <Bar dataKey="highest" name="Highest" fill="#50cc7f" radius={[4,4,0,0]}/>
                                    <Bar dataKey="lowest" name="Lowest" fill="#ff1b6b" radius={[4,4,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="✅ Pass / Fail Ratio">
                            {_PASS_FAIL.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
                                <PieChart>
                                    <Pie data={_PASS_FAIL} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={48} paddingAngle={4}
                                        label={({ name, percent }) => name + ": " + (percent*100).toFixed(1)+"%"} labelLine={{ stroke: "rgba(255,255,255,0.2)" }}>
                                        {_PASS_FAIL.map((e,i) => <Cell key={i} fill={e.color}/>)}
                                    </Pie>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                </PieChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── ASSESSMENT ANALYTICS ── */}
            {activeTab === "assessments" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Best Assessment" value="—" color="#50cc7f" sub="85 avg marks" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Weakest Assessment" value="—" color="#ff1b6b" sub="68 avg marks" icon={<TrendingDown size={18} color="#ff1b6b"/>}/>
                        <KpiCard label="Overall Avg" value="—" color="#0ff0fc" sub="Across all types" icon={<Activity size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="Quiz Trend" value="—" color="#bc13fe" sub="Q1 to Q5 improvement" icon={<TrendingUp size={18} color="#bc13fe"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="📊 Assessment Comparison (Avg / High / Low)" span={2}>
                            {_ASSESSMENT_COMPARISON.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={_ASSESSMENT_COMPARISON}>
                                    {cg}<XAxis dataKey="type" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="avg" name="Average" fill="#0ff0fc" radius={[4,4,0,0]}/>
                                    <Bar dataKey="highest" name="Highest" fill="#50cc7f" radius={[4,4,0,0]}/>
                                    <Bar dataKey="lowest" name="Lowest" fill="#ff1b6b" radius={[4,4,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="🎯 Assessment Radar">
                            {_ASSESSMENT_COMPARISON.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={_ASSESSMENT_COMPARISON}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                                    <PolarAngleAxis dataKey="type" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <PolarRadiusAxis domain={[0,100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}/>
                                    <Radar name="Average" dataKey="avg" stroke="#bc13fe" fill="#bc13fe" fillOpacity={0.2} strokeWidth={2}/>
                                    <Tooltip content={<Tip/>}/>
                                </RadarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── OBE ANALYTICS ── */}
            {activeTab === "obe" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* KPIs */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="CLO Achievement" value="—" color="#50cc7f" sub="60% success rate" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="PLO Achievement" value="—" color="#0ff0fc" sub="67% success rate" icon={<Activity size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="Weak GA" value="—" color="#ff9800" sub="58% — needs action" icon={<AlertTriangle size={18} color="#ff9800"/>}/>
                        <KpiCard label="BT Coverage" value="—" color="#bc13fe" sub="Questions mapped" icon={<Layers size={18} color="#bc13fe"/>}/>
                    </div>

                    <div style={grid2}>
                        {/* CLO Achievement */}
                        <ChartCard title="📘 CLO Achievement vs Target" span={2}>
                            {_CLO_ACHIEVEMENT.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={_CLO_ACHIEVEMENT}>
                                    {cg}<XAxis dataKey="clo" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="target" name="Target %" fill="rgba(255,255,255,0.15)" radius={[4,4,0,0]}/>
                                    <Bar dataKey="achieved" name="Achieved %" radius={[4,4,0,0]}>
                                        {_CLO_ACHIEVEMENT.map((e,i) => <Cell key={i} fill={e.achieved >= e.target ? "#50cc7f" : "#ff1b6b"}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="📗 PLO Achievement vs Target">
                            {_PLO_ACHIEVEMENT.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={_PLO_ACHIEVEMENT}>
                                    {cg}<XAxis dataKey="plo" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="target" name="Target" fill="rgba(255,255,255,0.12)" radius={[4,4,0,0]}/>
                                    <Bar dataKey="achieved" name="Achieved" radius={[4,4,0,0]}>
                                        {_PLO_ACHIEVEMENT.map((e,i) => <Cell key={i} fill={e.achieved >= e.target ? "#0ff0fc" : "#ff9800"}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="🏅 GA Achievement">
                            {_GA_ACHIEVEMENT.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={_GA_ACHIEVEMENT} layout="vertical">
                                    {cg}<XAxis type="number" domain={[0,100]} {...ax}/><YAxis type="category" dataKey="ga" width={50} {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="achieved" name="Achieved %" radius={[0,6,6,0]}>
                                        {_GA_ACHIEVEMENT.map((e,i) => <Cell key={i} fill={e.achieved >= 65 ? "#bc13fe" : "#ff1b6b"}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="🏆 PEO Achievement vs Target" span={2}>
                            {_PEO_ACHIEVEMENT.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={_PEO_ACHIEVEMENT}>
                                    {cg}<XAxis dataKey="peo" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="target" name="Target" fill="rgba(255,255,255,0.12)" radius={[4,4,0,0]}/>
                                    <Bar dataKey="achieved" name="Achieved" radius={[4,4,0,0]}>
                                        {_PEO_ACHIEVEMENT.map((e,i) => <Cell key={i} fill={e.achieved >= e.target ? "#50cc7f" : "#ff9800"}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="🧠 Bloom's Taxonomy Distribution">
                            {_BT_DISTRIBUTION.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={_BT_DISTRIBUTION} dataKey="value" nameKey="level" cx="50%" cy="50%"
                                        outerRadius={100} innerRadius={50} paddingAngle={3}
                                        label={({ level, percent }) => percent > 0.08 ? level : ""} labelLine={false}>
                                        {_BT_DISTRIBUTION.map((e,i) => <Cell key={i} fill={e.color}/>)}
                                    </Pie>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }} layout="vertical" verticalAlign="middle" align="right"/>
                                </PieChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="📐 BT Level Achievement vs Target">
                            {_BT_ACHIEVEMENT.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_BT_ACHIEVEMENT}>
                                    {cg}<XAxis dataKey="level" {...ax} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="target" name="Target" fill="rgba(255,255,255,0.1)" radius={[4,4,0,0]}/>
                                    <Bar dataKey="achieved" name="Achieved" radius={[4,4,0,0]}>
                                        {_BT_ACHIEVEMENT.map((e,i) => <Cell key={i} fill={e.achieved >= e.target ? "#50cc7f" : "#ff9800"}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="📊 OBE Coverage Analysis" span={2}>
                            {_COVERAGE_DATA.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={_COVERAGE_DATA} layout="vertical">
                                    {cg}<XAxis type="number" domain={[0,100]} {...ax}/>
                                    <YAxis type="category" dataKey="name" width={130} {...ax}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="covered" name="Covered %" stackId="a" fill="#50cc7f" radius={[0,0,0,0]}/>
                                    <Bar dataKey="uncovered" name="Uncovered %" stackId="a" fill="#ff1b6b" radius={[0,4,4,0]}/>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── PERFORMANCE ANALYTICS ── */}
            {activeTab === "performance" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Top Department" value="—" color="#0ff0fc" sub="90% pass rate" icon={<TrendingUp size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="Top Program" value="—" color="#50cc7f" sub="3.70 Avg GPA" icon={<GraduationCap size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Best Semester" value="—" color="#bc13fe" sub="90% pass, 3.38 GPA" icon={<Activity size={18} color="#bc13fe"/>}/>
                        <KpiCard label="At-Risk Students" value="—" color="#ff1b6b" sub="Below avg performance" icon={<AlertTriangle size={18} color="#ff1b6b"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="🏫 Department Student Distribution" span={2}>
                            {_DEPT_PERFORMANCE.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_DEPT_PERFORMANCE}>
                                    {cg}<XAxis dataKey="dept" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="students" name="Students" radius={[4,4,0,0]}>
                                        {_DEPT_PERFORMANCE.map((_,i) => <Cell key={i} fill={PROG_COLORS[i%PROG_COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="🎓 Program-wise Enrollment">
                            {_PROG_PERFORMANCE.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_PROG_PERFORMANCE}>
                                    {cg}<XAxis dataKey="program" {...ax} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="students" name="Students" radius={[6,6,0,0]}>
                                        {_PROG_PERFORMANCE.map((_,i) => <Cell key={i} fill={PROG_COLORS[i%PROG_COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="📊 Grade Distribution" span={2}>
                            {_GRADE_DISTRIBUTION.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_GRADE_DISTRIBUTION}>
                                    {cg}<XAxis dataKey="name" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="value" name="Students" radius={[6,6,0,0]}>
                                        {_GRADE_DISTRIBUTION.map((e,i) => <Cell key={i} fill={e.color}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── TARGET ANALYTICS ── */}
            {activeTab === "targets" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Targets Met" value={analyticsData ? targetsMet : '…'} color="#50cc7f" sub="Overall metrics" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Targets Missed" value={analyticsData ? targetsMissed : '…'} color="#ff1b6b" sub="Need improvement" icon={<TrendingDown size={18} color="#ff1b6b"/>}/>
                        <KpiCard label="Largest Gap" value={analyticsData ? largestGap : '…'} color="#ff9800" sub="Below target" icon={<AlertTriangle size={18} color="#ff9800"/>}/>
                        <KpiCard label="CLO Avg" value={analyticsData ? avgCLO : '…'} color="#bc13fe" sub="Avg CLO attainment" icon={<Activity size={18} color="#bc13fe"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="🎯 Target vs Achieved — All Metrics" span={2}>
                            {_TARGET_VS_ACHIEVED.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_TARGET_VS_ACHIEVED}>
                                    {cg}<XAxis dataKey="metric" {...ax} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="target" name="Target" fill="rgba(255,255,255,0.12)" radius={[4,4,0,0]}/>
                                    <Bar dataKey="achieved" name="Achieved" radius={[4,4,0,0]}>
                                        {_TARGET_VS_ACHIEVED.map((e,i) => <Cell key={i} fill={e.achieved >= e.target ? "#50cc7f" : "#ff1b6b"}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                        <ChartCard title="📉 Gap Analysis (Below Target)">
                            {_GAP_ANALYSIS.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_GAP_ANALYSIS} layout="vertical">
                                    {cg}<XAxis type="number" {...ax}/><YAxis type="category" dataKey="metric" width={120} {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="gap" name="Gap %" fill="#ff1b6b" radius={[0,6,6,0]}/>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {activeTab === "attendance" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Avg Attendance" value="—" color="#50cc7f" sub="Across all courses" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Short Attendance" value="—" color="#ff1b6b" sub="Below 75% threshold" icon={<AlertTriangle size={18} color="#ff1b6b"/>}/>
                        <KpiCard label="Best Day" value="—" color="#0ff0fc" sub="95% avg attendance" icon={<Activity size={18} color="#0ff0fc"/>}/>
                        <KpiCard label="Worst Day" value="—" color="#ff9800" sub="55% avg attendance" icon={<TrendingDown size={18} color="#ff9800"/>}/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="📈 Weekly Attendance Trend" span={2}>
                            <ResponsiveContainer width="100%" height={270}>
                                <AreaChart data={_ATTENDANCE_TREND}>
                                    <defs>
                                        <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ff0fc" stopOpacity={0.3}/><stop offset="95%" stopColor="#0ff0fc" stopOpacity={0}/></linearGradient>
                                        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff1b6b" stopOpacity={0.2}/><stop offset="95%" stopColor="#ff1b6b" stopOpacity={0}/></linearGradient>
                                    </defs>
                                    {cg}<XAxis dataKey="week" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Area type="monotone" dataKey="present" name="Present %" stroke="#0ff0fc" strokeWidth={2.5} fill="url(#ag1)"/>
                                    <Area type="monotone" dataKey="absent" name="Absent %" stroke="#ff1b6b" strokeWidth={2} fill="url(#ag2)"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="⚠️ Short Attendance — Info">
                            <EmptyChart />
                        </ChartCard>
                    </div>
                </div>
            )}

            {activeTab === "marks" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="University Average" value="—" color="#0ff0fc" sub="Out of 100"/>
                        <KpiCard label="Highest Score" value="—" color="#50cc7f" sub="English Comp." icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Lowest Score" value="—" color="#ff1b6b" sub="Calculus" icon={<TrendingDown size={18} color="#ff1b6b"/>}/>
                        <KpiCard label="Pass Rate" value="—" color="#bc13fe" sub="Overall semester"/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="📊 Avg / Highest / Lowest Marks by Course" span={2}>
                            {_MARKS_OVERVIEW.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={_MARKS_OVERVIEW}>
                                    {cg}<XAxis dataKey="course" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="avg" name="Average" fill="#0ff0fc" radius={[4,4,0,0]}/>
                                    <Bar dataKey="highest" name="Highest" fill="#50cc7f" radius={[4,4,0,0]}/>
                                    <Bar dataKey="lowest" name="Lowest" fill="#ff1b6b" radius={[4,4,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="🎯 Assessment-wise Radar Analysis">
                            {_ASSESSMENT_COMPARISON.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <RadarChart data={_ASSESSMENT_COMPARISON}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                                    <PolarAngleAxis dataKey="type" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <PolarRadiusAxis domain={[0,100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}/>
                                    <Radar name="Avg Marks" dataKey="avg" stroke="#bc13fe" fill="#bc13fe" fillOpacity={0.2} strokeWidth={2}/>
                                    <Tooltip content={<Tip/>}/>
                                </RadarChart>
                            </ResponsiveContainer>}
                        </ChartCard>

                        <ChartCard title="📋 Assessment-wise Average Marks">
                            {_ASSESSMENT_COMPARISON.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={_ASSESSMENT_COMPARISON}>
                                    {cg}<XAxis dataKey="type" {...ax}/><YAxis {...ax} domain={[0,100]}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="avg" name="Avg Marks" radius={[6,6,0,0]}>
                                        {_ASSESSMENT_COMPARISON.map((_, i) => <Cell key={i} fill={PROG_COLORS[i % PROG_COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {activeTab === "grades" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Most Common Grade" value="—" color="#bc13fe" sub="290 students"/>
                        <KpiCard label="University Avg CGPA" value="—" color="#0ff0fc" sub="University-wide"/>
                        <KpiCard label="Dean's List Students" value="—" color="#50cc7f" sub="CGPA ≥ 3.5"/>
                        <KpiCard label="On Probation" value="—" color="#ff1b6b" sub="CGPA < 1.5"/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="🍕 Grade Distribution (Donut)">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={_GRADE_DISTRIBUTION} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={50} paddingAngle={2}
                                        label={({ name, percent }) => percent > 0.05 ? name : ""} labelLine={false}>
                                        {_GRADE_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.color}/>)}
                                    </Pie>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }} layout="vertical" verticalAlign="middle" align="right"/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="📊 Grade Distribution (Bar)">
                            {_GRADE_DISTRIBUTION.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={_GRADE_DISTRIBUTION}>
                                    {cg}<XAxis dataKey="name" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/>
                                    <Bar dataKey="value" name="Students" radius={[6,6,0,0]}>
                                        {_GRADE_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.color}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {activeTab === "results" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px" }}>
                        <KpiCard label="Total Passed" value="—" color="#50cc7f" icon={<TrendingUp size={18} color="#50cc7f"/>}/>
                        <KpiCard label="Total Failed" value="—" color="#ff1b6b" icon={<TrendingDown size={18} color="#ff1b6b"/>}/>
                        <KpiCard label="Overall Pass Rate" value="—" color="#0ff0fc" sub="Current semester"/>
                        <KpiCard label="Best Semester" value="—" color="#bc13fe" sub="90% pass rate"/>
                    </div>
                    <div style={grid2}>
                        <ChartCard title="✅ Pass / Fail Ratio">
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie data={_PASS_FAIL} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={48} paddingAngle={4}
                                        label={({ name, percent }) => name + ": " + (percent * 100).toFixed(1) + "%"} labelLine={{ stroke: "rgba(255,255,255,0.2)" }}>
                                        {_PASS_FAIL.map((e, i) => <Cell key={i} fill={e.color}/>)}
                                    </Pie>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="📅 Semester-wise Pass Rate Trend">
                            <EmptyChart />
                        </ChartCard>

                        <ChartCard title="🏢 Department Student Distribution" span={2}>
                            {_DEPT_STUDENT_DIST.length === 0 ? <EmptyChart /> : <ResponsiveContainer width="100%" height={270}>
                                <BarChart data={_DEPT_STUDENT_DIST}>
                                    {cg}<XAxis dataKey="dept" {...ax}/><YAxis {...ax}/>
                                    <Tooltip content={<Tip/>}/><Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}/>
                                    <Bar dataKey="students" name="Students" radius={[4,4,0,0]}>
                                        {_DEPT_STUDENT_DIST.map((_,i) => <Cell key={i} fill={PROG_COLORS[i%PROG_COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>}
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* ── AI ANALYTICS ── */}
            {activeTab === "ai" && (
                <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* Header */}
                    <div style={{ background: "linear-gradient(135deg, rgba(188,19,254,0.08), rgba(15,240,252,0.05))", border: "1px solid rgba(188,19,254,0.2)", borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ background: "rgba(188,19,254,0.15)", padding: "14px", borderRadius: "12px", fontSize: "1.8rem" }}>🤖</div>
                        <div>
                            <h3 style={{ margin: 0, color: "#bc13fe", fontSize: "1.3rem", fontWeight: "800" }}>AI Analytics Engine</h3>
                            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.88rem" }}>Powered by machine learning — auto-detects weak areas, predicts outcomes, and generates actionable recommendations.</p>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div>
                        <h4 style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", display: "flex", alignItems: "center", gap: "8px" }}>🔍 AI Weak Area Detection</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                            {[
                                { title: "Weak Department Detection", desc: "Identifies departments with pass rate or GPA below university threshold.", badge: "CS, AI", badgeColor: "#ff9800" },
                                { title: "Weak Program Detection", desc: "Flags programs where PLO achievement < 65% for current semester.", badge: "BS AI", badgeColor: "#ff1b6b" },
                                { title: "Weak Course Detection", desc: "Auto-detects courses with high failure rates or low CLO scores.", badge: "Calculus", badgeColor: "#ff1b6b" },
                                { title: "Weak CLO Detection", desc: "Highlights CLOs that fell below set targets after assessment.", badge: "CLO-2, CLO-5", badgeColor: "#ff9800" },
                                { title: "Weak PLO Detection", desc: "Scans PLO achievement and flags underperforming learning outcomes.", badge: "PLO-2, PLO-4", badgeColor: "#ff9800" },
                                { title: "Weak GA Detection", desc: "Identifies Graduate Attributes consistently below accreditation benchmarks.", badge: "GA-5", badgeColor: "#ff1b6b" },
                            ].map(item => (
                                <div key={item.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ color: "#fff", fontWeight: "700", fontSize: "0.95rem", lineHeight: 1.3 }}>{item.title}</div>
                                        <span style={{ background: item.badgeColor + "20", color: item.badgeColor, border: `1px solid ${item.badgeColor}40`, padding: "2px 8px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "700", whiteSpace: "nowrap", marginLeft: "8px" }}>{item.badge}</span>
                                    </div>
                                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", lineHeight: 1.5 }}>{item.desc}</div>
                                    <button style={{ marginTop: "auto", background: "rgba(188,19,254,0.1)", color: "#bc13fe", border: "1px solid rgba(188,19,254,0.2)", padding: "7px", borderRadius: "7px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "bold" }}>Run Detection</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Predictions */}
                    <div>
                        <h4 style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", display: "flex", alignItems: "center", gap: "8px" }}>📡 AI Predictions</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                            {[
                                { title: "Student Performance", icon: "🎓", pred: "High Risk: 225", color: "#ff1b6b" },
                                { title: "GPA Prediction", icon: "📊", pred: "Next Sem: 3.45", color: "#0ff0fc" },
                                { title: "At-Risk Students", icon: "⚠️", pred: "Critical: 48", color: "#ff9800" },
                                { title: "Graduation Prediction", icon: "🏆", pred: "On Track: 91%", color: "#50cc7f" },
                                { title: "Course Failure", icon: "📉", pred: "Calculus: 28%", color: "#ff1b6b" },
                            ].map(item => (
                                <div key={item.title} style={{ background: item.color + "0d", border: `1px solid ${item.color}25`, borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                                    <div style={{ fontSize: "2rem" }}>{item.icon}</div>
                                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", fontWeight: "600" }}>{item.title}</div>
                                    <div style={{ color: item.color, fontSize: "1rem", fontWeight: "800" }}>{item.pred}</div>
                                    <button style={{ width: "100%", background: item.color + "15", color: item.color, border: `1px solid ${item.color}30`, padding: "6px", borderRadius: "7px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "bold" }}>Predict</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Recommendations */}
                    <div>
                        <h4 style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", display: "flex", alignItems: "center", gap: "8px" }}>💡 AI Recommendations</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                            {[
                                { title: "Improve CLO Achievement", desc: "Adjust assessment weights and add targeted learning activities for CLO-2 and CLO-5.", priority: "High" },
                                { title: "Improve PLO Achievement", desc: "Revise curriculum mapping to increase PLO coverage in semester 3 and 4 courses.", priority: "High" },
                                { title: "Improve GA Achievement", desc: "Introduce project-based learning to boost GA-5 (Ethics & Society) scores.", priority: "Medium" },
                                { title: "Faculty Improvement", desc: "Recommend professional development workshops for teachers with low student ratings.", priority: "Medium" },
                                { title: "Curriculum Improvement", desc: "Identify and retire outdated course content. Align syllabi with industry standards.", priority: "Low" },
                                { title: "Accreditation Improvement", desc: "Upload 8 missing evidence documents in Criteria C3 before next NCEAC visit.", priority: "High" },
                            ].map(item => {
                                const pColor = item.priority === "High" ? "#ff1b6b" : item.priority === "Medium" ? "#ff9800" : "#50cc7f";
                                return (
                                    <div key={item.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ color: "#fff", fontWeight: "700", fontSize: "0.95rem" }}>💡 {item.title}</div>
                                            <span style={{ background: pColor + "20", color: pColor, border: `1px solid ${pColor}40`, padding: "2px 8px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "800" }}>{item.priority}</span>
                                        </div>
                                        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", lineHeight: 1.5 }}>{item.desc}</div>
                                        <button style={{ marginTop: "auto", background: "rgba(80,204,127,0.1)", color: "#50cc7f", border: "1px solid rgba(80,204,127,0.2)", padding: "7px", borderRadius: "7px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "bold" }}>Apply Recommendation</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Summary */}
                    <div>
                        <h4 style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1.5px", display: "flex", alignItems: "center", gap: "8px" }}>📝 AI One-Click Summaries</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                            {[
                                { title: "Semester Performance Summary", icon: "📅", color: "#0ff0fc" },
                                { title: "Department Performance Summary", icon: "🏫", color: "#bc13fe" },
                                { title: "OBE Summary", icon: "🎯", color: "#50cc7f" },
                                { title: "Accreditation Readiness Summary", icon: "🏛", color: "#ff9800" },
                                { title: "Executive Summary", icon: "📋", color: "#ffcc00" },
                            ].map(item => (
                                <div key={item.title} style={{ background: item.color + "0d", border: `1px solid ${item.color}25`, borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", cursor: "pointer" }}>
                                    <div style={{ fontSize: "2.4rem" }}>{item.icon}</div>
                                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: "600", lineHeight: 1.4 }}>{item.title}</div>
                                    <button style={{ width: "100%", background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`, color: item.color, border: `1px solid ${item.color}40`, padding: "8px", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>✨ Generate</button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};

export default AnalyticsManagement;
