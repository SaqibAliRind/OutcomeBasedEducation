import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Target, BarChart2, CheckCircle, XCircle, AlertTriangle, Activity, Calculator, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TeacherOBE = ({ initialCourseId = '' }) => {
    const { token, user } = useSelector(s => s.auth);
    const hdrs = { Authorization: `Bearer ${token}` };

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
    const [selectedOffering, setSelectedOffering] = useState('');
    const [loading, setLoading] = useState(false);
    const [calcLoading, setCalcLoading] = useState(false);
    const [toast, setToast] = useState(null);
    
    // Data
    const [mappings, setMappings] = useState([]);
    const [marksRecords, setMarksRecords] = useState([]);
    const [clos, setClos] = useState([]);
    const [attainments, setAttainments] = useState([]); // Real server-calculated data

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        axios.get(`${API}/teachers/courses`, { headers: hdrs }).then(r => setCourses(r.data || [])).catch(console.error);
        axios.get(`${API}/clos`, { headers: hdrs }).then(r => setClos(r.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedCourse) return;
        setLoading(true);
        
        const offering = courses.find(c => c.course?._id === selectedCourse);
        const offeringId = offering?._id;
        setSelectedOffering(offeringId || '');

        const fetchMappings = axios.get(`${API}/question-mappings?course=${selectedCourse}&teacher=${user._id}`, { headers: hdrs });
        let fetchMarks = Promise.resolve({ data: [] });
        let fetchAttainment = Promise.resolve({ data: [] });
        if (offeringId) {
            fetchMarks = axios.get(`${API}/marks?courseOffering=${offeringId}`, { headers: hdrs });
            fetchAttainment = axios.get(`${API}/obe/attainment/${offeringId}`, { headers: hdrs });
        }

        Promise.all([fetchMappings, fetchMarks, fetchAttainment])
            .then(([mRes, mkRes, attRes]) => {
                setMappings(mRes.data);
                setMarksRecords(mkRes.data);
                setAttainments(attRes.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedCourse, courses, user._id]);

    // OBE Calculation Logic
    const calculateOBE = () => {
        let totalMappedMarks = 0;
        let totalObtained = 0;

        const cloStats = {};
        const btStats = {};

        mappings.forEach(m => {
            const mId = m.assessment?._id || m.assessment;
            // Find corresponding marks record
            const markRec = marksRecords.find(r => (r.assessment?._id || r.assessment) === mId);
            if (!markRec) return;

            // Calculate total marks for this assessment
            const classAverage = markRec.students.length > 0 
                ? markRec.students.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0) / markRec.students.length
                : 0;

            const assessmentTotal = markRec.assessment?.totalMarks || 1;
            const percentage = (classAverage / assessmentTotal); // e.g. 0.82

            m.questions.forEach(q => {
                const qMarks = q.marks || 0;
                const achievedQMarks = qMarks * percentage;
                
                totalMappedMarks += qMarks;
                totalObtained += achievedQMarks;

                // CLO Calc
                if (q.clo) {
                    const cloId = q.clo._id || q.clo;
                    if (!cloStats[cloId]) cloStats[cloId] = { target: qMarks, achieved: achievedQMarks, code: q.clo.code || 'CLO' };
                    else {
                        cloStats[cloId].target += qMarks;
                        cloStats[cloId].achieved += achievedQMarks;
                    }
                }

                // BT Calc
                if (q.btLevel) {
                    if (!btStats[q.btLevel]) btStats[q.btLevel] = { target: qMarks, achieved: achievedQMarks };
                    else {
                        btStats[q.btLevel].target += qMarks;
                        btStats[q.btLevel].achieved += achievedQMarks;
                    }
                }
            });
        });

        const cloResults = Object.values(cloStats).map(c => ({
            code: c.code,
            percentage: c.target > 0 ? (c.achieved / c.target) * 100 : 0
        }));

        const btResults = Object.keys(btStats).map(k => ({
            level: k,
            percentage: btStats[k].target > 0 ? (btStats[k].achieved / btStats[k].target) * 100 : 0
        }));

        return {
            overallAchieved: totalMappedMarks > 0 ? (totalObtained / totalMappedMarks) * 100 : 0,
            cloResults,
            btResults
        };
    };

    const handleCalculateObe = async () => {
        if (!selectedOffering) return showToast('Select a course with a course offering first.', 'error');
        setCalcLoading(true);
        try {
            await axios.post(`${API}/obe/calculate/${selectedOffering}`, {}, { headers: hdrs });
            const attRes = await axios.get(`${API}/obe/attainment/${selectedOffering}`, { headers: hdrs });
            setAttainments(attRes.data);
            showToast('OBE attainment calculated and updated!');
        } catch (err) {
            showToast(err.response?.data?.message || 'Calculation failed.', 'error');
        } finally {
            setCalcLoading(false);
        }
    };

    // Aggregate class-level CLO attainment from server data
    const serverCloStats = (() => {
        if (!attainments.length) return [];
        const map = {};
        attainments.forEach(rec => {
            rec.clos.forEach(c => {
                const code = c.clo?.code || c.clo;
                if (!map[code]) map[code] = { code, percentages: [], target: c.targetThreshold };
                map[code].percentages.push(c.percentage);
            });
        });
        return Object.values(map).map(c => ({
            code: c.code,
            percentage: c.percentages.reduce((s, v) => s + v, 0) / c.percentages.length,
            target: c.target
        }));
    })();

    const stats = calculateOBE();
    const useServerData = attainments.length > 0;

    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            {toast && (
                <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'error' ? '#ff1b6b' : '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold' }}>
                    {toast.msg}
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                    <Target size={22} color="#10B981" /> OBE Dashboard
                </h3>
                {selectedOffering && (
                    <button onClick={handleCalculateObe} disabled={calcLoading} className="primary-btn">
                        {calcLoading ? <Loader2 size={16} className="spinner" /> : <Calculator size={16} />}
                        {calcLoading ? 'Calculating...' : 'Calculate OBE'}
                    </button>
                )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Select Course for OBE Analysis</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                    <option value="">-- Choose Course --</option>
                    {[...new Map(courses.map(c => [c.course._id, c.course])).values()].map(c => (
                        <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#10B981' }}>Loading OBE Data...</div>
            ) : !selectedCourse ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Please select a course to view OBE analytics.</div>
            ) : mappings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#F59E0B' }}>
                    <AlertTriangle size={32} style={{ marginBottom: '1rem', opacity: 0.8 }} />
                    <div>No Question Mappings found for this course.</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>Please map your assessments first in the Question Mapping tab.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Overall Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10B981' }}>{(useServerData ? (serverCloStats.reduce((s,c)=>s+c.percentage,0)/Math.max(serverCloStats.length,1)) : stats.overallAchieved).toFixed(1)}%</div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>Overall CLO Attainment</div>
                        </div>
                        <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(15,240,252,0.2)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0ff0fc' }}>{mappings.length}</div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>Assessments Mapped</div>
                        </div>
                        <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(188,19,254,0.2)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#bc13fe' }}>{(useServerData ? serverCloStats : stats.cloResults).filter(c => c.percentage >= (c.target||60)).length}/{(useServerData ? serverCloStats : stats.cloResults).length}</div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>CLOs Meeting Target</div>
                        </div>
                        {useServerData && (
                            <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.2)' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{attainments.length}</div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>Students Assessed</div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* CLO Achievement Table */}
                        <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={18} color="#0ff0fc" /> CLO Achievement
                                {useServerData && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '2px 8px' }}>✓ Server Calculated</span>}
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '10px 5px', color: 'rgba(255,255,255,0.5)' }}>CLO</th>
                                        <th style={{ padding: '10px 5px', color: 'rgba(255,255,255,0.5)' }}>Target</th>
                                        <th style={{ padding: '10px 5px', color: 'rgba(255,255,255,0.5)' }}>Achieved</th>
                                        <th style={{ padding: '10px 5px', color: 'rgba(255,255,255,0.5)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(useServerData ? serverCloStats : stats.cloResults).map((c, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px 5px', fontWeight: 'bold' }}>{c.code}</td>
                                            <td style={{ padding: '10px 5px' }}>{c.target || 60}%</td>
                                            <td style={{ padding: '10px 5px', color: c.percentage >= (c.target||60) ? '#10B981' : '#ff1b6b' }}>{c.percentage.toFixed(1)}%</td>
                                            <td style={{ padding: '10px 5px' }}>
                                                {c.percentage >= (c.target||60) ? <CheckCircle size={16} color="#10B981" /> : <XCircle size={16} color="#ff1b6b" />}
                                            </td>
                                        </tr>
                                    ))}
                                    {(useServerData ? serverCloStats : stats.cloResults).length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.3)' }}>No CLO data</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        {/* BT Achievement Progress */}
                        <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BarChart2 size={18} color="#bc13fe" /> BT Level Achievement
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.btResults.map((b, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '5px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.8)' }}>{b.level}</span>
                                            <span style={{ color: '#bc13fe', fontWeight: 'bold' }}>{b.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min(100, b.percentage)}%`, background: '#bc13fe', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                ))}
                                {stats.btResults.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No Bloom's Taxonomy data mapped.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherOBE;
