import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCLOs, createCLO, updateCLO, deleteCLO, mapCLOtoPLOs, mapCLOtoGAs,
  fetchPLOs, fetchGAs, clearObeMessages 
} from '../store/obeSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { 
  Plus, Edit2, Trash2, Search, X, Loader2, Link2, Layers,
  CheckCircle, BarChart2, AlertTriangle, List, GitBranch, Eye, Award
} from 'lucide-react';
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

const WeightageBar = ({ value, total }) => {
  const pct = Math.min(value, 100);
  const color = total > 100 ? '#ff1b6b' : total === 100 ? '#50cc7f' : '#0ff0fc';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 20, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color, minWidth: 32 }}>{value}%</span>
    </div>
  );
};

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        padding: '9px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
        background: active === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: active === tab.id ? '#bc13fe' : 'rgba(255,255,255,0.5)',
        borderBottom: active === tab.id ? '2px solid #bc13fe' : '2px solid transparent',
      }}>
        <tab.icon size={15} /> {tab.label}
      </button>
    ))}
  </div>
);

const CLOManagement = () => {
  const dispatch = useDispatch();
  const { clos, plos, gas, loading, error, successMessage } = useSelector(state => state.obe);
  const { records } = useSelector(state => state.academic);
  const courses = records.courses || [];

  const [activeTab, setActiveTab]         = useState('list');
  const [toast, setToast]                 = useState(null);
  const [search, setSearch]               = useState('');
  const [filterCourse, setFilterCourse]   = useState('');
  const [filterBlooms, setFilterBlooms]   = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  
  const [showMapPLOModal, setShowMapPLOModal] = useState(false);
  const [showMapGAModal, setShowMapGAModal]   = useState(false);
  const [mappingCLO, setMappingCLO]       = useState(null);
  const [selectedPLOs, setSelectedPLOs]   = useState([]);
  const [selectedGAs, setSelectedGAs]     = useState([]);
  const pendingAction                     = useRef(null);

  const initialForm = { code: '', description: '', course: '', bloomsLevel: 'Understand', bloomsDomain: 'Cognitive', weightage: 0, status: 'Active' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    dispatch(fetchCLOs());
    dispatch(fetchPLOs());
    dispatch(fetchGAs());
    dispatch(fetchAcademicData('courses'));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setToast({ msg: pendingAction.current || successMessage, type: 'success' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearObeMessages());
      setFormData(initialForm);
      setShowModal(false);
      setShowMapPLOModal(false);
      setShowMapGAModal(false);
    }
    if (error) {
      setToast({ msg: error, type: 'error' });
      setTimeout(() => setToast(null), 5000);
      dispatch(clearObeMessages());
    }
  }, [successMessage, error, dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleBloomsChange = (e) => {
    const val = e.target.value;
    const domain = val === 'Remember' || val === 'Understand' || val === 'Analyze' || val === 'Evaluate' || val === 'Create' ? 'Cognitive' : formData.bloomsDomain;
    setFormData({ ...formData, bloomsLevel: val, bloomsDomain: domain });
  };

  const handleSave = (e) => {
    e.preventDefault();
    pendingAction.current = editingId ? 'CLO updated!' : 'CLO created!';
    if (editingId) dispatch(updateCLO({ id: editingId, payload: formData }));
    else dispatch(createCLO(formData));
  };

  const handleEdit = (clo) => {
    setEditingId(clo._id);
    setFormData({
      code: clo.code, description: clo.description,
      course: clo.course?._id || '', bloomsLevel: clo.bloomsLevel || 'Understand',
      bloomsDomain: clo.bloomsDomain || 'Cognitive', weightage: clo.weightage || 0, status: clo.status
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this CLO?')) {
      pendingAction.current = 'CLO deleted!';
      dispatch(deleteCLO(id));
    }
  };

  const openMapPLOModal = (clo) => {
    setMappingCLO(clo);
    setSelectedPLOs((clo.plos || []).map(p => ({
      plo: p.plo?._id || p.plo || (p._id ? p._id : p), // fallback for old data
      weightage: p.weightage || 100,
      level: p.level || 'Medium'
    })));
    setShowMapPLOModal(true);
  };

  const openMapGAModal = (clo) => {
    setMappingCLO(clo);
    setSelectedGAs((clo.gas || []).map(g => ({
      ga: g.ga?._id || g.ga || (g._id ? g._id : g),
      weightage: g.weightage || 100,
      level: g.level || 'Medium'
    })));
    setShowMapGAModal(true);
  };

  const togglePLO = (id) => setSelectedPLOs(prev => prev.some(x => x.plo === id) ? prev.filter(x => x.plo !== id) : [...prev, { plo: id, weightage: 100, level: 'Medium' }]);
  const toggleGA = (id) => setSelectedGAs(prev => prev.some(x => x.ga === id) ? prev.filter(x => x.ga !== id) : [...prev, { ga: id, weightage: 100, level: 'Medium' }]);

  const updatePLOMapping = (id, field, value) => setSelectedPLOs(prev => prev.map(x => x.plo === id ? { ...x, [field]: value } : x));
  const updateGAMapping = (id, field, value) => setSelectedGAs(prev => prev.map(x => x.ga === id ? { ...x, [field]: value } : x));


  const handleSavePLOMapping = () => {
    pendingAction.current = 'CLO mapped to PLOs!';
    dispatch(mapCLOtoPLOs({ id: mappingCLO._id, plos: selectedPLOs }));
  };

  const handleSaveGAMapping = () => {
    pendingAction.current = 'CLO mapped to GAs!';
    dispatch(mapCLOtoGAs({ id: mappingCLO._id, gas: selectedGAs }));
  };

  const courseProgramId = mappingCLO?.course?.program?._id || mappingCLO?.course?.program;
  const coursePLOs = useMemo(() =>
    courseProgramId ? plos.filter(p => p.program?._id === courseProgramId || p.program === courseProgramId) : plos,
    [plos, courseProgramId]
  );
  const courseGAs = useMemo(() =>
    courseProgramId ? gas.filter(g => g.program?._id === courseProgramId || g.program === courseProgramId) : gas,
    [gas, courseProgramId]
  );

  const filtered = useMemo(() => (clos || []).filter(c => {
    const matchSearch = c.code?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !filterCourse || c.course?._id === filterCourse;
    const matchBlooms = !filterBlooms || c.bloomsLevel === filterBlooms;
    return matchSearch && matchCourse && matchBlooms;
  }), [clos, search, filterCourse, filterBlooms]);

  // CLO→PLO matrix per course
  const matrixPLOData = useMemo(() => courses.map(cr => {
    const courseCLOs = clos.filter(c => c.course?._id === cr._id);
    // Get program from the courses record OR from any CLO's populated course.program
    const _cloProg = courseCLOs.find(c => c.course?.program);
    const crsProgram = cr.program?._id || cr.program || _cloProg?.course?.program?._id || _cloProg?.course?.program;
    let relatedPLOs = crsProgram ? plos.filter(p => p.program?._id === crsProgram || p.program === crsProgram) : [];
    
    // Always add PLOs that are directly mapped via CLO even if program doesn't match
    const mappedIds = new Set();
    courseCLOs.forEach(c => (c.plos || []).forEach(pl => mappedIds.add(pl.plo?._id || pl.plo)));
    plos.forEach(p => {
        if (mappedIds.has(p._id) && !relatedPLOs.some(rp => rp._id === p._id)) relatedPLOs.push(p);
    });

    return { course: cr, clos: courseCLOs, plos: relatedPLOs };
  }).filter(d => d.clos.length > 0), [courses, clos, plos]);

  // CLO→GA matrix per course
  const matrixGAData = useMemo(() => courses.map(cr => {
    const courseCLOs = clos.filter(c => c.course?._id === cr._id);
    const crsProgram = cr.program?._id || cr.program;
    let relatedGAs = crsProgram ? gas.filter(g => g.program?._id === crsProgram || g.program === crsProgram) : [];

    const mappedIds = new Set();
    courseCLOs.forEach(c => (c.gas || []).forEach(g => mappedIds.add(g.ga?._id || g.ga)));
    gas.forEach(g => {
        if (mappedIds.has(g._id) && !relatedGAs.some(rg => rg._id === g._id)) relatedGAs.push(g);
    });

    return { course: cr, clos: courseCLOs, gas: relatedGAs };
  }).filter(d => d.clos.length > 0 && d.gas.length > 0), [courses, clos, gas]);

  // Course Weightage Summary
  const weightageSummary = useMemo(() => courses.map(cr => {
    const courseCLOs = clos.filter(c => c.course?._id === cr._id);
    if (courseCLOs.length === 0) return null;
    const totalW = courseCLOs.reduce((acc, c) => acc + (c.weightage || 0), 0);
    return { course: cr, clos: courseCLOs, totalW };
  }).filter(Boolean), [courses, clos]);

  const TABS = [
    { id: 'list',     label: 'Manage CLOs',        icon: List },
    { id: 'matrixplo',label: 'CLO → PLO Matrix',   icon: GitBranch },
    { id: 'matrixga', label: 'CLO → GA Matrix',    icon: Award },
    { id: 'summary',  label: 'Course Summary',     icon: Eye },
  ];

  return (
    <div className="">
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '10px', zIndex: 2000, color: '#fff', fontWeight: 600,
          background: toast.type === 'success' ? 'rgba(80,204,127,0.95)' : 'rgba(255,27,107,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#bc13fe', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={24} /> Course Learning Outcomes (CLOs)
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>Define outcomes at the course level, assign weightage, and map to PLOs/GAs.</p>
        </div>
        {activeTab === 'list' && (
          <button className="page-btn primary-btn" onClick={() => { setEditingId(null); setFormData(initialForm); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #bc13fe, #7e22ce)' }}>
            <Plus size={18} /> Create CLO
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total CLOs', value: clos.length, color: '#bc13fe', bg: 'rgba(188,19,254,0.1)', Icon: Layers },
          { label: 'Mapped to PLOs', value: clos.filter(c => c.plos?.length > 0).length, color: '#50cc7f', bg: 'rgba(80,204,127,0.1)', Icon: Link2 },
          { label: 'Mapped to GAs', value: clos.filter(c => c.gas?.length > 0).length, color: '#ff9800', bg: 'rgba(255,152,0,0.1)', Icon: Award },
          { label: 'Courses with CLOs', value: weightageSummary.length, color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)', Icon: CheckCircle },
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
              <input className="search-input" placeholder="Search CLOs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38, width: '100%' }} />
            </div>
            <select className="filter-select" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
            </select>
            <select className="filter-select" value={filterBlooms} onChange={e => setFilterBlooms(e.target.value)} style={{ minWidth: 150 }}>
              <option value="">All Bloom's Levels</option>
              {BLOOMS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="table-container">
            <table className="glass-table" style={{ width: '100%' }}>
              <thead><tr><th>#</th><th>Code</th><th>Description</th><th>Course</th><th>Bloom's</th><th>Weightage</th><th>PLOs</th><th>GAs</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>
                {loading && clos.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} color="#bc13fe" /></td></tr>
                ) : filtered.map((clo, i) => {
                  const bc = bloomsColor[clo.bloomsLevel] || bloomsColor.Understand;
                  return (
                    <tr key={clo._id}>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td><strong style={{ color: '#bc13fe' }}>{clo.code}</strong></td>
                      <td style={{ maxWidth: 200 }}><span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={clo.description}>{clo.description}</span></td>
                      <td><span style={{ background: 'rgba(15,240,252,0.12)', color: '#0ff0fc', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>{clo.course?.code || '—'}</span></td>
                      <td><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: bc.bg, color: bc.color, border: `1px solid ${bc.border}` }}>L{BLOOMS_LEVEL[clo.bloomsLevel]}</span></td>
                      <td style={{ minWidth: 80 }}><WeightageBar value={clo.weightage || 0} total={100} /></td>
                      <td>
                        {clo.plos?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {clo.plos.slice(0, 2).map(p => <span key={p._id} style={{ background: 'rgba(80,204,127,0.12)', color: '#50cc7f', padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(80,204,127,0.3)', fontWeight: 600 }}>{p.code}</span>)}
                            {clo.plos.length > 2 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{clo.plos.length - 2}</span>}
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                      </td>
                      <td>
                        {clo.gas?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {clo.gas.slice(0, 2).map(g => <span key={g._id} style={{ background: 'rgba(255,152,0,0.12)', color: '#ff9800', padding: '2px 7px', borderRadius: 4, fontSize: '0.7rem', border: '1px solid rgba(255,152,0,0.3)', fontWeight: 600 }}>{g.code}</span>)}
                            {clo.gas.length > 2 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>+{clo.gas.length - 2}</span>}
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                          background: clo.status === 'Active' ? 'rgba(80,204,127,0.12)' : 'rgba(255,27,107,0.12)',
                          color: clo.status === 'Active' ? '#50cc7f' : '#ff1b6b',
                          border: `1px solid ${clo.status === 'Active' ? 'rgba(80,204,127,0.3)' : 'rgba(255,27,107,0.3)'}` }}>
                          {clo.status}
                        </span>
                      </td>
                      <td className="actions-col" style={{ justifyContent: 'center', gap: 5 }}>
                        <button className="action-btn" title="Map to GAs" onClick={() => openMapGAModal(clo)} style={{ background: 'rgba(255,152,0,0.1)', color: '#ff9800', border: '1px solid rgba(255,152,0,0.3)' }}><Award size={14} /></button>
                        <button className="action-btn" title="Map to PLOs" onClick={() => openMapPLOModal(clo)} style={{ background: 'rgba(80,204,127,0.1)', color: '#50cc7f', border: '1px solid rgba(80,204,127,0.3)' }}><Link2 size={14} /></button>
                        <button className="action-btn edit" onClick={() => handleEdit(clo)}><Edit2 size={14} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(clo._id)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No CLOs found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLO→PLO MATRIX ── */}
      {activeTab === 'matrixplo' && (
        <div>
          {matrixPLOData.length === 0 ? (
            <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No CLOs exist yet. Create CLOs to view the matrix.</div>
          ) : matrixPLOData.map(({ course, clos: crsCLOs, plos: crsPLOs }) => (
            <div key={course._id} className="glass-panel-dash" style={{ marginBottom: '20px', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>{course.code} — {course.name}</h3>
                <span style={{ fontSize: '0.75rem', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', padding: '3px 10px', borderRadius: 20 }}>{crsCLOs.length} CLOs</span>
              </div>
              {crsPLOs.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(255,152,0,0.07)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <p style={{ color: '#ff9800', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>No PLOs linked to this course's program.</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontSize: '0.78rem' }}>
                      Ensure this course has a Program assigned in Academic Management, and that PLOs exist for that program. Then use the Map PLO button on each CLO to link them.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px 0 0 0' }}>CLO / PLO</th>
                        {crsPLOs.map(plo => (
                          <th key={plo._id} style={{ padding: '8px 14px', textAlign: 'center', color: '#50cc7f', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(80,204,127,0.07)', whiteSpace: 'nowrap', borderRadius: 4 }}>
                            {plo.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {crsCLOs.map(clo => (
                        <tr key={clo._id}>
                          <td style={{ padding: '8px 12px', color: '#bc13fe', fontWeight: 600, fontSize: '0.82rem', background: 'rgba(188,19,254,0.05)', borderRadius: 4, whiteSpace: 'nowrap' }}>
                            {clo.code}
                          </td>
                          {crsPLOs.map(plo => {
                            const mapping = (clo.plos || []).find(p => (p.plo?._id || p.plo) === plo._id);
                            return (
                              <td key={plo._id} style={{ textAlign: 'center', padding: '8px', background: mapping ? 'rgba(80,204,127,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                                {mapping ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#50cc7f', fontWeight: 700 }}>{mapping.weightage || 100}%</span>
                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{mapping.level || 'Medium'}</span>
                                  </div>
                                ) : <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.15)' }}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: CLO→GA MATRIX ── */}
      {activeTab === 'matrixga' && (
        <div>
          {matrixGAData.length === 0 ? (
            <div className="glass-panel-dash" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No GAs mapped yet for any course.</div>
          ) : matrixGAData.map(({ course, clos: crsCLOs, gas: crsGAs }) => (
            <div key={course._id} className="glass-panel-dash" style={{ marginBottom: '20px', padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>{course.code} — {course.name}</h3>
                <span style={{ fontSize: '0.75rem', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', padding: '3px 10px', borderRadius: 20 }}>{crsCLOs.length} CLOs</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px 0 0 0' }}>CLO / GA</th>
                      {crsGAs.map(ga => (
                        <th key={ga._id} style={{ padding: '8px 14px', textAlign: 'center', color: '#ff9800', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(255,152,0,0.07)', whiteSpace: 'nowrap', borderRadius: 4 }}>
                          {ga.code}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crsCLOs.map(clo => (
                      <tr key={clo._id}>
                        <td style={{ padding: '8px 12px', color: '#bc13fe', fontWeight: 600, fontSize: '0.82rem', background: 'rgba(188,19,254,0.05)', borderRadius: 4, whiteSpace: 'nowrap' }}>
                          {clo.code}
                        </td>
                        {crsGAs.map(ga => {
                          const mapping = (clo.gas || []).find(g => g.ga?._id === ga._id || g.ga === ga._id || g._id === ga._id || g === ga._id);
                          return (
                            <td key={ga._id} style={{ textAlign: 'center', padding: '8px', background: mapping ? 'rgba(255,152,0,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                              {mapping ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.9rem', color: '#ff9800', fontWeight: 700 }}>{mapping.weightage || 100}%</span>
                                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{mapping.level || 'Medium'}</span>
                                </div>
                              ) : <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.15)' }}>—</span>}
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

      {/* ── TAB 4: SUMMARY (Weightage Check) ── */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {weightageSummary.map(({ course, clos: courseCLOs, totalW }) => (
            <div key={course._id} className="glass-panel-dash" style={{ padding: '1.2rem', borderRadius: 12, borderTop: totalW !== 100 ? '3px solid #ff1b6b' : '3px solid #50cc7f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{course.code}</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{course.name}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: totalW === 100 ? '#50cc7f' : totalW > 100 ? '#ff1b6b' : '#ffc107' }}>{totalW}%</span>
                  {totalW !== 100 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#ff1b6b', marginTop: 2 }}>
                      <AlertTriangle size={10} /> {totalW < 100 ? 'Under 100%' : 'Exceeds 100%'}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {courseCLOs.map(c => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                    <span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700, width: 45, textAlign: 'center' }}>
                      {c.code}
                    </span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.weightage}%`, background: '#bc13fe' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', width: 25, textAlign: 'right' }}>{c.weightage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {weightageSummary.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
              No CLOs added to any course yet.
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '580px', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#bc13fe' }}>{editingId ? '✏️ Edit CLO' : '➕ Create CLO'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Course <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="course" value={formData.course} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>CLO Code <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. CLO-1" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Weightage (%) <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="number" name="weightage" value={formData.weightage} onChange={handleChange} required min="1" max="100" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Bloom's Level <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="bloomsLevel" value={formData.bloomsLevel} onChange={handleBloomsChange} style={{ width: '100%', padding: '10px' }}>
                  {BLOOMS.map((b, i) => <option key={b} value={b}>L{i + 1} – {b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Domain</label>
                <select className="filter-select" name="bloomsDomain" value={formData.bloomsDomain} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Status</label>
                <select className="filter-select" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description <span style={{ color: '#ff1b6b' }}>*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} required rows="3"
                  placeholder="At the end of the course, students will be able to..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading} className="primary-btn">
                  {loading ? <Loader2 className="spinner" size={16} /> : (editingId ? '✔ Update CLO' : '✔ Save CLO')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PLO Mapping Modal ── */}
      {showMapPLOModal && mappingCLO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#50cc7f' }}>🔗 Map CLO → PLOs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#bc13fe' }}>{mappingCLO.code}</strong>: {mappingCLO.description}
                </p>
              </div>
              <button onClick={() => setShowMapPLOModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {coursePLOs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No PLOs found for this course's program.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                {coursePLOs.map(plo => {
                  const mapped = selectedPLOs.find(x => x.plo === plo._id);
                  const isSelected = !!mapped;
                  return (
                    <div key={plo._id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '13px 16px', borderRadius: '10px', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(80,204,127,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(80,204,127,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      <div onClick={() => togglePLO(plo._id)} style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? '#50cc7f' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#50cc7f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {isSelected && <CheckCircle size={13} color="#000" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div onClick={() => togglePLO(plo._id)} style={{ cursor: 'pointer' }}>
                          <strong style={{ color: isSelected ? '#50cc7f' : '#fff', fontSize: '0.88rem' }}>{plo.code}</strong>
                          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.4 }}>{plo.description}</p>
                        </div>
                        {isSelected && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Weightage (%)</label>
                              <input type="number" min="0" max="100" value={mapped.weightage} onChange={(e) => updatePLOMapping(plo._id, 'weightage', Number(e.target.value))} className="search-input" style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Level</label>
                              <select value={mapped.level} onChange={(e) => updatePLOMapping(plo._id, 'level', e.target.value)} className="filter-select" style={{ width: '100%', padding: '6px' }}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>
                        )}
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

      {/* ── GA Mapping Modal ── */}
      {showMapGAModal && mappingCLO && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '520px', padding: '2rem', borderRadius: '16px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#ff9800' }}>🔗 Map CLO → GAs</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: '#bc13fe' }}>{mappingCLO.code}</strong>: {mappingCLO.description}
                </p>
              </div>
              <button onClick={() => setShowMapGAModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {courseGAs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No GAs found for this course's program.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
                {courseGAs.map(ga => {
                  const mapped = selectedGAs.find(x => x.ga === ga._id);
                  const isSelected = !!mapped;
                  return (
                    <div key={ga._id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '13px 16px', borderRadius: '10px', transition: 'all 0.2s',
                      background: isSelected ? 'rgba(255,152,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(255,152,0,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      <div onClick={() => toggleGA(ga._id)} style={{ width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, marginTop: 1, border: `2px solid ${isSelected ? '#ff9800' : 'rgba(255,255,255,0.2)'}`, background: isSelected ? '#ff9800' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        {isSelected && <CheckCircle size={13} color="#000" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div onClick={() => toggleGA(ga._id)} style={{ cursor: 'pointer' }}>
                          <strong style={{ color: isSelected ? '#ff9800' : '#fff', fontSize: '0.88rem' }}>{ga.code} - {ga.name}</strong>
                          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', lineHeight: 1.4 }}>{ga.description}</p>
                        </div>
                        {isSelected && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Weightage (%)</label>
                              <input type="number" min="0" max="100" value={mapped.weightage} onChange={(e) => updateGAMapping(ga._id, 'weightage', Number(e.target.value))} className="search-input" style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Level</label>
                              <select value={mapped.level} onChange={(e) => updateGAMapping(ga._id, 'level', e.target.value)} className="filter-select" style={{ width: '100%', padding: '6px' }}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>
                        )}
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

export default CLOManagement;
