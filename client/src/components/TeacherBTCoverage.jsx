import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Layers, RefreshCw, Loader2, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

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
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target}%`, width: 2, background: 'rgba(255,204,0,0.7)' }} />
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,204,0,0.6)', textAlign: 'right', marginTop: 2 }}>Target: {target}%</div>
    </div>
);

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
const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TeacherBTCoverage = () => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [markRecords, setMarkRecords] = useState([]);
    const [mappings, setMappings] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get(`${API}/teachers/courses`, { headers: hdrs });
                if (res.data?.length > 0) {
                    setCourses(res.data);
                    setSelectedOffering(res.data[0]._id);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        if (!selectedOffering) return;
        setLoading(true);
        Promise.all([
            axios.get(`${API}/marks?courseOffering=${selectedOffering}`, { headers: hdrs }),
            axios.get(`${API}/question-mappings?teacher=${user._id}`, { headers: hdrs })
        ]).then(([mk, mp]) => {
            setMarkRecords(mk.data || []);
            setMappings(mp.data || []);
        }).catch(console.error)
        .finally(() => setLoading(false));
    }, [selectedOffering]);

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

    const panelStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' };

    return (
        <div className="fade-in">
            <header className="top-header">
                <div className="header-title">
                    <h1>Bloom's Taxonomy Coverage</h1>
                    <p>Track BT achievement levels across your assessments</p>
                </div>
            </header>

            <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '5px' }}>Select Course Offering</label>
                <select
                    value={selectedOffering}
                    onChange={(e) => setSelectedOffering(e.target.value)}
                    style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                    <option value="" disabled>-- Select Course --</option>
                    {courses.map(c => {
                        const safeStr = (val) => {
                            if (typeof val === 'string' || typeof val === 'number') return String(val);
                            if (!val) return '';
                            if (typeof val === 'object') return val.code || val.name || '';
                            return '';
                        };
                        return (
                            <option key={c._id} value={c._id}>
                                {safeStr(c.course)} — {safeStr(c.section)} | {safeStr(c.batch?.program)} {safeStr(c.batch)}
                            </option>
                        );
                    })}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="spinner-large" size={48} color="#8B5CF6" />
                </div>
            ) : !selectedOffering ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                    Please select a course offering to view BT Coverage.
                </div>
            ) : (
                <div style={panelStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', color: '#8B5CF6', fontSize: '1.1rem', fontWeight: '700' }}>
                        <Layers size={20} />
                        Bloom's Taxonomy Achievement
                    </div>
                    {btAnalysis.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.25)' }}>
                            No BT level data found for this course. Please ensure you have mapped questions and entered marks.
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <BarChart data={btAnalysis.map(b => ({ level: b.level.substring(0, 6), pct: Math.round(b.pct) }))} valueKey="pct" labelKey="level" color="#8B5CF6" height={160} />
                            </div>
                            {btAnalysis.map((b, i) => (
                                <div key={i} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 90, fontSize: '0.85rem', fontWeight: '600', color: '#8B5CF6', flexShrink: 0 }}>{b.level}</div>
                                    <div style={{ flex: 1 }}><ProgressBar label="" pct={b.pct} color="#8B5CF6" target={60} /></div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', width: 70, textAlign: 'right' }}>{b.marks} marks</div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherBTCoverage;
