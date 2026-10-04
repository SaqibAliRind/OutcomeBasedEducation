import React, { useState, useMemo } from 'react';
import { Brain, Search, ChevronDown, ChevronRight, BookOpen, Zap, BarChart2, Eye, Star, Layers, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

// ── Static BT Data (fixed levels, configurable verbs) ─────────────────────
const BT_META = [
  {
    level: 1, code: 'BT1', name: 'Remember', color: '#ff5757', bg: 'rgba(255,87,87,0.12)', border: 'rgba(255,87,87,0.3)',
    description: 'Retrieve, recall, or recognize relevant knowledge from long-term memory.',
    icon: Brain,
    defaultVerbs: ['Define', 'Identify', 'Recall', 'List', 'Name', 'Label', 'State', 'Match', 'Memorize', 'Repeat']
  },
  {
    level: 2, code: 'BT2', name: 'Understand', color: '#ffc107', bg: 'rgba(255,193,7,0.12)', border: 'rgba(255,193,7,0.3)',
    description: 'Construct meaning from oral, written, and graphic messages through interpreting, exemplifying, classifying, summarizing, inferring, comparing, and explaining.',
    icon: BookOpen,
    defaultVerbs: ['Explain', 'Describe', 'Discuss', 'Summarize', 'Compare', 'Interpret', 'Classify', 'Paraphrase', 'Illustrate', 'Infer']
  },
  {
    level: 3, code: 'BT3', name: 'Apply', color: '#50cc7f', bg: 'rgba(80,204,127,0.12)', border: 'rgba(80,204,127,0.3)',
    description: 'Carry out or use a procedure in a given situation.',
    icon: Zap,
    defaultVerbs: ['Apply', 'Solve', 'Use', 'Demonstrate', 'Implement', 'Execute', 'Calculate', 'Operate', 'Produce', 'Compute']
  },
  {
    level: 4, code: 'BT4', name: 'Analyze', color: '#0ff0fc', bg: 'rgba(15,240,252,0.12)', border: 'rgba(15,240,252,0.3)',
    description: 'Break material into constituent parts, determine how the parts relate to one another and to an overall structure or purpose.',
    icon: BarChart2,
    defaultVerbs: ['Analyze', 'Differentiate', 'Investigate', 'Organize', 'Examine', 'Compare', 'Deconstruct', 'Outline', 'Structure', 'Attribute']
  },
  {
    level: 5, code: 'BT5', name: 'Evaluate', color: '#bc13fe', bg: 'rgba(188,19,254,0.12)', border: 'rgba(188,19,254,0.3)',
    description: 'Make judgments based on criteria and standards through checking and critiquing.',
    icon: Star,
    defaultVerbs: ['Evaluate', 'Judge', 'Critique', 'Justify', 'Assess', 'Argue', 'Defend', 'Prioritize', 'Appraise', 'Recommend']
  },
  {
    level: 6, code: 'BT6', name: 'Create', color: '#ff1b6b', bg: 'rgba(255,27,107,0.12)', border: 'rgba(255,27,107,0.3)',
    description: 'Put elements together to form a coherent or functional whole; reorganize elements into a new pattern or structure.',
    icon: Layers,
    defaultVerbs: ['Create', 'Design', 'Develop', 'Construct', 'Generate', 'Plan', 'Produce', 'Formulate', 'Compose', 'Invent']
  },
];

const DOMAINS = [
  { name: 'Cognitive',    color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)',  desc: 'Knowledge & intellectual skills' },
  { name: 'Psychomotor', color: '#50cc7f', bg: 'rgba(80,204,127,0.1)',  desc: 'Physical/manual skills' },
  { name: 'Affective',   color: '#ffc107', bg: 'rgba(255,193,7,0.1)',   desc: 'Attitudes & feelings' },
];

const BloomsTaxonomy = () => {
  const [search, setSearch] = useState('');
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [activeView, setActiveView] = useState('levels'); // 'levels' | 'pyramid' | 'domains'

  // Local verb state (per-level, starts from defaults)
  const [verbsMap, setVerbsMap] = useState(() =>
    Object.fromEntries(BT_META.map(bt => [bt.code, [...bt.defaultVerbs]]))
  );
  const [editingVerb, setEditingVerb] = useState(null); // { code, index }
  const [editingVerbValue, setEditingVerbValue] = useState('');
  const [newVerbInput, setNewVerbInput] = useState({}); // { [btCode]: string }
  const [showAddVerb, setShowAddVerb] = useState({}); // { [btCode]: bool }

  const addVerb = (code) => {
    const verb = (newVerbInput[code] || '').trim();
    if (!verb) return;
    setVerbsMap(prev => ({ ...prev, [code]: [...prev[code], verb] }));
    setNewVerbInput(prev => ({ ...prev, [code]: '' }));
    setShowAddVerb(prev => ({ ...prev, [code]: false }));
  };

  const removeVerb = (code, index) => {
    setVerbsMap(prev => ({ ...prev, [code]: prev[code].filter((_, i) => i !== index) }));
  };

  const startEditVerb = (code, index) => {
    setEditingVerb({ code, index });
    setEditingVerbValue(verbsMap[code][index]);
  };

  const saveEditVerb = () => {
    if (!editingVerb) return;
    const { code, index } = editingVerb;
    setVerbsMap(prev => {
      const updated = [...prev[code]];
      updated[index] = editingVerbValue.trim() || updated[index];
      return { ...prev, [code]: updated };
    });
    setEditingVerb(null);
  };

  const filtered = useMemo(() =>
    BT_META.filter(bt =>
      bt.name.toLowerCase().includes(search.toLowerCase()) ||
      bt.code.toLowerCase().includes(search.toLowerCase()) ||
      verbsMap[bt.code].some(v => v.toLowerCase().includes(search.toLowerCase()))
    ),
    [search, verbsMap]
  );

  const VIEWS = [
    { id: 'levels',  label: 'BT Levels & Verbs', icon: BookOpen },
    { id: 'pyramid', label: 'Pyramid View',       icon: Layers },
    { id: 'domains', label: 'Learning Domains',   icon: Brain },
  ];

  return (
    <div className="">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={24} /> Bloom's Taxonomy (BT)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>
            6-level cognitive framework for writing measurable CLOs and PLOs.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '22px' }}>
        {BT_META.map(bt => (
          <div key={bt.code} className="glass-panel-dash"
            style={{ padding: '12px', textAlign: 'center', border: `1px solid ${bt.border}`, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { setActiveView('levels'); setExpandedLevel(bt.code === expandedLevel ? null : bt.code); }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: bt.color }}>{bt.level}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>{bt.code}</div>
            <div style={{ fontSize: '0.72rem', color: bt.color, marginTop: 2 }}>{bt.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{verbsMap[bt.code].length} verbs</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '9px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
            background: activeView === v.id ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeView === v.id ? '#0ff0fc' : 'rgba(255,255,255,0.5)',
            borderBottom: activeView === v.id ? '2px solid #0ff0fc' : '2px solid transparent',
          }}>
            <v.icon size={15} /> {v.label}
          </button>
        ))}
      </div>

      {/* ── VIEW 1: Levels & Verbs ── */}
      {activeView === 'levels' && (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input className="search-input" placeholder="Search levels or action verbs..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, width: '100%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(bt => {
              const isExpanded = expandedLevel === bt.code;
              const Icon = bt.icon;
              return (
                <div key={bt.code} className="glass-panel-dash" style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${isExpanded ? bt.border : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.3s' }}>
                  {/* Level Header */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px', cursor: 'pointer', background: isExpanded ? bt.bg : 'transparent', transition: 'all 0.2s' }}
                    onClick={() => setExpandedLevel(isExpanded ? null : bt.code)}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: '12px', background: bt.bg, border: `2px solid ${bt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={22} color={bt.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 4 }}>
                        <span style={{ background: bt.bg, color: bt.color, border: `1px solid ${bt.border}`, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {bt.code} · Level {bt.level}
                        </span>
                        <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{bt.name}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{bt.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', color: '#ddd' }}>
                        {verbsMap[bt.code].length} Action Verbs
                      </span>
                      {isExpanded ? <ChevronDown size={18} color={bt.color} /> : <ChevronRight size={18} color="rgba(255,255,255,0.4)" />}
                    </div>
                  </div>

                  {/* Expanded Verb Panel */}
                  {isExpanded && (
                    <div style={{ padding: '20px 22px', borderTop: `1px solid ${bt.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 style={{ margin: 0, color: bt.color, fontSize: '0.9rem' }}>Action Verbs for {bt.name}</h4>
                        <button
                          onClick={() => setShowAddVerb(prev => ({ ...prev, [bt.code]: !prev[bt.code] }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: bt.bg, color: bt.color, border: `1px solid ${bt.border}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Plus size={14} /> Add Verb
                        </button>
                      </div>

                      {/* Add new verb input */}
                      {showAddVerb[bt.code] && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <input
                            className="search-input"
                            placeholder="New action verb..."
                            value={newVerbInput[bt.code] || ''}
                            onChange={e => setNewVerbInput(prev => ({ ...prev, [bt.code]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && addVerb(bt.code)}
                            style={{ flex: 1, padding: '8px 12px' }}
                            autoFocus
                          />
                          <button onClick={() => addVerb(bt.code)}
                            style={{ background: bt.bg, color: bt.color, border: `1px solid ${bt.border}`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                            <Check size={16} />
                          </button>
                          <button onClick={() => setShowAddVerb(prev => ({ ...prev, [bt.code]: false }))}
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                            <X size={16} />
                          </button>
                        </div>
                      )}

                      {/* Verb chips grid */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {verbsMap[bt.code].map((verb, idx) => (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: bt.bg, border: `1px solid ${bt.border}`,
                            borderRadius: '24px', padding: '6px 14px', transition: 'all 0.2s'
                          }}>
                            {editingVerb?.code === bt.code && editingVerb?.index === idx ? (
                              <>
                                <input
                                  value={editingVerbValue}
                                  onChange={e => setEditingVerbValue(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && saveEditVerb()}
                                  style={{ background: 'transparent', border: 'none', outline: 'none', color: bt.color, fontWeight: 700, fontSize: '0.82rem', width: `${editingVerbValue.length + 2}ch` }}
                                  autoFocus
                                />
                                <button onClick={saveEditVerb} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: bt.color }}><Check size={12} /></button>
                                <button onClick={() => setEditingVerb(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.4)' }}><X size={12} /></button>
                              </>
                            ) : (
                              <>
                                <span style={{ color: bt.color, fontWeight: 700, fontSize: '0.85rem' }}>{verb}</span>
                                <button onClick={() => startEditVerb(bt.code, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.3)', opacity: 0, transition: 'opacity 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                                  <Edit2 size={11} />
                                </button>
                                <button onClick={() => removeVerb(bt.code, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,87,87,0.5)', opacity: 0, transition: 'opacity 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                                  <X size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        {verbsMap[bt.code].length === 0 && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontStyle: 'italic' }}>No verbs yet. Click "Add Verb" to start.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── VIEW 2: Pyramid ── */}
      {activeView === 'pyramid' && (
        <div className="glass-panel-dash" style={{ padding: '2.5rem', borderRadius: '16px' }}>
          <h3 style={{ margin: '0 0 2rem', color: '#fff', textAlign: 'center' }}>Bloom's Taxonomy Pyramid</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', maxWidth: '700px', margin: '0 auto' }}>
            {[...BT_META].reverse().map((bt, i) => {
              const width = `${40 + (i * 10)}%`;
              const Icon = bt.icon;
              return (
                <div key={bt.code} style={{
                  width, padding: '14px 24px', borderRadius: '10px',
                  background: bt.bg, border: `1px solid ${bt.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s', cursor: 'default',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={20} color={bt.color} />
                    <div>
                      <strong style={{ color: bt.color, fontSize: '0.95rem' }}>{bt.code} — {bt.name}</strong>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                        {verbsMap[bt.code].slice(0, 5).map(v => (
                          <span key={v} style={{ background: 'rgba(255,255,255,0.08)', color: '#ddd', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>{v}</span>
                        ))}
                        {verbsMap[bt.code].length > 5 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{verbsMap[bt.code].length - 5} more</span>}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.8rem', color: bt.color, opacity: 0.5 }}>L{bt.level}</span>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
            Lower levels (BT1–BT3) = Lower Order Thinking Skills (LOTS) &nbsp;|&nbsp; Higher levels (BT4–BT6) = Higher Order Thinking Skills (HOTS)
          </p>
        </div>
      )}

      {/* ── VIEW 3: Domains ── */}
      {activeView === 'domains' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {DOMAINS.map(domain => (
              <div key={domain.name} className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px', border: `1px solid rgba(255,255,255,0.1)` }}>
                <h3 style={{ margin: '0 0 8px', color: domain.color, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: domain.color }} />
                  {domain.name}
                </h3>
                <p style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{domain.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {BT_META.map(bt => (
                    <span key={bt.code} style={{ background: bt.bg, color: bt.color, border: `1px solid ${bt.border}`, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {bt.code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Full verb reference table */}
          <div className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: '14px' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#fff' }}>Complete Action Verb Reference</h3>
            <div className="table-container">
              <table className="glass-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Level</th>
                    {BT_META.map(bt => (
                      <th key={bt.code} style={{ color: bt.color, textAlign: 'center' }}>{bt.code}<br /><span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{bt.name}</span></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(...BT_META.map(bt => verbsMap[bt.code].length)) }).map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', fontWeight: 600 }}>Verb {rowIdx + 1}</td>
                      {BT_META.map(bt => (
                        <td key={bt.code} style={{ textAlign: 'center' }}>
                          {verbsMap[bt.code][rowIdx] ? (
                            <span style={{ background: bt.bg, color: bt.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${bt.border}` }}>
                              {verbsMap[bt.code][rowIdx]}
                            </span>
                          ) : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloomsTaxonomy;
