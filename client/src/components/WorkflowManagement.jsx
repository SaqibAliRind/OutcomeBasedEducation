/**
 * WorkflowManagement — Standalone Workflow & Approval Page
 * Uses the generic WorkflowEngine component
 */
import React from 'react';
import WorkflowEngine from './WorkflowEngine';
import '../style/Dashboard.css';

const WorkflowManagement = () => {
    return (
        <div className="" style={{ padding: '20px' }}>
            <WorkflowEngine />
        </div>
    );
};

export default WorkflowManagement;
