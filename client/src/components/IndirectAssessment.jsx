import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSurveys } from '../store/surveySlice';
import { Loader2, Calculator, Save, AlertTriangle, Target } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const IndirectAssessment = () => {
    const dispatch = useDispatch();
    const { token } = useSelector(s => s.auth);
    const { surveys, loading: surveysLoading } = useSelector(s => s.surveys);
    const [selectedSurvey, setSelectedSurvey] = useState('');
    const [calculating, setCalculating] = useState(false);
    const [calcMsg, setCalcMsg] = useState('');
    const [targetWeights, setTargetWeights] = useState({ directWeight: 80, indirectWeight: 20 });
    const [savingWeights, setSavingWeights] = useState(false);

    useEffect(() => {
        dispatch(fetchSurveys());
        // Fetch target weights
        axios.get(`${API}/targets`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.data && res.data.length > 0) {
                    const target = res.data[0];
                    if (target.directWeight !== undefined) {
                        setTargetWeights({
                            directWeight: target.directWeight * 100,
                            indirectWeight: target.indirectWeight * 100
                        });
                    }
                }
            }).catch(console.error);
    }, [dispatch, token]);

    const handleCalculate = async () => {
        if (!selectedSurvey) return;
        setCalculating(true);
        setCalcMsg('');
        try {
            const cfg = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post(`${API}/surveys/${selectedSurvey}/calculate-indirect`, {}, cfg);
            setCalcMsg(res.data.message || 'Indirect assessment calculated and Student Attainment updated successfully.');
        } catch (err) {
            setCalcMsg(err.response?.data?.message || err.message);
        } finally {
            setCalculating(false);
        }
    };

    const handleSaveWeights = async () => {
        if (targetWeights.directWeight + targetWeights.indirectWeight !== 100) {
            alert('Direct and Indirect weights must sum to 100%');
            return;
        }
        setSavingWeights(true);
        try {
            const cfg = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API}/targets`, { 
                directWeight: targetWeights.directWeight / 100, 
                indirectWeight: targetWeights.indirectWeight / 100 
            }, cfg);
            alert('Weights updated successfully');
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        } finally {
            setSavingWeights(false);
        }
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={20}/> Weight Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '6px' }}>Direct Assessment Weight (%)</label>
                        <input type="number" min="0" max="100" value={targetWeights.directWeight} onChange={e => setTargetWeights({...targetWeights, directWeight: Number(e.target.value)})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}/>
                    </div>
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '6px' }}>Indirect Assessment Weight (%)</label>
                        <input type="number" min="0" max="100" value={targetWeights.indirectWeight} onChange={e => setTargetWeights({...targetWeights, indirectWeight: Number(e.target.value)})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}/>
                    </div>
                </div>
                <button onClick={handleSaveWeights} disabled={savingWeights} style={{ padding: '10px 20px', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {savingWeights ? <Loader2 size={16} className="spinner" /> : <Save size={16} />} Save Weights
                </button>
            </div>

            <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calculator size={20}/> Calculate Indirect Assessment
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Select a survey with mapped PLO/GA questions to calculate indirect attainment. This will update the overall percentage in Student Attainment records.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select value={selectedSurvey} onChange={e => setSelectedSurvey(e.target.value)} style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                        <option value="">Select a Survey</option>
                        {surveys.filter(s => s.responses?.length > 0).map(s => (
                            <option key={s._id} value={s._id}>{s.title} ({s.responses.length} responses)</option>
                        ))}
                    </select>
                    <button onClick={handleCalculate} disabled={calculating || !selectedSurvey} className="primary-btn">
                        {calculating ? <Loader2 size={16} className="spinner" /> : <Calculator size={16} />} Calculate
                    </button>
                </div>
                {calcMsg && (
                    <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: calcMsg.toLowerCase().includes('error') ? 'rgba(255,27,107,0.1)' : 'rgba(80,204,127,0.1)', color: calcMsg.toLowerCase().includes('error') ? '#ff1b6b' : '#50cc7f', border: `1px solid ${calcMsg.toLowerCase().includes('error') ? 'rgba(255,27,107,0.3)' : 'rgba(80,204,127,0.3)'}` }}>
                        {calcMsg}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndirectAssessment;
