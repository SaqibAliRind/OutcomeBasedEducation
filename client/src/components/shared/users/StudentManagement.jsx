import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAcademicData } from '../../../store/academicSlice';
import { createUser, updateUser, deleteUser, toggleUserStatus, adminResetUserPassword, importUsers } from '../../../store/userSlice';
import {
    Plus, Edit2, UserX, ShieldBan, ShieldCheck, KeyRound,
    Loader2, X, Search, Download, Upload, Eye, RefreshCw, GraduationCap, Users
} from 'lucide-react';

const ACADEMIC_STATUSES = ['Active', 'Freeze', 'Graduated', 'Suspended', 'Alumni', 'Dropped', 'Transferred'];
const GENDERS           = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS      = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ADMISSION_TYPES   = ['Regular', 'Self-Finance', 'Merit', 'Lateral Entry', 'Transfer'];

const generateStudentId = () => `STU-${Date.now().toString().slice(-6)}`;

const emptyForm = {
    // Personal
    name: '', email: '', password: '',
    fatherName: '', cnic: '', gender: '', dateOfBirth: '', bloodGroup: '',
    // Contact
    phone: '', guardianName: '', guardianPhone: '', address: '',
    // Academic
    faculty: '', department: '', program: '', batch: '', session: '', section: '',
    currentSemester: 1,
    // Admission
    admissionDate: '', admissionType: '', scholarship: '',
    // Records
    rollNumber: '', studentId: '',
    cgpa: '', gpa: '', completedCredits: '', remainingCredits: '',
    academicStatus: 'Active',
    role: 'Student'
};

// Helpers
const gf = (usr, path) => {
    if (path === 'program')    return usr.program    || null;
    if (path === 'department') return usr.department || null;
    if (path === 'batch')      return usr.batch      || null;
    if (path === 'section')    return usr.section    || null;
    if (path === 'session')    return usr.session    || null;
    if (path === 'faculty')    return usr.faculty    || null;
    if (path === 'rollNumber') return usr.rollNumber || '';
    if (path === 'studentId')  return usr.studentId  || '';
    if (path === 'semester')   return usr.currentSemester || '—';
    if (path === 'cgpa')       return usr.cgpa !== undefined && usr.cgpa !== null ? usr.cgpa : null;
    if (path === 'acStatus')   return usr.academicStatus || '—';
    return '';
};

const idOf = (obj) => (typeof obj === 'object' && obj !== null) ? obj._id : obj;
const nameOf = (obj) => (typeof obj === 'object' && obj !== null) ? (obj.name || obj.year || '') : (obj || '');

const SH = ({ title, color = '#0ff0fc' }) => (
    <div style={{ gridColumn: '1 / -1', marginTop: '0.6rem', paddingBottom: '0.4rem', borderBottom: `1px solid ${color}33` }}>
        <p style={{ margin: 0, color, fontWeight: 700, fontSize: '0.76rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{title}</p>
    </div>
);

const FG = ({ label, children }) => (
    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', display: 'block', marginBottom: '3px' }}>{label}</label>
        {children}
    </div>
);

const iS = {
    width: '100%', padding: '8px 10px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)',
    color: '#fff', fontSize: '0.86rem', boxSizing: 'border-box', outline: 'none'
};

const StudentManagement = ({ users, loading }) => {
    const dispatch = useDispatch();
    const { records } = useSelector(state => state.academic);
    const programs    = records.programs    || [];
    const departments = records.departments || [];
    const batches     = records.batches     || [];
    const faculties   = records.faculties   || [];
    const sections    = records.sections    || [];
    const sessions    = records.sessions    || [];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen,   setIsEditModalOpen]   = useState(false);
    const [isResetModalOpen,  setIsResetModalOpen]  = useState(false);
    const [isViewModalOpen,   setIsViewModalOpen]   = useState(false);

    const [selectedUser,  setSelectedUser]  = useState(null);
    const [formData,      setFormData]      = useState(emptyForm);
    const [newPassword,   setNewPassword]   = useState('');
    const [resetLoading,  setResetLoading]  = useState(false);

    // Search & Filters
    const [search,        setSearch]        = useState('');
    const [filterStatus,  setFilterStatus]  = useState('all');
    const [filterProgram, setFilterProgram] = useState('all');
    const [filterBatch,   setFilterBatch]   = useState('all');
    const [filterDept,    setFilterDept]    = useState('all');
    const [filterSem,     setFilterSem]     = useState('all');
    const [filterAcStat,  setFilterAcStat]  = useState('all');

    useEffect(() => {
        dispatch(fetchAcademicData('programs'));
        dispatch(fetchAcademicData('departments'));
        dispatch(fetchAcademicData('batches'));
        dispatch(fetchAcademicData('faculties'));
        dispatch(fetchAcademicData('sections'));
        dispatch(fetchAcademicData('sessions'));
    }, [dispatch]);

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // ── Filtering ────────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch =
            (u.name        || '').toLowerCase().includes(q) ||
            (u.email       || '').toLowerCase().includes(q) ||
            (u.rollNumber  || '').toLowerCase().includes(q) ||
            (u.studentId   || '').toLowerCase().includes(q) ||
            (u.phone       || '').toLowerCase().includes(q) ||
            (u.fatherName  || '').toLowerCase().includes(q) ||
            (u.cnic        || '').toLowerCase().includes(q);
        const matchStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active'   &&  u.isActive) ||
            (filterStatus === 'inactive' && !u.isActive);
        const matchProgram = filterProgram === 'all' || idOf(gf(u, 'program')) === filterProgram;
        const matchBatch   = filterBatch   === 'all' || idOf(gf(u, 'batch'))   === filterBatch;
        const matchDept    = filterDept    === 'all' || idOf(gf(u, 'department')) === filterDept;
        const matchSem     = filterSem     === 'all' || String(gf(u, 'semester')) === filterSem;
        const matchAcStat  = filterAcStat  === 'all' || gf(u, 'acStatus') === filterAcStat;
        return matchSearch && matchStatus && matchProgram && matchBatch && matchDept && matchSem && matchAcStat;
    });

    // ── Export CSV ──────────────────────────────────────────────────
    const handleExport = () => {
        const headers = ['Student ID', 'Roll No', 'Full Name', 'Father Name', 'CNIC', 'Gender', 'Blood Group',
            'Email', 'Phone', 'Guardian Name', 'Guardian Phone', 'Address',
            'Faculty', 'Department', 'Program', 'Batch', 'Session', 'Section', 'Semester',
            'Admission Type', 'Scholarship', 'Admission Date',
            'GPA', 'CGPA', 'Completed Credits', 'Remaining Credits', 'Academic Status', 'Account Status'];
        const rows = filtered.map(u => [
            u.studentId || '', u.rollNumber || '', u.name, u.fatherName || '', u.cnic || '', u.gender || '', u.bloodGroup || '',
            u.email, u.phone || '', u.guardianName || '', u.guardianPhone || '', u.address || '',
            nameOf(gf(u,'faculty')), nameOf(gf(u,'department')), nameOf(gf(u,'program')),
            nameOf(gf(u,'batch')), nameOf(gf(u,'session')), nameOf(gf(u,'section')), gf(u,'semester'),
            u.admissionType || '', u.scholarship || '',
            u.admissionDate ? new Date(u.admissionDate).toLocaleDateString() : '',
            u.gpa ?? '', gf(u,'cgpa') ?? '', u.completedCredits ?? '', u.remainingCredits ?? '',
            gf(u,'acStatus'), u.isActive ? 'Active' : 'Inactive'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'students_export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    // ── Import CSV ──────────────────────────────────────────────────
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const csv   = event.target.result;
            const lines = csv.split('\n');
            const result = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const c = lines[i].split(',');
                if (c.length >= 2) {
                    result.push({
                        name:       c[0]?.trim(),
                        email:      c[1]?.trim(),
                        password:   c[2]?.trim() || 'default123',
                        rollNumber: c[3]?.trim() || '',
                        phone:      c[4]?.trim() || '',
                        fatherName: c[5]?.trim() || '',
                        role: 'Student',
                        studentId: generateStudentId()
                    });
                }
            }
            if (result.length > 0) {
                if (window.confirm(`Import ${result.length} student(s)?`)) dispatch(importUsers(result));
            } else {
                alert('No valid data found.');
            }
            e.target.value = null;
        };
        reader.readAsText(file);
    };

    // ── Handlers ────────────────────────────────────────────────────
    const closeAll = () => { setIsCreateModalOpen(false); setIsEditModalOpen(false); setIsResetModalOpen(false); setIsViewModalOpen(false); setSelectedUser(null); };
    const openAdd  = () => { setFormData({ ...emptyForm, studentId: generateStudentId() }); setIsCreateModalOpen(true); };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name || '', email: user.email || '', password: '',
            fatherName: user.fatherName || '', cnic: user.cnic || '',
            gender: user.gender || '', dateOfBirth: user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '',
            bloodGroup: user.bloodGroup || '',
            phone: user.phone || '', guardianName: user.guardianName || '',
            guardianPhone: user.guardianPhone || '', address: user.address || '',
            faculty: idOf(gf(user,'faculty')) || '',
            department: idOf(gf(user,'department')) || '',
            program: idOf(gf(user,'program')) || '',
            batch: idOf(gf(user,'batch')) || '',
            session: idOf(gf(user,'session')) || '',
            section: idOf(gf(user,'section')) || '',
            currentSemester: gf(user,'semester') || 1,
            admissionDate: user.admissionDate ? user.admissionDate.substring(0, 10) : '',
            admissionType: user.admissionType || '',
            scholarship: user.scholarship || '',
            rollNumber: user.rollNumber || '', studentId: user.studentId || '',
            cgpa: gf(user,'cgpa') ?? '', gpa: user.gpa ?? '',
            completedCredits: user.completedCredits ?? '',
            remainingCredits: user.remainingCredits ?? '',
            academicStatus: gf(user,'acStatus') === '—' ? 'Active' : gf(user,'acStatus'),
            role: 'Student'
        });
        setIsEditModalOpen(true);
    };

    const openView  = (user) => { setSelectedUser(user); setIsViewModalOpen(true); };
    const openReset = (user) => { setSelectedUser(user); setNewPassword(''); setIsResetModalOpen(true); };

    const handleCreate = (e) => { e.preventDefault(); dispatch(createUser({ ...formData, role: 'Student' })); closeAll(); };
    const handleEditSave = (e) => { e.preventDefault(); const { password, ...rest } = formData; dispatch(updateUser({ id: selectedUser._id, userData: rest })); closeAll(); };
    const handleResetPassword = async (e) => {
        e.preventDefault(); setResetLoading(true);
        await dispatch(adminResetUserPassword({ id: selectedUser._id, newPassword }));
        setResetLoading(false); closeAll();
    };

    // ── Form ─────────────────────────────────────────────────────────
    const renderForm = (isCreate) => (
        <form className="modal-form" onSubmit={isCreate ? handleCreate : handleEditSave} className="modal-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.2rem' }}>

                {/* ── PERSONAL INFORMATION ── */}
                <SH title="Personal Information" color="#bc13fe" />

                <FG label="Full Name *">
                    <input required type="text" style={iS} placeholder="e.g. Amna Tariq" value={formData.name} onChange={set('name')} />
                </FG>
                <FG label="Father Name">
                    <input type="text" style={iS} placeholder="e.g. Mr. Tariq Ali" value={formData.fatherName} onChange={set('fatherName')} />
                </FG>
                <FG label="CNIC / B-Form">
                    <input type="text" style={iS} placeholder="35201-1234567-1" value={formData.cnic} onChange={set('cnic')} />
                </FG>
                <FG label="Date of Birth">
                    <input type="date" style={iS} value={formData.dateOfBirth} onChange={set('dateOfBirth')} />
                </FG>
                <FG label="Gender">
                    <select style={iS} value={formData.gender} onChange={set('gender')}>
                        <option value="">-- Select --</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </FG>
                <FG label="Blood Group">
                    <select style={iS} value={formData.bloodGroup} onChange={set('bloodGroup')}>
                        <option value="">-- Select --</option>
                        {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </FG>

                {/* ── CONTACT INFORMATION ── */}
                <SH title="Contact Information" color="#0ff0fc" />

                <FG label="Email Address *">
                    <input required type="email" style={iS} placeholder="student@university.edu.pk" value={formData.email} onChange={set('email')} />
                </FG>
                <FG label="Phone">
                    <input type="tel" style={iS} placeholder="+92-300-1234567" value={formData.phone} onChange={set('phone')} />
                </FG>
                <FG label="Guardian Name">
                    <input type="text" style={iS} placeholder="e.g. Mr. Ali Hassan" value={formData.guardianName} onChange={set('guardianName')} />
                </FG>
                <FG label="Guardian Phone">
                    <input type="tel" style={iS} placeholder="+92-300-0000000" value={formData.guardianPhone} onChange={set('guardianPhone')} />
                </FG>
                <FG label="Address">
                    <input type="text" style={iS} placeholder="House, Street, City" value={formData.address} onChange={set('address')} />
                </FG>

                {/* ── ACADEMIC INFORMATION ── */}
                <SH title="Academic Information" color="#50cc7f" />

                <FG label="Student ID">
                    <input type="text" style={{ ...iS, opacity: 0.5, cursor: 'not-allowed' }} readOnly value={formData.studentId || 'Auto-generated'} />
                </FG>
                <FG label="Roll Number">
                    <input type="text" style={iS} placeholder="e.g. 21-CS-01" value={formData.rollNumber} onChange={set('rollNumber')} />
                </FG>
                <FG label="Faculty">
                    <select style={iS} value={formData.faculty} onChange={set('faculty')}>
                        <option value="">-- Select Faculty --</option>
                        {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                    </select>
                </FG>
                <FG label="Department">
                    <select style={iS} value={formData.department} onChange={set('department')}>
                        <option value="">-- Select Department --</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                </FG>
                <FG label="Program">
                    <select style={iS} value={formData.program} onChange={set('program')}>
                        <option value="">-- Select Program --</option>
                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </FG>
                <FG label="Batch">
                    <select style={iS} value={formData.batch} onChange={set('batch')}>
                        <option value="">-- Select Batch --</option>
                        {batches.map(b => <option key={b._id} value={b._id}>{b.name || b.year}</option>)}
                    </select>
                </FG>
                <FG label="Session">
                    <select style={iS} value={formData.session} onChange={set('session')}>
                        <option value="">-- Select Session --</option>
                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name || s.year}</option>)}
                    </select>
                </FG>
                <FG label="Section">
                    <select style={iS} value={formData.section} onChange={set('section')}>
                        <option value="">-- Select Section --</option>
                        {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </FG>
                <FG label="Current Semester">
                    <select style={iS} value={formData.currentSemester} onChange={e => setFormData(p => ({ ...p, currentSemester: parseInt(e.target.value) }))}>
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                    </select>
                </FG>
                <FG label="Academic Status">
                    <select style={iS} value={formData.academicStatus} onChange={set('academicStatus')}>
                        {ACADEMIC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </FG>

                {/* ── ADMISSION INFORMATION ── */}
                <SH title="Admission Information" color="#ffcc00" />

                <FG label="Admission Date">
                    <input type="date" style={iS} value={formData.admissionDate} onChange={set('admissionDate')} />
                </FG>
                <FG label="Admission Type">
                    <select style={iS} value={formData.admissionType} onChange={set('admissionType')}>
                        <option value="">-- Select --</option>
                        {ADMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </FG>
                <FG label="Scholarship (if any)">
                    <input type="text" style={iS} placeholder="e.g. HEC Need-Based" value={formData.scholarship} onChange={set('scholarship')} />
                </FG>

                {/* ── ACADEMIC RECORD ── */}
                <SH title="Academic Record" color="#45caff" />

                <FG label="GPA (Current Sem)">
                    <input type="number" min="0" max="4" step="0.01" style={iS} placeholder="0.00 – 4.00" value={formData.gpa} onChange={set('gpa')} />
                </FG>
                <FG label="CGPA">
                    <input type="number" min="0" max="4" step="0.01" style={iS} placeholder="0.00 – 4.00" value={formData.cgpa} onChange={set('cgpa')} />
                </FG>
                <FG label="Completed Credits">
                    <input type="number" min="0" style={iS} placeholder="e.g. 60" value={formData.completedCredits} onChange={set('completedCredits')} />
                </FG>
                <FG label="Remaining Credits">
                    <input type="number" min="0" style={iS} placeholder="e.g. 66" value={formData.remainingCredits} onChange={set('remainingCredits')} />
                </FG>

                {/* ── ACCOUNT ── */}
                {isCreate && (
                    <>
                        <SH title="Account" color="#ff6b9d" />
                        <FG label="Initial Password *">
                            <input required type="password" style={iS} placeholder="Min. 8 characters" value={formData.password} onChange={set('password')} />
                        </FG>
                    </>
                )}
            </div>

            <div className="modal-footer" style={{ marginTop: '1.2rem' }}>
                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={18} /> : isCreate ? 'Add Student' : 'Save Changes'}
                </button>
            </div>
        </form>
    );

    // ── CGPA color ───────────────────────────────────────────────────
    const cgpaColor = (val) => {
        const v = parseFloat(val);
        if (isNaN(v)) return 'rgba(255,255,255,0.35)';
        if (v >= 3.5) return '#50cc7f';
        if (v >= 2.5) return '#ffcc00';
        return '#ff1b6b';
    };

    const acStatusColor = (s) => ({
        'Active': '#50cc7f', 'Graduated': '#0ff0fc', 'Freeze': '#45caff',
        'Alumni': '#45caff', 'Suspended': '#ff6b00', 'Dropped': '#ff1b6b', 'Transferred': '#bc13fe'
    }[s] || '#fff');

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--uni-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={20} /> Students List
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '6px' }}>({filtered.length} found)</span>
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={handleExport}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#50cc7f', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                        <Download size={15} /> Export CSV
                    </button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#45caff', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                        <Upload size={15} /> Import CSV
                        <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
                    </label>
                    <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }} onClick={openAdd}>
                        <Plus size={16} /> Add Student
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input type="text" className="search-input"
                        placeholder="Search by name, roll no, student ID, CNIC, father name..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '34px', width: '100%' }} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '120px' }}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '145px' }}>
                    <option value="all">All Programs</option>
                    {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '150px' }}>
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '130px' }}>
                    <option value="all">All Batches</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name || b.year}</option>)}
                </select>
                <select value={filterSem} onChange={e => setFilterSem(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '120px' }}>
                    <option value="all">All Sems</option>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={String(n)}>Sem {n}</option>)}
                </select>
                <select value={filterAcStat} onChange={e => setFilterAcStat(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', minWidth: '140px' }}>
                    <option value="all">All Ac. Status</option>
                    {ACADEMIC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                {loading && users.length === 0 ? (
                    <div className="table-loading"><Loader2 className="spinner-large" /></div>
                ) : (
                    <table className="uni-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Roll No</th>
                                <th>Full Name</th>
                                <th>Program</th>
                                <th>Batch</th>
                                <th>Section</th>
                                <th>Sem</th>
                                <th>CGPA</th>
                                <th>Ac. Status</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(usr => (
                                <tr key={usr._id}>
                                    <td><span style={{ fontFamily: 'monospace', color: '#0ff0fc', fontSize: '0.8rem' }}>{usr.studentId || '—'}</span></td>
                                    <td><span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{usr.rollNumber || '—'}</span></td>
                                    <td>
                                        <strong>{usr.name}</strong>
                                        {usr.fatherName && <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)' }}>s/o {usr.fatherName}</div>}
                                    </td>
                                    <td style={{ fontSize: '0.83rem' }}>{nameOf(gf(usr,'program')) || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                                    <td style={{ fontSize: '0.83rem' }}>{nameOf(gf(usr,'batch')) || '—'}</td>
                                    <td style={{ fontSize: '0.83rem' }}>{nameOf(gf(usr,'section')) || '—'}</td>
                                    <td style={{ textAlign: 'center' }}>{gf(usr, 'semester')}</td>
                                    <td>
                                        <span style={{ color: cgpaColor(gf(usr,'cgpa')), fontWeight: 700 }}>
                                            {gf(usr,'cgpa') !== null ? parseFloat(gf(usr,'cgpa')).toFixed(2) : '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ background: `${acStatusColor(gf(usr,'acStatus'))}18`, color: acStatusColor(gf(usr,'acStatus')), border: `1px solid ${acStatusColor(gf(usr,'acStatus'))}44`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>
                                            {gf(usr,'acStatus')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${usr.isActive ? 'active' : 'inactive'}`}>
                                            {usr.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="actions-col">
                                        <button className="action-btn" onClick={() => openView(usr)} title="View Profile" style={{ background: 'rgba(15,240,252,0.1)', color: '#0ff0fc' }}><Eye size={15} /></button>
                                        <button className="action-btn edit" onClick={() => openEdit(usr)} title="Edit"><Edit2 size={15} /></button>
                                        <button className="action-btn" onClick={() => openReset(usr)} title="Reset Password" style={{ background: 'rgba(255,204,0,0.1)', color: '#ffcc00' }}><KeyRound size={15} /></button>
                                        <button className="action-btn toggle" onClick={() => dispatch(toggleUserStatus(usr._id))} title={usr.isActive ? 'Deactivate' : 'Activate'}>
                                            {usr.isActive ? <ShieldBan size={15} /> : <ShieldCheck size={15} />}
                                        </button>
                                        <button className="action-btn delete" onClick={() => window.confirm('Delete this Student permanently?') && dispatch(deleteUser(usr._id))} title="Delete">
                                            <UserX size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No Students found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
                📋 Import CSV format: <code style={{ color: 'rgba(255,255,255,0.5)' }}>Name, Email, Password, RollNumber, Phone, FatherName</code>
            </div>

            {/* ── Add / Edit Modal ── */}
            {(isCreateModalOpen || isEditModalOpen) && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '800px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <GraduationCap size={18} color="#bc13fe" />
                                {isCreateModalOpen ? 'Add New Student' : 'Edit Student'}
                            </h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        {renderForm(isCreateModalOpen)}
                    </div>
                </div>,
                document.body
            )}

            {/* ── View Profile Modal ── */}
            {isViewModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '560px', borderRadius: '14px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>Student Profile</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        {/* Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '1rem 0' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #bc13fe, #0ff0fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '1.4rem', flexShrink: 0 }}>
                                {selectedUser.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedUser.name}</div>
                                {selectedUser.fatherName && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>s/o {selectedUser.fatherName}</div>}
                                <div style={{ color: '#0ff0fc', fontSize: '0.82rem' }}>{selectedUser.rollNumber || selectedUser.studentId || 'No ID'}</div>
                                <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>{selectedUser.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>

                        {/* Grid of info */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                            {[
                                ['Student ID',      selectedUser.studentId],
                                ['Roll Number',     selectedUser.rollNumber],
                                ['CNIC / B-Form',   selectedUser.cnic],
                                ['Gender',          selectedUser.gender],
                                ['Blood Group',     selectedUser.bloodGroup],
                                ['Date of Birth',   selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : null],
                                ['Email',           selectedUser.email],
                                ['Phone',           selectedUser.phone],
                                ['Guardian Name',   selectedUser.guardianName],
                                ['Guardian Phone',  selectedUser.guardianPhone],
                                ['Address',         selectedUser.address],
                                ['Faculty',         nameOf(gf(selectedUser,'faculty'))],
                                ['Department',      nameOf(gf(selectedUser,'department'))],
                                ['Program',         nameOf(gf(selectedUser,'program'))],
                                ['Batch',           nameOf(gf(selectedUser,'batch'))],
                                ['Session',         nameOf(gf(selectedUser,'session'))],
                                ['Section',         nameOf(gf(selectedUser,'section'))],
                                ['Semester',        gf(selectedUser, 'semester')],
                                ['Admission Type',  selectedUser.admissionType],
                                ['Scholarship',     selectedUser.scholarship],
                                ['Admission Date',  selectedUser.admissionDate ? new Date(selectedUser.admissionDate).toLocaleDateString() : null],
                                ['GPA',             selectedUser.gpa],
                                ['CGPA',            gf(selectedUser,'cgpa') !== null ? parseFloat(gf(selectedUser,'cgpa')).toFixed(2) : null],
                                ['Completed Credits', selectedUser.completedCredits],
                                ['Remaining Credits', selectedUser.remainingCredits],
                                ['Academic Status', gf(selectedUser, 'acStatus')],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', flexDirection: 'column', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginBottom: '2px' }}>{label}</span>
                                    <span style={{ color: val ? '#fff' : 'rgba(255,255,255,0.25)', fontSize: '0.85rem', fontWeight: val ? 500 : 400 }}>{val ?? '—'}</span>
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer" style={{ marginTop: '1rem' }}>
                            <button className="cancel-btn" onClick={closeAll}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Reset Password Modal ── */}
            {isResetModalOpen && selectedUser && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content glass-panel-dash" style={{ width: '380px', borderRadius: '14px', padding: '1.5rem' }}>
                        <div className="modal-header">
                            <h3>Reset Password</h3>
                            <button className="close-btn" onClick={closeAll}><X size={20} /></button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Resetting password for <strong style={{ color: '#fff' }}>{selectedUser.name}</strong>
                            {selectedUser.rollNumber && <span style={{ color: '#0ff0fc' }}> ({selectedUser.rollNumber})</span>}.
                        </p>
                        <form className="modal-form" onSubmit={handleResetPassword} className="modal-form">
                            <div className="form-group">
                                <label>New Password</label>
                                <input required type="password" placeholder="Min. 8 characters"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={8} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={closeAll}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={resetLoading}
                                    className="primary-btn">
                                    {resetLoading ? <Loader2 className="spinner" size={18} /> : <><RefreshCw size={14} /> Reset Password</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default StudentManagement;
