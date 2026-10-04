import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SuperAdminLogs = () => {
  const [activeTab, setActiveTab] = useState('activity');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs(activeTab);
  }, [activeTab]);

  const fetchLogs = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); // Bhejna mat bhoolna jo pehle error aa raha tha!
      const response = await axios.get(`http://localhost:5000/api/logs?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>📜 System Logs (Super Admin Panel)</h2>
      
      {/* Tabs Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {['activity', 'audit', 'error'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab ? '#007bff' : '#f0f0f0',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab} Logs
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            
            {/* 1. ACTIVITY LOGS TABLE */}
            {activeTab === 'activity' && (
              <>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th>User</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>IP Address</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.user}</td>
                      <td>{log.module}</td>
                      <td><span style={{ fontWeight: 'bold' }}>{log.action}</span></td>
                      <td>{log.ipAddress}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 2. AUDIT LOGS TABLE */}
            {activeTab === 'audit' && (
              <>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Changed By</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td><pre style={{ margin: 0 }}>{JSON.stringify(log.oldValue, null, 2)}</pre></td>
                      <td><pre style={{ margin: 0 }}>{JSON.stringify(log.newValue, null, 2)}</pre></td>
                      <td>{log.changedBy}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {/* 3. ERROR LOGS TABLE */}
            {activeTab === 'error' && (
              <>
                <thead>
                  <tr style={{ backgroundColor: '#ffdddd', color: '#a00' }}>
                    <th>Code</th>
                    <th>Error Message</th>
                    <th>Stack Trace</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} style={{ backgroundColor: '#fff5f5' }}>
                      <td style={{ color: 'red', fontWeight: 'bold' }}>{log.errorCode}</td>
                      <td style={{ color: 'red' }}>{log.errorMessage}</td>
                      <td>
                        <details>
                          <summary>View Stack Trace</summary>
                          <pre style={{ fontSize: '12px', background: '#eee', padding: '5px' }}>{log.stackTrace}</pre>
                        </details>
                      </td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

          </table>
          {logs.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No logs found for this category.</p>}
        </div>
      )}
    </div>
  );
};

export default SuperAdminLogs;