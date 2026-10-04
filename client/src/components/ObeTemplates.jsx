import React from 'react';
import { FileSpreadsheet, Download, BookOpen, Target, Layout, Layers, BrainCircuit } from 'lucide-react';

const TEMPLATES = [
    {
        id: 'clo',
        title: 'CLO Template',
        description: 'Standard CSV template for importing Course Learning Outcomes.',
        icon: BookOpen,
        color: '#0ff0fc',
        headers: 'Course Code,CLO Code,Description,Blooms Level,Blooms Domain,Weightage'
    },
    {
        id: 'plo',
        title: 'PLO Template',
        description: 'Standard CSV template for importing Program Learning Outcomes.',
        icon: Layers,
        color: '#bc13fe',
        headers: 'Program Code,PLO Code,Statement,Description,Domain,Blooms Level,Version'
    },
    {
        id: 'peo',
        title: 'PEO Template',
        description: 'Standard CSV template for importing Program Educational Objectives.',
        icon: Target,
        color: '#ff9800',
        headers: 'Program Code,PEO Code,Title,Description,Version,Effective Date'
    },
    {
        id: 'mapping',
        title: 'Mapping Template',
        description: 'CSV template for bulk uploading CLO-PLO or PLO-GA mappings.',
        icon: Layout,
        color: '#50cc7f',
        headers: 'Source Type (CLO/PLO),Source Code,Target Type (PLO/GA),Target Code,Weightage,Level (Low/Medium/High)'
    },
    {
        id: 'bt',
        title: 'BT Template',
        description: 'CSV template containing Blooms Taxonomy levels and associated verbs.',
        icon: BrainCircuit,
        color: '#ff1b6b',
        headers: 'Domain,Level,Verbs (Comma Separated)'
    }
];

const ObeTemplates = () => {
    const handleDownload = (template) => {
        const blob = new Blob([template.headers], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${template.id}_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <FileSpreadsheet size={28} color="#0ff0fc" />
                <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>OBE Templates</h2>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
                Download standard CSV templates to bulk import Outcome-Based Education (OBE) data into the system.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                        <div key={tpl.id} className="glass-panel-dash" style={{
                            padding: '1.5rem',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            border: `1px solid ${tpl.color}33`,
                            background: `${tpl.color}08`,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: `${tpl.color}22`, padding: '10px', borderRadius: '8px' }}>
                                    <Icon size={24} color={tpl.color} />
                                </div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{tpl.title}</h3>
                            </div>
                            
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', flex: 1 }}>
                                {tpl.description}
                            </p>

                            <button 
                                onClick={() => handleDownload(tpl)}
                                className="btn"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    background: `${tpl.color}22`,
                                    color: tpl.color,
                                    border: `1px solid ${tpl.color}44`,
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    width: '100%',
                                    marginTop: 'auto',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = tpl.color;
                                    e.currentTarget.style.color = '#fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = `${tpl.color}22`;
                                    e.currentTarget.style.color = tpl.color;
                                }}
                            >
                                <Download size={18} /> Download
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ObeTemplates;
