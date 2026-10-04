import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchTeacherProfile, updatePersonalInfo, updateProfessionalInfo,
    addQualification, deleteQualification,
    addExperience, deleteExperience,
    uploadDocument, deleteDocument,
    clearMessages
} from '../../../store/teacherProfileSlice';
import {
    ArrowLeft, User, Briefcase, GraduationCap, Clock, FileText,
    Plus, Trash2, Save, Upload, Loader2, X, CheckCircle, AlertCircle,
    Calendar, Phone, MapPin, Droplet, UserCog, BookOpen, FlaskConical, ExternalLink
} from 'lucide-react';

const TAB_ICONS = {
    personal:     { icon: User,        label: 'Personal Info' },
    professional: { icon: Briefcase,   label: 'Professional' },
    qualifications:{ icon: GraduationCap, label: 'Qualifications' },
    experience:   { icon: Clock,       label: 'Experience' },
    documents:    { icon: FileText,    label: 'Documents' }
};

const TeacherProfileView = ({ teacher, onBack }) => {
    const dispatch = useDispatch();
    const { profile, loading, saving, error, successMessage } = useSelector(s => s.teacherProfile);
    const [activeTab, setActiveTab] = useState('personal');

    // Form states
    const [personalForm, setPersonalForm]     = useState({ dob: '', gender: '', address: '', bloodGroup: '', emergencyContact: '' });
    const [professionalForm, setProfForm]     = useState({ designation: '', department: '', joiningDate: '', specialization: '', researchInterests: '' });
    const [qualModal, setQualModal]           = useState(false);
    const [expModal, setExpModal]             = useState(false);
    const [qualForm, setQualForm]             = useState({ degree: '', institution: '', year: '', grade: '' });
    const [expForm, setExpForm]               = useState({ title: '', organization: '', startDate: '', endDate: '', description: '' });
    const [docName, setDocName]               = useState('');
    const [docFile, setDocFile]               = useState(null);

    useEffect(() => {
        if (teacher?._id) dispatch(fetchTeacherProfile(teacher._id));
    }, [teacher, dispatch]);

    useEffect(() => {
        if (profile) {
            const p = profile.personalInfo || {};
            setPersonalForm({
                dob: p.dob ? p.dob.slice(0, 10) : '',
                gender: p.gender || '',
                address: p.address || '',
                bloodGroup: p.bloodGroup || '',
                emergencyContact: p.emergencyContact || ''
            });
            const pr = profile.professionalInfo || {};
            setProfForm({
                designation: pr.designation || '',
                department: pr.department?._id || pr.department || '',
                joiningDate: pr.joiningDate ? pr.joiningDate.slice(0, 10) : '',
                specialization: pr.specialization || '',
                researchInterests: pr.researchInterests || ''
            });
        }
    }, [profile]);

    useEffect(() => {
        if (successMessage) {
            const t = setTimeout(() => dispatch(clearMessages()), 3000);
            return () => clearTimeout(t);
        }
    }, [successMessage, dispatch]);

    const handleSavePersonal = (e) => {
        e.preventDefault();
        dispatch(updatePersonalInfo({ userId: teacher._id, data: personalForm }));
    };

    const handleSaveProfessional = (e) => {
        e.preventDefault();
        dispatch(updateProfessionalInfo({ userId: teacher._id, data: professionalForm }));
    };

    const handleAddQual = (e) => {
        e.preventDefault();
        dispatch(addQualification({ userId: teacher._id, data: qualForm }));
        setQualModal(false);
        setQualForm({ degree: '', institution: '', year: '', grade: '' });
    };

    const handleAddExp = (e) => {
        e.preventDefault();
        dispatch(addExperience({ userId: teacher._id, data: expForm }));
        setExpModal(false);
        setExpForm({ title: '', organization: '', startDate: '', endDate: '', description: '' });
    };

    const handleUploadDoc = (e) => {
        e.preventDefault();
        if (!docFile) return;
        const fd = new FormData();
        fd.append('file', docFile);
        fd.append('name', docName || docFile.name);
        dispatch(uploadDocument({ userId: teacher._id, formData: fd }));
        setDocName('');
        setDocFile(null);
    };

    // ─── Styles ────────────────────────────────────────────────────────────────
    const panel = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem' };
    const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem 1rem', color: '#fff', width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none' };
    const labelStyle = { fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.35rem' };
    const gridTwo = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' };

    return (
        <div style={{ fontFamily: 'Inter, sans-serif', color: '#fff' }} className="fade-in">
            {/* ── Top Bar ─────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                    <ArrowLeft size={16} /> Back to Teachers
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{teacher.name}</h2>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{teacher.email}</p>
                </div>
                {saving && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0ff0fc', fontSize: '0.85rem' }}><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</div>}
                {successMessage && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#50cc7f', fontSize: '0.85rem' }}><CheckCircle size={16} /> {successMessage}</div>}
                {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff6b9d', fontSize: '0.85rem' }}><AlertCircle size={16} /> {error}</div>}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 size={40} style={{ animation: 'spin 0.8s linear infinite', color: '#0ff0fc' }} /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* ── Sidebar Tabs ──────────────────────────────────────── */}
                    <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0.75rem' }}>
                        {Object.entries(TAB_ICONS).map(([key, { icon: Icon, label }]) => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.88rem', transition: 'all 0.2s', textAlign: 'left', background: activeTab === key ? 'linear-gradient(135deg, rgba(15,240,252,0.15), rgba(188,19,254,0.1))' : 'transparent', color: activeTab === key ? '#0ff0fc' : 'rgba(255,255,255,0.6)', borderLeft: activeTab === key ? '3px solid #0ff0fc' : '3px solid transparent' }}>
                                <Icon size={16} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Content Panel ─────────────────────────────────────── */}
                    <div style={panel}>
                        {/* Personal Info */}
                        {activeTab === 'personal' && (
                            <form onSubmit={handleSavePersonal}>
                                <h3 style={{ margin: '0 0 1.2rem', color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Personal Information</h3>
                                <div style={gridTwo}>
                                    {[{ label: 'Date of Birth', field: 'dob', type: 'date', icon: Calendar },
                                      { label: 'Gender', field: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                                      { label: 'Blood Group', field: 'bloodGroup', type: 'text', icon: Droplet },
                                      { label: 'Emergency Contact', field: 'emergencyContact', type: 'text', icon: Phone }
                                    ].map(({ label, field, type, options, icon: Icon }) => (
                                        <div key={field}>
                                            <label style={labelStyle}>{label}</label>
                                            {type === 'select' ? (
                                                <select value={personalForm[field]} onChange={e => setPersonalForm({ ...personalForm, [field]: e.target.value })} style={inputStyle}>
                                                    <option value="">-- Select --</option>
                                                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input type={type} value={personalForm[field]} onChange={e => setPersonalForm({ ...personalForm, [field]: e.target.value })} style={inputStyle} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={labelStyle}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Residential Address</label>
                                    <textarea value={personalForm.address} onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
                                </div>
                                <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="primary-btn" disabled={saving}><Save size={16} /> Save Personal Info</button>
                                </div>
                            </form>
                        )}

                        {/* Professional Info */}
                        {activeTab === 'professional' && (
                            <form onSubmit={handleSaveProfessional}>
                                <h3 style={{ margin: '0 0 1.2rem', color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={18} /> Professional Information</h3>
                                <div style={gridTwo}>
                                    {[{ label: 'Designation / Title', field: 'designation', icon: UserCog },
                                      { label: 'Joining Date', field: 'joiningDate', type: 'date' },
                                      { label: 'Specialization', field: 'specialization', icon: FlaskConical }
                                    ].map(({ label, field, type = 'text' }) => (
                                        <div key={field}>
                                            <label style={labelStyle}>{label}</label>
                                            <input type={type} value={professionalForm[field]} onChange={e => setProfForm({ ...professionalForm, [field]: e.target.value })} style={inputStyle} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={labelStyle}><BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />Research Interests</label>
                                    <textarea value={professionalForm.researchInterests} onChange={e => setProfForm({ ...professionalForm, researchInterests: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="e.g. Machine Learning, Data Science..." />
                                </div>
                                <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="primary-btn" disabled={saving}><Save size={16} /> Save Professional Info</button>
                                </div>
                            </form>
                        )}

                        {/* Qualifications */}
                        {activeTab === 'qualifications' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h3 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><GraduationCap size={18} /> Qualifications</h3>
                                    <button className="primary-btn" onClick={() => setQualModal(true)}><Plus size={16} /> Add Qualification</button>
                                </div>
                                {(profile?.qualifications || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>No qualifications added yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {(profile?.qualifications || []).map(q => (
                                            <div key={q._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '1rem 1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{q.degree}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '2px' }}>{q.institution} · {q.year} {q.grade && `· ${q.grade}`}</div>
                                                </div>
                                                <button onClick={() => dispatch(deleteQualification({ userId: teacher._id, qualId: q._id }))} style={{ background: 'rgba(255,27,107,0.12)', border: 'none', color: '#ff1b6b', borderRadius: '7px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Add Qual Modal */}
                                {qualModal && createPortal(
                                    <div className="modal-overlay">
                                        <div className="modal-content glass-panel-dash">
                                            <div className="modal-header"><h3>Add Qualification</h3><button className="close-btn" onClick={() => setQualModal(false)}><X size={18} /></button></div>
                                            <form onSubmit={handleAddQual} className="modal-form">
                                                {[{ label: 'Degree / Certificate', field: 'degree', required: true }, { label: 'Institution', field: 'institution', required: true }, { label: 'Year', field: 'year', type: 'number', required: true }, { label: 'Grade / CGPA', field: 'grade' }].map(({ label, field, type = 'text', required }) => (
                                                    <div className="form-group" key={field}>
                                                        <label>{label}</label>
                                                        <input type={type} required={required} value={qualForm[field]} onChange={e => setQualForm({ ...qualForm, [field]: e.target.value })} />
                                                    </div>
                                                ))}
                                                <div className="modal-footer">
                                                    <button type="button" className="cancel-btn" onClick={() => setQualModal(false)}>Cancel</button>
                                                    <button type="submit" className="primary-btn" disabled={saving}><Plus size={16} /> Add</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>, document.body
                                )}
                            </div>
                        )}

                        {/* Experience */}
                        {activeTab === 'experience' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <h3 style={{ margin: 0, color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> Experience</h3>
                                    <button className="primary-btn" onClick={() => setExpModal(true)}><Plus size={16} /> Add Experience</button>
                                </div>
                                {(profile?.experience || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>No experience records added yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {(profile?.experience || []).map(e => (
                                            <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '1rem 1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{e.title}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '2px' }}>
                                                        {e.organization} · {new Date(e.startDate).getFullYear()} – {e.endDate ? new Date(e.endDate).getFullYear() : 'Present'}
                                                    </div>
                                                    {e.description && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: '4px' }}>{e.description}</div>}
                                                </div>
                                                <button onClick={() => dispatch(deleteExperience({ userId: teacher._id, expId: e._id }))} style={{ background: 'rgba(255,27,107,0.12)', border: 'none', color: '#ff1b6b', borderRadius: '7px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Add Exp Modal */}
                                {expModal && createPortal(
                                    <div className="modal-overlay">
                                        <div className="modal-content glass-panel-dash">
                                            <div className="modal-header"><h3>Add Experience</h3><button className="close-btn" onClick={() => setExpModal(false)}><X size={18} /></button></div>
                                            <form onSubmit={handleAddExp} className="modal-form">
                                                {[{ label: 'Job Title', field: 'title', required: true }, { label: 'Organization', field: 'organization', required: true }, { label: 'Start Date', field: 'startDate', type: 'date', required: true }, { label: 'End Date (leave blank if current)', field: 'endDate', type: 'date' }].map(({ label, field, type = 'text', required }) => (
                                                    <div className="form-group" key={field}>
                                                        <label>{label}</label>
                                                        <input type={type} required={required} value={expForm[field]} onChange={e => setExpForm({ ...expForm, [field]: e.target.value })} />
                                                    </div>
                                                ))}
                                                <div className="form-group">
                                                    <label>Description (Optional)</label>
                                                    <textarea value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} style={{ minHeight: '70px' }} />
                                                </div>
                                                <div className="modal-footer">
                                                    <button type="button" className="cancel-btn" onClick={() => setExpModal(false)}>Cancel</button>
                                                    <button type="submit" className="primary-btn" disabled={saving}><Plus size={16} /> Add</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>, document.body
                                )}
                            </div>
                        )}

                        {/* Documents */}
                        {activeTab === 'documents' && (
                            <div>
                                <h3 style={{ margin: '0 0 1.2rem', color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={18} /> Documents</h3>

                                {/* Upload Area */}
                                <form onSubmit={handleUploadDoc} style={{ background: 'rgba(15,240,252,0.04)', border: '2px dashed rgba(15,240,252,0.25)', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Upload a document (PDF, Image — max 5 MB)</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                                        <div>
                                            <label style={labelStyle}>Document Name</label>
                                            <input value={docName} onChange={e => setDocName(e.target.value)} style={inputStyle} placeholder="e.g. PhD Certificate" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Choose File</label>
                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setDocFile(e.target.files[0])} style={{ ...inputStyle, padding: '0.5rem' }} />
                                        </div>
                                        <button type="submit" className="primary-btn" disabled={saving || !docFile}><Upload size={16} /> Upload</button>
                                    </div>
                                </form>

                                {/* Documents List */}
                                {(profile?.documents || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>No documents uploaded yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {(profile?.documents || []).map(doc => (
                                            <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.9rem 1.2rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <FileText size={20} color="#bc13fe" />
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{doc.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{doc.type || 'File'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noreferrer"
                                                        style={{ background: 'rgba(15,240,252,0.1)', border: 'none', color: '#0ff0fc', borderRadius: '7px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                        <ExternalLink size={14} />
                                                    </a>
                                                    <button onClick={() => dispatch(deleteDocument({ userId: teacher._id, docId: doc._id }))} style={{ background: 'rgba(255,27,107,0.12)', border: 'none', color: '#ff1b6b', borderRadius: '7px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherProfileView;
