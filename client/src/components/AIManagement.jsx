import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAiStats } from '../store/logsSlice';
import { updateSettingsCategory, fetchSettings } from '../store/settingsSlice';
import {
    Bot, Cpu, ToggleLeft, ToggleRight, Activity, Zap, AlertTriangle,
    CheckCircle, Settings, BarChart2, Brain, FileText, BookOpen, Target,
    ClipboardList, TrendingDown, PieChart, Globe, ChevronDown, RefreshCw
} from 'lucide-react';
import '../style/Dashboard.css';

const AI_MODULES_BASE = [
    { id: 'Q_GEN', label: 'AI Question Generator', icon: BookOpen },
    { id: 'CLO_GEN', label: 'AI CLO Generator', icon: Target },
    { id: 'PLO_GEN', label: 'AI PLO Generator', icon: Target },
    { id: 'BT_SUGGEST', label: 'AI BT Suggestion', icon: Brain },
    { id: 'RUBRIC_GEN', label: 'AI Rubric Generator', icon: ClipboardList },
    { id: 'BLUEPRINT_GEN', label: 'AI Blueprint Generator', icon: FileText },
    { id: 'GAP_ANALYSIS', label: 'AI Gap Analysis', icon: TrendingDown },
    { id: 'CLOSING_LOOP', label: 'AI Closing the Loop', icon: Activity },
    { id: 'SURVEY_ANALYSIS', label: 'AI Survey Analysis', icon: PieChart },
    { id: 'PERF_PREDICT', label: 'AI Performance Prediction', icon: BarChart2 },
    { id: 'AT_RISK', label: 'AI At-Risk Detection', icon: AlertTriangle },
    { id: 'EXEC_SUMMARY', label: 'AI Executive Summary', icon: FileText },
];

const AI_MODELS = ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'GPT-4o', 'GPT-4o Mini', 'Claude Sonnet'];
const AI_LANGUAGES = ['English', 'Urdu', 'Arabic', 'French'];

const AIManagement = () => {
    const dispatch = useDispatch();
    const { total, success, errors, byModule, loading: statsLoading } = useSelector(s => s.logs.aiStats);
    const { config: settings, loading: settingsLoading } = useSelector(s => s.settings);

    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Local state for settings to avoid flicker
    const [aiEnabled, setAiEnabled] = useState(true);
    const [aiModel, setAiModel] = useState(AI_MODELS[0]);
    const [aiLang, setAiLang] = useState(AI_LANGUAGES[0]);
    const [usageLimit, setUsageLimit] = useState(5000);
    const [disabledModules, setDisabledModules] = useState([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        dispatch(fetchAiStats());
        dispatch(fetchSettings());
    }, [dispatch]);

    // Sync settings from redux to local state
    useEffect(() => {
        if (settings?.ai) {
            setAiEnabled(settings.ai.enabled ?? true);
            setAiModel(settings.ai.defaultModel || AI_MODELS[0]);
            setAiLang(settings.ai.responseLanguage || AI_LANGUAGES[0]);
            setUsageLimit(settings.ai.monthlyLimit || 5000);
            setDisabledModules(settings.ai.disabledModules || []);
        }
    }, [settings]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        const data = {
            enabled: aiEnabled,
            defaultModel: aiModel,
            responseLanguage: aiLang,
            monthlyLimit: usageLimit,
            disabledModules
        };
        const res = await dispatch(updateSettingsCategory({ category: 'ai', data }));
        setIsSaving(false);
        if (!res.error) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const toggleModule = async (id) => {
        let newDisabled = [...disabledModules];
        if (newDisabled.includes(id)) {
            newDisabled = newDisabled.filter(m => m !== id);
        } else {
            newDisabled.push(id);
        }
        setDisabledModules(newDisabled);
        
        // Auto-save module toggles immediately
        const data = {
            enabled: aiEnabled,
            defaultModel: aiModel,
            responseLanguage: aiLang,
            monthlyLimit: usageLimit,
            disabledModules: newDisabled
        };
        dispatch(updateSettingsCategory({ category: 'ai', data }));
    };

    const TABS = [
        { id: 'dashboard', label: 'AI Dashboard', icon: BarChart2 },
        { id: 'modules', label: 'AI Modules', icon: Brain },
        { id: 'settings', label: 'AI Settings', icon: Settings },
    ];

    const STAT_CARDS = [
        { label: 'Total AI Requests', value: total.toLocaleString(), icon: Cpu, color: '#0ff0fc', change: 'Lifetime usage' },
        { label: 'Successful Responses', value: success.toLocaleString(), icon: CheckCircle, color: '#50cc7f', change: `${total > 0 ? ((success/total)*100).toFixed(1) : 0}% success rate` },
        { label: 'AI Errors', value: errors.toLocaleString(), icon: AlertTriangle, color: '#ff1b6b', change: 'Failed API calls' },
        { label: 'Monthly Limit', value: `${((total/usageLimit)*100).toFixed(1)}%`, icon: Zap, color: '#ffcc00', change: `${total} / ${usageLimit} used` },
    ];

    // Combine base modules with stats and disabled state
    const modulesData = AI_MODULES_BASE.map(m => {
        const stat = byModule.find(b => b._id === m.id);
        return {
            ...m,
            status: !disabledModules.includes(m.id),
            requests: stat ? stat.count : 0
        };
    });

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Bot size={28} color="#bc13fe" />
                        AI Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        University-level control over all AI features and usage.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: aiEnabled ? '#50cc7f' : '#ff1b6b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        AI: {aiEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button onClick={() => { setAiEnabled(!aiEnabled); handleSaveSettings(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {aiEnabled ? <ToggleRight size={36} color="#50cc7f" /> : <ToggleLeft size={36} color="#ff1b6b" />}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s', background: activeTab === tab.id ? 'rgba(188,19,254,0.15)' : 'transparent', color: activeTab === tab.id ? '#bc13fe' : 'rgba(255,255,255,0.5)' }}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        {STAT_CARDS.map(card => (
                            <div key={card.label} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <card.icon size={22} color={card.color} />
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{statsLoading ? '...' : card.value}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '6px' }}>{card.label}</div>
                                <div style={{ color: card.color, fontSize: '0.75rem', marginTop: '8px' }}>{card.change}</div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 20px', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
                            Usage by Module
                            <button onClick={() => dispatch(fetchAiStats())} style={{ background: 'none', border: 'none', color: '#0ff0fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                                <RefreshCw size={14} /> Refresh Stats
                            </button>
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {modulesData.sort((a,b) => b.requests - a.requests).filter(m => m.requests > 0).map(m => {
                                const maxReq = Math.max(...modulesData.map(x => x.requests), 1);
                                const pct = (m.requests / maxReq) * 100;
                                return (
                                    <div key={m.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}><m.icon size={14} color="#bc13fe" />{m.label}</span>
                                            <span style={{ color: '#bc13fe', fontSize: '0.85rem', fontWeight: 'bold' }}>{m.requests.toLocaleString()} req</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#bc13fe,#0ff0fc)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {total === 0 && !statsLoading && (
                                <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>No AI usage recorded yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODULES */}
            {activeTab === 'modules' && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {modulesData.map(m => (
                        <div key={m.id} className="glass-panel-dash" style={{ borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: m.status ? '1px solid rgba(188,19,254,0.3)' : '1px solid rgba(255,255,255,0.05)', opacity: m.status ? 1 : 0.6, transition: 'all 0.3s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: m.status ? 'rgba(188,19,254,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <m.icon size={20} color={m.status ? '#bc13fe' : 'rgba(255,255,255,0.3)'} />
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{m.label}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{m.requests} total requests</div>
                                </div>
                            </div>
                            <button onClick={() => toggleModule(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                {m.status ? <ToggleRight size={32} color="#50cc7f" /> : <ToggleLeft size={32} color="rgba(255,255,255,0.2)" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
                <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '28px', maxWidth: '700px' }}>
                    <h3 style={{ margin: '0 0 24px', color: '#bc13fe', display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={20} />AI Configuration</h3>

                    {saveSuccess && (
                        <div style={{ padding: '12px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', color: '#50cc7f', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle size={16} /> AI Settings saved successfully!
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                            <div>
                                <div style={{ color: '#fff', fontWeight: 'bold' }}>Enable / Disable AI</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Globally enable or disable all AI features.</div>
                            </div>
                            <button onClick={() => setAiEnabled(!aiEnabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                {aiEnabled ? <ToggleRight size={36} color="#50cc7f" /> : <ToggleLeft size={36} color="#ff1b6b" />}
                            </button>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>Default AI Model</label>
                            <div style={{ position: 'relative' }}>
                                <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ width: '100%', padding: '14px 40px 14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', appearance: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                                    {AI_MODELS.map(m => <option key={m}>{m}</option>)}
                                </select>
                                <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>AI Monthly Usage Limit (Requests)</label>
                            <input type="number" value={usageLimit} onChange={e => setUsageLimit(Number(e.target.value))} min={100} style={{ width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }} />
                            <div style={{ marginTop: '10px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (total / usageLimit) * 100)}%`, background: 'linear-gradient(90deg,#50cc7f,#ffcc00)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '6px' }}>{total} / {usageLimit.toLocaleString()} used this month</div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>AI Response Language</label>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {AI_LANGUAGES.map(lang => (
                                    <button key={lang} onClick={() => setAiLang(lang)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '8px', border: aiLang === lang ? '1px solid #bc13fe' : '1px solid rgba(255,255,255,0.1)', background: aiLang === lang ? 'rgba(188,19,254,0.15)' : 'rgba(255,255,255,0.03)', color: aiLang === lang ? '#bc13fe' : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 'bold' }}>
                                        <Globe size={14} /> {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSaveSettings} disabled={isSaving} className="primary-btn">
                            {isSaving ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save AI Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIManagement;
