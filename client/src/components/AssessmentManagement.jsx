import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAssessmentSettings, createAssessmentSetting, updateAssessmentSetting, deleteAssessmentSetting, clearAssessmentMessages 
} from '../store/assessmentSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, X, Loader2, List, ClipboardList, AlertTriangle, Eye, Activity } from 'lucide-react';
import '../style/UniversityAdminDashboard.css';

const TYPES = ['Quiz', 'Assignment', 'Lab', 'Presentation', 'Project', 'Mid', 'Final', 'Viva'];

const WeightageBar = ({ value, total }) => {
  const pct = Math.min(value, 100);
  const color = total > 100 ? '#ff1b6b' : total === 100 ? '#50cc7f' : '#ff9800';
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
        color: active === tab.id ? '#ff5757' : 'rgba(255,255,255,0.5)',
        borderBottom: active === tab.id ? '2px solid #ff5757' : '2px solid transparent',
      }}>
        <tab.icon size={15} /> {tab.label}
      </button>
    ))}
  </div>
);

const AssessmentManagement = () => {
  const dispatch = useDispatch();
  const { settings, loading, error, successMessage } = useSelector(state => state.assessment);
  

  const { records } = useSelector(state => state.academic);
  const programs = records.programs || [];

  const [activeTab, setActiveTab]         = useState('list');
  const [toast, setToast]                 = useState(null);
  const [filterProgram, setFilterProgram] = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const pendingAction                     = useRef(null);

  const initialForm = { program: '', type: 'Quiz', weightage: '', totalMarks: '', passingMarks: '', status: 'Active' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    dispatch(fetchAssessmentSettings());
    dispatch(fetchAcademicData('programs'));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      setToast({ msg: pendingAction.current || successMessage, type: 'success' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearAssessmentMessages());
      setFormData(initialForm);
      setShowModal(false);
    }
    if (error) {
      setToast({ msg: error, type: 'error' });
      setTimeout(() => setToast(null), 5000);
      dispatch(clearAssessmentMessages());
    }
  }, [successMessage, error, dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    pendingAction.current = editingId ? 'Assessment updated!' : 'Assessment created!';
    if (editingId) dispatch(updateAssessmentSetting({ id: editingId, payload: formData }));
    else dispatch(createAssessmentSetting(formData));
  };

  const handleEdit = (setting) => {
    setEditingId(setting._id);
    setFormData({
      program: setting.program?._id || '', 
      type: setting.type,
      weightage: setting.weightage,
      totalMarks: setting.totalMarks,
      passingMarks: setting.passingMarks,
      status: setting.status
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this assessment setting?')) {
      pendingAction.current = 'Assessment deleted!';
      dispatch(deleteAssessmentSetting(id));
    }
  };

  const filtered = useMemo(() => (settings || []).filter(s => 
    (!filterProgram || s.program?._id === filterProgram)
  ), [settings, filterProgram]);

  // Program grading policy summary
  const programPolicies = useMemo(() => programs.map(prog => {
    const progSettings = settings.filter(s => s.program?._id === prog._id && s.status === 'Active');
    const totalW = progSettings.reduce((acc, s) => acc + (s.weightage || 0), 0);
    return { program: prog, settings: progSettings, totalW };
  }).filter(p => p.settings.length > 0), [programs, settings]);

  const TABS = [
    { id: 'list',    label: 'Manage Assessments',  icon: List },
    { id: 'summary', label: 'Grading Policies',    icon: Eye },
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
          <h2 style={{ margin: 0, color: '#ff5757', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={24} /> Assessment Management
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>Configure grading policies, weightages, and standard marks for each assessment type per program.</p>
        </div>
        {activeTab === 'list' && (
          <button className="page-btn primary-btn" onClick={() => { setEditingId(null); setFormData(initialForm); setShowModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #ff5757, #d32f2f)' }}>
            <Plus size={18} /> Add Assessment
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total Assessments', value: settings.length, color: '#ff5757', bg: 'rgba(255,87,87,0.1)', Icon: ClipboardList },
          { label: 'Active Policies', value: settings.filter(s => s.status === 'Active').length, color: '#50cc7f', bg: 'rgba(80,204,127,0.1)', Icon: Activity },
          { label: 'Programs Configured', value: programPolicies.length, color: '#0ff0fc', bg: 'rgba(15,240,252,0.1)', Icon: Eye },
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
            <select className="filter-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">All Programs</option>
              {programs.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
            </select>
          </div>
          <div className="table-container">
            <table className="glass-table" style={{ width: '100%' }}>
              <thead><tr><th>#</th><th>Program</th><th>Assessment Type</th><th>Total Marks</th><th>Passing Marks</th><th>Weightage</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
              <tbody>
                {loading && settings.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} color="#ff5757" /></td></tr>
                ) : filtered.map((setting, i) => (
                  <tr key={setting._id}>
                    <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td><span style={{ background: 'rgba(15,240,252,0.12)', color: '#0ff0fc', padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>{setting.program?.code || '—'}</span></td>
                    <td><strong style={{ color: '#ff5757' }}>{setting.type}</strong></td>
                    <td><span style={{ color: '#fff', fontWeight: 600 }}>{setting.totalMarks}</span></td>
                    <td><span style={{ color: '#ff9800', fontWeight: 600 }}>{setting.passingMarks}</span></td>
                    <td style={{ minWidth: 100 }}><WeightageBar value={setting.weightage || 0} total={100} /></td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        background: setting.status === 'Active' ? 'rgba(80,204,127,0.12)' : 'rgba(255,27,107,0.12)',
                        color: setting.status === 'Active' ? '#50cc7f' : '#ff1b6b',
                        border: `1px solid ${setting.status === 'Active' ? 'rgba(80,204,127,0.3)' : 'rgba(255,27,107,0.3)'}` }}>
                        {setting.status}
                      </span>
                    </td>
                    <td className="actions-col" style={{ justifyContent: 'center', gap: 5 }}>
                      <button className="action-btn edit" onClick={() => handleEdit(setting)}><Edit2 size={14} /></button>
                      <button className="action-btn delete" onClick={() => handleDelete(setting._id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.4)' }}>No assessment settings found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: SUMMARY ── */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {programPolicies.map(({ program, settings: progSettings, totalW }) => (
            <div key={program._id} className="glass-panel-dash" style={{ padding: '1.5rem', borderRadius: 12, borderTop: totalW !== 100 ? '3px solid #ff1b6b' : '3px solid #50cc7f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{program.code}</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{program.name}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: totalW === 100 ? '#50cc7f' : totalW > 100 ? '#ff1b6b' : '#ff9800' }}>{totalW}%</span>
                  {totalW !== 100 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#ff1b6b', marginTop: 2 }}>
                      <AlertTriangle size={10} /> {totalW < 100 ? 'Under 100% (Incomplete)' : 'Exceeds 100%'}
                    </span>
                  )}
                  {totalW === 100 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#50cc7f', marginTop: 2 }}>
                      Valid Policy
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {progSettings.map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <span style={{ background: 'rgba(255,87,87,0.12)', color: '#ff5757', padding: '3px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, width: 90, textAlign: 'center' }}>
                      {s.type}
                    </span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.weightage}%`, background: '#ff5757' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{s.weightage}%</span>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>({s.passingMarks}/{s.totalMarks})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {programPolicies.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
              No active grading policies found. Configure assessments first.
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="glass-panel-dash" style={{ width: '500px', padding: '2rem', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 90px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#ff5757' }}>{editingId ? '✏️ Edit Assessment' : '➕ Add Assessment'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Program <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="program" value={formData.program} onChange={handleChange} required style={{ width: '100%', padding: '10px' }} disabled={editingId}>
                  <option value="">Select Program</option>
                  {programs.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assessment Type <span style={{ color: '#ff1b6b' }}>*</span></label>
                <select className="filter-select" name="type" value={formData.type} onChange={handleChange} required style={{ width: '100%', padding: '10px' }} disabled={editingId}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Weightage (%) <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="number" name="weightage" value={formData.weightage} onChange={handleChange} required min="1" max="100" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Total Marks <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} required min="1" className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group">
                <label>Passing Marks <span style={{ color: '#ff1b6b' }}>*</span></label>
                <input type="number" name="passingMarks" value={formData.passingMarks} onChange={handleChange} required min="1" max={formData.totalMarks} className="search-input" style={{ width: '100%', padding: '10px' }} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Status</label>
                <select className="filter-select" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading} className="primary-btn">
                  {loading ? <Loader2 className="spinner" size={16} /> : (editingId ? '✔ Update Policy' : '✔ Save Policy')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentManagement;
