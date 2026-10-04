import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { BarChart2, BookOpen, FileText, Network, Brain, Target, Layers, Shield, Loader2, Download, CheckCircle, XCircle, AlertCircle, ChevronRight, Building, GraduationCap } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`;

const statCard = (label, value, color, key = null) => (
    <div key={key || label} style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '10px', padding: '14px 18px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{label}</div>
    </div>
);

const CoverageBar = ({ label, value, color = '#0ff0fc', mapped = null, total = null }) => (
    <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
            <span style={{ color, fontWeight: '600' }}>{mapped !== null ? `${mapped}/${total} mapped` : `${value}%`}</span>
        </div>
        <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${mapped !== null ? Math.round((mapped / (total || 1)) * 100) : value}%`, background: color, borderRadius: '8px', transition: 'width 0.5s ease' }} />
        </div>
    </div>
);

const TableView = ({ headers, rows, emptyMsg = 'No data available' }) => (
    <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {headers.map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr><td colSpan={headers.length} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>{emptyMsg}</td></tr>
                ) : rows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {r.map((cell, j) => <td key={j} style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.85)' }}>{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const StatusBadge = ({ val }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
        background: val ? 'rgba(80,204,127,0.1)' : 'rgba(255,27,107,0.1)',
        color: val ? '#50cc7f' : '#ff1b6b'
    }}>{val ? <CheckCircle size={12} /> : <XCircle size={12} />}{val ? 'Mapped' : 'Unmapped'}</span>
);

const exportCSV = (headers, rows, filename) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

const REPORT_TABS = [
    // Existing
    { id: 'questionbank',    label: 'Question Bank',     icon: BookOpen,   color: '#0ff0fc', group: 'Coverage' },
    { id: 'blueprint',       label: 'Blueprint',          icon: FileText,   color: '#bc13fe', group: 'Coverage' },
    { id: 'rubric',          label: 'Rubrics',            icon: Layers,     color: '#2196f3', group: 'Coverage' },
    { id: 'questionmapping', label: 'Question Mapping',   icon: Network,    color: '#50cc7f', group: 'Coverage' },
    { id: 'btcoverage',      label: 'BT Coverage',        icon: Brain,      color: '#ff9800', group: 'Coverage' },
    { id: 'clocoverage',     label: 'CLO Coverage',       icon: Target,     color: '#e91e63', group: 'Coverage' },
    { id: 'plocoverage',     label: 'PLO Coverage',       icon: Target,     color: '#7c3aed', group: 'Coverage' },
    { id: 'gacoverage',      label: 'GA Coverage',        icon: Target,     color: '#4caf50', group: 'Coverage' },
    // New Achievement Reports
    { id: 'cloreport',       label: 'CLO Report',         icon: Target,     color: '#bc13fe', group: 'Achievement' },
    { id: 'ploreport',       label: 'PLO Report',         icon: Target,     color: '#7c3aed', group: 'Achievement' },
    { id: 'gareport',        label: 'GA Report',          icon: Target,     color: '#4caf50', group: 'Achievement' },
    { id: 'peoreport',       label: 'PEO Report',         icon: Target,     color: '#ff9800', group: 'Achievement' },
    { id: 'targetreport',    label: 'Target Report',      icon: Target,     color: '#0ff0fc', group: 'Achievement' },
    { id: 'gapreport',       label: 'Gap Report',         icon: BarChart2,  color: '#ff1b6b', group: 'CQI' },
    { id: 'cqireport',       label: 'Closing Loop Report',icon: FileText,   color: '#0ff0fc', group: 'CQI' },
    { id: 'outcomereport',   label: 'Outcome Report',     icon: Layers,     color: '#50cc7f', group: 'CQI' },
    { id: 'deptreport',      label: 'Department Report',  icon: Building,   color: '#2196f3', group: 'Comparison' },
    { id: 'progreport',      label: 'Program Report',     icon: GraduationCap, color: '#e91e63', group: 'Comparison' },
    { id: 'accredreport',    label: 'Accreditation Report',icon: Shield,    color: '#ffc107', group: 'Comparison' },
];

const ObeReports = () => {
    const { token } = useSelector(s => s.auth);
    const cfg = { headers: { Authorization: `Bearer ${token}` } };

    const [activeTab, setActiveTab] = useState('questionbank');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = async (tab) => {
        const endpointMap = {
            questionbank:    'obe/question-bank',
            blueprint:       'obe/blueprint',
            rubric:          'obe/rubric',
            questionmapping: 'obe/question-mapping',
            btcoverage:      'obe/bt-coverage',
            clocoverage:     'obe/clo-coverage',
            plocoverage:     'obe/plo-coverage',
            gacoverage:      'obe/ga-coverage',
            cloreport:       'obe/clo-report',
            ploreport:       'obe/plo-report',
            gareport:        'obe/ga-report',
            peoreport:       'obe/peo-report',
            targetreport:    'obe/target-report',
            gapreport:       'obe/gap-report',
            cqireport:       'obe/cqi-report',
            outcomereport:   'obe/outcome-report',
            deptreport:      'obe/dept-report',
            progreport:      'obe/prog-report',
            accredreport:    'obe/accred-report',
        };
        if (!endpointMap[tab]) {
            setData(d => ({ ...d, [tab]: { isMock: true } }));
            return;
        }
        if (data[tab]) return; // cache
        setLoading(true); setError(null);
        try {
            const res = await axios.get(`${API}/${endpointMap[tab]}`, cfg);
            setData(d => ({ ...d, [tab]: res.data }));
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(activeTab); }, [activeTab]);

    const activeMeta = REPORT_TABS.find(t => t.id === activeTab);
    const d = data[activeTab];

    const renderContent = () => {
        if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="spin" size={36} color={activeMeta.color} /></div>;
        if (error) return <div style={{ color: '#ff1b6b', padding: '2rem', textAlign: 'center', background: 'rgba(255,27,107,0.05)', borderRadius: '10px', margin: '1rem 0' }}>❌ {error}</div>;
        if (!d) return null;

        if (activeTab === 'questionbank') {
            const rows = (d.questions || []).map(q => [q.course || 'N/A', q.title, q.type, q.difficulty, `${q.marks} pts`, q.status]);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total Questions', d.total, '#0ff0fc')}
                        {Object.entries(d.byDifficulty || {}).map(([k, v]) => statCard(k, v, k === 'Easy' ? '#50cc7f' : k === 'Medium' ? '#ff9800' : '#ff1b6b', k))}
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>By Type</div>
                        {Object.entries(d.byType || {}).map(([k, v]) => <CoverageBar key={k} label={k} value={Math.round((v / d.total) * 100)} color="#0ff0fc" />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Course', 'Title', 'Type', 'Difficulty', 'Marks', 'Status'], rows, 'question_bank_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,255,252,0.1)', color: '#0ff0fc', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Course', 'Title', 'Type', 'Difficulty', 'Marks', 'Status']} rows={rows} />
                </div>
            );
        }

        if (activeTab === 'blueprint') {
            const rows = (d.blueprints || []).map(b => [b.course, b.teacher, b.assessment, b.totalMarks, b.totalQuestions, b.rowCount, b.status]);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total Blueprints', d.total, '#bc13fe')}
                        {statCard('Finalized', d.finalized, '#50cc7f')}
                        {statCard('Draft', d.draft, '#ff9800')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Course', 'Teacher', 'Assessment', 'Total Marks', 'Questions', 'Topics', 'Status'], rows, 'blueprint_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(188,19,254,0.1)', color: '#bc13fe', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Course', 'Teacher', 'Assessment', 'Total Marks', 'Questions', 'Topics', 'Status']} rows={rows} />
                </div>
            );
        }

        if (activeTab === 'rubric') {
            const rows = (d.rubrics || []).map(r => [r.name, r.rubricType, r.assessmentType, `${r.totalMarks} pts`, r.criteriaCount, r.status]);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total Rubrics', d.total, '#2196f3')}
                        {statCard('Active', d.active, '#50cc7f')}
                        {statCard('Types', Object.keys(d.byType || {}).length, '#0ff0fc')}
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        {Object.entries(d.byType || {}).map(([k, v]) => <CoverageBar key={k} label={k} value={Math.round((v / d.total) * 100)} color="#2196f3" />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Name', 'Type', 'Assessment', 'Total Marks', 'Criteria', 'Status'], rows, 'rubric_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(33,150,243,0.1)', color: '#2196f3', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Name', 'Type', 'Assessment', 'Total Marks', 'Criteria', 'Status']} rows={rows} />
                </div>
            );
        }

        if (activeTab === 'questionmapping') {
            const rows = (d.mappings || []).map(m => [m.course, m.teacher, m.assessment, m.questionCount, m.status]);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total Mappings', d.total, '#50cc7f')}
                        {statCard('Active', (d.mappings || []).filter(m => m.status === 'Active').length, '#0ff0fc')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Course', 'Teacher', 'Assessment', 'Questions', 'Status'], rows, 'question_mapping_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Course', 'Teacher', 'Assessment', 'Questions', 'Status']} rows={rows} />
                </div>
            );
        }

        if (activeTab === 'btcoverage') {
            const rows = (d.coverage || []).map(c => [c.level, c.marks, c.questions, `${c.percentage}%`]);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Finalized Blueprints', d.totalBlueprints, '#ff9800')}
                        {statCard('Total Marks Covered', d.totalMarks, '#0ff0fc')}
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        {(d.coverage || []).map(c => (
                            <CoverageBar key={c.level} label={`${c.level} — ${c.questions} questions`} value={c.percentage} color="#ff9800" />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(["BT Level", "Marks", "Questions", "Percentage"], rows, 'bt_coverage_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['BT Level', 'Marks', 'Questions', 'Coverage %']} rows={rows} />
                </div>
            );
        }

        if (activeTab === 'clocoverage') {
            const rows = (d.clos || []).map(c => [c.code, c.course, c.description?.substring(0, 80) + '...', c.mapped ? '✅ Mapped' : '❌ Unmapped']);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total CLOs', d.total, '#e91e63')}
                        {statCard('Mapped', d.mapped, '#50cc7f')}
                        {statCard('Unmapped', d.unmapped, '#ff1b6b')}
                    </div>
                    <CoverageBar label="Overall CLO Coverage" mapped={d.mapped} total={d.total} color="#e91e63" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['CLO Code', 'Course', 'Description', 'Status'], rows, 'clo_coverage_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(233,30,99,0.1)', color: '#e91e63', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['CLO Code', 'Course', 'Description', 'Mapping Status']} rows={(d.clos || []).map(c => [c.code, c.course, c.description?.substring(0, 70), <StatusBadge key={c.id} val={c.mapped} />])} />
                </div>
            );
        }

        if (activeTab === 'plocoverage') {
            const rows = (d.plos || []).map(p => [p.code, p.description?.substring(0, 80), p.mapped ? '✅ Mapped' : '❌ Unmapped']);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total PLOs', d.total, '#7c3aed')}
                        {statCard('Mapped', d.mapped, '#50cc7f')}
                        {statCard('Unmapped', d.unmapped, '#ff1b6b')}
                    </div>
                    <CoverageBar label="Overall PLO Coverage" mapped={d.mapped} total={d.total} color="#7c3aed" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['PLO Code', 'Description', 'Status'], rows, 'plo_coverage_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['PLO Code', 'Description', 'Mapping Status']} rows={(d.plos || []).map(p => [p.code, p.description?.substring(0, 70), <StatusBadge key={p.id} val={p.mapped} />])} />
                </div>
            );
        }

        if (activeTab === 'gacoverage') {
            const rows = (d.gas || []).map(g => [g.code, g.description?.substring(0, 80), g.mapped ? '✅ Mapped' : '❌ Unmapped']);
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total GAs', d.total, '#4caf50')}
                        {statCard('Mapped', d.mapped, '#50cc7f')}
                        {statCard('Unmapped', d.unmapped, '#ff1b6b')}
                    </div>
                    <CoverageBar label="Overall GA Coverage" mapped={d.mapped} total={d.total} color="#4caf50" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['GA Code', 'Description', 'Status'], rows, 'ga_coverage_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(76,175,80,0.1)', color: '#4caf50', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['GA Code', 'Description', 'Mapping Status']} rows={(d.gas || []).map(g => [g.code, g.description?.substring(0, 70), <StatusBadge key={g.id} val={g.mapped} />])} />
                </div>
            );
        }

        // ── CLO Achievement Report ────────────────────────────────────────
        if (activeTab === 'cloreport') {
            const rows = d.clos || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total CLOs Assessed', d.total || 0, '#bc13fe')}
                        {statCard('Achieved', d.achieved || 0, '#50cc7f')}
                        {statCard('Not Achieved', d.notAchieved || 0, '#ff1b6b')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['CLO', 'Course', 'Target %', 'Achieved %', 'Status'], rows.map(r => [r.clo, r.course, r.target, r.achieved, r.status]), 'clo_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(188,19,254,0.1)', color: '#bc13fe', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['CLO', 'Course', 'Target %', 'Achieved %', 'Status']} rows={rows.map(r => [r.clo, r.course, `${r.target}%`, `${r.achieved}%`, r.status === 'Met' ? '✅ Met' : '❌ Not Met'])} />
                </div>
            );
        }

        // ── PLO Achievement Report ────────────────────────────────────────
        if (activeTab === 'ploreport') {
            const rows = d.plos || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total PLOs Assessed', d.total || 0, '#7c3aed')}
                        {statCard('Achieved', d.achieved || 0, '#50cc7f')}
                        {statCard('Not Achieved', d.notAchieved || 0, '#ff1b6b')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['PLO', 'Program', 'Target %', 'Achieved %', 'Status'], rows.map(r => [r.plo, r.program, r.target, r.achieved, r.status]), 'plo_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['PLO', 'Program', 'Target %', 'Achieved %', 'Status']} rows={rows.map(r => [r.plo, r.program, `${r.target}%`, `${r.achieved}%`, r.status === 'Met' ? '✅ Met' : '❌ Not Met'])} />
                </div>
            );
        }

        // ── GA Achievement Report ────────────────────────────────────────
        if (activeTab === 'gareport') {
            const rows = d.gas || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total GAs Assessed', d.total || 0, '#4caf50')}
                        {statCard('Achieved', d.achieved || 0, '#50cc7f')}
                        {statCard('Not Achieved', d.notAchieved || 0, '#ff1b6b')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['GA', 'Target %', 'Achieved %', 'Status'], rows.map(r => [r.ga, r.target, r.achieved, r.status]), 'ga_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(76,175,80,0.1)', color: '#4caf50', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['GA', 'Target %', 'Achieved %', 'Status']} rows={rows.map(r => [r.ga, `${r.target}%`, `${r.achieved}%`, r.status === 'Met' ? '✅ Met' : '❌ Not Met'])} />
                </div>
            );
        }

        // ── PEO Achievement Report ────────────────────────────────────────
        if (activeTab === 'peoreport') {
            const rows = d.peos || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total PEOs', rows.length, '#ff9800')}
                        {statCard('Avg Achievement', '0%', '#0ff0fc')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['PEO', 'Target %', 'Achieved %', 'Status'], rows.map(r => [r.peo, r.target, r.achieved, r.achieved >= r.target ? 'Met' : 'Not Met']), 'peo_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['PEO', 'Target %', 'Achieved %', 'Status']} rows={rows.map(r => [r.peo, `${r.target}%`, `${r.achieved}%`, r.achieved >= r.target ? '✅ Met' : '❌ Not Met'])} />
                </div>
            );
        }

        // ── Target Report ────────────────────────────────────────────────
        if (activeTab === 'targetreport') {
            const rows = d.targets || [];
            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Outcome', 'Base Target', 'Dept Override', 'Program Override'], rows.map(r => [r.type, `${r.base}%`, `${r.deptOverride}%`, `${r.progOverride}%`]), 'target_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Outcome', 'Base Target', 'Dept Override', 'Program Override']} rows={rows.map(r => [r.type, `${r.base}%`, `${r.deptOverride}%`, `${r.progOverride}%`])} />
                </div>
            );
        }

        // ── Gap Report ────────────────────────────────────────────────────
        if (activeTab === 'gapreport') {
            const rows = d.gaps || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Critical Gaps', rows.filter(r => r.severity === 'Critical').length, '#ff1b6b')}
                        {statCard('Moderate Gaps', rows.filter(r => r.severity === 'Moderate').length, '#ff9800')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Outcome', 'Context', 'Gap %', 'Severity'], rows.map(r => [r.outcome, r.context, `${r.gap}%`, r.severity]), 'gap_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Outcome', 'Context', 'Gap %', 'Severity']} rows={rows.map(r => [r.outcome, r.context, <span style={{ color: '#ff1b6b', fontWeight: 700 }}>{r.gap}%</span>, r.severity])} />
                </div>
            );
        }

        // ── Closing Loop / CQI Report ─────────────────────────────────────
        if (activeTab === 'cqireport') {
            const rows = d.cqi || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total CQI Actions', rows.length, '#0ff0fc')}
                        {statCard('Completed', rows.filter(r => r.status === 'Completed').length, '#50cc7f')}
                        {statCard('In Progress', rows.filter(r => r.status !== 'Completed').length, '#ff9800')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['ID', 'Outcome', 'Course', 'Root Cause', 'Action', 'Status', 'Due Date'], rows.map(r => [r.id, r.outcome, r.course, r.rootCause, r.action, r.status, r.dueDate]), 'cqi_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['ID', 'Outcome', 'Course', 'Corrective Action', 'Status', 'Due Date']} rows={rows.map(r => [r.id, r.outcome, r.course, r.action, r.status, r.dueDate])} />
                </div>
            );
        }

        // ── Outcome Summary Report ────────────────────────────────────────
        if (activeTab === 'outcomereport') {
            const rows = d.outcomes || [];
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Total Students Evaluated', d.totalStudents || 0, '#0ff0fc')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Type', 'Total Evaluations', 'Total Students', 'Achieved', 'Not Achieved', 'Avg %'], rows.map(r => [r.type, r.evaluations, r.totalStudents, r.achieved, r.notAchieved, `${r.avg}%`]), 'outcome_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Outcome Type', 'Total Evaluations', 'Total Students', 'Achieved', 'Not Achieved', 'Avg Achievement']} rows={rows.map(r => [r.type, r.evaluations, r.totalStudents, <span style={{ color: '#50cc7f', fontWeight: 700 }}>{r.achieved}</span>, <span style={{ color: '#ff1b6b', fontWeight: 700 }}>{r.notAchieved}</span>, `${r.avg}%`])} />
                </div>
            );
        }

        // ── Department Report ─────────────────────────────────────────────
        if (activeTab === 'deptreport') {
            const rows = d.depts || [];
            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Department', 'CLO %', 'PLO %', 'GA %', 'PEO %'], rows.map(r => [r.dept, r.clo, r.plo, r.ga, r.peo]), 'department_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(33,150,243,0.1)', color: '#2196f3', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Department', 'CLO Avg %', 'PLO Avg %', 'GA Avg %', 'PEO Avg %']} rows={rows.map(r => [r.dept, `${r.clo}%`, `${r.plo}%`, `${r.ga}%`, `${r.peo}%`])} />
                </div>
            );
        }

        // ── Program Report ────────────────────────────────────────────────
        if (activeTab === 'progreport') {
            const rows = d.programs || [];
            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <button onClick={() => exportCSV(['Program', 'CLO %', 'PLO %', 'GA %', 'PEO %'], rows.map(r => [r.prog, r.clo, r.plo, r.ga, r.peo]), 'program_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(233,30,99,0.1)', color: '#e91e63', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Program', 'CLO Avg %', 'PLO Avg %', 'GA Avg %', 'PEO Avg %']} rows={rows.map(r => [r.prog, `${r.clo}%`, `${r.plo}%`, `${r.ga}%`, `${r.peo}%`])} />
                </div>
            );
        }

        // ── Accreditation Readiness Report ────────────────────────────────
        if (activeTab === 'accredreport') {
            const rows = d.accreditation || [];
            const readinessScore = rows.length ? Math.round((rows.filter(r => r.status).length / rows.length) * 100) : 0;
            return (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                        {statCard('Readiness Score', `${readinessScore}%`, readinessScore >= 80 ? '#50cc7f' : readinessScore >= 60 ? '#ff9800' : '#ff1b6b')}
                        {statCard('Criteria Met', rows.filter(r => r.status).length, '#50cc7f')}
                        {statCard('Criteria Not Met', rows.filter(r => !r.status).length, '#ff1b6b')}
                    </div>
                    <CoverageBar label="Overall Accreditation Readiness" value={readinessScore} color="#ffc107" />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0' }}>
                        <button onClick={() => exportCSV(['Criterion', 'Status', 'Score'], rows.map(r => [r.criterion, r.status ? 'Met' : 'Not Met', r.score ?? 'N/A']), 'accreditation_report.csv')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,193,7,0.1)', color: '#ffc107', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}><Download size={14}/> Export CSV</button>
                    </div>
                    <TableView headers={['Accreditation Criterion', 'Status', 'Score']} rows={rows.map(r => [r.criterion, r.status ? <span style={{ color: '#50cc7f', fontWeight: 700 }}>✅ Met</span> : <span style={{ color: '#ff1b6b', fontWeight: 700 }}>❌ Not Met</span>, r.score ? `${r.score}%` : '—'])} />
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                    <BarChart2 size={28} color="#0ff0fc" /> OBE Reports
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Live reports from Question Bank, Blueprints, Rubrics, Mappings, and Coverage analytics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Tab Sidebar */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {REPORT_TABS.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: activeTab === t.id ? `${t.color}15` : 'transparent', border: activeTab === t.id ? `1px solid ${t.color}40` : '1px solid transparent', borderRadius: '8px', color: activeTab === t.id ? t.color : 'rgba(255,255,255,0.65)', cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === t.id ? '600' : '400', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                                <Icon size={16} /> {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Report Content */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.8rem', minHeight: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                        {activeMeta && <activeMeta.icon size={20} color={activeMeta.color} />}
                        <h3 style={{ margin: 0, color: activeMeta?.color }}>{activeMeta?.label} Report</h3>
                        <button onClick={() => { setData(d => { const nd = {...d}; delete nd[activeTab]; return nd; }); load(activeTab); }} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>↻ Refresh</button>
                    </div>
                    {renderContent()}
                </div>
            </div>

            {/* Permissions Panel */}
            <div className="glass-panel-dash" style={{ marginTop: '1.5rem', borderRadius: '12px', padding: '1.8rem' }}>
                <h3 style={{ margin: '0 0 1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={22} color="#50cc7f" /> University Admin — Permissions Overview
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {[
                        { label: 'Create Assessment Structure', allowed: true },
                        { label: 'Approve Questions in Question Bank', allowed: true },
                        { label: 'View & Monitor Blueprints', allowed: true },
                        { label: 'View & Monitor Rubrics', allowed: true },
                        { label: 'Monitor Question Mappings', allowed: true },
                        { label: 'Generate OBE Reports', allowed: true },
                        { label: 'Conduct Assessments (Teacher role)', allowed: false },
                        { label: 'Submit Marks directly', allowed: false },
                        { label: 'Edit Student Records', allowed: false },
                        { label: 'Delete System Data', allowed: false },
                    ].map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: p.allowed ? 'rgba(80,204,127,0.05)' : 'rgba(255,27,107,0.05)', border: `1px solid ${p.allowed ? 'rgba(80,204,127,0.15)' : 'rgba(255,27,107,0.1)'}`, borderRadius: '8px' }}>
                            {p.allowed ? <CheckCircle size={18} color="#50cc7f" style={{ flexShrink: 0 }} /> : <XCircle size={18} color="#ff1b6b" style={{ flexShrink: 0 }} />}
                            <span style={{ color: p.allowed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>{p.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ObeReports;
