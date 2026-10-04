import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchGAs, createGA, updateGA, deleteGA,
  fetchPLOs, fetchCLOs, mapGAtoPLOs, bulkInitGAs, clearObeMessages 
} from '../store/obeSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Award, List, Eye, Link2, BookOpen, Zap, CheckCircle, GitBranch } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '9px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
        background: active === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active === tab.id ? '#ff9800' : 'rgba(255,255,255,0.5)',
        boxShadow: active === tab.id ? '0 0 16px rgba(255,152,0,0.12)' : 'none',
        borderBottom: active === tab.id ? '2px solid #ff9800' : '2px solid transparent',
      }}>
        <tab.icon size={15} /> {tab.label}
      </button>
    ))}
  </div>
);

const PREDEFINED_GAS = [
  { code: 'GA1',  name: 'Engineering / Computing Knowledge',      desc: 'Apply knowledge of mathematics, natural science, computing/engineering fundamentals and specialization to solve complex problems.' },
  { code: 'GA2',  name: 'Problem Analysis',                        desc: 'Identify, formulate, research literature, and analyze complex problems reaching substantiated conclusions.' },
  { code: 'GA3',  name: 'Design/Development of Solutions',         desc: 'Design solutions for complex problems and systems that meet specified needs with consideration for societal and environmental factors.' },
  { code: 'GA4',  name: 'Investigation',                           desc: 'Conduct investigations of complex problems using research-based knowledge including design of experiments, analysis and interpretation of data.' },
  { code: 'GA5',  name: 'Modern Tool Usage',                       desc: 'Create, select and apply appropriate techniques, resources, and modern engineering and IT tools to complex activities.' },
  { code: 'GA6',  name: 'The Engineer / Professional and Society',  desc: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal and cultural issues.' },
  { code: 'GA7',  name: 'Environment and Sustainability',          desc: 'Understand the impact of professional engineering/computing solutions in societal and environmental contexts.' },
  { code: 'GA8',  name: 'Ethics',                                  desc: 'Apply ethical principles and commit to professional ethics, responsibilities and norms of professional practice.' },
  { code: 'GA9',  name: 'Individual and Team Work',                desc: 'Function effectively as an individual, and as a member or leader in diverse teams and multi-disciplinary settings.' },
  { code: 'GA10', name: 'Communication',                           desc: 'Communicate effectively on complex activities with the engineering/computing community and with society at large.' },
  { code: 'GA11', name: 'Project Management & Finance',            desc: 'Demonstrate knowledge and understanding of engineering/computing and management principles and apply these to one\'s own work.' },
  { code: 'GA12', name: 'Lifelong Learning',                       desc: 'Recognize the need for, and engage in independent and life-long learning in the broadest context of technological change.' },
];

const GAManagement = () => {
  const dispatch = useDispatch();
  
  const { gas, plos, clos, loading, error, successMessage } = useSelector(state => state.obe);
  const { records } = useSelector(state => state.academic);
  const programs = records.programs || [];

  const [activeTab, setActiveTab]   = useState('list');
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);

  // Map PLO modal
  const [showMapPLOModal, setShowMapPLOModal] = useState(false);
  const [mappingGA, setMappingGA]   = useState(null);
  const [selectedPLOs, setSelectedPLOs] = useState([]);

  // View CLOs modal
  const [showCLOModal, setShowCLOModal] = useState(false);
  const [viewingGA, setViewingGA]   = useState(null);

  // Bulk init modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProgram, setBulkProgram] = useState('');

  const initialFormState = { code: '', name: '', description: '', program: '', status: 'Active' };
  const [formData, setFormData]     = useState(initialFormState);
  const pendingAction               = useRef(null);

  useEffect(() => {
    dispatch(fetchGAs());
    dispatch(fetchPLOs());
    dispatch(fetchCLOs());
    dispatch(fetchAcademicData('programs'));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setToast({ msg: pendingAction.current || successMessage, type: 'success' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearObeMessages());
      setFormData(initialFormState);
      setShowModal(false);
      setShowMapPLOModal(false);
      setShowBulkModal(false);
    }
    if (error) {
      setToast({ msg: error, type: 'error' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearObeMessages());
    }
  }, [successMessage, error, dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    pendingAction.current = editingId ? 'GA updated!' : 'GA created!';
    if (editingId) dispatch(updateGA({ id: editingId, payload: formData }));
    else dispatch(createGA(formData));
  };

  const handleEdit = (ga) => {
    setEditingId(ga._id);
    setFormData({ code: ga.code, name: ga.name, description: ga.description, program: ga.program?._id || '', status: ga.status });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this Graduate Attribute?')) {
      pendingAction.current = 'GA deleted!';
      dispatch(deleteGA(id));
    }
  };

  const handlePredefinedChange = (e) => {
    const selected = PREDEFINED_GAS.find(g => g.code === e.target.value);
    if (selected) setFormData(prev => ({ ...prev, code: selected.code, name: selected.name, description: selected.desc }));
  };

  // Map PLO modal handlers
  const openMapPLOModal = (ga) => {
    setMappingGA(ga);
    // Find which PLOs already include this GA
    const already = (plos || []).filter(p => (p.gas || []).some(g => g._id === ga._id || g === ga._id)).map(p => p._id);
    setSelectedPLOs(already);
    setShowMapPLOModal(true);
  };
  const togglePLO = (id) => setSelectedPLOs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSavePLOMapping = () => {
    pendingAction.current = 'GA mapped to PLOs!';
    dispatch(mapGAtoPLOs({ id: mappingGA._id, ploIds: selectedPLOs })).then(() => dispatch(fetchPLOs()));
  };

  // View CLOs linked via PLOs
  const openCLOModal = (ga) => {
    setViewingGA(ga);
    setShowCLOModal(true);
  };

  // Bulk init
  const handleBulkInit = () => {
    if (!bulkProgram) return;
    pendingAction.current = 'Standard GAs initialized!';
    dispatch(bulkInitGAs(bulkProgram));
  };

  const filtered = useMemo(() => (gas || []).filter(g =>
    (g.code?.toLowerCase().includes(search.toLowerCase()) || 
     g.name?.toLowerCase().includes(search.toLowerCase()) || 
     g.description?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterProgram || g.program?._id === filterProgram) &&
    (!filterStatus || g.status === filterStatus)
  ), [gas, search, filterProgram, filterStatus]);

  // GA → PLO mapping data for matrix tab
  const programPLOs = useMemo(() => mappingGA ? (plos || []).filter(p => p.program?._id === mappingGA.program?._id) : [], [plos, mappingGA]);

  // CLOs linked to a GA via PLOs
  const linkedCLOs = useMemo(() => {
    if (!viewingGA) return [];
    const gaLinkedPLOs = (plos || []).filter(p => (p.gas || []).some(g => g._id === viewingGA._id || g === viewingGA._id));
    const gaLinkedPLOIds = gaLinkedPLOs.map(p => p._id);
    return (clos || []).filter(c => (c.plos || []).some(p => gaLinkedPLOIds.includes(p._id || p)));
  }, [viewingGA, plos, clos]);

  // GA → PLO matrix data
  const matrixData = useMemo(() => programs.map(prog => {
    const progGAs  = (gas  || []).filter(g => g.program?._id === prog._id);
    const progPLOs = (plos || []).filter(p => p.program?._id === prog._id);
    return { program: prog, gas: progGAs, plos: progPLOs };
  }).filter(d => d.gas.length > 0 && d.plos.length > 0), [programs, gas, plos]);

  const TABS = [
    { id: 'list',    label: 'Manage GAs',       icon: List },
    { id: 'matrix',  label: 'GA → PLO Matrix',  icon: GitBranch },
    { id: 'summary', label: 'Program Summary',  icon: Eye },
  ];

  return (
    <div className="">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '10px', zIndex: 2000, color: '#fff', fontWeight: 600,
          background: toast.type === 'success' ? 'rgba(80,204,127,0.95)' : 'rgba(255,27,107,0.95)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ff9800', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={24} /> Graduate Attributes (GAs)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>Define and map the 12 standard Washington Accord Graduate Attributes.</p>
        </div>
        {activeTab === 'list' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="page-btn" onClick={() => setShowBulkModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,152,0,0.15)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)' }}>
              <Zap size={16} /> Init All 12 GAs
            </button>
            <button className="page-btn primary-btn" onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}>
              <Plus size={18} /> Add GA
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total GAs',    value: gas.length,                                           color: '#ff9800', bg: 'rgba(255,152,0,0.1)',    Icon: Award },
          { label: 'Active',       value: gas.filter(g => g.status === 'Active').length,         color: '#50cc7f', bg: 'rgba(80,204,127,0.1)',   Icon: CheckCircle },
          { label: 'Mapped PLOs',  value: (plos || []).filter(p => p.gas?.length > 0).length,   color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)',   Icon: Link2 },
          { label: 'Mapped CLOs',  value: (clos || []).filter(c => c.gas?.length > 0).length,   color: '#bc13fe', bg: 'rgba(188,19,254,0.1)',   Icon: BookOpen },
        ].map(s => (
          <div key={s.label} className="glass-panel-dash" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: s.bg, borderRadius: '50%', padding: '10px' }}><s.Icon size={20} color={s.color} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{s.value}</h3>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── TAB 1: LIST ── */}
      {activeTab === 'list' && (
        <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="text" className="search-input" placeholder="Search GAs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, width: '100%' }} />
            </div>
            <select className="filter-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">All Programs</option>
              {programs.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 130 }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="table-container">
            <table className="glass-table" style={{ width: '100%' }}>
              <thead><tr><th>#</th><th>Code</th><th>Name</th><th>Description</th><th>Program</th><th>PLOs Mapped</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>
                {loading && gas.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} color="#ff9800" /></td></tr>
                ) : filtered.map((ga, i) => {
                  const mappedPLOs = (plos || []).filter(p => (p.gas || []).some(g => g._id === ga._id || g === ga._id));
                  const linkedCLOCount = (clos || []).filter(c => (c.plos || []).some(p => mappedPLOs.find(mp => mp._id === (p._id || p)))).length;
                  return (
                    <tr key={ga._id}>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td><strong style={{ color: '#ff9800', fontSize: '0.95rem' }}>{ga.code}</strong></td>
                      <td style={{ maxWidth: 180 }}><span style={{ fontWeight: 600, color: '#fff' }}>{ga.name}</span></td>
                      <td style={{ maxWidth: 260 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ga.description}>{ga.description}</span></td>
                      <td><span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{ga.program?.code || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {mappedPLOs.length > 0 ? (
                            <>
                              {mappedPLOs.slice(0, 2).map(p => <span key={p._id} style={{ background: 'rgba(80,204,127,0.12)', color: '#50cc7f', padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(80,204,127,0.3)', fontWeight: 600 }}>{p.code}</span>)}
                              {mappedPLOs.length > 2 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{mappedPLOs.length - 2}</span>}
                              {linkedCLOCount > 0 && <span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '2px 5px', borderRadius: 4, fontSize: '0.68rem' }}>{linkedCLOCount} CLOs</span>}
                            </>
                          ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                          background: ga.status === 'Active' ? 'rgba(80,204,127,0.12)' : 'rgba(255,27,107,0.12)',
                          color: ga.status === 'Active' ? '#50cc7f' : '#ff1b6b',
                          border: `1px solid ${ga.status === 'Active' ? 'rgba(80,204,127,0.3)' : 'rgba(255,27,107,0.3)'}` }}>
                          {ga.status}
                        </span>
                      </td>
                      <td className="actions-col" style={{ justifyContent: 'center', gap: 5 }}>
                        <button className="action-btn" title="View Linked CLOs" onClick={() => openCLOModal(ga)} style={{ background: 'rgba(188,19,254,0.1)', color: '#bc13fe', border: '1px solid rgba(188,19,254,0.3)' }}><BookOpen size={14} /></button>
                        <button className="action-btn" title="Map to PLOs" onClick={() => openMapPLOModal(ga)} style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)' }}><Link2 size={14} /></button>
                        <button className="action-btn edit" title="Edit" onClick={() => handleEdit(ga)}><Edit2 size={14} /></button>
                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(ga._id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No GAs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: GA → PLO MATRIX ── */}
      {activeTab === 'matrix' && (
        <div>
          {matrixData.length === 0 ? (
            <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No GAs or PLOs exist yet.</div>
          ) : matrixData.map(({ program, gas: progGAs, plos: progPLOs }) => (
            <div key={program._id} className="glass-panel-dash" style={{ marginBottom: '20px', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff' }}>{program.code} — {program.name}</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px 0 0 0' }}>PLO / GA</th>
                      {progGAs.map(ga => (
                        <th key={ga._id} style={{ padding: '8px 10px', textAlign: 'center', color: '#ff9800', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(255,152,0,0.07)', whiteSpace: 'nowrap', borderRadius: 4 }}>
                          {ga.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {progPLOs.map(plo => (
                      <tr key={plo._id}>
                        <td style={{ padding: '8px 12px', color: '#50cc7f', fontWeight: 600, fontSize: '0.82rem', background: 'rgba(80,204,127,0.05)', borderRadius: 4, whiteSpace: 'nowrap' }}>
                          {plo.code}
                        </td>
                        {progGAs.map(ga => {
                          const isMapped = (plo.gas || []).some(g => g._id === ga._id || g === ga._id);
                          return (
                            <td key={ga._id} style={{ textAlign: 'center', padding: '8px', background: isMapped ? 'rgba(255,152,0,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                              {isMapped ? <span style={{ fontSize: '1rem', color: '#ff9800' }}>✔</span> : <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.15)' }}>—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: SUMMARY ── */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {programs.map(prog => {
            const progGAs = gas.filter(g => g.program?._id === prog._id);
            if (progGAs.length === 0) return null;
            return (
              <div key={prog._id} className="glass-panel-dash" style={{ padding: '1.2rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>{prog.code}</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ background: 'rgba(255,152,0,0.1)', color: '#ff9800', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {progGAs.length} / 12 GAs
                    </span>
                    {progGAs.length < 12 && <span style={{ background: 'rgba(255,27,107,0.1)', color: '#ff1b6b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>Incomplete</span>}
                  </div>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{prog.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {progGAs.map(ga => (
                    <div key={ga._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ background: 'rgba(255,152,0,0.12)', color: '#ff9800', padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{ga.code}</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{ga.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginTop: 2 }}>{ga.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {programs.every(p => gas.filter(g => g.program?._id === p._id).length === 0) && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>No GAs found. Add GAs or use "Init All 12 GAs".</div>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '540px', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#ff9800' }}>{editingId ? '✏️ Edit GA' : '➕ Add GA'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {!editingId && (
              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,152,0,0.1)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,152,0,0.3)' }}>
                <label style={{ color: '#ff9800', fontWeight: 600, display: 'block', marginBottom: '8px' }}>⚡ Quick Fill (Standard GA)</label>
                <select className="filter-select" onChange={handlePredefinedChange} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                  <option value="">-- Select a Predefined Graduate Attribute --</option>
                  {PREDEFINED_GAS.map(ga => <option key={ga.code} value={ga.code}>{ga.code} - {ga.name}</option>)}
                </select>
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Select to auto-fill. You can modify after.</p>
              </div>
            )}

            <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Program <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="program" value={formData.program} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>GA Code <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. GA1" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="filter-select" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>GA Name <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Engineering Knowledge" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description <span style={{ color: '#ff1b6b' }}>*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" placeholder="Enter Graduate Attribute Description..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading} className="primary-btn">
                  {loading ? <Loader2 className="spinner" size={16} /> : (editingId ? '✔ Update GA' : '✔ Save GA')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Map PLO Modal ── */}
      {showMapPLOModal && mappingGA && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#50cc7f' }}>🔗 Map GA → PLOs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#ff9800' }}>{mappingGA.code}</strong>: {mappingGA.name}
                </p>
              </div>
              <button onClick={() => setShowMapPLOModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {programPLOs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No PLOs found for this program. Create PLOs first.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                {programPLOs.map(plo => {
                  const isSelected = selectedPLOs.includes(plo._id);
                  return (
                    <div key={plo._id} onClick={() => togglePLO(plo._id)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '13px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(80,204,127,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(80,204,127,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? '#50cc7f' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#50cc7f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {isSelected && <CheckCircle size={13} color="#000" />}
                      </div>
                      <div>
                        <strong style={{ color: isSelected ? '#50cc7f' : '#fff', fontSize: '0.88rem' }}>{plo.code}</strong>
                        <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.4 }}>{plo.statement || plo.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowMapPLOModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSavePLOMapping} className="primary-btn" disabled={loading}
                className="primary-btn">
                {loading ? <Loader2 className="spinner" size={16} /> : <><Link2 size={16} /> Save Mapping</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View CLOs Modal ── */}
      {showCLOModal && viewingGA && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '540px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#bc13fe' }}>📚 CLOs Linked via PLOs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#ff9800' }}>{viewingGA.code}</strong>: {viewingGA.name}
                </p>
              </div>
              <button onClick={() => setShowCLOModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {linkedCLOs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No CLOs linked. Map this GA to PLOs first, then map CLOs to those PLOs.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {linkedCLOs.map(clo => (
                  <div key={clo._id} style={{ background: 'rgba(188,19,254,0.06)', border: '1px solid rgba(188,19,254,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: '#bc13fe', fontSize: '0.88rem' }}>{clo.code}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{clo.course?.code || '—'}</span>
                    </div>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', lineHeight: 1.4 }}>{clo.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bulk Init Modal ── */}
      {showBulkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '480px', padding: '2rem', borderRadius: '16px', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#ff9800', display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={20} /> Initialize All 12 Standard GAs</h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will create all 12 Washington Accord Graduate Attributes (GA1–GA12) for the selected program. Existing GAs with the same code will be skipped.
            </p>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Select Program <span style={{ color: '#ff1b6b' }}>*</span></label>
              <select className="filter-select" value={bulkProgram} onChange={e => setBulkProgram(e.target.value)} style={{ width: '100%', padding: '10px' }}>
                <option value="">-- Select Program --</option>
                {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowBulkModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleBulkInit} disabled={loading || !bulkProgram} className="primary-btn"
                className="primary-btn">
                {loading ? <Loader2 className="spinner" size={16} /> : <><Zap size={16} /> Initialize GAs</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GAManagement;
