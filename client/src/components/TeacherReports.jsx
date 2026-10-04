import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    FileText, BarChart2, Target, Download, Layers,
    TrendingDown, CheckCircle, XCircle, Users, Calendar,
    ClipboardList, BookOpen, PieChart, Activity,
    ChevronDown, RefreshCw, Printer, TrendingUp, Award
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// ══════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ══════════════════════════════════════════════════════════════
const getGrade = (p) =>
    p >= 90 ? 'A+' : p >= 85 ? 'A' : p >= 80 ? 'A-' : p >= 75 ? 'B+' :
    p >= 70 ? 'B' : p >= 65 ? 'B-' : p >= 60 ? 'C+' : p >= 55 ? 'C' :
    p >= 50 ? 'D' : 'F';

const gradeColor = (g) => g === 'F' ? '#ff1b6b' : g === 'D' ? '#ff9800' : g?.startsWith('C') ? '#ffcc00' : '#10B981';

const exportCSV = (headers, rows, filename) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c ?? ''}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const printSection = () => window.print();

// ══════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ══════════════════════════════════════════════════════════════
const StatCard = ({ label, value, color, icon, sub }) => (
    <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '12px', padding: '1.1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
        {icon && <div style={{ color, opacity: 0.5, marginBottom: 4 }}>{icon}</div>}
        <div style={{ fontSize: '1.9rem', fontWeight: 'bold', color }}>{value ?? '—'}</div>
        <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.3 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>}
    </div>
);

const ProgressBar = ({ label, pct, color = '#0ff0fc', target = 60 }) => (
    <div style={{ marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: 5 }}>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {pct >= target
                    ? <CheckCircle size={13} color="#10B981" />
                    : <XCircle size={13} color="#ff1b6b" />}
                <span style={{ color, fontWeight: 'bold' }}>{pct.toFixed(1)}%</span>
            </div>
        </div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: pct >= target ? color : '#ff1b6b', borderRadius: 5, transition: 'width 0.6s ease' }} />
            {/* Target line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target}%`, width: 2, background: 'rgba(255,204,0,0.7)' }} />
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,204,0,0.6)', textAlign: 'right', marginTop: 2 }}>Target: {target}%</div>
    </div>
);

// ── Inline Bar Chart ────────────────────────────────────────
const BarChart = ({ data, valueKey, labelKey, color = '#0ff0fc', height = 120 }) => {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: `${height}px`, padding: '0 4px' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.62rem', color, fontWeight: 'bold' }}>{typeof d[valueKey] === 'number' ? d[valueKey].toFixed(0) : d[valueKey]}</div>
                    <div style={{ width: '100%', background: `${color}15`, borderRadius: '4px 4px 0 0', overflow: 'hidden', height: `${height - 30}px`, display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', height: `${((d[valueKey] || 0) / max) * 100}%`, background: `linear-gradient(180deg, ${color}cc, ${color})`, transition: 'height 0.8s ease', borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d[labelKey]}</div>
                </div>
            ))}
        </div>
    );
};

// ── Donut Chart ─────────────────────────────────────────────
const DonutChart = ({ segments, size = 100 }) => {
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let cumulative = 0;
    const COLORS = ['#10B981', '#ff1b6b', '#0ff0fc', '#bc13fe', '#ffcc00', '#ff9800'];

    const describePie = (startPct, endPct, r = 35, cx = 50, cy = 50) => {
        const start = (startPct * 360 * Math.PI) / 180;
        const end = (endPct * 360 * Math.PI) / 180;
        const x1 = cx + r * Math.sin(start);
        const y1 = cy - r * Math.cos(start);
        const x2 = cx + r * Math.sin(end);
        const y2 = cy - r * Math.cos(end);
        const large = endPct - startPct > 0.5 ? 1 : 0;
        return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z`;
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <svg viewBox="0 0 100 100" width={size} height={size}>
                {segments.map((seg, i) => {
                    const start = cumulative / total;
                    cumulative += seg.value;
                    const end = cumulative / total;
                    return <path key={i} d={describePie(start, end)} fill={COLORS[i % COLORS.length]} opacity={0.85} />;
                })}
                <circle cx="50" cy="50" r="22" fill="#0a0a0a" />
                <text x="50" y="54" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">{total}</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {segments.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{seg.label}</span>
                        <span style={{ color: '#fff', fontWeight: 'bold', marginLeft: 'auto' }}>{seg.value}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>({((seg.value / (total || 1)) * 100).toFixed(0)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Line Sparkline ───────────────────────────────────────────
const SparkLine = ({ data, valueKey, labelKey, color = '#0ff0fc', height = 80 }) => {
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
    const min = Math.min(...data.map(d => d[valueKey] || 0), 0);
    const range = max - min || 1;
    const w = 100 / (data.length - 1 || 1);
    const pts = data.map((d, i) => `${i * w},${100 - ((d[valueKey] - min) / range) * 100}`).join(' ');
    return (
        <div style={{ position: 'relative', height }}>
            <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={`0,100 ${pts} ${(data.length - 1) * w},100`} fill="url(#lg)" />
                <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => (
                    <circle key={i} cx={i * w} cy={100 - ((d[valueKey] - min) / range) * 100} r="2.5" fill={color} />
                ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {data.map((d, i) => (
                    <div key={i} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{d[labelKey]}</div>
                ))}
            </div>
        </div>
    );
};

// ── Heat Map ─────────────────────────────────────────────────
const HeatMap = ({ data, rowKey, colKey, valueKey }) => {
    const rows = [...new Set(data.map(d => d[rowKey]))];
    const cols = [...new Set(data.map(d => d[colKey]))];
    const max = Math.max(...data.map(d => d[valueKey] || 0), 1);

    const getVal = (r, c) => {
        const found = data.find(d => d[rowKey] === r && d[colKey] === c);
        return found ? found[valueKey] : 0;
    };

    const cellColor = (v) => {
        const pct = v / max;
        if (pct >= 0.75) return '#10B981';
        if (pct >= 0.5) return '#ffcc00';
        if (pct >= 0.25) return '#ff9800';
        return '#ff1b6b';
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '6px 10px', color: 'rgba(255,255,255,0.4)', textAlign: 'left' }}></th>
                        {cols.map(c => <th key={c} style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textAlign: 'center' }}>{c}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r}>
                            <td style={{ padding: '6px 10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, whiteSpace: 'nowrap' }}>{r}</td>
                            {cols.map(c => {
                                const v = getVal(r, c);
                                const bg = cellColor(v);
                                return (
                                    <td key={c} style={{ padding: '6px 8px', textAlign: 'center' }}>
                                        <div style={{ background: `${bg}20`, border: `1px solid ${bg}50`, borderRadius: 4, padding: '4px 8px', color: bg, fontWeight: 'bold', minWidth: 40 }}>
                                            {v.toFixed ? v.toFixed(0) : v}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const TeacherReports = ({ initialOfferingId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(initialOfferingId);
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(false);

    // Raw data
    const [markRecords, setMarkRecords] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [mappings, setMappings] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [clos, setClos] = useState([]);
    const [plos, setPlos] = useState([]);

    // Filters
    const [filterAssessmentType, setFilterAssessmentType] = useState('All');
    const [searchStudent, setSearchStudent] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const [coursesRes, closRes, plosRes] = await Promise.all([
                    axios.get(`${API}/teachers/courses`, { headers: hdrs }),
                    axios.get(`${API}/clos`, { headers: hdrs }),
                    axios.get(`${API}/plos`, { headers: hdrs }),
                ]);
                setCourses(coursesRes.data || []);
                setClos(closRes.data || []);
                setPlos(plosRes.data || []);
            } catch (e) { console.error(e); }
        };
        fetch();
    }, []);

    useEffect(() => {
        if (!selectedOffering) return;
        setLoading(true);
        Promise.all([
            axios.get(`${API}/marks?courseOffering=${selectedOffering}`, { headers: hdrs }),
            axios.get(`${API}/attendance?courseOffering=${selectedOffering}`, { headers: hdrs }),
            axios.get(`${API}/question-mappings?teacher=${user._id}`, { headers: hdrs }),
            axios.get(`${API}/assessments?courseOffering=${selectedOffering}`, { headers: hdrs }),
        ]).then(([mk, at, mp, as_]) => {
            setMarkRecords(mk.data || []);
            setAttendanceRecords(at.data || []);
            setMappings(mp.data || []);
            setAssessments(as_.data || []);
        }).catch(console.error)
        .finally(() => setLoading(false));
    }, [selectedOffering]);

    const selectedCourse = courses.find(c => c._id === selectedOffering);

    // ── MARKS ANALYSIS ──────────────────────────────────────────
    const marksAnalysis = useMemo(() => {
        const studentMap = {};
        const assessmentBreakdown = {};

        markRecords.forEach(mr => {
            const aType = mr.assessment?.type || 'Other';
            const aName = mr.assessment?.name || 'Assessment';
            const maxM = mr.assessment?.totalMarks || 0;
            if (!assessmentBreakdown[aType]) assessmentBreakdown[aType] = { obtained: 0, possible: 0, count: 0 };
            assessmentBreakdown[aType].possible += maxM;
            assessmentBreakdown[aType].count++;

            mr.students?.forEach(s => {
                const id = s.student?._id || s.student;
                const name = s.student?.name || 'Unknown';
                const rollNo = s.student?.rollNo || '';
                if (!studentMap[id]) studentMap[id] = { name, rollNo, obtained: 0, possible: 0, breakdown: {} };
                studentMap[id].obtained += s.obtainedMarks || 0;
                studentMap[id].possible += maxM;
                if (!studentMap[id].breakdown[aType]) studentMap[id].breakdown[aType] = { obtained: 0, possible: 0 };
                studentMap[id].breakdown[aType].obtained += s.obtainedMarks || 0;
                studentMap[id].breakdown[aType].possible += maxM;
                assessmentBreakdown[aType].obtained += s.obtainedMarks || 0;
            });
        });

        const rows = Object.values(studentMap).map(s => ({
            ...s,
            pct: s.possible > 0 ? (s.obtained / s.possible) * 100 : 0,
        })).map(s => ({ ...s, grade: getGrade(s.pct) })).sort((a, b) => b.pct - a.pct);

        const gradeMap = {};
        rows.forEach(r => { gradeMap[r.grade] = (gradeMap[r.grade] || 0) + 1; });
        const passCount = rows.filter(r => r.pct >= 50).length;
        const failCount = rows.length - passCount;
        const avg = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
        const highest = rows.length ? rows[0].pct : 0;
        const lowest = rows.length ? rows[rows.length - 1].pct : 0;
        const topPerformers = rows.slice(0, 3);
        const weakStudents = [...rows].sort((a, b) => a.pct - b.pct).filter(r => r.pct < 50).slice(0, 5);

        // Assessment type averages for chart
        const assessmentAvg = Object.entries(assessmentBreakdown).map(([type, v]) => ({
            type,
            avg: v.possible > 0 ? (v.obtained / v.possible) * 100 : 0,
        }));

        return { rows, gradeMap, passCount, failCount, avg, highest, lowest, total: rows.length, topPerformers, weakStudents, assessmentAvg, assessmentBreakdown };
    }, [markRecords]);

    // ── ATTENDANCE ANALYSIS ──────────────────────────────────────
    const attendanceAnalysis = useMemo(() => {
        const studentAtt = {};
        const dailyRecords = [];

        attendanceRecords.forEach(rec => {
            const dateStr = rec.date ? new Date(rec.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : 'N/A';
            let dayPresent = 0;
            rec.students?.forEach(s => {
                const id = s.student?._id || s.student;
                const name = s.student?.name || 'Unknown';
                if (!studentAtt[id]) studentAtt[id] = { name, present: 0, absent: 0, late: 0, total: 0 };
                studentAtt[id].total++;
                if (s.status === 'Present') { studentAtt[id].present++; dayPresent++; }
                else if (s.status === 'Late') { studentAtt[id].late++; dayPresent += 0.5; }
                else studentAtt[id].absent++;
            });
            const total = rec.students?.length || 1;
            dailyRecords.push({ date: dateStr, rate: Math.round((dayPresent / total) * 100) });
        });

        const rows = Object.values(studentAtt).map(s => ({
            ...s,
            pct: s.total > 0 ? ((s.present + s.late * 0.5) / s.total) * 100 : 0
        })).sort((a, b) => b.pct - a.pct);

        const classAvg = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
        const shortfall = rows.filter(r => r.pct < 75);
        const totalClasses = attendanceRecords.length;

        return { rows, classAvg, shortfall, totalClasses, dailyRecords };
    }, [attendanceRecords]);

    // ── CLO ANALYSIS ────────────────────────────────────────────
    const cloAnalysis = useMemo(() => {
        const cloStats = {};
        mappings.forEach(m => {
            const mId = m.assessment?._id || m.assessment;
            const markRec = markRecords.find(r => (r.assessment?._id || r.assessment) === mId);
            if (!markRec) return;
            const total = markRec.assessment?.totalMarks || 1;
            const avg = markRec.students?.length
                ? markRec.students.reduce((s, st) => s + (st.obtainedMarks || 0), 0) / markRec.students.length
                : 0;
            const pct = avg / total;

            (m.questions || []).forEach(q => {
                const cloId = q.clo?._id || q.clo;
                const cloCode = q.clo?.code || cloId;
                const cloDesc = q.clo?.description || '';
                const ploCode = q.clo?.plo?.code || '';
                if (!cloId) return;
                if (!cloStats[cloId]) cloStats[cloId] = { code: cloCode, desc: cloDesc, plo: ploCode, marks: 0, achieved: 0 };
                cloStats[cloId].marks += q.marks || 0;
                cloStats[cloId].achieved += (q.marks || 0) * pct;
            });
        });
        return Object.values(cloStats).map(c => ({
            ...c,
            pct: c.marks > 0 ? (c.achieved / c.marks) * 100 : 0
        })).sort((a, b) => a.pct - b.pct);
    }, [mappings, markRecords]);

    // ── BT ANALYSIS ─────────────────────────────────────────────
    const btAnalysis = useMemo(() => {
        const btMap = {};
        mappings.forEach(m => {
            (m.questions || []).forEach(q => {
                if (!q.btLevel) return;
                const mId = m.assessment?._id || m.assessment;
                const markRec = markRecords.find(r => (r.assessment?._id || r.assessment) === mId);
                const total = markRec?.assessment?.totalMarks || 1;
                const avg = markRec?.students?.length
                    ? markRec.students.reduce((s, st) => s + (st.obtainedMarks || 0), 0) / markRec.students.length
                    : 0;
                const pct = avg / total;
                if (!btMap[q.btLevel]) btMap[q.btLevel] = { marks: 0, achieved: 0, count: 0 };
                btMap[q.btLevel].marks += q.marks || 0;
                btMap[q.btLevel].achieved += (q.marks || 0) * pct;
                btMap[q.btLevel].count++;
            });
        });
        const ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
        return ORDER.filter(l => btMap[l]).map(level => ({
            level,
            pct: btMap[level].marks > 0 ? (btMap[level].achieved / btMap[level].marks) * 100 : 0,
            marks: btMap[level].marks,
            count: btMap[level].count
        }));
    }, [mappings, markRecords]);

    // ── ASSESSMENT ANALYSIS ─────────────────────────────────────
    const assessmentAnalysis = useMemo(() => {
        return markRecords.map(mr => {
            const scores = mr.students?.map(s => s.obtainedMarks || 0) || [];
            const total = mr.assessment?.totalMarks || 1;
            const avg = scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : 0;
            const highest = scores.length ? Math.max(...scores) : 0;
            const lowest = scores.length ? Math.min(...scores) : 0;
            const pass = scores.filter(s => (s / total) * 100 >= 50).length;
            return {
                name: mr.assessment?.name || 'Assessment',
                type: mr.assessment?.type || 'Other',
                total,
                avg: avg.toFixed(1),
                highest,
                lowest,
                passRate: scores.length ? ((pass / scores.length) * 100).toFixed(1) : '0',
                students: scores.length
            };
        });
    }, [markRecords]);

    const filteredStudents = useMemo(() => {
        return marksAnalysis.rows.filter(r =>
            !searchStudent || r.name.toLowerCase().includes(searchStudent.toLowerCase()) || r.rollNo?.toLowerCase().includes(searchStudent.toLowerCase())
        );
    }, [marksAnalysis.rows, searchStudent]);

    // ── SECTIONS CONFIG ──────────────────────────────────────────
    const SECTIONS = [
        { id: 'overview',      label: 'Overview',          icon: <Activity size={14} />,     color: '#0ff0fc' },
        { id: 'students',      label: 'Student Reports',   icon: <Users size={14} />,        color: '#10B981' },
        { id: 'attendance',    label: 'Attendance',        icon: <Calendar size={14} />,     color: '#F59E0B' },
        { id: 'assessments',   label: 'Assessments',       icon: <ClipboardList size={14} />, color: '#ff9800' },
        { id: 'marks',         label: 'Marks Sheet',       icon: <BarChart2 size={14} />,    color: '#bc13fe' },
        { id: 'clo',           label: 'CLO Achievement',   icon: <Target size={14} />,       color: '#0ff0fc' },
        { id: 'gap',           label: 'Gap Analysis',      icon: <TrendingDown size={14} />, color: '#ff6b35' },
        { id: 'analytics',     label: 'Analytics Charts',  icon: <PieChart size={14} />,     color: '#ffc107' },
    ];

    const panelStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' };
    const sectionTitleStyle = (color) => ({ margin: '0 0 1.2rem', display: 'flex', alignItems: 'center', gap: 8, color, fontSize: '1rem', fontWeight: '700' });
    const tableTh = { padding: '10px 12px', color: 'rgba(255,255,255,0.45)', fontWeight: '600', fontSize: '0.78rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' };
    const tableTd = { padding: '10px 12px', fontSize: '0.83rem', borderBottom: '1px solid rgba(255,255,255,0.04)' };

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontSize: '1.2rem' }}>
                        <BarChart2 size={22} color="#F59E0B" /> Reports & Analytics
                    </h3>
                    {selectedCourse && (
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
                            {selectedCourse.course?.code} — {selectedCourse.course?.title} | {selectedCourse.section?.name} | {selectedCourse.semester?.name}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={printSection} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.82rem' }}>
                        <Printer size={14} /> Print
                    </button>
                </div>
            </div>

            {/* Course Selector */}
            <div style={panelStyle}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: 8 }}>Select Course Offering</label>
                <select value={selectedOffering} onChange={e => { setSelectedOffering(e.target.value); setActiveSection('overview'); }}
                    style={{ width: '100%', maxWidth: 500, padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <option value="">-- Select Course Offering --</option>
                    {courses.map(c => (
                        <option key={c._id} value={c._id}>
                            {c.course?.code} — {c.course?.title} | {c.section?.name} | {c.semester?.name}
                        </option>
                    ))}
                </select>
            </div>

            {!selectedOffering ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.25)' }}>
                    <BookOpen size={50} style={{ opacity: 0.15, marginBottom: '1rem' }} />
                    <p>Select a course offering above to generate reports.</p>
                </div>
            ) : loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#F59E0B' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                    <p>Fetching data from database...</p>
                </div>
            ) : (
                <>
                    {/* Section Tabs */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {SECTIONS.map(sec => (
                            <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: '8px', border: activeSection === sec.id ? `1px solid ${sec.color}50` : '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem',
                                    background: activeSection === sec.id ? `${sec.color}18` : 'rgba(255,255,255,0.03)',
                                    color: activeSection === sec.id ? sec.color : 'rgba(255,255,255,0.55)',
                                    transition: 'all 0.2s' }}>
                                {sec.icon} {sec.label}
                            </button>
                        ))}
                    </div>

                    {/* ══ OVERVIEW ══ */}
                    {activeSection === 'overview' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <StatCard label="Total Students" value={marksAnalysis.total} color="#0ff0fc" icon={<Users size={16} />} />
                                <StatCard label="Pass" value={marksAnalysis.passCount} color="#10B981" icon={<CheckCircle size={16} />} />
                                <StatCard label="Fail" value={marksAnalysis.failCount} color="#ff1b6b" icon={<XCircle size={16} />} />
                                <StatCard label="Class Average" value={marksAnalysis.avg.toFixed(1) + '%'} color="#F59E0B" icon={<BarChart2 size={16} />} />
                                <StatCard label="Highest Score" value={marksAnalysis.highest.toFixed(1) + '%'} color="#bc13fe" icon={<TrendingUp size={16} />} />
                                <StatCard label="Lowest Score" value={marksAnalysis.lowest.toFixed(1) + '%'} color="#ff6b35" icon={<TrendingDown size={16} />} />
                                <StatCard label="Attendance Avg" value={attendanceAnalysis.classAvg.toFixed(1) + '%'} color="#50cc7f" icon={<Calendar size={16} />} />
                                <StatCard label="CLOs Mapped" value={cloAnalysis.length} color="#8B5CF6" icon={<Target size={16} />} />
                                <StatCard label="Total Classes" value={attendanceAnalysis.totalClasses} color="#ffc107" icon={<BookOpen size={16} />} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                {/* Grade Distribution */}
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#bc13fe')}><PieChart size={16} /> Grade Distribution</h4>
                                    <DonutChart segments={Object.entries(marksAnalysis.gradeMap).map(([g, c]) => ({ label: `Grade ${g}`, value: c }))} size={110} />
                                </div>

                                {/* Top Performers */}
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#ffc107')}><Award size={16} /> Top Performers</h4>
                                    {marksAnalysis.topPerformers.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.7rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: ['linear-gradient(135deg,#ffd700,#ffb300)', 'linear-gradient(135deg,#c0c0c0,#a0a0a0)', 'linear-gradient(135deg,#cd7f32,#9e5b24)'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#000', flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{s.rollNo}</div>
                                            </div>
                                            <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '1rem' }}>{s.pct.toFixed(1)}%</div>
                                        </div>
                                    ))}
                                    {marksAnalysis.topPerformers.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1rem' }}>No data yet</div>}
                                </div>
                            </div>

                            {/* CLO Overview */}
                            {cloAnalysis.length > 0 && (
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#0ff0fc')}><Target size={16} /> CLO Achievement Overview</h4>
                                    {cloAnalysis.map((c, i) => (
                                        <ProgressBar key={i} label={`${c.code}${c.desc ? ': ' + c.desc.substring(0, 60) + '...' : ''}`} pct={c.pct} color="#0ff0fc" target={60} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ══ STUDENT REPORTS ══ */}
                    {activeSection === 'students' && (
                        <div style={panelStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h4 style={sectionTitleStyle('#10B981')}><Users size={16} /> Student Performance Report</h4>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input value={searchStudent} onChange={e => setSearchStudent(e.target.value)} placeholder="Search student..." style={{ padding: '7px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem' }} />
                                    <button onClick={() => exportCSV(
                                        ['Roll No', 'Student', 'Obtained', 'Total', 'Percentage', 'Grade', 'Status'],
                                        filteredStudents.map(r => [r.rollNo, r.name, r.obtained.toFixed(1), r.possible, r.pct.toFixed(1) + '%', r.grade, r.pct >= 50 ? 'Pass' : 'Fail'])
                                    , 'student_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '7px', color: '#10B981', cursor: 'pointer', fontSize: '0.82rem' }}>
                                        <Download size={13} /> CSV
                                    </button>
                                </div>
                            </div>

                            {/* At-Risk Students */}
                            {marksAnalysis.weakStudents.length > 0 && (
                                <div style={{ background: 'rgba(255,27,107,0.05)', border: '1px solid rgba(255,27,107,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ color: '#ff1b6b', fontWeight: '700', marginBottom: '0.7rem', fontSize: '0.85rem' }}>⚠️ At-Risk Students (Below 50%)</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {marksAnalysis.weakStudents.map((s, i) => (
                                            <span key={i} style={{ background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', color: '#ff1b6b' }}>
                                                {s.name} ({s.pct.toFixed(1)}%)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            {['#', 'Roll No', 'Student Name', 'Obtained', 'Total', 'Percentage', 'Grade', 'Status'].map(h => (
                                                <th key={h} style={tableTh}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((r, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                                <td style={tableTd}><span style={{ color: 'rgba(255,255,255,0.35)' }}>{i + 1}</span></td>
                                                <td style={{ ...tableTd, color: 'rgba(255,255,255,0.5)' }}>{r.rollNo || '—'}</td>
                                                <td style={{ ...tableTd, color: '#fff', fontWeight: '600' }}>{r.name}</td>
                                                <td style={{ ...tableTd, color: '#0ff0fc' }}>{r.obtained.toFixed(1)}</td>
                                                <td style={tableTd}>{r.possible}</td>
                                                <td style={{ ...tableTd, color: r.pct >= 50 ? '#10B981' : '#ff1b6b', fontWeight: '700' }}>{r.pct.toFixed(1)}%</td>
                                                <td style={tableTd}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '5px', fontWeight: 'bold', background: `${gradeColor(r.grade)}18`, color: gradeColor(r.grade), fontSize: '0.8rem' }}>{r.grade}</span>
                                                </td>
                                                <td style={tableTd}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '5px', fontWeight: '600', background: r.pct >= 50 ? 'rgba(16,185,129,0.12)' : 'rgba(255,27,107,0.12)', color: r.pct >= 50 ? '#10B981' : '#ff1b6b', fontSize: '0.8rem' }}>
                                                        {r.pct >= 50 ? 'Pass' : 'Fail'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.2)' }}>No student data found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ══ ATTENDANCE ══ */}
                    {activeSection === 'attendance' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <StatCard label="Total Classes" value={attendanceAnalysis.totalClasses} color="#F59E0B" />
                                <StatCard label="Class Average" value={attendanceAnalysis.classAvg.toFixed(1) + '%'} color="#10B981" />
                                <StatCard label="Attendance Shortfall" value={attendanceAnalysis.shortfall.length} color="#ff1b6b" sub="< 75%" />
                            </div>

                            {/* Attendance Trend */}
                            {attendanceAnalysis.dailyRecords.length > 1 && (
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#F59E0B')}><TrendingUp size={16} /> Attendance Trend</h4>
                                    <SparkLine data={attendanceAnalysis.dailyRecords.slice(-10)} valueKey="rate" labelKey="date" color="#F59E0B" height={90} />
                                </div>
                            )}

                            {/* Shortfall */}
                            {attendanceAnalysis.shortfall.length > 0 && (
                                <div style={{ ...panelStyle, borderColor: 'rgba(255,27,107,0.2)', background: 'rgba(255,27,107,0.03)' }}>
                                    <h4 style={sectionTitleStyle('#ff1b6b')}>⚠️ Students Below 75% Attendance</h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead><tr>
                                                {['Student', 'Present', 'Absent', 'Late', 'Total', 'Percentage'].map(h => <th key={h} style={tableTh}>{h}</th>)}
                                            </tr></thead>
                                            <tbody>
                                                {attendanceAnalysis.shortfall.map((s, i) => (
                                                    <tr key={i}>
                                                        <td style={{ ...tableTd, fontWeight: 600, color: '#fff' }}>{s.name}</td>
                                                        <td style={{ ...tableTd, color: '#10B981' }}>{s.present}</td>
                                                        <td style={{ ...tableTd, color: '#ff1b6b' }}>{s.absent}</td>
                                                        <td style={{ ...tableTd, color: '#ffcc00' }}>{s.late}</td>
                                                        <td style={tableTd}>{s.total}</td>
                                                        <td style={{ ...tableTd, color: '#ff1b6b', fontWeight: '700' }}>{s.pct.toFixed(1)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Full Attendance Sheet */}
                            <div style={panelStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={sectionTitleStyle('#F59E0B')}><Calendar size={16} /> Full Attendance Sheet</h4>
                                    <button onClick={() => exportCSV(
                                        ['Student', 'Present', 'Absent', 'Late', 'Total', 'Percentage'],
                                        attendanceAnalysis.rows.map(r => [r.name, r.present, r.absent, r.late, r.total, r.pct.toFixed(1) + '%'])
                                    , 'attendance_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '7px', color: '#F59E0B', cursor: 'pointer', fontSize: '0.82rem' }}>
                                        <Download size={13} /> CSV
                                    </button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr>
                                            {['Student', 'Present', 'Absent', 'Late', 'Total', 'Percentage', 'Status'].map(h => <th key={h} style={tableTh}>{h}</th>)}
                                        </tr></thead>
                                        <tbody>
                                            {attendanceAnalysis.rows.map((s, i) => (
                                                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                                    <td style={{ ...tableTd, fontWeight: 600, color: '#fff' }}>{s.name}</td>
                                                    <td style={{ ...tableTd, color: '#10B981' }}>{s.present}</td>
                                                    <td style={{ ...tableTd, color: '#ff1b6b' }}>{s.absent}</td>
                                                    <td style={{ ...tableTd, color: '#ffcc00' }}>{s.late}</td>
                                                    <td style={tableTd}>{s.total}</td>
                                                    <td style={{ ...tableTd, color: s.pct >= 75 ? '#10B981' : '#ff1b6b', fontWeight: '700' }}>{s.pct.toFixed(1)}%</td>
                                                    <td style={tableTd}>
                                                        <span style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '600', background: s.pct >= 75 ? 'rgba(16,185,129,0.12)' : 'rgba(255,27,107,0.12)', color: s.pct >= 75 ? '#10B981' : '#ff1b6b' }}>
                                                            {s.pct >= 75 ? 'Regular' : 'Shortfall'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {attendanceAnalysis.rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)' }}>No attendance records found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ══ ASSESSMENTS ══ */}
                    {activeSection === 'assessments' && (
                        <div style={panelStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <h4 style={sectionTitleStyle('#ff9800')}><ClipboardList size={16} /> Assessment Summary</h4>
                                <button onClick={() => exportCSV(
                                    ['Assessment', 'Type', 'Total Marks', 'Average', 'Highest', 'Lowest', 'Pass Rate', 'Students'],
                                    assessmentAnalysis.map(a => [a.name, a.type, a.total, a.avg, a.highest, a.lowest, a.passRate + '%', a.students])
                                , 'assessment_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '7px', color: '#ff9800', cursor: 'pointer', fontSize: '0.82rem' }}>
                                    <Download size={13} /> CSV
                                </button>
                            </div>

                            {assessmentAnalysis.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h5 style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 0.8rem', fontSize: '0.8rem' }}>Average Marks by Assessment</h5>
                                    <BarChart data={assessmentAnalysis.map(a => ({ name: a.name.substring(0, 8), avg: parseFloat(a.avg) }))} valueKey="avg" labelKey="name" color="#ff9800" height={110} />
                                </div>
                            )}

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>
                                        {['Assessment', 'Type', 'Total Marks', 'Avg Score', 'Highest', 'Lowest', 'Pass Rate', 'Students'].map(h => <th key={h} style={tableTh}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                        {assessmentAnalysis.map((a, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                                <td style={{ ...tableTd, fontWeight: 600, color: '#fff' }}>{a.name}</td>
                                                <td style={tableTd}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,152,0,0.1)', color: '#ff9800', fontSize: '0.75rem' }}>{a.type}</span></td>
                                                <td style={tableTd}>{a.total}</td>
                                                <td style={{ ...tableTd, color: '#0ff0fc', fontWeight: '700' }}>{a.avg}</td>
                                                <td style={{ ...tableTd, color: '#10B981' }}>{a.highest}</td>
                                                <td style={{ ...tableTd, color: '#ff6b35' }}>{a.lowest}</td>
                                                <td style={{ ...tableTd, color: parseFloat(a.passRate) >= 50 ? '#10B981' : '#ff1b6b', fontWeight: '700' }}>{a.passRate}%</td>
                                                <td style={tableTd}>{a.students}</td>
                                            </tr>
                                        ))}
                                        {assessmentAnalysis.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)' }}>No assessment data found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ══ MARKS SHEET ══ */}
                    {activeSection === 'marks' && (
                        <div style={panelStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <h4 style={sectionTitleStyle('#bc13fe')}><BarChart2 size={16} /> Marks Sheet</h4>
                                <button onClick={() => exportCSV(
                                    ['Roll No', 'Student', 'Obtained', 'Total', 'Percentage', 'Grade'],
                                    marksAnalysis.rows.map(r => [r.rollNo, r.name, r.obtained.toFixed(1), r.possible, r.pct.toFixed(1) + '%', r.grade])
                                , 'marks_sheet.csv')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(188,19,254,0.1)', border: '1px solid rgba(188,19,254,0.3)', borderRadius: '7px', color: '#bc13fe', cursor: 'pointer', fontSize: '0.82rem' }}>
                                    <Download size={13} /> CSV
                                </button>
                            </div>

                            {/* Grade Distribution Visual */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                {Object.entries(marksAnalysis.gradeMap).map(([g, cnt]) => (
                                    <div key={g} style={{ background: `${gradeColor(g)}10`, border: `1px solid ${gradeColor(g)}30`, borderRadius: '8px', padding: '0.8rem', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: gradeColor(g) }}>{cnt}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem' }}>Grade {g}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#10B981' }}>{marksAnalysis.total ? ((marksAnalysis.passCount / marksAnalysis.total) * 100).toFixed(1) : 0}%</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Pass Rate</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#ff1b6b' }}>{marksAnalysis.total ? ((marksAnalysis.failCount / marksAnalysis.total) * 100).toFixed(1) : 0}%</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Fail Rate</div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr>
                                        {['#', 'Roll No', 'Student', 'Obtained', 'Total', 'Percentage', 'Grade'].map(h => <th key={h} style={tableTh}>{h}</th>)}
                                    </tr></thead>
                                    <tbody>
                                        {marksAnalysis.rows.map((r, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                                <td style={{ ...tableTd, color: 'rgba(255,255,255,0.3)' }}>{i + 1}</td>
                                                <td style={{ ...tableTd, color: 'rgba(255,255,255,0.5)' }}>{r.rollNo || '—'}</td>
                                                <td style={{ ...tableTd, fontWeight: 600, color: '#fff' }}>{r.name}</td>
                                                <td style={{ ...tableTd, color: '#0ff0fc' }}>{r.obtained.toFixed(1)}</td>
                                                <td style={tableTd}>{r.possible}</td>
                                                <td style={{ ...tableTd, color: r.pct >= 50 ? '#10B981' : '#ff1b6b', fontWeight: '700' }}>{r.pct.toFixed(1)}%</td>
                                                <td style={tableTd}><span style={{ padding: '2px 8px', borderRadius: '4px', background: `${gradeColor(r.grade)}15`, color: gradeColor(r.grade), fontWeight: 'bold', fontSize: '0.82rem' }}>{r.grade}</span></td>
                                            </tr>
                                        ))}
                                        {marksAnalysis.rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)' }}>No marks records found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ══ CLO ACHIEVEMENT ══ */}
                    {activeSection === 'clo' && (
                        <div style={panelStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <h4 style={sectionTitleStyle('#0ff0fc')}><Target size={16} /> CLO Achievement Report</h4>
                                <button onClick={() => exportCSV(
                                    ['CLO', 'Description', 'PLO', 'Achievement %', 'Status'],
                                    cloAnalysis.map(c => [c.code, c.desc, c.plo, c.pct.toFixed(1), c.pct >= 60 ? 'Achieved' : 'Not Achieved'])
                                , 'clo_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '7px', color: '#0ff0fc', cursor: 'pointer', fontSize: '0.82rem' }}>
                                    <Download size={13} /> CSV
                                </button>
                            </div>

                            {cloAnalysis.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)' }}>No question mappings found. Map your questions in the Blueprint/Mapping module first.</div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <StatCard label="Total CLOs" value={cloAnalysis.length} color="#0ff0fc" />
                                        <StatCard label="Achieved (≥60%)" value={cloAnalysis.filter(c => c.pct >= 60).length} color="#10B981" />
                                        <StatCard label="Not Achieved" value={cloAnalysis.filter(c => c.pct < 60).length} color="#ff1b6b" />
                                        <StatCard label="Achievement Rate" value={cloAnalysis.length ? ((cloAnalysis.filter(c => c.pct >= 60).length / cloAnalysis.length) * 100).toFixed(0) + '%' : '0%'} color="#bc13fe" />
                                    </div>

                                    {cloAnalysis.map((c, i) => (
                                        <div key={i} style={{ marginBottom: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
                                                <div>
                                                    <span style={{ color: '#0ff0fc', fontWeight: '700', fontSize: '0.9rem' }}>{c.code}</span>
                                                    {c.plo && <span style={{ marginLeft: 10, color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>→ {c.plo}</span>}
                                                    {c.desc && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', marginTop: 3 }}>{c.desc}</div>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                    {c.pct >= 60 ? <CheckCircle size={16} color="#10B981" /> : <XCircle size={16} color="#ff1b6b" />}
                                                    <span style={{ fontWeight: 'bold', color: c.pct >= 60 ? '#10B981' : '#ff1b6b' }}>{c.pct.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <ProgressBar label="" pct={c.pct} color={c.pct >= 60 ? '#10B981' : '#ff1b6b'} target={60} />
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* ══ GAP ANALYSIS ══ */}
                    {activeSection === 'gap' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{ ...panelStyle, borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.03)' }}>
                                    <h4 style={sectionTitleStyle('#10B981')}>✅ Strong CLOs (≥60%)</h4>
                                    {cloAnalysis.filter(c => c.pct >= 60).length === 0
                                        ? <div style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '1rem' }}>None yet</div>
                                        : cloAnalysis.filter(c => c.pct >= 60).sort((a, b) => b.pct - a.pct).map((c, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(16,185,129,0.06)', borderRadius: '7px', marginBottom: '6px', fontSize: '0.83rem' }}>
                                                <span style={{ color: '#fff', fontWeight: 500 }}>{c.code}</span>
                                                <span style={{ color: '#10B981', fontWeight: 'bold' }}>{c.pct.toFixed(1)}%</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div style={{ ...panelStyle, borderColor: 'rgba(255,27,107,0.25)', background: 'rgba(255,27,107,0.03)' }}>
                                    <h4 style={sectionTitleStyle('#ff1b6b')}>❌ Weak CLOs (&lt;60%)</h4>
                                    {cloAnalysis.filter(c => c.pct < 60).length === 0
                                        ? <div style={{ color: '#10B981', textAlign: 'center', padding: '1rem', fontWeight: '600' }}>All CLOs achieving target! 🎉</div>
                                        : cloAnalysis.filter(c => c.pct < 60).sort((a, b) => a.pct - b.pct).map((c, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,27,107,0.06)', borderRadius: '7px', marginBottom: '6px', fontSize: '0.83rem' }}>
                                                <span style={{ color: '#fff', fontWeight: 500 }}>{c.code}{c.desc ? ': ' + c.desc.substring(0, 30) + '...' : ''}</span>
                                                <span style={{ color: '#ff1b6b', fontWeight: 'bold' }}>{c.pct.toFixed(1)}%</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            <div style={panelStyle}>
                                <h4 style={sectionTitleStyle('#ff6b35')}><TrendingDown size={16} /> Gap Analysis Summary</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <StatCard label="Total CLOs" value={cloAnalysis.length} color="#0ff0fc" />
                                    <StatCard label="Achieved" value={cloAnalysis.filter(c => c.pct >= 60).length} color="#10B981" />
                                    <StatCard label="Gap CLOs" value={cloAnalysis.filter(c => c.pct < 60).length} color="#ff1b6b" />
                                    <StatCard label="Achievement %" value={cloAnalysis.length ? ((cloAnalysis.filter(c => c.pct >= 60).length / cloAnalysis.length) * 100).toFixed(0) + '%' : '0%'} color="#bc13fe" />
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                                    <b style={{ color: '#ff6b35' }}>📋 Recommendation:</b> For any CLO below 60%, review your teaching methodology, reassess question difficulty distribution, and document corrective actions in the <b>Course File → Closing the Loop</b> section. Consider additional remedial sessions for weak areas.
                                </div>
                            </div>
                        </>
                    )}

                    {/* ══ ANALYTICS CHARTS ══ */}
                    {activeSection === 'analytics' && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                {/* Assessment Type Performance */}
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#ffc107')}><BarChart2 size={16} /> Assessment-wise Avg</h4>
                                    {marksAnalysis.assessmentAvg.length > 0
                                        ? <BarChart data={marksAnalysis.assessmentAvg.map(a => ({ type: a.type, avg: Math.round(a.avg) }))} valueKey="avg" labelKey="type" color="#ffc107" height={120} />
                                        : <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.2)' }}>No data</div>
                                    }
                                </div>

                                {/* Grade Distribution Donut */}
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#bc13fe')}><PieChart size={16} /> Grade Distribution</h4>
                                    <DonutChart segments={Object.entries(marksAnalysis.gradeMap).map(([g, c]) => ({ label: `Grade ${g}`, value: c }))} size={110} />
                                </div>

                                {/* Attendance Trend Sparkline */}
                                {attendanceAnalysis.dailyRecords.length > 1 && (
                                    <div style={panelStyle}>
                                        <h4 style={sectionTitleStyle('#F59E0B')}><TrendingUp size={16} /> Attendance Trend</h4>
                                        <SparkLine data={attendanceAnalysis.dailyRecords.slice(-14)} valueKey="rate" labelKey="date" color="#F59E0B" height={90} />
                                    </div>
                                )}

                                {/* BT Distribution */}
                                {btAnalysis.length > 0 && (
                                    <div style={panelStyle}>
                                        <h4 style={sectionTitleStyle('#8B5CF6')}><Layers size={16} /> Bloom's Level Coverage</h4>
                                        <BarChart data={btAnalysis.map(b => ({ level: b.level.substring(0, 5), pct: Math.round(b.pct) }))} valueKey="pct" labelKey="level" color="#8B5CF6" height={120} />
                                    </div>
                                )}
                            </div>

                            {/* Student Attendance Heatmap */}
                            {attendanceAnalysis.rows.length > 0 && (
                                <div style={panelStyle}>
                                    <h4 style={sectionTitleStyle('#0ff0fc')}> Attendance vs Marks Comparison</h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                            <thead><tr>
                                                {['Student', 'Attendance %', 'Marks %', 'Grade', 'Risk Level'].map(h => <th key={h} style={tableTh}>{h}</th>)}
                                            </tr></thead>
                                            <tbody>
                                                {attendanceAnalysis.rows.slice(0, 15).map((att, i) => {
                                                    const marksRow = marksAnalysis.rows.find(m => m.name === att.name);
                                                    const marksPct = marksRow ? marksRow.pct : 0;
                                                    const grade = marksRow ? marksRow.grade : 'N/A';
                                                    const risk = att.pct < 75 && marksPct < 50 ? '🔴 High' : att.pct < 75 || marksPct < 50 ? '🟡 Medium' : '🟢 Low';
                                                    return (
                                                        <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                                            <td style={{ ...tableTd, fontWeight: 600, color: '#fff' }}>{att.name}</td>
                                                            <td style={{ ...tableTd, color: att.pct >= 75 ? '#10B981' : '#ff1b6b' }}>{att.pct.toFixed(1)}%</td>
                                                            <td style={{ ...tableTd, color: marksPct >= 50 ? '#10B981' : '#ff1b6b' }}>{marksPct.toFixed(1)}%</td>
                                                            <td style={{ ...tableTd, color: gradeColor(grade), fontWeight: 'bold' }}>{grade}</td>
                                                            <td style={tableTd}>{risk}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
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

export default TeacherReports;
