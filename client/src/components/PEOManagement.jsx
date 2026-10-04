import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPEOs, createPEO, updatePEO, deletePEO, mapPEOtoPLOs,
  fetchPLOs, clearObeMessages 
} from '../store/obeSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, Target, List, GitBranch, Eye, Link2, CheckCircle } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

// ── Tab bar shared style ─────────────────────
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '9px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
        background: active === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active === tab.id ? '#0ff0fc' : 'rgba(255,255,255,0.5)',
        boxShadow: active === tab.id ? '0 0 16px rgba(15,240,252,0.12)' : 'none',
        borderBottom: active === tab.id ? '2px solid #0ff0fc' : '2px solid transparent',
      }}>
        <tab.icon size={15} /> {tab.label}
      </button>
    ))}
  </div>
);

const PEOManagement = () => {
  const dispatch = useDispatch();
  
  const { peos, plos, loading, error, successMessage } = useSelector(state => state.obe);
  const { records } = useSelector(state => state.academic);
  const programs = records.programs || [];

  const [activeTab, setActiveTab]   = useState('list');
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState(null);

  // Mapping state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mappingPEO, setMappingPEO] = useState(null);
  const [selectedPLOs, setSelectedPLOs] = useState([]);
  
  const initialFormState = { code: '', title: '', description: '', program: '', version: 'v1.0', effectiveDate: '', status: 'Active' };
  const [formData, setFormData]     = useState(initialFormState);
  const [filterStatus, setFilterStatus] = useState('');
  const pendingAction               = useRef(null);

  useEffect(() => {
    dispatch(fetchPEOs());
    dispatch(fetchPLOs());
    dispatch(fetchAcademicData('programs'));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setToast({ msg: pendingAction.current || successMessage, type: 'success' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearObeMessages());
      setFormData(initialFormState);
      setShowModal(false);
      setShowMapModal(false);
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
    pendingAction.current = editingId ? 'PEO updated!' : 'PEO created!';
    if (editingId) dispatch(updatePEO({ id: editingId, payload: formData }));
    else dispatch(createPEO(formData));
  };

  const handleEdit = (peo) => {
    setEditingId(peo._id);
    setFormData({ 
      code: peo.code, 
      title: peo.title || '',
      description: peo.description, 
      program: peo.program?._id || '', 
      version: peo.version || 'v1.0',
      effectiveDate: peo.effectiveDate ? peo.effectiveDate.substring(0, 10) : '',
      status: peo.status 
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this PEO?')) {
      pendingAction.current = 'PEO deleted!';
      dispatch(deletePEO(id));
    }
  };

  // Map to PLOs
  const openMapModal = (peo) => {
    setMappingPEO(peo);
    const alreadyMapped = (plos || []).filter(p => (p.peos || []).some(pe => pe._id === peo._id || pe === peo._id)).map(p => p._id);
    setSelectedPLOs(alreadyMapped);
    setShowMapModal(true);
  };

  const togglePLO = (id) => setSelectedPLOs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSaveMapping = () => {
    pendingAction.current = 'PEO mapped to PLOs!';
    dispatch(mapPEOtoPLOs({ id: mappingPEO._id, ploIds: selectedPLOs })).then(() => dispatch(fetchPLOs()));
  };

  // Filtered
  const filtered = useMemo(() => (peos || []).filter(p =>
    (p.code?.toLowerCase().includes(search.toLowerCase()) || 
     p.title?.toLowerCase().includes(search.toLowerCase()) ||
     p.description?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterProgram || p.program?._id === filterProgram) &&
    (!filterStatus || p.status === filterStatus)
  ), [peos, search, filterProgram, filterStatus]);

  // PEO→PLO Mapping matrix data
  const matrixData = useMemo(() => {
    return programs.map(prog => {
      const progPEOs = peos.filter(p => p.program?._id === prog._id);
      const progPLOs = plos.filter(p => p.program?._id === prog._id);
      return { program: prog, peos: progPEOs, plos: progPLOs };
    }).filter(d => d.peos.length > 0 || d.plos.length > 0);
  }, [programs, peos, plos]);

  const programPLOsForMapping = useMemo(() => mappingPEO ? (plos || []).filter(p => p.program?._id === mappingPEO.program?._id) : [], [plos, mappingPEO]);

  const TABS = [
    { id: 'list',    label: 'Manage PEOs',        icon: List },
    { id: 'matrix',  label: 'PEO → PLO Matrix',   icon: GitBranch },
    { id: 'summary', label: 'Program Summary',     icon: Eye },
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
          <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={24} /> Program Educational Objectives (PEOs)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>Define and manage long-term goals for program graduates.</p>
        </div>
        {activeTab === 'list' && (
          <button className="page-btn primary-btn" onClick={() => { setEditingId(null); setFormData(initialFormState); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Create PEO
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total PEOs', value: peos.length, color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)', Icon: Target },
          { label: 'Active PEOs', value: peos.filter(p => p.status === 'Active').length, color: '#50cc7f', bg: 'rgba(80,204,127,0.1)', Icon: CheckCircle },
          { label: 'Mapped to PLOs', value: peos.filter(p => plos.some(plo => plo.peos?.includes(p._id))).length, color: '#ffc107', bg: 'rgba(255,193,7,0.1)', Icon: Link2 },
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

      {/* Tab Bar */}
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── TAB 1: LIST ──────────────────── */}
      {activeTab === 'list' && (
        <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input type="text" className="search-input" placeholder="Search PEOs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, width: '100%' }} />
            </div>
            <select className="filter-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">All Programs</option>
              {programs.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
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
              <thead><tr><th>#</th><th>PEO Code</th><th>Title</th><th>Description</th><th>Program</th><th>PLOs Mapped</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>
                {loading && peos.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} color="#0ff0fc" /></td></tr>
                ) : filtered.map((peo, i) => {
                  const mappedPLOs = (plos || []).filter(p => (p.peos || []).some(pe => pe._id === peo._id || pe === peo._id));
                  return (
                    <tr key={peo._id}>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td><strong style={{ color: '#0ff0fc' }}>{peo.code}</strong></td>
                      <td style={{ maxWidth: 180 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={peo.title}>{peo.title || '—'}</span></td>
                      <td style={{ maxWidth: 220 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={peo.description}>{peo.description}</span></td>
                      <td><span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{peo.program?.code || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {mappedPLOs.length > 0 ? (
                            <>
                              {mappedPLOs.slice(0, 2).map(p => <span key={p._id} style={{ background: 'rgba(80,204,127,0.12)', color: '#50cc7f', padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(80,204,127,0.3)', fontWeight: 600 }}>{p.code}</span>)}
                              {mappedPLOs.length > 2 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{mappedPLOs.length - 2}</span>}
                            </>
                          ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                          background: peo.status === 'Active' ? 'rgba(80,204,127,0.12)' : peo.status === 'Archived' ? 'rgba(255,255,255,0.07)' : 'rgba(255,27,107,0.12)',
                          color: peo.status === 'Active' ? '#50cc7f' : peo.status === 'Archived' ? '#aaa' : '#ff1b6b',
                          border: `1px solid ${peo.status === 'Active' ? 'rgba(80,204,127,0.3)' : peo.status === 'Archived' ? 'rgba(255,255,255,0.15)' : 'rgba(255,27,107,0.3)'}` }}>
                          {peo.status}
                        </span>
                      </td>
                      <td className="actions-col" style={{ justifyContent: 'center' }}>
                        <button className="action-btn" title="Map to PLOs" onClick={() => openMapModal(peo)} style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)' }}><Link2 size={15} /></button>
                        <button className="action-btn edit" title="Edit" onClick={() => handleEdit(peo)}><Edit2 size={15} /></button>
                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(peo._id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No PEOs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PEO→PLO MATRIX ──────────────────── */}
      {activeTab === 'matrix' && (
        <div>
          {matrixData.length === 0 ? (
            <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              No data yet. Create PEOs and PLOs first.
            </div>
          ) : matrixData.map(({ program, peos: progPEOs, plos: progPLOs }) => (
            <div key={program._id} className="glass-panel-dash" style={{ marginBottom: '20px', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff' }}>{program.code} — {program.name}</h3>
              {progPEOs.length === 0 || progPLOs.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Need both PEOs and PLOs for this program to display matrix.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px 0 0 0' }}>PLO / PEO</th>
                        {progPEOs.map(peo => (
                          <th key={peo._id} style={{ padding: '8px 14px', textAlign: 'center', color: '#0ff0fc', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(15,240,252,0.07)', whiteSpace: 'nowrap', borderRadius: 4 }}>
                            {peo.code}
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
                          {progPEOs.map(peo => {
                            const isMapped = (plo.peos || []).some(p => p._id === peo._id || p === peo._id);
                            return (
                              <td key={peo._id} style={{ textAlign: 'center', padding: '8px', background: isMapped ? 'rgba(80,204,127,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                                {isMapped ? (
                                  <span style={{ fontSize: '1rem', color: '#50cc7f' }}>✔</span>
                                ) : (
                                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.15)' }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#fff', fontSize: '0.82rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 0 6px' }}>Total Mapped</td>
                        {progPEOs.map(peo => {
                          const total = progPLOs.filter(plo => (plo.peos || []).some(p => (p._id || p) === peo._id)).length;
                          return (
                            <td key={peo._id} style={{ textAlign: 'center', padding: '8px', fontWeight: 700, color: total > 0 ? '#50cc7f' : 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
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

      {/* ── TAB 3: SUMMARY ──────────────────── */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {programs.map(prog => {
            const progPEOs = peos.filter(p => p.program?._id === prog._id);
            if (progPEOs.length === 0) return null;
            return (
              <div key={prog._id} className="glass-panel-dash" style={{ padding: '1.2rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>{prog.code}</h4>
                  <span style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    {progPEOs.length} PEO{progPEOs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{prog.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {progPEOs.map(peo => (
                    <div key={peo._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ background: 'rgba(15,240,252,0.12)', color: '#0ff0fc', padding: '2px 7px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                        {peo.code}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{peo.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {programs.every(p => peos.filter(peo => peo.program?._id === p._id).length === 0) && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
              No PEOs found. Create PEOs first.
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0ff0fc' }}>{editingId ? '✏️ Edit PEO' : '➕ Create PEO'}</h3>
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
                <label>PEO Code <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. PEO-1" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="filter-select" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>PEO Title <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Industry-Ready Graduates" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input type="text" name="version" value={formData.version} onChange={handleChange} placeholder="e.g. v1.0" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Effective Date</label>
                <input type="date" name="effectiveDate" value={formData.effectiveDate} onChange={handleChange} className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description <span style={{ color: '#ff1b6b' }}>*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" placeholder="Enter PEO Description..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <Loader2 className="spinner" size={16} /> : (editingId ? '✔ Update PEO' : '✔ Save PEO')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Map PLO Modal ── */}
      {showMapModal && mappingPEO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#50cc7f' }}>🔗 Map PEO → PLOs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#0ff0fc' }}>{mappingPEO.code}</strong>: {mappingPEO.title}
                </p>
              </div>
              <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {programPLOsForMapping.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No PLOs found for this program. Create PLOs first.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                {programPLOsForMapping.map(plo => {
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
              <button type="button" onClick={() => setShowMapModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleSaveMapping} className="primary-btn" disabled={loading}>
                {loading ? <Loader2 className="spinner" size={16} /> : <><Link2 size={16} /> Save Mapping</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PEOManagement;
