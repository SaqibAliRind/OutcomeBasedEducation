import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCurriculums, 
  createCurriculum, 
  updateCurriculum, 
  deleteCurriculum, 
  cloneCurriculum,
  clearCurriculumMessages 
} from '../store/curriculumSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { Plus, Edit2, Trash2, Search, X, Loader2, BookMarked, Layers, Copy } from 'lucide-react';
import CurriculumBuilder from './CurriculumBuilder';
import '../style/UniversityAdminDashboard.css';

const Curriculum = () => {
  const dispatch = useDispatch();
  
  // States from Redux
  const { curriculums, loading, error, successMessage } = useSelector(state => state.curriculum);
  const { records } = useSelector(state => state.academic);
  const programs = records.programs || [];
  const departments = records.departments || [];

  // Local state
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Builder View State
  const [activeBuilderCurriculum, setActiveBuilderCurriculum] = useState(null);
  
  const initialFormState = {
    name: '', version: '', program: '', department: '', description: '', status: 'Draft',
    degreeLevel: 'BS', totalCreditHours: '', totalSemesters: '', effectiveFrom: '', effectiveTo: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const pendingAction = useRef(null);

  // Initial Fetch
  useEffect(() => {
    dispatch(fetchCurriculums());
    dispatch(fetchAcademicData('programs'));
    dispatch(fetchAcademicData('departments'));
  }, [dispatch]);

  // Toast Handling
  useEffect(() => {
    if (successMessage) {
      setToast({ msg: pendingAction.current || successMessage, type: 'success' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearCurriculumMessages());
      setFormData(initialFormState);
      setShowModal(false);
    }
    if (error) {
      setToast({ msg: error, type: 'error' });
      setTimeout(() => setToast(null), 4000);
      dispatch(clearCurriculumMessages());
    }
  }, [successMessage, error, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    pendingAction.current = editingId ? 'Curriculum updated successfully!' : 'Curriculum created successfully!';
    if (editingId) {
      dispatch(updateCurriculum({ id: editingId, payload: formData }));
    } else {
      dispatch(createCurriculum(formData));
    }
  };

  const handleEdit = (curriculum) => {
    setEditingId(curriculum._id);
    setFormData({
      name: curriculum.name,
      version: curriculum.version,
      program: curriculum.program?._id || '',
      department: curriculum.department?._id || '',
      description: curriculum.description || '',
      status: curriculum.status,
      degreeLevel: curriculum.degreeLevel || 'BS',
      totalCreditHours: curriculum.totalCreditHours || '',
      totalSemesters: curriculum.totalSemesters || '',
      effectiveFrom: curriculum.effectiveFrom ? curriculum.effectiveFrom.substring(0, 10) : '',
      effectiveTo: curriculum.effectiveTo ? curriculum.effectiveTo.substring(0, 10) : ''
    });
    setShowModal(true);
  };

  const handleClone = (curriculum) => {
    if (window.confirm('Are you sure you want to create a copy of this curriculum?')) {
      pendingAction.current = 'Curriculum cloned successfully!';
      const payload = {
        newName: `${curriculum.name} (Copy)`
      };
      dispatch(cloneCurriculum({ id: curriculum._id, payload }));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      pendingAction.current = 'Curriculum deleted successfully!';
      dispatch(deleteCurriculum(id));
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  // Filter curriculums
  const filtered = (curriculums || []).filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.version?.toLowerCase().includes(search.toLowerCase()) ||
    c.program?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // If in Builder View, render CurriculumBuilder
  if (activeBuilderCurriculum) {
    return (
      <CurriculumBuilder 
        curriculum={activeBuilderCurriculum} 
        onBack={() => setActiveBuilderCurriculum(null)} 
      />
    );
  }

  return (
    <div className="">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`} style={{
          position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', 
          borderRadius: '8px', zIndex: 1000, color: '#fff',
          background: toast.type === 'success' ? 'rgba(80,204,127,0.9)' : 'rgba(255,27,107,0.9)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
              <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BookMarked size={24} /> Curriculum Management
              </h2>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.45)' }}>Manage academic curriculums and versions.</p>
          </div>
          <button className="page-btn primary-btn" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Create Curriculum
          </button>
      </div>

      <div className="glass-panel-dash" style={{ borderRadius: '12px', padding: '1.5rem' }}>
        {/* Search */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input type="text" className="search-input" placeholder="Search curriculums..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px', width: '100%' }} />
            </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="glass-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Curriculum Name</th>
                <th>Version</th>
                <th>Program</th>
                <th>Department</th>
                <th>Degree</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && curriculums.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={32} color="#0ff0fc" /></td></tr>
              ) : filtered.map((curr) => (
                <tr key={curr._id}>
                  <td><strong>{curr.name}</strong></td>
                  <td>
                    <span style={{ background: 'rgba(188,19,254,0.12)', color: '#bc13fe', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(188,19,254,0.3)' }}>
                      {curr.version}
                    </span>
                  </td>
                  <td>{curr.program?.name || '—'}</td>
                  <td>{curr.department?.name || '—'}</td>
                  <td>{curr.degreeLevel || '—'}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                      background: curr.status === 'Active' ? 'rgba(80,204,127,0.12)' : curr.status === 'Archived' ? 'rgba(255,255,255,0.1)' : curr.status === 'Draft' ? 'rgba(255,204,0,0.12)' : 'rgba(255,27,107,0.12)',
                      color: curr.status === 'Active' ? '#50cc7f' : curr.status === 'Archived' ? '#aaa' : curr.status === 'Draft' ? '#ffcc00' : '#ff1b6b',
                      border: `1px solid ${curr.status === 'Active' ? 'rgba(80,204,127,0.3)' : curr.status === 'Archived' ? 'rgba(255,255,255,0.2)' : curr.status === 'Draft' ? 'rgba(255,204,0,0.3)' : 'rgba(255,27,107,0.3)'}`
                    }}>
                      {curr.status}
                    </span>
                  </td>
                  <td className="actions-col" style={{ justifyContent: 'center' }}>
                    <button className="action-btn" title="Open Builder" onClick={() => setActiveBuilderCurriculum(curr)} style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)' }}>
                      <Layers size={16} /> Builder
                    </button>
                    <button className="action-btn edit" title="Clone Curriculum" onClick={() => handleClone(curr)}>
                      <Copy size={16} />
                    </button>
                    <button className="action-btn edit" title="Edit Curriculum" onClick={() => handleEdit(curr)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn delete" title="Delete Curriculum" onClick={() => handleDelete(curr._id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No curriculums found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add/Edit Modal ─────────────────── */}
      {showModal && (
          <div className="modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }}>
              <div className="modal-content glass-panel-dash" style={{ width: '520px', padding: '1.5rem', borderRadius: '14px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: '#fff' }}>{editingId ? 'Edit Curriculum' : 'Create Curriculum'}</h3>
                      <button className="close-btn" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                  </div>
                  
                  <form className="modal-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Curriculum Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. BSCS Syllabus 2024" className="search-input" style={{ width: '100%', padding: '10px' }} />
                      </div>

                      <div className="form-group">
                          <label>Version</label>
                          <input type="text" name="version" value={formData.version} onChange={handleChange} required placeholder="e.g. v1.0 or 2024-2028" className="search-input" style={{ width: '100%', padding: '10px' }} />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Program</label>
                          <select className="filter-select" name="program" value={formData.program} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                              <option value="">Select Program</option>
                              {programs?.map(prog => (
                                  <option key={prog._id} value={prog._id}>{prog.name} ({prog.code})</option>
                              ))}
                          </select>
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Department</label>
                          <select className="filter-select" name="department" value={formData.department} onChange={handleChange} required style={{ width: '100%', padding: '10px' }}>
                              <option value="">Select Department</option>
                              {departments?.map(dept => (
                                  <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                              ))}
                          </select>
                      </div>

                      <div className="form-group">
                          <label>Degree Level</label>
                          <select className="filter-select" name="degreeLevel" value={formData.degreeLevel} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                              <option value="BS">BS</option>
                              <option value="MS">MS</option>
                              <option value="MPhil">MPhil</option>
                              <option value="PhD">PhD</option>
                          </select>
                      </div>

                      <div className="form-group">
                          <label>Status</label>
                          <select className="filter-select" name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
                              <option value="Draft">Draft</option>
                              <option value="Active">Active</option>
                              <option value="Archived">Archived</option>
                              <option value="Deprecated">Deprecated</option>
                          </select>
                      </div>

                      <div className="form-group">
                          <label>Total Credit Hours</label>
                          <input type="number" name="totalCreditHours" value={formData.totalCreditHours} onChange={handleChange} className="search-input" style={{ width: '100%', padding: '10px' }} />
                      </div>

                      <div className="form-group">
                          <label>Total Semesters</label>
                          <input type="number" name="totalSemesters" value={formData.totalSemesters} onChange={handleChange} className="search-input" style={{ width: '100%', padding: '10px' }} />
                      </div>

                      <div className="form-group">
                          <label>Effective From</label>
                          <input type="date" name="effectiveFrom" value={formData.effectiveFrom} onChange={handleChange} className="search-input" style={{ width: '100%', padding: '10px' }} />
                      </div>

                      <div className="form-group">
                          <label>Effective To</label>
                          <input type="date" name="effectiveTo" value={formData.effectiveTo} onChange={handleChange} className="search-input" style={{ width: '100%', padding: '10px' }} />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Description</label>
                          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" 
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '6px' }}></textarea>
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button type="button" className="page-btn" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                              Cancel
                          </button>
                          <button type="submit" className="primary-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {loading ? <Loader2 className="spinner" size={16} /> : (editingId ? 'Update Curriculum' : 'Save Curriculum')}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Curriculum;