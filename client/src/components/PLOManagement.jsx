import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPLOs, createPLO, updatePLO, deletePLO, mapPLOtoPEOs, mapPLOtoGAs,
  fetchPEOs, fetchCLOs, fetchGAs, clearObeMessages 
} from '../store/obeSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, BookOpen, Link2, List, GitBranch, Eye, CheckCircle, Award, Download } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const BLOOMS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const BLOOMS_LEVEL = { Remember: 1, Understand: 2, Apply: 3, Analyze: 4, Evaluate: 5, Create: 6 };
const DOMAINS = ['Cognitive', 'Psychomotor', 'Affective'];

const bloomsColor = {
  Remember:    { bg: 'rgba(255,87,87,0.15)',   color: '#ff5757', border: 'rgba(255,87,87,0.3)' },
  Understand:  { bg: 'rgba(255,193,7,0.15)',   color: '#ffc107', border: 'rgba(255,193,7,0.3)' },
  Apply:       { bg: 'rgba(80,204,127,0.15)',  color: '#50cc7f', border: 'rgba(80,204,127,0.3)' },
  Analyze:     { bg: 'rgba(15,240,252,0.15)',  color: '#0ff0fc', border: 'rgba(15,240,252,0.3)' },
  Evaluate:    { bg: 'rgba(188,19,254,0.15)',  color: '#bc13fe', border: 'rgba(188,19,254,0.3)' },
  Create:      { bg: 'rgba(255,27,107,0.15)',  color: '#ff1b6b', border: 'rgba(255,27,107,0.3)' },
};

const domainColor = {
  Cognitive:    { bg: 'rgba(15,240,252,0.1)',  color: '#0ff0fc', border: 'rgba(15,240,252,0.25)' },
  Psychomotor:  { bg: 'rgba(188,19,254,0.1)',  color: '#bc13fe', border: 'rgba(188,19,254,0.25)' },
  Affective:    { bg: 'rgba(255,193,7,0.1)',   color: '#ffc107', border: 'rgba(255,193,7,0.25)' },
};

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '9px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
        background: active === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active === tab.id ? '#50cc7f' : 'rgba(255,255,255,0.5)',
        borderBottom: active === tab.id ? '2px solid #50cc7f' : '2px solid transparent',
      }}>
        <tab.icon size={15} /> {tab.label}
      </button>
    ))}
  </div>
);

const PLOManagement = () => {
  const dispatch = useDispatch();
  const { plos, peos, clos, gas, loading, error, successMessage } = useSelector(state => state.obe);
  const { records } = useSelector(state => state.academic);
  const programs = records.programs || [];

  const [activeTab, setActiveTab]       = useState('list');
  const [toast, setToast]               = useState(null);
  const [search, setSearch]             = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editingId, setEditingId]       = useState(null);
  
  const [showMapPEOModal, setShowMapPEOModal] = useState(false);
  const [showMapGAModal, setShowMapGAModal] = useState(false);
  const [mappingPLO, setMappingPLO]     = useState(null);
  const [selectedPEOs, setSelectedPEOs] = useState([]);
  const [selectedGAs, setSelectedGAs] = useState([]);
  const pendingAction                   = useRef(null);

  const initialForm = { code: '', statement: '', description: '', program: '', domain: 'Cognitive', bloomsLevel: 'Understand', version: 'v1.0', status: 'Active' };
  const [formData, setFormData] = useState(initialForm);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    dispatch(fetchPLOs());
    dispatch(fetchPEOs());
    dispatch(fetchCLOs());
    dispatch(fetchGAs());
    dispatch(fetchAcademicData('programs'));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setToast({ msg: pendingAction.current || successMessage, type: 'success' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearObeMessages());
      setFormData(initialForm);
      setShowModal(false);
      setShowMapPEOModal(false);
      setShowMapGAModal(false);
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
    pendingAction.current = editingId ? 'PLO updated!' : 'PLO created!';
    if (editingId) dispatch(updatePLO({ id: editingId, payload: formData }));
    else dispatch(createPLO(formData));
  };

  const handleEdit = (plo) => {
    setEditingId(plo._id);
    setFormData({
      code: plo.code,
      statement: plo.statement || '',
      description: plo.description || '',
      program: plo.program?._id || '',
      domain: plo.domain || 'Cognitive',
      bloomsLevel: plo.bloomsLevel || 'Understand',
      version: plo.version || 'v1.0',
      status: plo.status
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this PLO?')) {
      pendingAction.current = 'PLO deleted!';
      dispatch(deletePLO(id));
    }
  };

  const openMapPEOModal = (plo) => {
    setMappingPLO(plo);
    setSelectedPEOs((plo.peos || []).map(p => p._id));
    setShowMapPEOModal(true);
  };

  const openMapGAModal = (plo) => {
    setMappingPLO(plo);
    setSelectedGAs((plo.gas || []).map(g => g._id));
    setShowMapGAModal(true);
  };

  const togglePEO = (id) => setSelectedPEOs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleGA = (id) => setSelectedGAs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSavePEOMapping = () => {
    pendingAction.current = 'PLO mapped to PEOs!';
    dispatch(mapPLOtoPEOs({ id: mappingPLO._id, peos: selectedPEOs }));
  };

  const handleSaveGAMapping = () => {
    pendingAction.current = 'PLO mapped to GAs!';
    dispatch(mapPLOtoGAs({ id: mappingPLO._id, gas: selectedGAs }));
  };

  const programPEOs = useMemo(() =>
    mappingPLO ? peos.filter(p => p.program?._id === mappingPLO.program?._id) : [],
    [peos, mappingPLO]
  );
  const programGAs = useMemo(() =>
    mappingPLO ? gas.filter(g => g.program?._id === mappingPLO.program?._id) : [],
    [gas, mappingPLO]
  );

  const filtered = useMemo(() => (plos || []).filter(p => {
    const matchSearch = p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.statement?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchProg = !filterProgram || p.program?._id === filterProgram;
    const matchDomain = !filterDomain || p.domain === filterDomain;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchProg && matchDomain && matchStatus;
  }), [plos, search, filterProgram, filterDomain, filterStatus]);

  // PLO→CLO matrix per program
  const matrixCLOData = useMemo(() => programs.map(prog => {
    const progPLOs = plos.filter(p => p.program?._id === prog._id);
    const progCLOs = clos.filter(c => (c.plos || []).some(pl => progPLOs.find(pp => pp._id === (pl.plo?._id || pl.plo))));
    return { program: prog, plos: progPLOs, clos: progCLOs };
  }).filter(d => d.plos.length > 0), [programs, plos, clos]);

  // PLO→GA matrix per program
  const matrixGAData = useMemo(() => {
    return programs.map(prog => {
      const progPLOs = plos.filter(p => p.program?._id === prog._id);
      const progGAs = gas.filter(g => g.program?._id === prog._id);
      return { program: prog, plos: progPLOs, gas: progGAs };
    }).filter(d => d.plos.length > 0 && d.gas.length > 0);
  }, [programs, plos, gas]);

  const exportMatrixCSV = (progCode, progName, progPLOs, progGAs) => {
    if (!progPLOs.length || !progGAs.length) return;
    let csv = `PLO / GA,${progGAs.map(g => g.code).join(',')}\n`;
    progPLOs.forEach(plo => {
      const row = [plo.code];
      progGAs.forEach(ga => {
        row.push((plo.gas || []).some(g => g._id === ga._id || g === ga._id) ? 'Mapped' : 'Unmapped');
      });
      csv += row.join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${progCode}_PLO_GA_Matrix.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: 'list',    label: 'Manage PLOs',        icon: List },
    { id: 'matrix',  label: 'PLO → CLO Matrix',   icon: GitBranch },
    { id: 'matrixga',label: 'PLO → GA Matrix',    icon: Award },
    { id: 'summary', label: 'Program Summary',     icon: Eye },
  ];

  return (
    <div className="">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '10px', zIndex: 2000, color: '#fff', fontWeight: 600,
          background: toast.type === 'success' ? 'rgba(80,204,127,0.95)' : 'rgba(255,27,107,0.95)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#50cc7f', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={24} /> Program Learning Outcomes (PLOs)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>Define measurable outcomes and map them to Program Educational Objectives and Graduate Attributes.</p>
        </div>
        {activeTab === 'list' && (
          <button className="page-btn primary-btn" onClick={() => { setEditingId(null); setFormData(initialForm); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Create PLO
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total PLOs', value: plos.length, color: '#50cc7f', bg: 'rgba(80,204,127,0.1)', Icon: BookOpen },
          { label: 'Active PLOs', value: plos.filter(p => p.status === 'Active').length, color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)', Icon: CheckCircle },
          { label: 'Mapped to PEOs', value: plos.filter(p => p.peos?.length > 0).length, color: '#ffc107', bg: 'rgba(255,193,7,0.1)', Icon: Link2 },
          { label: 'Mapped to GAs', value: plos.filter(p => p.gas?.length > 0).length, color: '#ff9800', bg: 'rgba(255,152,0,0.1)', Icon: Award },
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
              <input className="search-input" placeholder="Search PLOs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, width: '100%' }} />
            </div>
            <select className="filter-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">All Programs</option>
              {programs.map(p => <option key={p._id} value={p._id}>{p.code}</option>)}
            </select>
            <select className="filter-select" value={filterDomain} onChange={e => setFilterDomain(e.target.value)} style={{ minWidth: 150 }}>
              <option value="">All Domains</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 130 }}>
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          <div className="table-container">
            <table className="glass-table" style={{ width: '100%' }}>
              <thead><tr><th>#</th><th>Code</th><th>PLO Statement</th><th>Description</th><th>Program</th><th>Version</th><th>Bloom's</th><th>Domain</th><th>PEOs</th><th>GAs</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>
                {loading && plos.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} color="#50cc7f" /></td></tr>
                ) : filtered.map((plo, i) => {
                  const bc = bloomsColor[plo.bloomsLevel] || bloomsColor.Understand;
                  const dc = domainColor[plo.domain] || domainColor.Cognitive;
                  return (
                  <tr key={plo._id}>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td><strong style={{ color: '#50cc7f' }}>{plo.code}</strong></td>
                      <td style={{ maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={plo.statement}>{plo.statement || '—'}</span></td>
                      <td style={{ maxWidth: 180 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={plo.description}>{plo.description || '—'}</span></td>
                      <td><span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>{plo.program?.code || '—'}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{plo.version || '—'}</td>
                      <td><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: bc.bg, color: bc.color, border: `1px solid ${bc.border}` }}>L{BLOOMS_LEVEL[plo.bloomsLevel]}</span></td>
                      <td><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: dc.bg, color: dc.color, border: `1px solid ${dc.border}` }}>{plo.domain}</span></td>
                      <td>
                        {plo.peos?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {plo.peos.slice(0, 2).map(p => <span key={p._id} style={{ background: 'rgba(255,193,7,0.12)', color: '#ffc107', padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(255,193,7,0.3)', fontWeight: 600 }}>{p.code}</span>)}
                            {plo.peos.length > 2 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{plo.peos.length - 2}</span>}
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                      </td>
                      <td>
                        {plo.gas?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {plo.gas.slice(0, 2).map(g => <span key={g._id} style={{ background: 'rgba(255,152,0,0.12)', color: '#ff9800', padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(255,152,0,0.3)', fontWeight: 600 }}>{g.code}</span>)}
                            {plo.gas.length > 2 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{plo.gas.length - 2}</span>}
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                          background: plo.status === 'Active' ? 'rgba(80,204,127,0.12)' : plo.status === 'Archived' ? 'rgba(255,255,255,0.07)' : 'rgba(255,27,107,0.12)',
                          color: plo.status === 'Active' ? '#50cc7f' : plo.status === 'Archived' ? '#aaa' : '#ff1b6b',
                          border: `1px solid ${plo.status === 'Active' ? 'rgba(80,204,127,0.3)' : plo.status === 'Archived' ? 'rgba(255,255,255,0.15)' : 'rgba(255,27,107,0.3)'}` }}>
                          {plo.status}
                        </span>
                      </td>
                      <td className="actions-col" style={{ justifyContent: 'center', gap: 5 }}>
                        <button className="action-btn" title="Map to GAs" onClick={() => openMapGAModal(plo)} style={{ background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)' }}><Award size={14} /></button>
                        <button className="action-btn" title="Map to PEOs" onClick={() => openMapPEOModal(plo)} style={{ background: 'rgba(255,193,7,0.1)', color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)' }}><Link2 size={14} /></button>
                        <button className="action-btn edit" onClick={() => handleEdit(plo)}><Edit2 size={14} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(plo._id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && <tr><td colSpan="12" style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No PLOs found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PLO→CLO MATRIX ── */}
      {activeTab === 'matrix' && (
        <div>
          {matrixCLOData.length === 0 ? (
            <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No PLOs exist yet. Create PLOs to view the matrix.</div>
          ) : matrixCLOData.map(({ program, plos: progPLOs, clos: progCLOs }) => (
            <div key={program._id} className="glass-panel-dash" style={{ marginBottom: '20px', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff' }}>{program.code} — {program.name}</h3>
              {progCLOs.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.85rem' }}>No CLOs mapped to PLOs for this program yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px 0 0 0' }}>CLO / PLO</th>
                        {progPLOs.map(plo => (
                          <th key={plo._id} style={{ padding: '8px 14px', textAlign: 'center', color: '#50cc7f', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(80,204,127,0.07)', whiteSpace: 'nowrap', borderRadius: 4 }}>
                            {plo.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {progCLOs.map(clo => (
                        <tr key={clo._id}>
                          <td style={{ padding: '8px 12px', color: '#bc13fe', fontWeight: 600, fontSize: '0.82rem', background: 'rgba(188,19,254,0.05)', borderRadius: 4, whiteSpace: 'nowrap' }}>
                            {clo.code} <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400, fontSize: '0.72rem' }}>({clo.course?.code})</span>
                          </td>
                          {progPLOs.map(plo => {
                            const isMapped = (clo.plos || []).some(p => (p.plo?._id || p.plo) === plo._id);
                            return (
                              <td key={plo._id} style={{ textAlign: 'center', padding: '8px', background: isMapped ? 'rgba(80,204,127,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                                {isMapped ? <span style={{ fontSize: '1rem', color: '#50cc7f' }}>✔</span> : <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.15)' }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#fff', fontSize: '0.82rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 0 6px' }}>Total Mapped</td>
                        {progCLOs.map(clo => {
                          const total = progPLOs.filter(plo => (plo.clos || []).some(c => (c._id || c) === clo._id)).length;
                          return (
                            <td key={clo._id} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, color: total > 0 ? '#0ff0fc' : 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
                              {total}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: PLO→GA MATRIX ── */}
      {activeTab === 'matrixga' && (
        <div>
          {matrixGAData.length === 0 ? (
            <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No PLOs or GAs exist for matrix viewing yet.</div>
          ) : matrixGAData.map(({ program, plos: progPLOs, gas: progGAs }) => (
            <div key={program._id} className="glass-panel-dash" style={{ marginBottom: '20px', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>{program.code} — {program.name}</h3>
                <button onClick={() => exportMatrixCSV(program.code, program.name, progPLOs, progGAs)} 
                  className="page-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)', padding: '6px 12px', fontSize: '0.8rem' }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px 0 0 0' }}>PLO / GA</th>
                      {progGAs.map(ga => (
                        <th key={ga._id} style={{ padding: '8px 14px', textAlign: 'center', color: '#ff9800', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(255,152,0,0.07)', whiteSpace: 'nowrap', borderRadius: 4 }}>
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
                          const isMapped = (plo.gas || []).some(g => (g._id || g) === ga._id);
                          return (
                            <td key={ga._id} style={{ textAlign: 'center', padding: '8px', background: isMapped ? 'rgba(255,152,0,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                              {isMapped ? <span style={{ fontSize: '1rem', color: '#ff9800' }}>✔</span> : <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.15)' }}>—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#fff', fontSize: '0.82rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 0 6px' }}>Total Mapped</td>
                      {progGAs.map(ga => {
                        const total = progPLOs.filter(plo => (plo.gas || []).some(g => (g._id || g) === ga._id)).length;
                        return (
                          <td key={ga._id} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, color: total > 0 ? '#ff9800' : 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
                            {total}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: SUMMARY (Bloom's distribution) ── */}
      {activeTab === 'summary' && (
        <div>
          {programs.map(prog => {
            const progPLOs = plos.filter(p => p.program?._id === prog._id);
            if (progPLOs.length === 0) return null;
            const bloomsCounts = BLOOMS.reduce((acc, b) => { acc[b] = progPLOs.filter(p => p.bloomsLevel === b).length; return acc; }, {});
            return (
              <div key={prog._id} className="glass-panel-dash" style={{ marginBottom: 16, padding: '1.5rem', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h4 style={{ margin: 0, color: '#fff' }}>{prog.code} — {prog.name}</h4>
                  <span style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>{progPLOs.length} PLOs</span>
                </div>
                {/* Bloom's distribution bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Bloom's Distribution</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {BLOOMS.map(b => {
                      const count = bloomsCounts[b];
                      const bc = bloomsColor[b];
                      return count > 0 ? (
                        <span key={b} style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: bc.bg, color: bc.color, border: `1px solid ${bc.border}` }}>
                          L{BLOOMS_LEVEL[b]} {b}: {count}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {progPLOs.map(plo => {
                    const bc = bloomsColor[plo.bloomsLevel] || bloomsColor.Understand;
                    return (
                      <div key={plo._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ background: 'rgba(80,204,127,0.12)', color: '#50cc7f', padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{plo.code}</span>
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, flex: 1 }}>{plo.description}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: bc.bg, color: bc.color, border: `1px solid ${bc.border}`, flexShrink: 0 }}>L{BLOOMS_LEVEL[plo.bloomsLevel]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '580px', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#50cc7f' }}>{editingId ? '✏️ Edit PLO' : '➕ Create PLO'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Program <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="program" value={formData.program} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>PLO Code <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. PLO-1" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="filter-select" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bloom's Level <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="bloomsLevel" value={formData.bloomsLevel} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  {BLOOMS.map((b, i) => <option key={b} value={b}>L{i + 1} – {b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Domain</label>
                <select className="filter-select" name="domain" value={formData.domain} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>PLO Statement <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="statement" value={formData.statement} onChange={handleChange} required
                  placeholder="e.g. Apply engineering knowledge to solve complex problems"
                  className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Bloom's Level <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="bloomsLevel" value={formData.bloomsLevel} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  {BLOOMS.map((b, i) => <option key={b} value={b}>L{i + 1} – {b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Domain</label>
                <select className="filter-select" name="domain" value={formData.domain} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Version</label>
                <input type="text" name="version" value={formData.version} onChange={handleChange}
                  placeholder="e.g. v1.0"
                  className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
                  placeholder="Optional additional details..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <Loader2 className="spinner" size={16} /> : (editingId ? '✔ Update PLO' : '✔ Save PLO')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PEO Mapping Modal ── */}
      {showMapPEOModal && mappingPLO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#ffc107' }}>🔗 Map PLO → PEOs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#50cc7f' }}>{mappingPLO.code}</strong>: {mappingPLO.description}
                </p>
              </div>
              <button onClick={() => setShowMapPEOModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {programPEOs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No PEOs found for this program. Create PEOs first.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                {programPEOs.map(peo => {
                  const isSelected = selectedPEOs.includes(peo._id);
                  return (
                    <div key={peo._id} onClick={() => togglePEO(peo._id)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '13px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(255,193,7,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(255,193,7,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? '#ffc107' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#ffc107' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {isSelected && <CheckCircle size={13} color="#000" />}
                      </div>
                      <div>
                        <strong style={{ color: isSelected ? '#ffc107' : '#fff', fontSize: '0.88rem' }}>{peo.code}</strong>
                        <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.4 }}>{peo.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowMapPEOModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSavePEOMapping} className="primary-btn" disabled={loading}
                className="primary-btn">
                {loading ? <Loader2 className="spinner" size={16} /> : <><Link2 size={16} /> Save Mapping</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GA Mapping Modal ── */}
      {showMapGAModal && mappingPLO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#ff9800' }}>🔗 Map PLO → GAs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#50cc7f' }}>{mappingPLO.code}</strong>: {mappingPLO.description}
                </p>
              </div>
              <button onClick={() => setShowMapGAModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {programGAs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No GAs found for this program. Create GAs first.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                {programGAs.map(ga => {
                  const isSelected = selectedGAs.includes(ga._id);
                  return (
                    <div key={ga._id} onClick={() => toggleGA(ga._id)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '13px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(255,152,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(255,152,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? '#ff9800' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#ff9800' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {isSelected && <CheckCircle size={13} color="#000" />}
                      </div>
                      <div>
                        <strong style={{ color: isSelected ? '#ff9800' : '#fff', fontSize: '0.88rem' }}>{ga.code} - {ga.name}</strong>
                        <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.4 }}>{ga.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowMapGAModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSaveGAMapping} className="primary-btn" disabled={loading}
                className="primary-btn">
                {loading ? <Loader2 className="spinner" size={16} /> : <><Award size={16} /> Save Mapping</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PLOManagement;
