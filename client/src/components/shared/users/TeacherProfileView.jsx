import React from 'react';

const TeacherProfileView = ({ teacher, onClose }) => {
    if (!teacher) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel-dash" style={{ maxWidth: '600px', width: '90%' }}>
                <div className="modal-header">
                    <h3>Teacher Profile</h3>
                    <button onClick={onClose} className="close-btn">X</button>
                </div>
                <div>
                    <h2 style={{ color: '#fff' }}>{teacher.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Email: {teacher.email}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Employee ID: {teacher.employeeId}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Designation: {teacher.designation}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Phone: {teacher.phone}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Specialization: {teacher.specialization}</p>
                </div>
            </div>
        </div>
    );
};

export default TeacherProfileView;
