import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  addCurriculumCourse, 
  removeCurriculumCourse, 
  updateCurriculumPrerequisites,
  updateCourseType,
  reorderSemesterCourses
} from '../store/curriculumSlice';
import { fetchAcademicData } from '../store/academicSlice';
import { ArrowLeft, Plus, Trash2, BookOpen, Clock, Activity, CheckCircle, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown, Map } from 'lucide-react';

const CurriculumBuilder = ({ curriculum, onBack }) => {
  const dispatch = useDispatch();
  
  const { records } = useSelector(state => state.academic);
  const coursesList = records.courses || [];

  const [expandedSemesters, setExpandedSemesters] = useState([1]);
  const [showAddCourse, setShowAddCourse] = useState(null); // semesterNumber
  const [showPrereqModal, setShowPrereqModal] = useState(null); // courseId

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedPrereqs, setSelectedPrereqs] = useState([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicData('courses'));
  }, [dispatch]);

  const toggleSemester = (semNum) => {
    setExpandedSemesters(prev => 
      prev.includes(semNum) ? prev.filter(s => s !== semNum) : [...prev, semNum]
    );
  };

  const handleAddCourse = (semesterNumber) => {
    if (!selectedCourse) return;
    dispatch(addCurriculumCourse({ 
      id: curriculum._id, 
      payload: { semesterNumber, courseId: selectedCourse } 
    }));
    setSelectedCourse('');
    setShowAddCourse(null);
  };

  const handleRemoveCourse = (courseId) => {
    if (window.confirm('Remove this course from the curriculum?')) {
      dispatch(removeCurriculumCourse({ id: curriculum._id, courseId }));
    }
  };

  const openPrereqModal = (courseMapping) => {
    setSelectedPrereqs(courseMapping.prerequisites.map(p => p._id));
    setShowPrereqModal(courseMapping.course._id);
  };

  const handleSavePrereqs = () => {
    dispatch(updateCurriculumPrerequisites({
      id: curriculum._id,
      courseId: showPrereqModal,
      payload: { prerequisites: selectedPrereqs }
    }));
    setShowPrereqModal(null);
  };

  const handleTypeChange = (courseId, newType) => {
    dispatch(updateCourseType({
      id: curriculum._id,
      courseId,
      payload: { courseType: newType }
    }));
  };

  const handleMoveCourse = (semesterNumber, currentIndex, direction) => {
    const semData = (curriculum.semesters || []).find(s => s.semesterNumber === semesterNumber);
    if (!semData) return;
    
    let courses = [...semData.courses];
    if (direction === 'up' && currentIndex > 0) {
      const temp = courses[currentIndex];
      courses[currentIndex] = courses[currentIndex - 1];
      courses[currentIndex - 1] = temp;
    } else if (direction === 'down' && currentIndex < courses.length - 1) {
      const temp = courses[currentIndex];
      courses[currentIndex] = courses[currentIndex + 1];
      courses[currentIndex + 1] = temp;
    } else {
      return; // Can't move further
    }

    const orderedCourseIds = courses.map(c => c.course._id);
    dispatch(reorderSemesterCourses({
      id: curriculum._id,
      semesterNumber,
      payload: { orderedCourseIds }
    }));
  };

  // Calculate totals
  let totalCredits = 0;
  let theoryCredits = 0;
  let labCredits = 0;

  (curriculum.semesters || []).forEach(sem => {
    sem.courses.forEach(c => {
      const cr = c.course.creditHours || 0;
      const th = c.course.theoryCreditHours || (c.course.type === 'Theory' || c.course.type === 'Theory + Lab' ? cr : 0);
      const lb = c.course.labCreditHours || (c.course.type === 'Lab' ? cr : 0);
      
      totalCredits += cr;
      theoryCredits += th;
      labCredits += lb;
    });
  });

  // Group semesters 1 to 8 (default for BS)
  const maxSemester = Math.max(8, ...(curriculum.semesters?.map(s => s.semesterNumber) || []));
  const semesterBlocks = Array.from({ length: maxSemester }, (_, i) => i + 1);

  return (
    <div className="curriculum-builder">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="action-btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, color: '#fff' }}>{curriculum.name} Builder</h2>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              {curriculum.program?.name} | {curriculum.version}
            </p>
          </div>
        </div>
        <button className="page-btn primary-btn" onClick={() => setShowMap(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Map size={18} /> View Curriculum Map
        </button>
      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <div className="glass-panel-dash" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: 'rgba(80,204,127,0.15)', padding: '12px', borderRadius: '50%' }}>
            <BookOpen size={24} color="#50cc7f" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{totalCredits}</h3>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Total Credit Hours</span>
          </div>
        </div>
        <div className="glass-panel-dash" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: 'rgba(15,240,252,0.15)', padding: '12px', borderRadius: '50%' }}>
            <Activity size={24} color="#0ff0fc" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{theoryCredits}</h3>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Theory Credit Hours</span>
          </div>
        </div>
        <div className="glass-panel-dash" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
          <div style={{ background: 'rgba(188,19,254,0.15)', padding: '12px', borderRadius: '50%' }}>
            <Clock size={24} color="#bc13fe" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{labCredits}</h3>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Lab Credit Hours</span>
          </div>
        </div>
      </div>

      {/* Semester Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {semesterBlocks.map(semNum => {
          const semData = (curriculum.semesters || []).find(s => s.semesterNumber === semNum);
          const semCourses = semData ? semData.courses : [];
          const isExpanded = expandedSemesters.includes(semNum);
          
          let semCredits = 0;
          semCourses.forEach(c => semCredits += (c.course.creditHours || 0));

          return (
            <div key={semNum} className="glass-panel-dash" style={{ padding: '0', overflow: 'hidden' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                onClick={() => toggleSemester(semNum)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isExpanded ? <ChevronDown size={18} color="#0ff0fc" /> : <ChevronRight size={18} color="rgba(255,255,255,0.5)" />}
                  <h4 style={{ margin: 0, color: '#fff' }}>Semester {semNum}</h4>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#ddd' }}>
                    {semCourses.length} Courses
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  {semCredits} Cr Hours
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  
                  {semCourses.length > 0 ? (
                    <table className="glass-table" style={{ width: '100%', marginBottom: '15px' }}>
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Title</th>
                          <th>Credits</th>
                          <th>Type</th>
                          <th>Prerequisites</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semCourses.map((c, index) => (
                          <tr key={c.course._id}>
                            <td><strong>{c.course.code}</strong></td>
                            <td>{c.course.name}</td>
                            <td>
                                {c.course.creditHours} <span style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.5)'}}>({c.course.theoryCreditHours || c.course.creditHours}+{c.course.labCreditHours || 0})</span>
                            </td>
                            <td>
                               <select 
                                 className="filter-select"
                                 value={c.courseType || 'Core'}
                                 onChange={(e) => handleTypeChange(c.course._id, e.target.value)}
                                 style={{ padding: '4px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                               >
                                 <option value="Core">Core</option>
                                 <option value="Elective">Elective</option>
                               </select>
                            </td>
                            <td>
                              {c.prerequisites.length > 0 ? (
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                  {c.prerequisites.map(p => (
                                    <span key={p._id} style={{ background: 'rgba(255,193,7,0.15)', color: '#ffc107', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', border: '1px solid rgba(255,193,7,0.3)' }}>
                                      {p.code}
                                    </span>
                                  ))}
                                </div>
                              ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>None</span>}
                            </td>
                            <td className="actions-col" style={{ justifyContent: 'center', gap: '5px' }}>
                              <button className="action-btn" title="Move Up" onClick={() => handleMoveCourse(semNum, index, 'up')} style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <ArrowUp size={14} />
                              </button>
                              <button className="action-btn" title="Move Down" onClick={() => handleMoveCourse(semNum, index, 'down')} style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <ArrowDown size={14} />
                              </button>
                              <button className="action-btn" title="Manage Prerequisites" onClick={() => openPrereqModal(c)} style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <CheckCircle size={14} color="#0ff0fc" />
                              </button>
                              <button className="action-btn delete" title="Remove Course" onClick={() => handleRemoveCourse(c.course._id)}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                      No courses assigned to Semester {semNum}.
                    </div>
                  )}

                  {showAddCourse === semNum ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <select 
                        className="filter-select" 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={{ flex: 1, padding: '8px' }}
                      >
                        <option value="">Select a Course...</option>
                        {coursesList.map(course => (
                          <option key={course._id} value={course._id}>{course.code} - {course.name} ({course.creditHours} Cr)</option>
                        ))}
                      </select>
                      <button className="primary-btn" onClick={() => handleAddCourse(semNum)} style={{ padding: '8px 15px' }}>Add</button>
                      <button className="action-btn" onClick={() => setShowAddCourse(null)} style={{ background: 'transparent' }}><X size={18} /></button>
                    </div>
                  ) : (
                    <button 
                      className="page-btn" 
                      style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px dashed rgba(15,240,252,0.3)', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '10px' }}
                      onClick={() => setShowAddCourse(semNum)}
                    >
                      <Plus size={16} /> Assign Course to Semester {semNum}
                    </button>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prerequisite Modal */}
      {showPrereqModal && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
            <div className="modal-content glass-panel-dash" style={{ width: '450px', padding: '1.5rem', borderRadius: '14px' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#fff' }}>Manage Prerequisites</h3>
                    <button className="close-btn" onClick={() => setShowPrereqModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Select Prerequisite Courses</label>
                    <select 
                      multiple
                      className="filter-select" 
                      value={selectedPrereqs} 
                      onChange={(e) => {
                        const options = [...e.target.options];
                        setSelectedPrereqs(options.filter(o => o.selected).map(o => o.value));
                      }}
                      style={{ width: '100%', padding: '10px', height: '150px' }}
                    >
                        {coursesList.map(course => (
                            <option key={course._id} value={course._id}>{course.code} - {course.name}</option>
                        ))}
                    </select>
                    <small style={{ color: 'rgba(255,255,255,0.4)', marginTop: '5px', display: 'block' }}>Hold CTRL or CMD to select multiple.</small>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="page-btn" onClick={() => setShowPrereqModal(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                        Cancel
                    </button>
                    <button type="button" className="primary-btn" onClick={handleSavePrereqs}>
                        Save Prerequisites
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Curriculum Map Modal */}
      {showMap && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
            <div className="modal-content glass-panel-dash" style={{ width: '90vw', height: '90vh', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '10px' }}><Map size={24} /> Curriculum Map</h2>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)' }}>{curriculum.name} ({curriculum.version})</p>
                    </div>
                    <button className="page-btn" onClick={() => window.print()} style={{ marginRight: '15px' }}>Print Map</button>
                    <button className="close-btn" onClick={() => setShowMap(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {semesterBlocks.map(semNum => {
                            const semData = (curriculum.semesters || []).find(s => s.semesterNumber === semNum);
                            const semCourses = semData ? semData.courses : [];
                            let semCredits = 0;
                            semCourses.forEach(c => semCredits += (c.course.creditHours || 0));

                            return (
                                <div key={semNum} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Semester {semNum}</h3>
                                        <span style={{ fontSize: '0.8rem', color: '#0ff0fc', background: 'rgba(15,240,252,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{semCredits} Cr</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {semCourses.length === 0 ? (
                                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No Courses</div>
                                        ) : semCourses.map(c => (
                                            <div key={c.course._id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', borderLeft: `3px solid ${c.courseType === 'Core' ? '#50cc7f' : '#bc13fe'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{c.course.code}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{c.courseType || 'Core'}</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '5px' }}>{c.course.name}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                                    <span style={{ color: '#aaa' }}>{c.course.creditHours} Credits</span>
                                                    {c.prerequisites.length > 0 && (
                                                        <span style={{ color: '#ffc107', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <CheckCircle size={10} /> Pre: {c.prerequisites.map(p => p.code).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumBuilder;
