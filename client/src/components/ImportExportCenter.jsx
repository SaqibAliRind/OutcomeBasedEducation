import React, { useState } from 'react';
import { Database, Upload, Download, FileSpreadsheet, FileText, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import '../style/Dashboard.css';

const IMPORT_MODULES = [
    { id: 'students', label: 'Students List', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'teachers', label: 'Teachers List', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'courses', label: 'Courses Master', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'curriculum', label: 'Curriculum mapping', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'peo', label: 'PEOs', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'plo', label: 'PLOs', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'clo', label: 'CLOs', icon: FileSpreadsheet, format: 'Excel/CSV' },
    { id: 'questions', label: 'Question Bank', icon: FileSpreadsheet, format: 'Excel/CSV' }
];

const EXPORT_MODULES = [
    { id: 'all_students', label: 'All Students Data', formats: ['Excel', 'CSV', 'PDF'] },
    { id: 'all_teachers', label: 'All Teachers Data', formats: ['Excel', 'CSV', 'PDF'] },
    { id: 'course_alloc', label: 'Course Allocations', formats: ['Excel', 'CSV'] },
    { id: 'obe_mapping', label: 'OBE Mapping Matrix', formats: ['Excel', 'PDF'] },
    { id: 'grade_sheet', label: 'Final Grade Sheets', formats: ['Excel', 'PDF'] },
];

const ImportExportCenter = () => {
    const [importTab, setImportTab] = useState(true);
    const [selectedImport, setSelectedImport] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [selectedExport, setSelectedExport] = useState(null);
    const [exportFormat, setExportFormat] = useState('');

    const handleImportSubmit = (e) => {
        e.preventDefault();
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            setUploadSuccess(true);
            setTimeout(() => {
                setUploadSuccess(false);
                setSelectedImport(null);
            }, 3000);
        }, 2000);
    };

    const handleExportSubmit = () => {
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            
            // Create a dummy file for the user to download
            let content = 'This is a mock export for ' + selectedExport.label;
            let mimeType = 'text/plain';
            let extension = 'txt';
            
            if (exportFormat === 'CSV') {
                content = 'ID,Name,Value\\n1,Sample,Data';
                mimeType = 'text/csv';
                extension = 'csv';
            } else if (exportFormat === 'Excel') {
                // Dummy xlsx text representation
                content = 'Mock Excel File Content'; 
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                extension = 'xlsx';
            } else if (exportFormat === 'PDF') {
                // We'll just provide a text file representing the PDF for now
                content = 'Mock PDF File Content\\n\\n' + selectedExport.label;
                mimeType = 'application/pdf';
                extension = 'pdf';
            }
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedExport.id}_export.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`Successfully exported ${selectedExport.label} as ${exportFormat}!`);
        }, 1500);
    };

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Database size={28} color="#50cc7f" />
                    Data Import & Export Center
                </h2>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Bulk upload your university data or export existing records for offline use.
                </p>
            </div>

            {/* Toggle Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                <button onClick={() => setImportTab(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', background: importTab ? 'rgba(80,204,127,0.15)' : 'transparent', color: importTab ? '#50cc7f' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                    <Upload size={16} /> Import Data
                </button>
                <button onClick={() => setImportTab(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', background: !importTab ? 'rgba(15,240,252,0.15)' : 'transparent', color: !importTab ? '#0ff0fc' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                    <Download size={16} /> Export Data
                </button>
            </div>

            {importTab ? (
                /* â”€â”€â”€ IMPORT CENTER â”€â”€â”€ */
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '300px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {IMPORT_MODULES.map(mod => (
                            <div key={mod.id} onClick={() => setSelectedImport(mod)} className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', cursor: 'pointer', border: selectedImport?.id === mod.id ? '2px solid #50cc7f' : '2px solid transparent', background: selectedImport?.id === mod.id ? 'rgba(80,204,127,0.05)' : '', transition: 'all 0.2s', textAlign: 'center' }}>
                                <mod.icon size={32} color={selectedImport?.id === mod.id ? '#50cc7f' : 'rgba(255,255,255,0.3)'} style={{ marginBottom: '12px' }} />
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{mod.label}</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '4px' }}>{mod.format}</div>
                            </div>
                        ))}
                    </div>
                    <div className="glass-panel-dash fade-in" style={{ flex: 1, minWidth: '300px', borderRadius: '12px', padding: '24px', height: 'fit-content' }}>
                        {selectedImport ? (
                            <>
                                <h3 style={{ margin: '0 0 16px', color: '#50cc7f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Upload size={20} /> Import {selectedImport.label}
                                </h3>
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
                                    <Download size={24} color="#0ff0fc" style={{ marginBottom: '8px' }} />
                                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>Download Template</div>
                                    <a href="#" style={{ color: '#0ff0fc', fontSize: '0.8rem', textDecoration: 'none' }}>template_{selectedImport.id}.xlsx</a>
                                </div>
                                <form className="modal-form" onSubmit={handleImportSubmit}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '8px' }}>Upload File (Excel/CSV):</label>
                                        <input type="file" accept=".csv, .xlsx, .xls" required style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                                    </div>
                                    {uploadSuccess && (
                                        <div style={{ padding: '12px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', color: '#50cc7f', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                                            <CheckCircle size={16} /> Data successfully imported!
                                        </div>
                                    )}
                                    <button type="submit" disabled={uploading} style={{ width: '100%', padding: '14px', background: uploading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#50cc7f,#0ff0fc)', border: 'none', borderRadius: '8px', color: uploading ? '#fff' : '#000', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                        {uploading ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><Upload size={18} /> Start Import</>}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                                <Database size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <div>Select a module from the left to start importing data.</div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* â”€â”€â”€ EXPORT CENTER â”€â”€â”€ */
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '300px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {EXPORT_MODULES.map(mod => (
                            <div key={mod.id} onClick={() => { setSelectedExport(mod); setExportFormat(mod.formats[0]); }} className="glass-panel-dash" style={{ padding: '20px', borderRadius: '12px', cursor: 'pointer', border: selectedExport?.id === mod.id ? '2px solid #0ff0fc' : '2px solid transparent', background: selectedExport?.id === mod.id ? 'rgba(15,240,252,0.05)' : '', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Download size={24} color={selectedExport?.id === mod.id ? '#0ff0fc' : 'rgba(255,255,255,0.5)'} />
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{mod.label}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '4px' }}>Supports: {mod.formats.join(', ')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="glass-panel-dash fade-in" style={{ flex: 1, minWidth: '300px', borderRadius: '12px', padding: '24px', height: 'fit-content' }}>
                        {selectedExport ? (
                            <>
                                <h3 style={{ margin: '0 0 16px', color: '#0ff0fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Download size={20} /> Export {selectedExport.label}
                                </h3>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginBottom: '8px' }}>Select Format:</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {selectedExport.formats.map(f => (
                                            <button key={f} onClick={() => setExportFormat(f)} style={{ flex: 1, padding: '10px', background: exportFormat === f ? 'rgba(15,240,252,0.2)' : 'rgba(255,255,255,0.05)', border: exportFormat === f ? '1px solid #0ff0fc' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: exportFormat === f ? '#0ff0fc' : '#fff', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {f === 'Excel' && <FileSpreadsheet size={16} />}
                                                {f === 'PDF' && <FileText size={16} />}
                                                {f === 'CSV' && <FileText size={16} />}
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: '8px', color: '#ffcc00', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
                                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                    <div>Large exports may take up to a minute to process. Please do not close the window.</div>
                                </div>
                                <button onClick={handleExportSubmit} disabled={uploading} style={{ width: '100%', padding: '14px', background: uploading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#0ff0fc,#bc13fe)', border: 'none', borderRadius: '8px', color: uploading ? '#fff' : '#000', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                                    {uploading ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating File...</> : <><Download size={18} /> Download {exportFormat}</>}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                                <Download size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                                <div>Select a module from the left to export its data.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportExportCenter;
