import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmailTemplates, updateEmailTemplate, sendTestEmailThunk, clearTestMsg } from '../store/emailTemplatesSlice';
import { Mail, Edit3, Send, CheckCircle, Search, LayoutTemplate, RefreshCw, AlertCircle, Save } from 'lucide-react';
import '../style/Dashboard.css';

const EmailTemplates = () => {
    const dispatch = useDispatch();
    const { list: templates, loading, error, testMsg } = useSelector(s => s.emailTemplates);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editorSubject, setEditorSubject] = useState('');
    const [editorBody, setEditorBody] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);

    useEffect(() => { dispatch(fetchEmailTemplates()); }, [dispatch]);

    useEffect(() => {
        if (testMsg) {
            const t = setTimeout(() => dispatch(clearTestMsg()), 5000);
            return () => clearTimeout(t);
        }
    }, [testMsg, dispatch]);

    const filtered = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSelect = (t) => {
        setSelectedTemplate(t);
        setEditorSubject(t.subject);
        setEditorBody(t.body);
        setSaveSuccess(false);
        dispatch(clearTestMsg());
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        const result = await dispatch(updateEmailTemplate({ id: selectedTemplate._id, subject: editorSubject, body: editorBody }));
        setIsSaving(false);
        if (!result.error) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    };

    const handleSendTest = async () => {
        if (!selectedTemplate) return;
        setIsSendingTest(true);
        await dispatch(sendTestEmailThunk(selectedTemplate._id));
        setIsSendingTest(false);
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={28} color="#ffcc00" />
                    Email Templates
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Customize automated emails sent by the system. All changes are saved to the database.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Template List */}
                <div className="glass-panel-dash" style={{ flex: 1, minWidth: '300px', borderRadius: '12px', padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 12, top: 10 }} />
                        <input type="text" placeholder="Search templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    </div>

                    {loading && <div style={{ textAlign: 'center', color: '#ffcc00', padding: '20px' }}>Loading templates...</div>}
                    {error && <div style={{ color: '#ff1b6b', fontSize: '0.85rem', padding: '12px' }}>{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map(t => (
                            <div key={t._id} onClick={() => handleSelect(t)} style={{ padding: '16px', background: selectedTemplate?._id === t._id ? 'rgba(255,204,0,0.1)' : 'rgba(255,255,255,0.03)', border: selectedTemplate?._id === t._id ? '1px solid #ffcc00' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <div style={{ color: selectedTemplate?._id === t._id ? '#ffcc00' : '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <LayoutTemplate size={16} /> {t.name}
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '6px' }}>{t.subject}</div>
                                {t.lastUpdatedBy && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: '4px' }}>Last edited by: {t.lastUpdatedBy}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div style={{ flex: 2, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedTemplate ? (
                        <div className="glass-panel-dash fade-in" style={{ borderRadius: '12px', padding: '24px', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, color: '#ffcc00', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Edit3 size={20} /> Edit: {selectedTemplate.name}
                                </h3>
                                <button onClick={handleSave} disabled={isSaving} style={{ padding: '10px 20px', background: isSaving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#ffcc00,#ff9800)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {isSaving ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={16} /> Save Template</>}
                                </button>
                            </div>

                            {saveSuccess && (
                                <div style={{ padding: '10px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', color: '#50cc7f', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle size={16} /> Template saved to database!
                                </div>
                            )}
                            {error && (
                                <div style={{ padding: '10px', background: 'rgba(255,27,107,0.1)', border: '1px solid rgba(255,27,107,0.3)', color: '#ff1b6b', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: 8 }}>
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>Email Subject</label>
                                <input value={editorSubject} onChange={e => setEditorSubject(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem' }} />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>Available Dynamic Tags</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {selectedTemplate.tags?.map(tag => (
                                        <button key={tag} onClick={() => setEditorBody(prev => prev + ' ' + tag)} style={{ padding: '6px 12px', background: 'rgba(15,240,252,0.1)', border: '1px solid rgba(15,240,252,0.3)', borderRadius: '16px', color: '#0ff0fc', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '8px' }}>Email Body</label>
                                <textarea value={editorBody} onChange={e => setEditorBody(e.target.value)} rows={12} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'monospace' }} />
                            </div>

                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>Send Test Email</div>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Send a preview to your admin email.</div>
                                    {testMsg && (
                                        <div style={{ marginTop: '6px', fontSize: '0.82rem', color: testMsg.startsWith('Error') ? '#ff1b6b' : '#50cc7f' }}>{testMsg}</div>
                                    )}
                                </div>
                                <button onClick={handleSendTest} disabled={isSendingTest} style={{ padding: '8px 16px', background: isSendingTest ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: isSendingTest ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isSendingTest ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <><Send size={14} /> Send Test</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel-dash" style={{ flex: 1, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', minHeight: '400px' }}>
                            <Mail size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                            <div>Select a template from the list to edit.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailTemplates;
