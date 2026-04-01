import React, { useState, useEffect } from 'react';
import { LicenseDataService } from '../services/LicenseDataService.js';
import './LicenseReturnPage.css';

function sortLicenses(licenses, key, dir) {
  return [...licenses].sort((a, b) => {
    let valA, valB;
    if (key === 'cost' || key === 'price') {
      valA = parseFloat(String(a.cost ?? a.price ?? '').replace(/[^0-9.]/g, '')) || 0;
      valB = parseFloat(String(b.cost ?? b.price ?? '').replace(/[^0-9.]/g, '')) || 0;
    } else if (key === 'date') {
      valA = a.date ? new Date(a.date).getTime() : 0;
      valB = b.date ? new Date(b.date).getTime() : 0;
    } else {
      valA = String(a[key] ?? '').toLowerCase();
      valB = String(b[key] ?? '').toLowerCase();
    }
    if (valA < valB) return dir === 'asc' ? -1 : 1;
    if (valA > valB) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ active, dir }) {
  return (
    <span style={{ marginLeft: 4, opacity: active ? 1 : 0.3, fontSize: 11 }}>
      {active && dir === 'desc' ? '↓' : '↑'}
    </span>
  );
}

export default function LicenseReturnPage({ navigate, employeeId }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    async function load() {
      try {
        const data = await LicenseDataService.getLicensesForReturn(employeeId);
        setLicenses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const displayed = sortKey ? sortLicenses(licenses, sortKey, sortDir) : licenses;
  const thStyle = { cursor: 'pointer', userSelect: 'none' };

  if (loading) return <p>Loading licenses...</p>;
  if (error)   return <p>Error: {error}</p>;

  return (
    <div className="license-return-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('')}>← Back to License Center</button>
        <h1>License Return</h1>
      </div>

      <div className="return-layout">
        <div className="licenses-table-section">
          <h2>Your Licenses ({licenses.length} total)</h2>
          <div className="scrollable-table">
            <table className="return-table">
              <thead>
                <tr>
                  <th style={thStyle} onClick={() => handleSort('id')}>
                    Product ID <SortIcon active={sortKey === 'id'} dir={sortDir} />
                  </th>
                  <th style={thStyle} onClick={() => handleSort('name')}>
                    Product <SortIcon active={sortKey === 'name'} dir={sortDir} />
                  </th>
                  <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('date')}>
                    Last Used <SortIcon active={sortKey === 'date'} dir={sortDir} />
                  </th>
                  <th style={thStyle} onClick={() => handleSort('status')}>
                    Status <SortIcon active={sortKey === 'status'} dir={sortDir} />
                  </th>
                  <th style={thStyle} onClick={() => handleSort('cost')}>
                    Price <SortIcon active={sortKey === 'cost'} dir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((license, index) => (
                  <tr
                    key={index}
                    className={`table-row ${selectedLicense?.id === license.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLicense(license)}
                  >
                    <td className="license-id">{license.id}</td>
                    <td className="license-name">{license.name}</td>
                    <td className="license-date" style={{ textAlign: 'center' }}>{license.date || '—'}</td>
                    <td>
                      <span className={`status-badge ${license.status.toLowerCase()}`}>
                        {license.status}
                      </span>
                    </td>
                    <td className="license-cost">{license.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="detail-panel">
          {selectedLicense ? (
            <div className="license-details">
              <h2>License Details</h2>
              <div className="detail-field">
                <label>Software Name</label>
                <div className="field-value">{selectedLicense.name}</div>
              </div>
              <div className="detail-field">
                <label>Price</label>
                <div className="field-value">{selectedLicense.cost}</div>
              </div>
              <div className="detail-field">
                <label>Product ID</label>
                <div className="field-value">{selectedLicense.id}</div>
              </div>
              <button className="return-btn" onClick={() => {
                const currentUser = window.g_user?.getUserName() || 'current_user';
                console.log(`User ${currentUser} wants to return license ${selectedLicense.name} with ID ${selectedLicense.id}`);
              }}>
                Return License
              </button>
            </div>
          ) : (
            <div className="no-selection">
              <p>Select a license from the table to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}