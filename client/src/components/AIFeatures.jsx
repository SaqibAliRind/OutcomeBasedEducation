import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    aiGenerateQuestion, aiSuggestCLOs, aiSuggestPLOs, aiDetectBTLevel,
    aiSuggestActionVerbs, aiGenerateBlueprint, aiGenerateRubric,
    aiAnalyzeDifficulty, aiDetectDuplicate, clearAI,
    aiPredictAttendance, aiDetectAtRisk, aiPredictGrade,
    aiPredictGPA, aiAnalyzePerformance, aiStudentRecommendations,
    aiSurveyAnalysis, aiSentimentAnalysis, aiNotificationSuggestions,
    aiWorkflowDelay, aiAutoReminder, aiQualityScore, aiQECRecommendations,
    aiAccreditationChecklist,
    aiGenerateLectureNotes, aiGeneratePPTOutline, aiGenerateQuiz,
    aiGenerateAssignment, aiGenerateProgrammingQuestion, aiGenerateLabManual
} from '../store/aiSlice';
import { Sparkles, Brain, Loader2, ChevronRight, Copy, X } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' };
const labelStyle = { display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '500' };
const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const Q_TYPES = ['MCQs', 'Short Question', 'Long Question', 'Practical Question', 'Coding Question', 'Numerical Question', 'Case Study', 'Viva Question'];

const FEATURES = [
    { id: 'generateQuestion',       label: 'AI Question Generator',              color: '#0ff0fc', icon: '❓', group: 'Academic' },
    { id: 'suggestCLOs',            label: 'AI CLO Suggestion',                  color: '#bc13fe', icon: '🎯', group: 'Academic' },
    { id: 'suggestPLOs',            label: 'AI PLO Suggestion',                  color: '#7c3aed', icon: '📌', group: 'Academic' },
    { id: 'detectBTLevel',          label: 'AI BT Level Detection',              color: '#50cc7f', icon: '🔍', group: 'Academic' },
    { id: 'suggestActionVerbs',     label: 'AI Action Verb Suggestion',          color: '#ff9800', icon: '✏️', group: 'Academic' },
    { id: 'generateBlueprint',      label: 'AI Blueprint Generator',             color: '#e91e63', icon: '📋', group: 'Academic' },
    { id: 'generateRubric',         label: 'AI Rubric Generator',                color: '#2196f3', icon: '🗃️', group: 'Academic' },
    { id: 'analyzeDifficulty',      label: 'AI Question Difficulty Analysis',    color: '#ffeb3b', icon: '📊', group: 'Academic' },
    { id: 'detectDuplicate',        label: 'AI Duplicate Question Detection',    color: '#ff5722', icon: '⚠️', group: 'Academic' },
    { id: 'predictAttendance',      label: 'AI Attendance Prediction',           color: '#00bcd4', icon: '📅', group: 'Student' },
    { id: 'detectAtRisk',           label: 'AI At-Risk Student Detection',       color: '#f44336', icon: '🚨', group: 'Student' },
    { id: 'predictGrade',           label: 'AI Grade Prediction',                color: '#4caf50', icon: '📈', group: 'Student' },
    { id: 'predictGPA',             label: 'AI GPA Prediction',                  color: '#9c27b0', icon: '🎓', group: 'Student' },
    { id: 'analyzePerformance',     label: 'AI Performance Analysis',            color: '#3f51b5', icon: '📉', group: 'Student' },
    { id: 'studentRecommendations', label: 'AI Student Recommendations',         color: '#ffc107', icon: '💡', group: 'Student' },
    // ── OBE AI Features ──────────────────────────────────────────────────────
    { id: 'aiGapAnalysis',          label: 'AI Gap Analysis',                    color: '#ff1b6b', icon: '📉', group: 'OBE' },
    { id: 'aiWeakCLO',              label: 'AI Weak CLO Detection',              color: '#bc13fe', icon: '🔴', group: 'OBE' },
    { id: 'aiWeakPLO',              label: 'AI Weak PLO Detection',              color: '#7c3aed', icon: '🟠', group: 'OBE' },
    { id: 'aiImprovementSuggestions', label: 'AI Improvement Suggestions',       color: '#50cc7f', icon: '💡', group: 'OBE' },
    { id: 'aiCQISuggestions',       label: 'AI Closing the Loop Suggestions',    color: '#0ff0fc', icon: '🔄', group: 'OBE' },
    { id: 'aiTargetPrediction',     label: 'AI Target Prediction',               color: '#ff9800', icon: '🎯', group: 'OBE' },
    { id: 'aiPerformanceForecast',  label: 'AI Performance Forecast',            color: '#2196f3', icon: '📊', group: 'OBE' },
    { id: 'aiAccreditationScore',   label: 'AI Accreditation Readiness Score',   color: '#ffc107', icon: '🏅', group: 'OBE' },
    // ── Management AI Features ───────────────────────────────────────────────
    { id: 'aiSurveyAnalysis',           label: 'AI Survey Analysis',                 color: '#ff1b6b', icon: '📝', group: 'Management' },
    { id: 'aiSentimentAnalysis',        label: 'AI Sentiment Analysis (Student Feedback)', color: '#bc13fe', icon: '💬', group: 'Management' },
    { id: 'aiNotificationSuggestions',  label: 'AI Notification Suggestions',        color: '#7c3aed', icon: '🔔', group: 'Management' },
    { id: 'aiWorkflowDelay',            label: 'AI Workflow Delay Detection',        color: '#ff9800', icon: '⏳', group: 'Management' },
    { id: 'aiAutoReminder',             label: 'AI Auto Reminder Generator',         color: '#50cc7f', icon: '⏱️', group: 'Management' },
    { id: 'aiQualityScore',             label: 'AI Quality Score (QEC)',             color: '#0ff0fc', icon: '⭐', group: 'Management' },
    { id: 'aiQECRecommendations',       label: 'AI QEC Recommendations',             color: '#ffc107', icon: '📋', group: 'Management' },
    { id: 'aiAccreditationChecklist',   label: 'AI Accreditation Checklist',         color: '#2196f3', icon: '✅', group: 'Management' },
    // ── Teaching AI Features ─────────────────────────────────────────────────
    { id: 'generateLectureNotes',       label: 'AI Lecture Notes Generator',         color: '#0ff0fc', icon: '📖', group: 'Teaching' },
    { id: 'generatePPTOutline',         label: 'AI PPT Outline Generator',           color: '#bc13fe', icon: '🖥️', group: 'Teaching' },
    { id: 'generateQuiz',               label: 'AI Quiz Generator',                  color: '#50cc7f', icon: '📝', group: 'Teaching' },
    { id: 'generateAssignment',         label: 'AI Assignment Generator',            color: '#ff9800', icon: '📋', group: 'Teaching' },
    { id: 'generateProgrammingQuestion',label: 'AI Programming Question Generator',  color: '#e91e63', icon: '💻', group: 'Teaching' },
    { id: 'generateLabManual',          label: 'AI Lab Manual Generator',            color: '#ffc107', icon: '🔬', group: 'Teaching' },
];

const FormField = ({ label, children }) => (
    <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>{label}</label>
        {children}
    </div>
);

const ResultPanel = ({ result, feature, onCopy }) => {
    if (!result) return null;
    const text = JSON.stringify(result, null, 2);
    return (
        <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(15,240,252,0.2)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#0ff0fc', fontWeight: '600', fontSize: '0.9rem' }}>✨ AI Result</span>
                <button onClick={() => { navigator.clipboard.writeText(text); onCopy(); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '6px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}><Copy size={12}/> Copy JSON</button>
            </div>
            <RenderResult result={result} feature={feature} />
        </div>
    );
};

const RenderResult = ({ result, feature }) => {
    // Smart display based on feature
    if (feature === 'generateQuestion' && result.statement) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(15,240,252,0.05)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(15,240,252,0.15)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>GENERATED QUESTION</div>
                    <div style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.5' }}>{result.statement}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <Chip label="BT Action Verb" value={result.actionVerb} color="#0ff0fc" />
                    <Chip label="Difficulty" value={result.difficulty} color="#ff9800" />
                    <Chip label="Marks" value={result.suggestedMarks} color="#50cc7f" />
                </div>
                {result.modelAnswer && <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}><strong style={{color: 'rgba(255,255,255,0.9)'}}>Model Answer:</strong> {result.modelAnswer}</div>}
            </div>
        );
    }
    if ((feature === 'suggestCLOs' || feature === 'suggestPLOs') && Array.isArray(result)) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.map((item, i) => (
                    <div key={i} style={{ background: 'rgba(188,19,254,0.05)', border: '1px solid rgba(188,19,254,0.2)', borderRadius: '8px', padding: '10px' }}>
                        <span style={{ color: '#bc13fe', fontWeight: '700', marginRight: '10px' }}>{item.code}</span>
                        <span style={{ color: '#fff', fontSize: '0.9rem' }}>{item.description}</span>
                        {item.bloomsLevel && <span style={{ marginLeft: '10px', color: '#0ff0fc', fontSize: '0.75rem' }}>({item.bloomsLevel})</span>}
                    </div>
                ))}
            </div>
        );
    }
    if (feature === 'detectBTLevel' && result.btLevel) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <Chip label="BT Level" value={result.btLevel} color="#50cc7f" />
                <Chip label="Action Verb" value={result.actionVerb} color="#0ff0fc" />
                <Chip label="Confidence" value={result.confidence} color={result.confidence === 'High' ? '#50cc7f' : result.confidence === 'Medium' ? '#ff9800' : '#ff1b6b'} />
                <div style={{ gridColumn: '1 / -1', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{result.reasoning}</div>
            </div>
        );
    }
    if (feature === 'suggestActionVerbs' && Array.isArray(result)) {
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.map((v, i) => <span key={i} style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', color: '#ff9800', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>{v}</span>)}
            </div>
        );
    }
    if (feature === 'generateBlueprint' && Array.isArray(result)) {
        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', textAlign: 'left' }}>
                    {['Topic', 'BT Level', 'Questions', 'Marks'].map(h => <th key={h} style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{h}</th>)}
                </tr></thead>
                <tbody>{result.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 6px', color: '#fff' }}>{r.topic}</td>
                        <td style={{ padding: '8px 6px', color: '#0ff0fc' }}>{r.bloomsLevel}</td>
                        <td style={{ padding: '8px 6px', color: '#fff' }}>{r.questionCount}</td>
                        <td style={{ padding: '8px 6px', color: '#bc13fe', fontWeight: '700' }}>{r.marks}</td>
                    </tr>
                ))}</tbody>
            </table>
        );
    }
    if (feature === 'generateRubric' && Array.isArray(result)) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(33,150,243,0.05)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontWeight: '700', color: '#2196f3', marginBottom: '8px' }}>{c.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.8rem' }}>
                            {[['Excellent', '#50cc7f'], ['Good', '#0ff0fc'], ['Satisfactory', '#ff9800'], ['Poor', '#ff1b6b']].map(([lvl, col]) => (
                                <div key={lvl} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '8px' }}>
                                    <div style={{ color: col, fontWeight: '600', marginBottom: '4px' }}>{lvl}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{c.descriptions?.[lvl.toLowerCase()]}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    if (feature === 'analyzeDifficulty' && result.difficulty) {
        const diffColor = result.suggestedDifficulty === 'Hard' ? '#ff1b6b' : result.suggestedDifficulty === 'Medium' ? '#ff9800' : '#50cc7f';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <Chip label="Detected Difficulty" value={result.difficulty} color={diffColor} />
                    <Chip label="Suggested Difficulty" value={result.suggestedDifficulty} color={diffColor} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{result.reasoning}</div>
                {result.suggestions?.length > 0 && (
                    <div>{result.suggestions.map((s, i) => <div key={i} style={{ color: '#0ff0fc', fontSize: '0.85rem', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}><ChevronRight size={14} style={{marginTop: '2px', flexShrink: 0}}/>{s}</div>)}</div>
                )}
            </div>
        );
    }
    if (feature === 'detectDuplicate') {
        const dupeColor = result.isDuplicate ? '#ff1b6b' : '#50cc7f';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: `${dupeColor}15`, border: `1px solid ${dupeColor}40`, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>{result.isDuplicate ? '⚠️' : '✅'}</div>
                    <div style={{ color: dupeColor, fontWeight: '700', fontSize: '1.1rem' }}>{result.isDuplicate ? 'Potential Duplicate Detected' : 'No Duplicates Found'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '4px' }}>Similarity Score: {result.similarity}%</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{result.reasoning}</div>
            </div>
        );
    }
    
    // Student Analytics Features
    if (feature === 'predictAttendance' && result.riskLevel) {
        const riskColor = result.riskLevel === 'Low' ? '#50cc7f' : result.riskLevel === 'Medium' ? '#ff9800' : '#ff1b6b';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <Chip label="Predicted Final Attendance" value={result.predictedFinalAttendance} color="#0ff0fc" />
                    <Chip label="Risk Level" value={result.riskLevel} color={riskColor} />
                </div>
                {result.shortfallRisk && <div style={{ color: '#ff1b6b', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,27,107,0.1)', borderRadius: '8px' }}>⚠️ Shortfall Risk: Requires {result.requiredConsecutivePresent} consecutive present classes.</div>}
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{result.reasoning}</div>
                {result.recommendations?.length > 0 && (
                    <div>{result.recommendations.map((s, i) => <div key={i} style={{ color: '#0ff0fc', fontSize: '0.85rem', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}><ChevronRight size={14} style={{marginTop: '2px', flexShrink: 0}}/>{s}</div>)}</div>
                )}
            </div>
        );
    }

    if (feature === 'detectAtRisk' && result.riskStatus) {
        const riskColor = result.riskStatus === 'Safe' ? '#50cc7f' : result.riskStatus === 'At Risk' ? '#ff9800' : '#ff1b6b';
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <Chip label="Risk Status" value={result.riskStatus} color={riskColor} />
                    <Chip label="Risk Score" value={`${result.riskScore}/100`} color={riskColor} />
                    <Chip label="Intervention" value={result.interventionRequired ? 'Required' : 'Not Required'} color={result.interventionRequired ? '#ff1b6b' : '#50cc7f'} />
                    <Chip label="Urgency" value={result.urgencyLevel} color={riskColor} />
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{result.prognosis}</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <div>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>PRIMARY RISK FACTORS</div>
                       {result.primaryRiskFactors?.map((s, i) => <div key={i} style={{ color: '#ff9800', fontSize: '0.85rem', padding: '2px 0' }}>• {s}</div>)}
                   </div>
                   <div>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>EARLY WARNING SIGNALS</div>
                       {result.earlyWarningSignals?.map((s, i) => <div key={i} style={{ color: '#ffcc00', fontSize: '0.85rem', padding: '2px 0' }}>• {s}</div>)}
                   </div>
                </div>

                {result.suggestedInterventions?.length > 0 && (
                    <div style={{ marginTop: '5px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>SUGGESTED INTERVENTIONS</div>
                        {result.suggestedInterventions.map((s, i) => <div key={i} style={{ color: '#0ff0fc', fontSize: '0.85rem', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}><ChevronRight size={14} style={{marginTop: '2px', flexShrink: 0}}/>{s}</div>)}
                    </div>
                )}
            </div>
        );
    }

    if (feature === 'predictGrade' && result.predictedGrade) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <Chip label="Predicted Grade" value={result.predictedGrade} color="#50cc7f" />
                    <Chip label="Percentage" value={`${result.predictedPercentage}%`} color="#0ff0fc" />
                    <Chip label="Confidence" value={result.confidence} color={result.confidence === 'High' ? '#50cc7f' : '#ff9800'} />
                </div>
                
                {result.finalExamRequiredFor && (
                   <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '8px' }}>FINAL EXAM MARKS REQUIRED FOR:</div>
                       <div style={{ display: 'flex', gap: '15px' }}>
                           {Object.entries(result.finalExamRequiredFor).map(([g, m]) => (
                               <div key={g} style={{ color: '#fff', fontSize: '0.85rem' }}><strong style={{ color: '#bc13fe' }}>{g}:</strong> {m}</div>
                           ))}
                       </div>
                   </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <div>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>STRENGTHS</div>
                       {result.strengths?.map((s, i) => <div key={i} style={{ color: '#50cc7f', fontSize: '0.85rem', padding: '2px 0' }}>+ {s}</div>)}
                   </div>
                   <div>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>WEAK AREAS</div>
                       {result.weakAreas?.map((s, i) => <div key={i} style={{ color: '#ff1b6b', fontSize: '0.85rem', padding: '2px 0' }}>- {s}</div>)}
                   </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(15,240,252,0.1)', borderRadius: '8px', color: '#0ff0fc' }}>💡 {result.suggestion}</div>
            </div>
        );
    }

    if (feature === 'predictGPA' && result.predictedSemesterGPA) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <Chip label="Predicted SGPA" value={result.predictedSemesterGPA} color="#0ff0fc" />
                    <Chip label="Predicted New CGPA" value={result.predictedNewCGPA} color="#bc13fe" />
                    <Chip label="Trend" value={result.cgpaTrend} color={result.cgpaTrend === 'Improving' ? '#50cc7f' : result.cgpaTrend === 'Declining' ? '#ff1b6b' : '#ff9800'} />
                    <Chip label="Change" value={result.cgpaChange} color="#fff" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Dean's List Track: <strong style={{ color: result.onTrackForDeansList ? '#50cc7f' : '#ff9800' }}>{result.onTrackForDeansList ? 'Yes' : 'No'}</strong></span>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>Projected Grad CGPA: <strong style={{ color: '#fff' }}>{result.projectedGraduationCGPA}</strong></span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>{result.insight}</div>
            </div>
        );
    }

    if (feature === 'analyzePerformance' && result.overallRating) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <Chip label="Overall Rating" value={result.overallRating} color="#0ff0fc" />
                    <Chip label="Performance Score" value={`${result.performanceScore}/100`} color="#bc13fe" />
                    <Chip label="Trend" value={result.performanceTrend} color="#ffcc00" />
                    <Chip label="Peak Performance" value={result.peakPerformance} color="#50cc7f" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                   <div>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>ACADEMIC STRENGTHS</div>
                       {result.academicStrengths?.map((s, i) => <div key={i} style={{ color: '#50cc7f', fontSize: '0.85rem', padding: '2px 0' }}>+ {s}</div>)}
                   </div>
                   <div>
                       <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>ACADEMIC WEAKNESSES</div>
                       {result.academicWeaknesses?.map((s, i) => <div key={i} style={{ color: '#ff1b6b', fontSize: '0.85rem', padding: '2px 0' }}>- {s}</div>)}
                   </div>
                </div>

                <div style={{ marginTop: '5px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '4px' }}>ACTION PLAN</div>
                    {result.actionPlan?.map((s, i) => <div key={i} style={{ color: '#0ff0fc', fontSize: '0.85rem', padding: '4px 0', display: 'flex', alignItems: 'flex-start', gap: '6px' }}><ChevronRight size={14} style={{marginTop: '2px', flexShrink: 0}}/>{s}</div>)}
                </div>
            </div>
        );
    }

    if (feature === 'studentRecommendations' && result.academicRecommendations) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: '#fff', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid #0ff0fc' }}>
                    "{result.motivationalMessage}"
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <div style={{ color: '#0ff0fc', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>ACADEMIC RECOMMENDATIONS</div>
                        {result.academicRecommendations?.map((s, i) => <div key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', padding: '2px 0' }}>• {s}</div>)}
                    </div>
                    <div>
                        <div style={{ color: '#bc13fe', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>CAREER PATH SUGGESTIONS</div>
                        {result.careerPathSuggestions?.map((s, i) => <div key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', padding: '2px 0' }}>• {s}</div>)}
                    </div>
                    <div>
                        <div style={{ color: '#50cc7f', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>STUDY STRATEGY</div>
                        {result.studyStrategyAdvice?.map((s, i) => <div key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', padding: '2px 0' }}>• {s}</div>)}
                    </div>
                    <div>
                        <div style={{ color: '#ffcc00', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>SKILL DEVELOPMENT</div>
                        {result.skillDevelopmentAreas?.map((s, i) => <div key={i} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', padding: '2px 0' }}>• {s}</div>)}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback JSON display
    return <pre style={{ color: '#0ff0fc', fontSize: '0.8rem', overflow: 'auto', maxHeight: '300px', margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>;
};

const Chip = ({ label, value, color }) => (
    <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '8px', padding: '8px 12px' }}>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>{label}</div>
        <div style={{ color, fontWeight: '700' }}>{value}</div>
    </div>
);

// ── Feature Forms ──────────────────────────────────────────────────────────────
const QuestionGeneratorForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ topic: '', btLevel: 'Apply', course: '', questionType: 'Short Question', marks: 5 });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <FormField label="Course Title"><input name="course" value={form.course} onChange={h} placeholder="e.g. Data Structures" style={inputStyle} /></FormField>
            <FormField label="Topic *"><input name="topic" value={form.topic} onChange={h} required placeholder="e.g. Binary Trees" style={inputStyle} /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Bloom's Level"><select name="btLevel" value={form.btLevel} onChange={h} style={inputStyle}>{BLOOMS.map(b => <option key={b}>{b}</option>)}</select></FormField>
                <FormField label="Question Type"><select name="questionType" value={form.questionType} onChange={h} style={inputStyle}>{Q_TYPES.map(q => <option key={q}>{q}</option>)}</select></FormField>
            </div>
            <FormField label="Marks"><input name="marks" type="number" value={form.marks} onChange={h} min={1} style={{ ...inputStyle, width: '120px' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const CLOForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ courseTitle: '', courseDescription: '', count: 5 });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <FormField label="Course Title *"><input name="courseTitle" value={form.courseTitle} onChange={h} required placeholder="e.g. Object Oriented Programming" style={inputStyle} /></FormField>
            <FormField label="Course Description"><textarea name="courseDescription" value={form.courseDescription} onChange={h} placeholder="Brief course description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <FormField label="Number of CLOs"><input name="count" type="number" value={form.count} onChange={h} min={1} max={10} style={{ ...inputStyle, width: '120px' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const PLOForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ programName: '', accreditation: 'NCEAC' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <FormField label="Program Name *"><input name="programName" value={form.programName} onChange={h} required placeholder="e.g. BS Computer Science" style={inputStyle} /></FormField>
            <FormField label="Accreditation Body">
                <select name="accreditation" value={form.accreditation} onChange={h} style={inputStyle}>
                    <option>NCEAC</option><option>HEC</option><option>ABET</option><option>General</option>
                </select>
            </FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const BTDetectForm = ({ onSubmit, loading }) => {
    const [text, setText] = useState('');
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ questionText: text }); }}>
            <FormField label="Question Text *"><textarea value={text} onChange={e => setText(e.target.value)} required rows={4} placeholder="Paste your exam question here..." style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const ActionVerbForm = ({ onSubmit, loading }) => {
    const [btLevel, setBtLevel] = useState('Apply');
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ btLevel }); }}>
            <FormField label="Bloom's Taxonomy Level">
                <select value={btLevel} onChange={e => setBtLevel(e.target.value)} style={inputStyle}>{BLOOMS.map(b => <option key={b}>{b}</option>)}</select>
            </FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const BlueprintForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ courseTitle: '', topicsInput: '', totalMarks: 100, assessmentType: 'Final Exam' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, topics: form.topicsInput.split(',').map(t => t.trim()).filter(Boolean) }); }}>
            <FormField label="Course Title *"><input name="courseTitle" value={form.courseTitle} onChange={h} required placeholder="e.g. Database Systems" style={inputStyle} /></FormField>
            <FormField label="Topics (comma-separated) *"><input name="topicsInput" value={form.topicsInput} onChange={h} required placeholder="e.g. ER Diagrams, SQL, Normalization, Transactions" style={inputStyle} /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Assessment Type"><select name="assessmentType" value={form.assessmentType} onChange={h} style={inputStyle}>
                    {['Quiz', 'Mid Exam', 'Final Exam', 'Lab', 'Project'].map(a => <option key={a}>{a}</option>)}</select>
                </FormField>
                <FormField label="Total Marks"><input name="totalMarks" type="number" value={form.totalMarks} onChange={h} min={1} style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const RubricForm = ({ onSubmit, loading }) => {
    const [rubricType, setRubricType] = useState('Programming Rubric');
    const [criteriaInput, setCriteriaInput] = useState('');
    const [context, setContext] = useState('');
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ rubricType, criteriaNames: criteriaInput.split(',').map(c => c.trim()).filter(Boolean), assessmentContext: context }); }}>
            <FormField label="Rubric Type"><select value={rubricType} onChange={e => setRubricType(e.target.value)} style={inputStyle}>
                {['Lab Rubric', 'Programming Rubric', 'Presentation Rubric', 'Project Rubric', 'Viva Rubric'].map(t => <option key={t}>{t}</option>)}</select>
            </FormField>
            <FormField label="Criteria Names (comma-separated) *"><input value={criteriaInput} onChange={e => setCriteriaInput(e.target.value)} required placeholder="e.g. Logic, Code Quality, Output, Documentation" style={inputStyle} /></FormField>
            <FormField label="Context (optional)"><input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. OOP project using Java and Spring Boot" style={inputStyle} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const DifficultyForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ questionText: '', marks: 5, questionType: 'Short Question' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <FormField label="Question Text *"><textarea name="questionText" value={form.questionText} onChange={h} required rows={4} placeholder="Paste your exam question here..." style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Marks"><input name="marks" type="number" value={form.marks} onChange={h} min={1} style={inputStyle} /></FormField>
                <FormField label="Question Type"><select name="questionType" value={form.questionType} onChange={h} style={inputStyle}>{Q_TYPES.map(q => <option key={q}>{q}</option>)}</select></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const DuplicateForm = ({ onSubmit, loading }) => {
    const [newQ, setNewQ] = useState('');
    const [existing, setExisting] = useState('');
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ newQuestion: newQ, existingQuestions: existing.split('\n').map(q => q.trim()).filter(Boolean) }); }}>
            <FormField label="New Question *"><textarea value={newQ} onChange={e => setNewQ(e.target.value)} required rows={3} placeholder="Enter the new question to check..." style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <FormField label="Existing Questions (one per line) *"><textarea value={existing} onChange={e => setExisting(e.target.value)} required rows={5} placeholder={'Question 1...\nQuestion 2...\nQuestion 3...'} style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

// ── New Student Analytics Forms ──────────────────────────────────────────────
const PredictAttendanceForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ studentName: '', currentAttendance: 85, missedClasses: 3, totalClasses: 20, pattern: '', courseTitle: '' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Student Name"><input name="studentName" value={form.studentName} onChange={h} placeholder="e.g. Ali Khan" style={inputStyle} /></FormField>
                <FormField label="Course Title"><input name="courseTitle" value={form.courseTitle} onChange={h} placeholder="e.g. Data Structures" style={inputStyle} /></FormField>
                <FormField label="Current Attendance (%) *"><input name="currentAttendance" type="number" value={form.currentAttendance} onChange={h} required min={0} max={100} style={inputStyle} /></FormField>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><FormField label="Missed Classes"><input name="missedClasses" type="number" value={form.missedClasses} onChange={h} min={0} style={inputStyle} /></FormField></div>
                    <div style={{ flex: 1 }}><FormField label="Total Classes"><input name="totalClasses" type="number" value={form.totalClasses} onChange={h} min={1} style={inputStyle} /></FormField></div>
                </div>
            </div>
            <FormField label="Pattern Notes (Optional)"><textarea name="pattern" value={form.pattern} onChange={h} rows={2} placeholder="e.g. Misses mostly Friday morning classes" style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const DetectAtRiskForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ studentName: '', cgpa: 2.1, attendanceRate: 65, failedCourses: 1, semesterNumber: 3, extraInfo: '' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Student Name"><input name="studentName" value={form.studentName} onChange={h} placeholder="e.g. Sara Ahmed" style={inputStyle} /></FormField>
                <FormField label="Current CGPA *"><input name="cgpa" type="number" step="0.01" value={form.cgpa} onChange={h} required min={0} max={4.0} style={inputStyle} /></FormField>
                <FormField label="Attendance Rate (%) *"><input name="attendanceRate" type="number" value={form.attendanceRate} onChange={h} required min={0} max={100} style={inputStyle} /></FormField>
                <FormField label="Failed Courses This Semester"><input name="failedCourses" type="number" value={form.failedCourses} onChange={h} min={0} style={inputStyle} /></FormField>
                <FormField label="Semester Number"><input name="semesterNumber" type="number" value={form.semesterNumber} onChange={h} min={1} max={8} style={inputStyle} /></FormField>
            </div>
            <FormField label="Additional Context (Optional)"><textarea name="extraInfo" value={form.extraInfo} onChange={h} rows={2} placeholder="e.g. Financial issues reported, low participation" style={{ ...inputStyle, resize: 'vertical' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const PredictGradeForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ studentName: '', courseTitle: '', quizAvg: 75, assignmentAvg: 80, midMarks: 65, labAvg: 85, attendanceRate: 90 });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Student Name"><input name="studentName" value={form.studentName} onChange={h} placeholder="e.g. Usman Tariq" style={inputStyle} /></FormField>
                <FormField label="Course Title"><input name="courseTitle" value={form.courseTitle} onChange={h} placeholder="e.g. Calculus I" style={inputStyle} /></FormField>
                <FormField label="Quiz Average (%)"><input name="quizAvg" type="number" value={form.quizAvg} onChange={h} min={0} max={100} style={inputStyle} /></FormField>
                <FormField label="Assignment Average (%)"><input name="assignmentAvg" type="number" value={form.assignmentAvg} onChange={h} min={0} max={100} style={inputStyle} /></FormField>
                <FormField label="Mid-Term Marks (%)"><input name="midMarks" type="number" value={form.midMarks} onChange={h} min={0} max={100} style={inputStyle} /></FormField>
                <FormField label="Lab Average (%) (if applicable)"><input name="labAvg" type="number" value={form.labAvg} onChange={h} min={0} max={100} style={inputStyle} /></FormField>
                <FormField label="Attendance Rate (%)"><input name="attendanceRate" type="number" value={form.attendanceRate} onChange={h} min={0} max={100} style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const PredictGPAForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ studentName: '', currentCGPA: 3.2, creditHours: 15, semesterNumber: 4, gradesJson: '{"OOP": "A", "Calculus": "B+", "Physics": "A-"}' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { 
            e.preventDefault(); 
            let grades = {};
            try { grades = JSON.parse(form.gradesJson); } catch (e) { alert("Invalid JSON for grades"); return; }
            onSubmit({...form, semesterGrades: grades}); 
        }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Student Name"><input name="studentName" value={form.studentName} onChange={h} placeholder="e.g. Ayesha Noor" style={inputStyle} /></FormField>
                <FormField label="Semester Number"><input name="semesterNumber" type="number" value={form.semesterNumber} onChange={h} min={1} max={8} style={inputStyle} /></FormField>
                <FormField label="Current CGPA *"><input name="currentCGPA" type="number" step="0.01" value={form.currentCGPA} onChange={h} required min={0} max={4.0} style={inputStyle} /></FormField>
                <FormField label="Credit Hours This Semester"><input name="creditHours" type="number" value={form.creditHours} onChange={h} min={1} style={inputStyle} /></FormField>
            </div>
            <FormField label="Semester Grades (JSON format) *"><textarea name="gradesJson" value={form.gradesJson} onChange={h} required rows={3} style={{ ...inputStyle, fontFamily: 'monospace' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const AnalyzePerformanceForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ studentName: '', program: 'BS CS', overallCGPA: 3.45, attendanceRate: 88, dataJson: '[{"semester": "S1", "gpa": 3.2}, {"semester": "S2", "gpa": 3.6}]' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { 
            e.preventDefault(); 
            let data = [];
            try { data = JSON.parse(form.dataJson); } catch (e) { alert("Invalid JSON"); return; }
            onSubmit({...form, semesterData: data}); 
        }}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Student Name"><input name="studentName" value={form.studentName} onChange={h} placeholder="e.g. Bilal Raza" style={inputStyle} /></FormField>
                <FormField label="Program"><input name="program" value={form.program} onChange={h} style={inputStyle} /></FormField>
                <FormField label="Overall CGPA *"><input name="overallCGPA" type="number" step="0.01" value={form.overallCGPA} onChange={h} required min={0} max={4.0} style={inputStyle} /></FormField>
                <FormField label="Attendance Rate (%)"><input name="attendanceRate" type="number" value={form.attendanceRate} onChange={h} min={0} max={100} style={inputStyle} /></FormField>
            </div>
            <FormField label="Semester Data (JSON array) *"><textarea name="dataJson" value={form.dataJson} onChange={h} required rows={3} style={{ ...inputStyle, fontFamily: 'monospace' }} /></FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const StudentRecommendationsForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ studentName: '', cgpa: 3.1, semesterNumber: 5, strongSubjects: 'Programming, Math', weakSubjects: 'Hardware, Networking', interests: 'AI, Web Dev', careerGoal: 'Software Engineer' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Student Name"><input name="studentName" value={form.studentName} onChange={h} placeholder="e.g. Zainab Bibi" style={inputStyle} /></FormField>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><FormField label="CGPA"><input name="cgpa" type="number" step="0.01" value={form.cgpa} onChange={h} min={0} max={4.0} style={inputStyle} /></FormField></div>
                    <div style={{ flex: 1 }}><FormField label="Semester"><input name="semesterNumber" type="number" value={form.semesterNumber} onChange={h} min={1} max={8} style={inputStyle} /></FormField></div>
                </div>
                <FormField label="Strong Subjects"><input name="strongSubjects" value={form.strongSubjects} onChange={h} style={inputStyle} /></FormField>
                <FormField label="Weak Subjects"><input name="weakSubjects" value={form.weakSubjects} onChange={h} style={inputStyle} /></FormField>
                <FormField label="Interests"><input name="interests" value={form.interests} onChange={h} style={inputStyle} /></FormField>
                <FormField label="Career Goal"><input name="careerGoal" value={form.careerGoal} onChange={h} style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const SubmitBtn = ({ loading, label = 'Generate' }) => (
    <button type="submit" disabled={loading} className="primary-btn">
        {loading ? <><Loader2 size={16} className="spin" /> Generating with Gemini AI...</> : <><Sparkles size={16} /> {label}</>}
    </button>
);

const FORM_MAP = {
    generateQuestion:       (props) => <QuestionGeneratorForm {...props} />,
    suggestCLOs:            (props) => <CLOForm {...props} />,
    suggestPLOs:            (props) => <PLOForm {...props} />,
    detectBTLevel:          (props) => <BTDetectForm {...props} />,
    suggestActionVerbs:     (props) => <ActionVerbForm {...props} />,
    generateBlueprint:      (props) => <BlueprintForm {...props} />,
    generateRubric:           (props) => <RubricForm {...props} />,
    analyzeDifficulty:        (props) => <DifficultyForm {...props} />,
    detectDuplicate:          (props) => <DuplicateForm {...props} />,
    predictAttendance:        (props) => <PredictAttendanceForm {...props} />,
    detectAtRisk:             (props) => <DetectAtRiskForm {...props} />,
    predictGrade:             (props) => <PredictGradeForm {...props} />,
    predictGPA:               (props) => <PredictGPAForm {...props} />,
    analyzePerformance:       (props) => <AnalyzePerformanceForm {...props} />,
    studentRecommendations:   (props) => <StudentRecommendationsForm {...props} />,
    // OBE AI
    aiGapAnalysis:            (props) => <AiGapAnalysisForm {...props} />,
    aiWeakCLO:                (props) => <AiWeakCLOForm {...props} />,
    aiWeakPLO:                (props) => <AiWeakPLOForm {...props} />,
    aiImprovementSuggestions: (props) => <AiImprovementForm {...props} />,
    aiCQISuggestions:         (props) => <AiCQIForm {...props} />,
    aiTargetPrediction:       (props) => <AiTargetPredictionForm {...props} />,
    aiPerformanceForecast:    (props) => <AiPerformanceForecastForm {...props} />,
    aiAccreditationScore:     (props) => <AiAccreditationScoreForm {...props} />,
    // Management AI
    aiSurveyAnalysis:         (props) => <GenericManagementForm {...props} />,
    aiSentimentAnalysis:      (props) => <GenericManagementForm {...props} />,
    aiNotificationSuggestions:(props) => <GenericManagementForm {...props} />,
    aiWorkflowDelay:          (props) => <GenericManagementForm {...props} />,
    aiAutoReminder:           (props) => <GenericManagementForm {...props} />,
    aiQualityScore:           (props) => <GenericManagementForm {...props} />,
    aiQECRecommendations:     (props) => <GenericManagementForm {...props} />,
    aiAccreditationChecklist: (props) => <GenericManagementForm {...props} />,
    // Teaching AI
    generateLectureNotes:        (props) => <LectureNotesForm {...props} />,
    generatePPTOutline:          (props) => <PPTOutlineForm {...props} />,
    generateQuiz:                (props) => <QuizGeneratorForm {...props} />,
    generateAssignment:          (props) => <AssignmentForm {...props} />,
    generateProgrammingQuestion: (props) => <ProgrammingQuestionForm {...props} />,
    generateLabManual:           (props) => <LabManualForm {...props} />,
};

// ════════════════════════════════════════════════════════════
// MANAGEMENT AI FORM COMPONENTS
// ════════════════════════════════════════════════════════════

const GenericManagementForm = ({ onSubmit, loading }) => {
    const [context, setContext] = useState('');
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ contextData: context }); }}>
            <FormField label="Context or Data (Provide text or paste JSON)">
                <textarea 
                    value={context} 
                    onChange={e => setContext(e.target.value)} 
                    placeholder="Enter details here for the AI to analyze..." 
                    style={{ ...inputStyle, minHeight: '100px' }} 
                    required 
                />
            </FormField>
            <SubmitBtn loading={loading} />
        </form>
    );
};

// ════════════════════════════════════════════════════════════
// OBE AI FORM COMPONENTS
// ════════════════════════════════════════════════════════════

const ObeContextForm = ({ onSubmit, loading, title, extra }) => {
    const [form, setForm] = useState({ session: 'Fall 2024', semester: 'Semester 5', program: 'BS CS', course: '', teacher: '' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit({ ...form, ...extra }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Session"><select name="session" value={form.session} onChange={h} style={inputStyle}><option>Fall 2024</option><option>Spring 2024</option></select></FormField>
                <FormField label="Semester"><select name="semester" value={form.semester} onChange={h} style={inputStyle}><option>Semester 5</option><option>Semester 3</option></select></FormField>
                <FormField label="Program"><select name="program" value={form.program} onChange={h} style={inputStyle}><option>BS CS</option><option>BS SE</option></select></FormField>
                <FormField label="Course (Optional)"><input name="course" value={form.course} onChange={h} placeholder="e.g. Data Structures" style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const AiGapAnalysisForm = (p) => <ObeContextForm {...p} />;
const AiWeakCLOForm     = (p) => <ObeContextForm {...p} />;
const AiWeakPLOForm     = (p) => <ObeContextForm {...p} />;
const AiImprovementForm = (p) => <ObeContextForm {...p} />;
const AiCQIForm         = (p) => <ObeContextForm {...p} />;

const AiTargetPredictionForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ program: 'BS CS', historicalAvg: 68, currentTrend: 'Improving', targetType: 'CLO' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Program"><input name="program" value={form.program} onChange={h} style={inputStyle} /></FormField>
                <FormField label="Outcome Type"><select name="targetType" value={form.targetType} onChange={h} style={inputStyle}><option>CLO</option><option>PLO</option><option>GA</option><option>PEO</option></select></FormField>
                <FormField label="Historical Avg (%)"><input name="historicalAvg" type="number" value={form.historicalAvg} onChange={h} style={inputStyle} min={0} max={100} /></FormField>
                <FormField label="Current Trend"><select name="currentTrend" value={form.currentTrend} onChange={h} style={inputStyle}><option>Improving</option><option>Stable</option><option>Declining</option></select></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const AiPerformanceForecastForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ department: 'Computer Science', semester: 'Semester 5', forecastHorizon: '2 Semesters' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Department"><input name="department" value={form.department} onChange={h} style={inputStyle} /></FormField>
                <FormField label="Forecast Horizon"><select name="forecastHorizon" value={form.forecastHorizon} onChange={h} style={inputStyle}><option>1 Semester</option><option>2 Semesters</option><option>1 Year</option></select></FormField>
                <FormField label="Current Semester"><input name="semester" value={form.semester} onChange={h} style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

const AiAccreditationScoreForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ program: 'BS CS', cloAchievement: 74, ploAchievement: 70, gaAchievement: 78, peoAchievement: 82, cqiActions: 5 });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Program"><input name="program" value={form.program} onChange={h} style={inputStyle} /></FormField>
                <FormField label="CLO Achievement (%)"><input name="cloAchievement" type="number" value={form.cloAchievement} onChange={h} style={inputStyle} min={0} max={100} /></FormField>
                <FormField label="PLO Achievement (%)"><input name="ploAchievement" type="number" value={form.ploAchievement} onChange={h} style={inputStyle} min={0} max={100} /></FormField>
                <FormField label="GA Achievement (%)"><input name="gaAchievement" type="number" value={form.gaAchievement} onChange={h} style={inputStyle} min={0} max={100} /></FormField>
                <FormField label="PEO Achievement (%)"><input name="peoAchievement" type="number" value={form.peoAchievement} onChange={h} style={inputStyle} min={0} max={100} /></FormField>
                <FormField label="CQI Actions Completed"><input name="cqiActions" type="number" value={form.cqiActions} onChange={h} style={inputStyle} min={0} /></FormField>
            </div>
            <SubmitBtn loading={loading} />
        </form>
    );
};

// ════════════════════════════════════════════════════════════
// TEACHING AI FORM COMPONENTS
// ════════════════════════════════════════════════════════════

const LectureNotesForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ topic: '', course: '', week: 1, clos: '', btLevel: 'Apply' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Topic *"><input name="topic" required value={form.topic} onChange={h} placeholder="e.g. Binary Search Trees" style={inputStyle} /></FormField>
                <FormField label="Course"><input name="course" value={form.course} onChange={h} placeholder="e.g. Data Structures" style={inputStyle} /></FormField>
                <FormField label="Week Number"><input name="week" type="number" value={form.week} onChange={h} style={inputStyle} min={1} max={18} /></FormField>
                <FormField label="Bloom's Level">
                    <select name="btLevel" value={form.btLevel} onChange={h} style={inputStyle}>
                        {BLOOMS.map(b => <option key={b}>{b}</option>)}
                    </select>
                </FormField>
                <FormField label="CLOs Addressed (comma-separated)"><input name="clos" value={form.clos} onChange={h} placeholder="e.g. CLO1, CLO2" style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} label="Generate Lecture Notes" />
        </form>
    );
};

const PPTOutlineForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ topic: '', course: '', slides: 12, audience: 'Undergraduate Students' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Topic *"><input name="topic" required value={form.topic} onChange={h} placeholder="e.g. Operating System Concepts" style={inputStyle} /></FormField>
                <FormField label="Course"><input name="course" value={form.course} onChange={h} placeholder="e.g. Operating Systems" style={inputStyle} /></FormField>
                <FormField label="Number of Slides"><input name="slides" type="number" value={form.slides} onChange={h} style={inputStyle} min={5} max={30} /></FormField>
                <FormField label="Audience">
                    <select name="audience" value={form.audience} onChange={h} style={inputStyle}>
                        <option>Undergraduate Students</option>
                        <option>Graduate Students</option>
                        <option>Faculty</option>
                    </select>
                </FormField>
            </div>
            <SubmitBtn loading={loading} label="Generate PPT Outline" />
        </form>
    );
};

const QuizGeneratorForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ topic: '', course: '', count: 5, questionType: 'MCQ', marks: 1, btLevel: 'Understand' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Topic *"><input name="topic" required value={form.topic} onChange={h} placeholder="e.g. Inheritance in OOP" style={inputStyle} /></FormField>
                <FormField label="Course"><input name="course" value={form.course} onChange={h} placeholder="e.g. Object Oriented Programming" style={inputStyle} /></FormField>
                <FormField label="Question Type">
                    <select name="questionType" value={form.questionType} onChange={h} style={inputStyle}>
                        {Q_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </FormField>
                <FormField label="Bloom's Level">
                    <select name="btLevel" value={form.btLevel} onChange={h} style={inputStyle}>
                        {BLOOMS.map(b => <option key={b}>{b}</option>)}
                    </select>
                </FormField>
                <FormField label="Number of Questions"><input name="count" type="number" value={form.count} onChange={h} style={inputStyle} min={1} max={30} /></FormField>
                <FormField label="Marks Per Question"><input name="marks" type="number" value={form.marks} onChange={h} style={inputStyle} min={1} max={20} /></FormField>
            </div>
            <SubmitBtn loading={loading} label="Generate Quiz" />
        </form>
    );
};

const AssignmentForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ topic: '', course: '', totalMarks: 20, deadline: '1 Week', clos: '' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Topic *"><input name="topic" required value={form.topic} onChange={h} placeholder="e.g. Database Normalization" style={inputStyle} /></FormField>
                <FormField label="Course"><input name="course" value={form.course} onChange={h} placeholder="e.g. Database Systems" style={inputStyle} /></FormField>
                <FormField label="Total Marks"><input name="totalMarks" type="number" value={form.totalMarks} onChange={h} style={inputStyle} min={5} max={100} /></FormField>
                <FormField label="Deadline">
                    <select name="deadline" value={form.deadline} onChange={h} style={inputStyle}>
                        <option>3 Days</option><option>1 Week</option><option>2 Weeks</option><option>1 Month</option>
                    </select>
                </FormField>
                <FormField label="CLOs (comma-separated)"><input name="clos" value={form.clos} onChange={h} placeholder="e.g. CLO1, CLO3" style={inputStyle} /></FormField>
            </div>
            <SubmitBtn loading={loading} label="Generate Assignment" />
        </form>
    );
};

const ProgrammingQuestionForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ topic: '', language: 'Python', difficulty: 'Medium', marks: 10, btLevel: 'Apply' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Topic *"><input name="topic" required value={form.topic} onChange={h} placeholder="e.g. Linked List Traversal" style={inputStyle} /></FormField>
                <FormField label="Programming Language">
                    <select name="language" value={form.language} onChange={h} style={inputStyle}>
                        <option>Python</option><option>Java</option><option>C++</option><option>C</option><option>JavaScript</option>
                    </select>
                </FormField>
                <FormField label="Difficulty">
                    <select name="difficulty" value={form.difficulty} onChange={h} style={inputStyle}>
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                </FormField>
                <FormField label="Bloom's Level">
                    <select name="btLevel" value={form.btLevel} onChange={h} style={inputStyle}>
                        {BLOOMS.map(b => <option key={b}>{b}</option>)}
                    </select>
                </FormField>
                <FormField label="Marks"><input name="marks" type="number" value={form.marks} onChange={h} style={inputStyle} min={1} max={50} /></FormField>
            </div>
            <SubmitBtn loading={loading} label="Generate Programming Question" />
        </form>
    );
};

const LabManualForm = ({ onSubmit, loading }) => {
    const [form, setForm] = useState({ labTitle: '', course: '', week: 1, objectives: '' });
    const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    return (
        <form className="modal-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormField label="Lab Title *"><input name="labTitle" required value={form.labTitle} onChange={h} placeholder="e.g. Introduction to Python Basics" style={inputStyle} /></FormField>
                <FormField label="Course"><input name="course" value={form.course} onChange={h} placeholder="e.g. Programming Fundamentals" style={inputStyle} /></FormField>
                <FormField label="Lab Number / Week"><input name="week" type="number" value={form.week} onChange={h} style={inputStyle} min={1} max={18} /></FormField>
            </div>
            <FormField label="Objectives">
                <textarea name="objectives" value={form.objectives} onChange={h} rows={2} placeholder="e.g. To understand variables, loops and functions in Python" style={{ ...inputStyle, resize: 'vertical' }} />
            </FormField>
            <SubmitBtn loading={loading} label="Generate Lab Manual" />
        </form>
    );
};

const ACTION_MAP = {
    generateQuestion:         aiGenerateQuestion,
    suggestCLOs:              aiSuggestCLOs,
    suggestPLOs:              aiSuggestPLOs,
    detectBTLevel:            aiDetectBTLevel,
    suggestActionVerbs:       aiSuggestActionVerbs,
    generateBlueprint:        aiGenerateBlueprint,
    generateRubric:           aiGenerateRubric,
    analyzeDifficulty:        aiAnalyzeDifficulty,
    detectDuplicate:          aiDetectDuplicate,
    predictAttendance:        aiPredictAttendance,
    detectAtRisk:             aiDetectAtRisk,
    predictGrade:             aiPredictGrade,
    predictGPA:               aiPredictGPA,
    analyzePerformance:       aiAnalyzePerformance,
    studentRecommendations:   aiStudentRecommendations,
    // OBE AI — dispatched through the generic aiAnalyzePerformance thunk with a 'type' discriminator
    aiGapAnalysis:            (p) => aiAnalyzePerformance({ ...p, requestType: 'gapAnalysis' }),
    aiWeakCLO:                (p) => aiAnalyzePerformance({ ...p, requestType: 'weakCLO' }),
    aiWeakPLO:                (p) => aiAnalyzePerformance({ ...p, requestType: 'weakPLO' }),
    aiImprovementSuggestions: (p) => aiStudentRecommendations({ ...p, requestType: 'improvement' }),
    aiCQISuggestions:         (p) => aiStudentRecommendations({ ...p, requestType: 'cqi' }),
    aiTargetPrediction:       (p) => aiPredictGPA({ ...p, requestType: 'targetPrediction' }),
    aiPerformanceForecast:    (p) => aiAnalyzePerformance({ ...p, requestType: 'forecast' }),
    aiAccreditationScore:     (p) => aiAnalyzePerformance({ ...p, requestType: 'accreditation' }),
    // Management AI
    aiSurveyAnalysis:         (p) => aiSurveyAnalysis(p),
    aiSentimentAnalysis:      (p) => aiSentimentAnalysis(p),
    aiNotificationSuggestions:(p) => aiNotificationSuggestions(p),
    aiWorkflowDelay:          (p) => aiWorkflowDelay(p),
    aiAutoReminder:           (p) => aiAutoReminder(p),
    aiQualityScore:           (p) => aiQualityScore(p),
    aiQECRecommendations:     (p) => aiQECRecommendations(p),
    aiAccreditationChecklist: (p) => aiAccreditationChecklist(p),
    // Teaching AI
    generateLectureNotes:        aiGenerateLectureNotes,
    generatePPTOutline:          aiGeneratePPTOutline,
    generateQuiz:                aiGenerateQuiz,
    generateAssignment:          aiGenerateAssignment,
    generateProgrammingQuestion: aiGenerateProgrammingQuestion,
    generateLabManual:           aiGenerateLabManual,
};

const AIFeatures = () => {
    const dispatch = useDispatch();
    const { loading, result, error, feature } = useSelector(s => s.ai);
    const [activeFeature, setActiveFeature] = useState('generateQuestion');
    const [copied, setCopied] = useState(false);

    const handleSelect = (id) => {
        setActiveFeature(id);
        dispatch(clearAI());
    };

    const handleSubmit = (payload) => {
        dispatch(ACTION_MAP[activeFeature](payload));
    };

    const activeMeta = FEATURES.find(f => f.id === activeFeature);

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.8rem' }}>
                    <Sparkles size={28} color="#0ff0fc" style={{ filter: 'drop-shadow(0 0 8px #0ff0fc)' }} /> AI Features Suite
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>Powered by Google Gemini 1.5 Flash — AI-assisted OBE tools for smarter academic workflows.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Sidebar with grouped features */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {['Academic', 'Student', 'OBE', 'Teaching', 'Management'].map(group => {
                        const groupFeatures = FEATURES.filter(f => f.group === group);
                        if (!groupFeatures.length) return null;
                        const groupColors = { Academic: '#0ff0fc', Student: '#50cc7f', OBE: '#bc13fe', Teaching: '#ffc107', Management: '#ff1b6b' };
                        return (
                            <div key={group}>
                                <div style={{ color: groupColors[group], fontSize: '0.68rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 8px 4px', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>{group}</div>
                                {groupFeatures.map(f => (
                                    <button key={f.id} onClick={() => handleSelect(f.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', width: '100%', background: activeFeature === f.id ? `${f.color}15` : 'transparent', border: activeFeature === f.id ? `1px solid ${f.color}40` : '1px solid transparent', borderRadius: '8px', color: activeFeature === f.id ? f.color : 'rgba(255,255,255,0.65)', cursor: 'pointer', textAlign: 'left', fontWeight: activeFeature === f.id ? '600' : '400', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{f.icon}</span> {f.label}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* Main Panel */}
                <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                        <span style={{ fontSize: '1.8rem' }}>{activeMeta?.icon}</span>
                        <div>
                            <h3 style={{ margin: 0, color: activeMeta?.color }}>{activeMeta?.label}</h3>
                            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Fill in the form and click Generate to call the Gemini API</p>
                        </div>
                        {(result || error) && (
                            <button onClick={() => { dispatch(clearAI()); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
                        )}
                    </div>

                    {/* Form */}
                    {FORM_MAP[activeFeature]?.({ onSubmit: handleSubmit, loading })}

                    {/* Error */}
                    {error && (
                        <div style={{ marginTop: '1rem', padding: '12px 16px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', borderRadius: '10px', color: '#ff1b6b', fontSize: '0.9rem' }}>
                            ❌ {error}
                        </div>
                    )}

                    {/* Result */}
                    <ResultPanel result={result} feature={feature} onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }} />
                    {copied && <div style={{ marginTop: '8px', color: '#50cc7f', fontSize: '0.85rem', textAlign: 'right' }}>✅ Copied to clipboard!</div>}
                </div>
            </div>

            {/* Info Card */}
            <div className="glass-panel-dash" style={{ marginTop: '1.5rem', borderRadius: '12px', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(255,152,0,0.2)', background: 'rgba(255,152,0,0.03)' }}>
                <Brain size={28} color="#ff9800" style={{ flexShrink: 0 }} />
                <div>
                    <div style={{ color: '#ff9800', fontWeight: '600', marginBottom: '3px' }}>⚙️ Setup Required</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                        Add your Gemini API key to <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#0ff0fc' }}>server/.env</code> as <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#0ff0fc' }}>GEMINI_API_KEY</code>. Get your free key at&nbsp;
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#0ff0fc' }}>aistudio.google.com</a>.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIFeatures;
