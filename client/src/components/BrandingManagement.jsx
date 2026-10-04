import React, { useRef, useState } from 'react';
import { Image, Upload, Monitor, FileText, Stamp, Layout, Save, CheckCircle } from 'lucide-react';
import '../style/Dashboard.css';

const BrandingManagement = () => {
    const [successMsg, setSuccessMsg] = useState('');
    const [images, setImages] = useState({
        logo: null, bg: null, banner: null, header: null, footer: null, cert: null, watermark: null
    });
    
    const handleUpload = (key, file) => {
        if (!file) return;
        setImages(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
        setSuccessMsg(`${key} successfully updated! (Local Preview)`);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const UploadCard = ({ title, icon: Icon, desc, imgKey, bgSize = 'contain' }) => (
        <div className="glass-panel-dash fade-in" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={18} color="#0ff0fc" /> {title}
            </h3>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{desc}</p>
            
            <div style={{ width: '100%', height: '140px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {images[imgKey] ? (
                    <img src={images[imgKey]} alt={title} style={{ width: '100%', height: '100%', objectFit: bgSize }} />
                ) : (
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>No Image Uploaded</span>
                )}
            </div>
            
            <label style={{ cursor: 'pointer', background: 'rgba(15,240,252,0.1)', color: '#0ff0fc', border: '1px solid rgba(15,240,252,0.3)', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Upload size={16} /> Upload New {title.split(' ')[1] || title}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(imgKey, e.target.files[0])} />
            </label>
        </div>
    );

    return (
        <div className="fade-in" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Layout size={28} color="#bc13fe" />
                        Branding Management
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        Customize your university's visual identity across the ERP, reports, and certificates.
                    </p>
                </div>
                <button className="primary-btn">
                    <Save size={16} /> Save All Changes
                </button>
            </div>

            {successMsg && (
                <div className="fade-in" style={{ padding: '12px', background: 'rgba(80,204,127,0.1)', border: '1px solid rgba(80,204,127,0.3)', color: '#50cc7f', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> {successMsg}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <UploadCard title="University Logo" icon={Image} desc="Used in navbar, sidebar, and general branding. (PNG/SVG 1:1)" imgKey="logo" />
                <UploadCard title="Login Background" icon={Monitor} desc="High-resolution background image for the login screen." imgKey="bg" bgSize="cover" />
                <UploadCard title="Dashboard Banner" icon={Layout} desc="Wide banner displayed on the student/teacher dashboard." imgKey="banner" bgSize="cover" />
                
                <UploadCard title="Report Header" icon={FileText} desc="Letterhead top banner used in auto-generated OBE reports." imgKey="header" bgSize="contain" />
                <UploadCard title="Report Footer" icon={FileText} desc="Bottom banner for reports (contains address/contact)." imgKey="footer" bgSize="contain" />
                
                <UploadCard title="Certificate Header" icon={Stamp} desc="Special header for auto-generated student certificates." imgKey="cert" bgSize="contain" />
                <UploadCard title="Document Watermark" icon={Stamp} desc="Semi-transparent logo applied to PDFs to prevent forgery." imgKey="watermark" bgSize="contain" />
            </div>
        </div>
    );
};

export default BrandingManagement;
